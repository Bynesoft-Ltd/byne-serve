import requests
import random
import hashlib
import datetime
import json


def generate_machine_id():
    return hashlib.sha256(str(random.getrandbits(256)).encode('utf-8')).hexdigest()


def generate_timestamp():
    start_date = datetime.datetime(2024, 9, 5)
    end_date = datetime.datetime(2024, 10, 6)
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + datetime.timedelta(days=random_number_of_days)
    return random_date.strftime("%Y-%m-%d %H:%M:%S")


def generate_method():
    return random.choice(["init", "forward"])


def send_request():
    url = "http://localhost:8000/reports/finbert/report"
    payload = {
        "machine_id": generate_machine_id(),
        "status": "success",
        "timestamp": generate_timestamp(),
        "method": generate_method()
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    return response.status_code


def main():
    success_count = 0
    failure_count = 0

    for _ in range(100):
        status_code = send_request()
        if status_code == 200:
            success_count += 1
        else:
            failure_count += 1

    print(f"Requests sent: 100")
    print(f"Successful requests: {success_count}")
    print(f"Failed requests: {failure_count}")


if __name__ == "__main__":
    main()