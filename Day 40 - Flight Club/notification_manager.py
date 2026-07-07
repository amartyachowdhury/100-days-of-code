import os
import smtplib

from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()


class NotificationManager:

    def __init__(self):
        self.smtp_address = os.environ.get(
            "EMAIL_PROVIDER_SMTP_ADDRESS", "YOUR SMTP ADDRESS"
        )
        self.email = os.environ.get("MY_EMAIL", "YOUR EMAIL")
        self.email_password = os.environ.get("MY_EMAIL_PASSWORD", "YOUR EMAIL PASSWORD")
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

    def send_emails(self, email_list, email_body):
        with smtplib.SMTP(self.smtp_address) as connection:
            connection.starttls()
            connection.login(self.email, self.email_password)
            for email in email_list:
                connection.sendmail(
                    from_addr=self.email,
                    to_addrs=email,
                    msg=f"Subject:New Low Price Flight!\n\n{email_body}".encode("utf-8"),
                )
