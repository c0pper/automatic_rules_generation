import requests
import time

url = "http://localhost:8087/analyze"

headers = {
    "Accept": "*/*",
    "Content-Type": "application/json",
}

def get_essex_analysis(data):
    for _ in range(5):  # Try 5 times
        response = requests.post(url, json=data, headers=headers)

        if response.status_code == 200:
            response_json = response.json()
            return response_json
        else:
            print("Error:", response.status_code)
        
        time.sleep(2)  # Wait for 2 seconds before the next attempt

    raise ValueError("Failed after 5 attempts.")