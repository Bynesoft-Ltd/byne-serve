import hashlib
import platform
import uuid
import socket
import os
import subprocess
import logging


def get_mac_address():
    try:
        mac = uuid.UUID(int=uuid.getnode()).hex[-12:]
        return ":".join([mac[i:i + 2] for i in range(0, 12, 2)])
    except Exception as e:
        logging.warning(f"Failed to get MAC address: {e}")
        return None


def get_hostname():
    try:
        return socket.gethostname()
    except Exception as e:
        logging.warning(f"Failed to get hostname: {e}")
        return None


def get_cpu_info():
    try:
        if platform.system() == "Windows":
            return platform.processor()
        elif platform.system() == "Darwin":
            os.environ['PATH'] = os.environ['PATH'] + os.pathsep + '/usr/sbin'
            command = "sysctl -n machdep.cpu.brand_string"
            return subprocess.check_output(command).strip().decode()
        elif platform.system() == "Linux":
            command = "cat /proc/cpuinfo"
            all_info = subprocess.check_output(command, shell=True).strip().decode()
            for line in all_info.split("\n"):
                if "model name" in line:
                    return line.split(":")[1].strip()
        return None
    except Exception as e:
        logging.warning(f"Failed to get CPU info: {e}")
        return None


def get_disk_serial():
    try:
        if platform.system() == "Windows":
            command = "wmic diskdrive get SerialNumber"
            return subprocess.check_output(command).strip().decode().split("\n")[1]
        elif platform.system() == "Darwin":
            command = "diskutil info / | grep 'Volume UUID' | awk '{print $3}'"
            return subprocess.check_output(command, shell=True).strip().decode()
        elif platform.system() == "Linux":
            command = "lsblk --nodeps -no serial"
            return subprocess.check_output(command, shell=True).strip().decode()
        return None
    except Exception as e:
        logging.warning(f"Failed to get disk serial: {e}")
        return None


def get_os_info():
    try:
        return f"{platform.system()} {platform.release()}"
    except Exception as e:
        logging.warning(f"Failed to get OS info: {e}")
        return None


def generate_machine_id():
    identifiers = [
        get_mac_address(),
        get_hostname(),
        get_cpu_info(),
        get_disk_serial(),
        get_os_info()
    ]

    # Filter out None values
    valid_identifiers = [str(id) for id in identifiers if id is not None]
    logging.info(f"Valid identifiers: {valid_identifiers}")

    if not valid_identifiers:
        # If all attempts failed, use a random UUID as a last resort
        logging.warning("All identification methods failed. Using a random UUID.")
        return str(uuid.uuid4())

    # Combine all available identifiers and hash them
    combined = "".join(valid_identifiers)
    return hashlib.sha256(combined.encode()).hexdigest()


def get_machine_id():
    try:
        return generate_machine_id()
    except Exception as e:
        logging.error(f"Unexpected error in get_machine_id: {e}")
        # Return a random UUID if all else fails
        return str(uuid.uuid4())


# Usage example
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    machine_id = get_machine_id()
    print(f"Machine ID: {machine_id}")