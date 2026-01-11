import requests
import json

URL = "http://127.0.0.1:8001/auth/register"
DATA = {
    "email": "test8001@example.com",
    "password": "password123"
}

try:
    response = requests.post(URL, json=DATA)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 500:
        print("Response Text (likely error trace):")
        print(response.text)
    else:
        print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
