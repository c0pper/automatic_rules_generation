import requests

url = "http://localhost:8087/analyze"

headers = {
    "Accept": "*/*",
    "Content-Type": "application/json",
}

def get_essex_analysis(data):
    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:
        response_json = response.json()
        return response_json
    else:
        print("Error:", response.status_code)