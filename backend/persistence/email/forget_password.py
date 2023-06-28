from email.message import EmailMessage

from config import smtp_config, service_config
from persistence.email import smtp_handler
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


async def send(to: str, code: str, subject="Let's meet Email Verification"):
    message = MIMEMultipart()
    message["From"] = f"{smtp_config.username}@{smtp_config.host}"
    message["To"] = to
    message["Subject"] = subject
    body = f"""
            <html>
                <body>
                    <p style="color: black;">Hello,</p>
                    <p style="color: black;">Please click on the following link to reset your password.</p>
                    <p style="color: black;">{service_config.url}/reset-password?code={code}</p>
                    <a href="{service_config.url}/reset-password?code={code}">Click here to reset password.</a>
                </body>
            </html>
            """
    # link to FE reset password page, not BE
    message.attach(MIMEText(body, 'html'))
    await smtp_handler.send_message(message)
