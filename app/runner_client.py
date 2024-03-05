import requests
import time


headers = {
    "Accept": "*/*",
    "Content-Type": "application/json",
}

def get_essex_analysis(data, port):
    url = f"http://localhost:{str(port)}/analyze"
    max_retries = 10
    retry_delay = 2  # seconds

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                response_json = response.json()
                return response_json
            else:
                print(f"Error ({response.status_code}): {response.text}")

            time.sleep(retry_delay)
        except requests.exceptions.ConnectionError as e:
            print(f"[*] Connection error on attempt {attempt}/{max_retries}: {e}")
            time.sleep(retry_delay)

    raise ValueError(f"Failed after {max_retries} attempts.")