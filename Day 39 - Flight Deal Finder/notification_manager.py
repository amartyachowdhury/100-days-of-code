import os

from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()


class NotificationManager:

    def __init__(self):
        account_sid = os.environ.get("TWILIO_SID", os.environ.get("TWILIO_ACCOUNT_SID"))
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        self.client = Client(account_sid, auth_token)

    def send_sms(self, message_body):
        message = self.client.messages.create(
            from_=os.environ["TWILIO_VIRTUAL_NUMBER"],
            body=message_body,
            to=os.environ["TWILIO_VERIFIED_NUMBER"],
        )
        print(message.sid)

    def send_whatsapp(self, message_body):
        message = self.client.messages.create(
            from_=f"whatsapp:{os.environ['TWILIO_WHATSAPP_NUMBER']}",
            body=message_body,
            to=f"whatsapp:{os.environ['TWILIO_VERIFIED_NUMBER']}",
        )
        print(message.sid)
