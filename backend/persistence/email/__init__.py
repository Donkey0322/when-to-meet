import aiosmtplib
import aiosmtplib.smtp

from base import mcs
from config import SMTPConfig


class SMTPHandler(metaclass=mcs.Singleton):
    def __init__(self):
        self._client: aiosmtplib.SMTP = None  # Need to be init/closed manually # noqa

    async def initialize(self, smtp_config: SMTPConfig):
        if self._client is None:
            self._client = aiosmtplib.SMTP(
                hostname=smtp_config.host,
                port=smtp_config.port,
                username=smtp_config.username,
                password=smtp_config.password,
                use_tls=smtp_config.use_tls,
            )

    async def close(self):
        if self._client is not None:
            self._client.close()

    async def send_message(
            self,
            message: aiosmtplib.smtp.Union[aiosmtplib.smtp.email.message.EmailMessage,
                                           aiosmtplib.smtp.email.message.Message],
            sender: aiosmtplib.smtp.Optional[str] = None,
            recipients: aiosmtplib.smtp.Optional[aiosmtplib.smtp.Union[str, aiosmtplib.smtp.Sequence[str]]] = None,
            mail_options: aiosmtplib.smtp.Optional[aiosmtplib.smtp.Iterable[str]] = None,
            rcpt_options: aiosmtplib.smtp.Optional[aiosmtplib.smtp.Iterable[str]] = None,
            timeout: aiosmtplib.smtp.Optional[
                aiosmtplib.smtp.Union[float, aiosmtplib.smtp.Default]] = aiosmtplib.smtp._default,
    ):
        client = await self.get_client()
        responses, data_log = await client.send_message(message=message, sender=sender, recipients=recipients,
                                                        mail_options=mail_options, rcpt_options=rcpt_options,
                                                        timeout=timeout)
        for address, (code, resp) in responses.items():
            if code != 200:
                print(f'{address=} failed with {code=} {resp=}')  # experimental, info level only

    async def get_client(self):
        try:
            await self._client.noop()
        except aiosmtplib.errors.SMTPServerDisconnected as e:
            try:
                await self._client.connect()
            except Exception as e2:
                raise e2 from e

            try:
                await self._client.noop()  # verify
            except Exception as e2:
                raise e2 from e

        return self._client


smtp_handler = SMTPHandler()

from . import (
    event_reminding,
    verification,
    forget_password,
    invite_to_meet,
    voting_notification,
)
