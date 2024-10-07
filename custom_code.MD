# Custom Code Models and byne-serve

## How Model Wrapping Works

The byne-serve model wrapping process modifies the model's `auto_map` configuration and creates wrapper classes for each architecture in the original model. These wrapper classes inherit from the original classes and add tracking functionality. The `auto_map` is updated to point to these new classes, ensuring that when the model is loaded via Hugging Face's `AutoModel`/`AutoModelFor*` classes, the wrapped versions are used. The wrapper classes use a decorator pattern to surround original method calls with try-except blocks, enabling tracking of successful executions and detailed error reporting without altering the core functionality of the original model.

## Limitations with Custom Code Models

Automatic wrapping of custom code models is not possible due to their non-standard structure. Custom models deviate from the standard Hugging Face model architecture, making it difficult to automatically identify which methods to wrap and where to init the tracker. 

## Manual Wrapping Guide

To manually wrap a custom code model with byne-serve tracking, follow these steps:

1. Add the following imports and utility functions to your main model file:

```python
import sys
import platform
import subprocess
import pkg_resources
import json
import traceback
import os
import hashlib
import uuid
import socket
import time
from functools import wraps
from typing import Dict, Any, Callable
from urllib import request, error
from urllib.parse import urlencode

def get_machine_id() -> str:
    file_path = './.sys_param/machine_id.json'
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)['machine_id']
        else:
            identifiers = [
                lambda: uuid.UUID(int=uuid.getnode()).hex[-12:],
                socket.gethostname,
                platform.processor,
                lambda: subprocess.check_output("cat /proc/cpuinfo", shell=True).decode() if platform.system() == "Linux" else None,
                lambda: f"{{platform.system()}} {{platform.release()}}"
            ]
            valid_identifiers = [str(id()) for id in identifiers if id() is not None]
            machine_id = hashlib.sha256("".join(valid_identifiers).encode()).hexdigest() if valid_identifiers else str(uuid.uuid4())
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                json.dump({{'machine_id': machine_id}}, f)
            return machine_id
    except Exception:
        return str(uuid.uuid4())

def get_env_info() -> Dict[str, Any]:
    file_path = './.sys_param/env_info.json'
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        else:
            env_info = {{
                "os_info": {{k: getattr(platform, k)() for k in ['system', 'release', 'version', 'machine']}},
                "python_info": {{
                    "version": sys.version,
                    "implementation": platform.python_implementation(),
                    "compiler": platform.python_compiler()
                }},
                "cuda_info": {{"available": False}},
                "gpu_info": [],
                "installed_packages": sorted([f"{{pkg.key}}=={{pkg.version}}" for pkg in pkg_resources.working_set]),
                "relevant_env_variables": {{k: v for k, v in os.environ.items() if any(k.startswith(p) for p in ["CUDA", "PYTHON", "PATH", "ROCM", "HIP", "MPS", "METAL"])}}
            }}
            try:
                env_info["cuda_info"] = {{"available": True, "version": subprocess.check_output(["nvcc", "--version"]).decode().split("release")[1].split(",")[0].strip()}}
            except Exception:
                pass
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                json.dump(env_info, f)
            return env_info
    except Exception:
        return {{}}

def send_report(data: Dict[str, Any]) -> None:
    try:
        json_data = json.dumps(data).encode('utf-8')
        headers = {{
            'Content-Type': 'application/json',
            'Content-Length': len(json_data)
        }}
        req = request.Request(f'{host}/report', data=json_data, headers=headers, method='POST')
        with request.urlopen(req, timeout=5) as response:
            pass
    except error.URLError as e:
        pass
    except Exception as e:
        pass

def error_handler(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        try:
            result = func(self, *args, **kwargs)
            send_report({{
                "machine_id": self.machine_id,
                "status": "success",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "method": func.__name__
            }})
            return result
        except Exception as e:
            send_report({{
                "machine_id": self.machine_id,
                "status": "fail",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "method": func.__name__,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "env_info": get_env_info()
            }})
            raise e  # Re-raise the exception
    return wrapper
```
We suggest you prepare the code with:

```python
static_template_path = TEMPLATE_PATH

with open(static_template_path, 'r') as template_file:
    static_code = template_file.read()
    static_code = static_code.format(
        host=YOUR_BYNE-SERVE_ENDPOINT
    )
```

2. Modify your model class to include the `machine_id` and apply the `error_handler` decorator to methods you want to track:

```python
class YourCustomModel(nn.Module):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.machine_id = get_machine_id()

    @error_handler
    def forward(self, *args, **kwargs):
        # Your forward method implementation

    @error_handler
    def generate(self, *args, **kwargs):
        # Your generate method implementation

    # Apply to other methods as needed
```

3. Update your model's configuration to include the `auto_map` if it's not already present:

```python
config.auto_map = {
    "AutoModel": "path.to.your.module.YourCustomModel",
    "AutoModelForCausalLM": "path.to.your.module.YourCustomModel",
    # Add other relevant mappings
}
```

4. When saving your model, ensure the updated configuration is saved:

```python
model.save_pretrained("path/to/save")
model.config.save_pretrained("path/to/save")
```