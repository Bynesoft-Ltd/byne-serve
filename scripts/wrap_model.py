import os
import sys
import json
import shutil
import importlib
import logging
import datetime
from typing import Dict, List, Tuple
from transformers import (
    AutoConfig,
    AutoModel,
    AutoTokenizer,
)
from huggingface_hub import HfApi, HfFolder, upload_folder, login

template_path = "./templates/class_template.py.txt"
static_template_path = "./templates/static_template.py.txt"
save_directory = "./tmp/modified_model"

# ------------------------#
# Step 1: Configure Logging
# ------------------------#

def configure_logging() -> logging.Logger:
    """
    Configure the logging settings for the script.

    Returns:
        A configured logger instance.
    """
    logger = logging.getLogger("ModelLogger")

    # Check if handlers are already added to prevent duplicate logs
    if not logger.handlers:
        logger.setLevel(logging.INFO)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        if not os.path.exists('tmp'):
            os.mkdir('tmp')

        fileHandler = logging.FileHandler(f"tmp/{datetime.datetime.now()}.log",
                                          mode="w+")
        fileHandler.setFormatter(formatter)
        logger.addHandler(fileHandler)

    return logger

logger = configure_logging()

# ------------------------#
# Step 2: Get the model names and token
# ------------------------#

def get_user_inputs() -> Tuple[str, str, str, str]:
    """
    Prompt the user for necessary inputs and retrieve the Hugging Face token.

    Returns:
        A tuple containing the original model name/path, target repository name and byne-serve address.
    """

    login()

    # Get the original repo name (model name or path)
    model_name_or_path = input("Enter the original model name or path (e.g., 'ProsusAI/finbert'): ")

    # Get the target repo name
    target_repo_name = input("Enter the target repository name (e.g., 'my-logged-model'): ")

    # Get the byne-serve address
    default = f'https://byne-serve-755fc296550a.herokuapp.com/reports/{target_repo_name}'
    host = input(f"Enter the byne-serve address without a slash at the end (default: {default}): ")

    if host == "":
        host = default

    return model_name_or_path, target_repo_name, host


model_name_or_path, target_repo_name, host = get_user_inputs()


# ------------------------#
# Step 3: Load the config and determine architectures
# ------------------------#

def load_model_config(model_name_or_path: str) -> Tuple[AutoConfig, List[str], str]:
    """
    Load the model configuration and determine the architectures.

    Args:
        model_name_or_path: The name or path of the pre-trained model.

    Returns:
        A tuple containing the config object, list of architectures, and config class name.
    """
    logger.info(f"Loading configuration for model '{model_name_or_path}'.")

    # Load the configuration
    try:
        config = AutoConfig.from_pretrained(model_name_or_path)
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        sys.exit(1)

    # Get the list of architectures from config.json
    original_architectures = getattr(config, "architectures", None)
    if not original_architectures:
        logger.error(f"No architectures found in config.json for {model_name_or_path}.")
        sys.exit(1)

    logger.info(f"Architectures found in config.json: {original_architectures}")
    config_class = config.__class__.__name__
    logger.info(f"Config class: {config_class}")

    auto_map = getattr(config, "auto_map", None)

    if auto_map:
        logger.error(f"The model {model_name_or_path} relies on custom code. Please refer to the Documentation to enable custom code analysis.")
        sys.exit(1)

    return config, original_architectures, config_class

config, original_architectures, config_class = load_model_config(model_name_or_path)

def get_auto_models_vocab(architectures: List[str]) -> Dict[str, str]:
    """
    Map original model architectures to their corresponding auto model classes.

    Args:
        architectures: A list of architecture class names.

    Returns:
        A dictionary mapping original architectures to auto model class names.
    """
    import re

    def get_auto_model_for_class(model_class_name: str):
        # Extract the task name from the model class name
        match = re.search(r'For(\w+)$', model_class_name)
        if match:
            task_name = match.group(1)
            auto_class_name = f"AutoModelFor{task_name}"
            # Try to import the AutoModelFor* class
            try:
                transformers_module = importlib.import_module("transformers")
                auto_class = getattr(transformers_module, auto_class_name)
                return auto_class
            except AttributeError:
                logger.warning('AutoModelFor* class for the task not found.')
        # Fallback logic
        if "CausalLM" in model_class_name:
            from transformers import AutoModelForCausalLM
            return AutoModelForCausalLM
        elif "MaskedLM" in model_class_name:
            from transformers import AutoModelForMaskedLM
            return AutoModelForMaskedLM
        elif model_class_name.startswith("T5") or model_class_name.startswith("Bart"):
            from transformers import AutoModelForSeq2SeqLM
            return AutoModelForSeq2SeqLM
        else:
            return AutoModel

    auto_models = [get_auto_model_for_class(task).__name__ for task in architectures]
    auto_models_vocab = {k: v for k, v in zip(architectures, auto_models)}
    logger.info(f"Auto models mapping: {auto_models_vocab}")
    return auto_models_vocab

auto_models_vocab = get_auto_models_vocab(original_architectures)

# ------------------------#
# Step 4: Create modified classes for the architectures
# ------------------------#

