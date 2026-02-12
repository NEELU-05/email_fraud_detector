import requests
import json

url = "http://localhost:8000/predict"
data = {
    "email_text": "Congratulations! You have won $1,000,000! Click here: http://bit.ly/win-now"
}

response = requests.post(url, json=data)
print(json.dumps(response.json(), indent=2))
