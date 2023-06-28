from config import smtp_config, service_config
from persistence.email import smtp_handler
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import time


async def send(to: str, meet_code: str, meet_title: str, user_name: str, end_time: time,
               subject="Vote for your meet time on Let's Meet!"):
    message = MIMEMultipart()
    message["From"] = f"{smtp_config.username}@{smtp_config.host}"
    message["To"] = to
    message["Subject"] = subject
    body = f"""
        <html>
            <body>
                <p style="color: black;">Hello, {user_name}</p>
                <p style="color: black;">The available time for you to vote for your meet {meet_title} will be ended at {end_time} tomorrow.</p>
                <p style="color: black;">Click the link to vote for your meet! </p>
                <a href="{service_config.url}/meets/{meet_code}">Click here to check out your meet!</a>
            </body>
        </html>
        """
    message.attach(MIMEText(body, 'html'))
    await smtp_handler.send_message(message)
