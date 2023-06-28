from config import smtp_config, service_config
from persistence.email import smtp_handler
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import time


async def send(to: str, meet_code: str, meet_title: str, user_name: str, start_time: time,
               subject="Remember to participate in your event"):
    message = MIMEMultipart()
    message["From"] = f"{smtp_config.username}@{smtp_config.host}"
    message["To"] = to
    message["Subject"] = subject
    body = f"""
        <html>
            <body>
                <p style="color: black;">Hello, {user_name}</p>
                <p style="color: black;">Your event {meet_title} will be held at {start_time} tomorrow, please remember to participate in the event.</p>
                <p style="color: black;">For more information about the event, click the link below.</p>
                <a href="{service_config.url}/meets/{meet_code}">Click here to check out your event!</a>
            </body>
        </html>
        """
    message.attach(MIMEText(body, 'html'))
    await smtp_handler.send_message(message)
