import os

import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv()

SHEETY_PRICES_ENDPOINT = os.environ.get(
    "SHEETY_PRICES_ENDPOINT", "YOUR SHEETY PRICES ENDPOINT"
)
SHEETY_USERS_ENDPOINT = os.environ.get(
    "SHEETY_USERS_ENDPOINT", "YOUR SHEETY USERS ENDPOINT"
)
CUSTOMER_EMAIL_FIELD = os.environ.get("CUSTOMER_EMAIL_FIELD", "whatIsYourEmail?")


class DataManager:

    def __init__(self):
        self._user = os.environ.get("SHEETY_USERNAME", "YOUR SHEETY USERNAME")
        self._password = os.environ.get("SHEETY_PASSWORD", "YOUR SHEETY PASSWORD")
        self._authorization = HTTPBasicAuth(self._user, self._password)
        self.destination_data = {}
        self.customer_data = {}

    def get_destination_data(self):
        response = requests.get(
            url=SHEETY_PRICES_ENDPOINT,
            auth=self._authorization,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        self.destination_data = data["prices"]
        return self.destination_data

    def update_lowest_price(self, row_id, new_price):
        new_data = {
            "price": {
                "lowestPrice": new_price,
            }
        }
        response = requests.put(
            url=f"{SHEETY_PRICES_ENDPOINT}/{row_id}",
            json=new_data,
            auth=self._authorization,
            timeout=10,
        )
        response.raise_for_status()
        return response

    def get_customer_emails(self):
        response = requests.get(
            url=SHEETY_USERS_ENDPOINT,
            auth=self._authorization,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        self.customer_data = data["users"]
        return self.customer_data

    def get_customer_email_list(self):
        return [row[CUSTOMER_EMAIL_FIELD] for row in self.get_customer_emails()]
