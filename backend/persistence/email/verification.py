from config import smtp_config, service_config
from persistence.email import smtp_handler
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


async def send(to: str, code: str, username: str, subject="Let's meet Email Verification"):
    message = MIMEMultipart()
    message["From"] = f"{smtp_config.username}@{smtp_config.host}"
    message["To"] = to
    message["Subject"] = subject
    body = f"""
                <html>
                    <body>
                        <p style="color: black;">Hello, {username}</p>
                        <p style="color: black;">Thanks for registering for our application.</p>
                        <p style="color: black;">Please click on the following link to verify!</p>
                        <a href="{service_config.url}/login?code={code}">Click here to verify</a>
                    </body>
                </html>
            """
    message.attach(MIMEText(body, 'html'))
    await smtp_handler.send_message(message)
