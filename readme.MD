# byne-serve

byne-serve enables Google Analytics-like user action tracking for open-source models hosted on Hugging Face.


## Hosted Option Coming Soon!

A fully managed, hosted version of byne-serve is in development. Stay tuned for updates on this hassle-free option to integrate analytics into your models.

## Features

- Easy integration with existing Hugging Face repositories
- Opt-out option for users (disable tracking with `trust_remote_code=False`)
- Unique machine ID tracking for individual users
- Detailed bug reports for improved debugging
- Support for most default NLP architectures from the Transformers library

## Quick Start

1. Clone and set up the repository:
   ```
   git clone https://github.com/BorysByne/byne-serve.git
   cd byne-serve
   # Fill in the .env file with your configuration
   docker compose --env-file .env -f docker-compose.yml -p byne-serve up -d --build
   ```

2. Register on the byne-serve app and create a new model.

3. Wrap your model:
   ```
   cd scripts
   python wrap_model.py
   # Follow prompts for source repo, target repo, and deployment URL
   ```

4. Access your server to view tracking data and analytics.

## Manual Integration for Custom Models

If your model uses custom code, manually integrate tracking:

1. Add this snippet to your `modelling_X.py` file:

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
   from transformers import BertForSequenceClassification
   
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

2. Use the `error_handling` wrapper on methods you want to track:

   ```python
   class YourModel(nn.Module):
       @error_handler
       def forward(self, ...):
           # Your forward method implementation
   ```

## Privacy and Data Collection

byne-serve collects:
- Unique machine ID for user tracking
- Detailed bug reports including OS, Python, CUDA, and GPU info

This stuff can sometimes include the user name / surname in the files pathes. We're dealing with this to ensure GDPR compliance. 

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/BorysByne/byne-serve/issues) on our GitHub repository.
