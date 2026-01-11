import requests

URL = "http://127.0.0.1:8000/auth/register"
DATA = {
    "email": "test@example.com",
    "password": "password123"
}

try:
    response = requests.post(URL, json=DATA)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
