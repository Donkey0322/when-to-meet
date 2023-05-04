from distutils.util import strtobool
import enum
from datetime import timedelta
import os
from dotenv import dotenv_values

env_values = {
    **dotenv_values(".env"),
    **os.environ,
}


class DBConfig:
    host = env_values.get('PG_HOST')
    port = env_values.get('PG_PORT')
    username = env_values.get('PG_USERNAME')
    password = env_values.get('PG_PASSWORD')
    db_name = env_values.get('PG_DBNAME')
    max_pool_size = int(env_values.get('PG_MAX_POOL_SIZE'))


class AppConfig:
    title = env_values.get('APP_TITLE')
    docs_url = env_values.get('APP_DOCS_URL', None)
    redoc_url = env_values.get('APP_REDOC_URL', None)


class JWTConfig:
    jwt_secret = env_values.get('JWT_SECRET', 'aaa')
    jwt_encode_algorithm = env_values.get('JWT_ENCODE_ALGORITHM', 'HS256')
    login_expire = timedelta(days=float(env_values.get('LOGIN_EXPIRE', '7')))


class SMTPConfig:
    host = env_values.get('SMTP_HOST')
    port = env_values.get('SMTP_PORT')
    username = env_values.get('SMTP_USERNAME')
    password = env_values.get('SMTP_PASSWORD')
    use_tls = strtobool(env_values.get('SMTP_USE_TLS'))


class ServiceConfig:
    domain = env_values.get('SERVICE_DOMAIN')
    port = env_values.get('SERVICE_PORT')
    use_https = bool(strtobool(env_values.get('SERVICE_USE_HTTPS', 'false')))

    @property
    def url(self) -> str:
        protocol = 'https' if self.use_https else 'http'
        port_postfix = f':{self.port}' if self.port else ''
        return f"{protocol}://{self.domain}{port_postfix}"


class GoogleConfig:
    GOOGLE_CLIENT_ID = env_values.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = env_values.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_LOGIN_REDIRECT_URI = env_values.get('GOOGLE_LOGIN_REDIRECT_URI')


class SessionConfig:
    SESSION_KEY = env_values.get('SESSION_KEY')


db_config = DBConfig()
app_config = AppConfig()
jwt_config = JWTConfig()
smtp_config = SMTPConfig()
service_config = ServiceConfig()
google_config = GoogleConfig()
session_config = SessionConfig()