def create_modified_class_codes(original_architectures: List[str], template_path: str) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Create modified classes for the architectures using the template.

    Args:
        original_architectures: List of original architecture class names.
        template_path: Path to the class template file.

    Returns:
        A tuple containing:
            - A dictionary mapping base class names to modified class names.
            - A dictionary mapping base class names to their modified class code.
    """
    modified_class_names = {}
    modified_model_class_codes = {}

    # Read the template code from the file
    with open(template_path, 'r') as template_file:
        class_template = template_file.read()

    for base_class_name in original_architectures:
        # Handle case where base_class_name might include package name
        if '.' in base_class_name:
            base_class_name_short = base_class_name.split('.')[-1]
        else:
            base_class_name_short = base_class_name

        try:
            # Import the base class
            exec(f"from transformers import {base_class_name_short}")
        except ImportError as e:
            logger.warning(f"Could not import {base_class_name_short}: {e}")
            continue

        # Create a modified class name
        modified_class_name = f"Modified{base_class_name_short}WithHook"
        modified_class_names[base_class_name_short] = modified_class_name

        # Generate the modified class code using the template
        modified_model_class_code = class_template.format(
            base_class_name_short=base_class_name_short,
            modified_class_name=modified_class_name
        )

        modified_model_class_codes[base_class_name_short] = modified_model_class_code

    return modified_class_names, modified_model_class_codes

modified_class_names, modified_model_class_codes = create_modified_class_codes(original_architectures, template_path)

# ------------------------#
# Step 5: Save the modified classes to code files
# ------------------------#

def save_modified_classes(modified_model_class_codes: Dict[str, str], config_class: str, save_directory: str) -> None:
    """
    Save the modified model classes and configuration to code files.

    Args:
        modified_model_class_codes: Dictionary of modified model class code.
        config_class: Name of the configuration class.
        save_directory: Directory to save the modified code files.
    """
    # Create the code directory
    os.makedirs(save_directory, exist_ok=True)

    # File paths
    model_code_file = os.path.join(save_directory, "modeling_modified.py")
    config_code_file = os.path.join(save_directory, "configuring_modified.py")

    # Static utility code (imports and utility functions)
    with open(static_template_path, 'r') as template_file:
        static_code = template_file.read()
        static_code = static_code.format(
            host=host
        )

    # Save the static code and modified classes to modeling_modified.py
    with open(model_code_file, "w") as f:
        # Write the static code
        f.write(static_code + "\n")
        # Write each modified class
        for code in modified_model_class_codes.values():
            f.write(code + "\n")

    # Create configuring_modified.py
    with open(config_code_file, "w") as f:
        f.write(f'from transformers import {config_class}\n')

save_modified_classes(modified_model_class_codes, config_class, save_directory)

# ------------------------#
# Step 6: Instantiate the model and update the config
# ------------------------#

def instantiate_and_update_model(model_name_or_path: str, base_model_name: str, modified_class_names: Dict[str, str], auto_models_vocab: Dict[str, str], save_directory: str, config_class: str) -> None:
    """
    Instantiate the model and update its configuration.

    Args:
        model_name_or_path: Original model name or path.
        base_model_name: Name of the base model class.
        modified_class_names: Dictionary of modified class names.
        auto_models_vocab: Mapping of architectures to auto model class names.
        save_directory: Directory to save the modified model.
        config_class: Name of the configuration class.
    """
    logger.info("Instantiating the model and updating the config. This might take a while...")

    transformers_module = importlib.import_module("transformers")
    model_class = getattr(transformers_module, base_model_name)
    model = model_class.from_pretrained(model_name_or_path)

    # Prepare the auto_map field
    new_auto_map = {}
    for base_class_name_short, mod_class_name in modified_class_names.items():
        key = base_class_name_short
        model_name = auto_models_vocab.get(key)
        if model_name:
            new_auto_map[model_name] = f'modeling_modified.{mod_class_name}'

    # Ensure 'AutoModel' is mapped to the first modified class
    first_modified_class = next(iter(modified_class_names.values()))
    new_auto_map['AutoModel'] = f'modeling_modified.{first_modified_class}'
    new_auto_map['AutoConfig'] = f'configuring_modified.{config_class}'

    # Update the model's config object
    model.config.auto_map = new_auto_map

    # Save the model (this will save the updated config)
    model.save_pretrained(save_directory)
    config = AutoConfig.from_pretrained(save_directory)
    config.architectures = list(modified_class_names.values())
    config.save_pretrained(save_directory)

    # Copy the tokenizer files if they exist
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name_or_path)
        tokenizer.save_pretrained(save_directory)
    except Exception as e:
        logger.warning(f"Could not save tokenizer: {e}")

base_model_name = original_architectures[0]
instantiate_and_update_model(model_name_or_path, base_model_name, modified_class_names, auto_models_vocab, save_directory, config_class)

# ------------------------#
# Step 7: Upload to Hugging Face Hub
# ------------------------#

def upload_to_huggingface_hub(repo_name: str, save_directory: str) -> None:
    """
    Upload the modified model to the Hugging Face Hub.

    Args:
        repo_name: Name of the target repository.
        save_directory: Directory containing the modified model files.
    """
    logger.info("Uploading the model to the Hugging Face Hub.")

    # Get user information
    api = HfApi()
    user = api.whoami()
    username = user["name"]

    # Define the repository ID
    repo_id = f"{username}/{repo_name}"

    logger.info(f"Creating repository '{repo_id}'.")

    # Create the repository
    api.create_repo(repo_id=repo_id, exist_ok=True)

    # Upload the folder
    upload_folder(
        folder_path=save_directory,
        path_in_repo=".",
        repo_id=repo_id,
        commit_message="Upload modified model with logging",
        ignore_patterns=["*.ipynb_checkpoints"]
    )

    logger.info(f"Model uploaded to {repo_id}")

    shutil.rmtree(save_directory)
    logger.info(f"Cleaned up the tmp storage at {save_directory}")

upload_to_huggingface_hub(target_repo_name, save_directory)