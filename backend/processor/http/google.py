from uuid import uuid4
import os

from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from fastapi import APIRouter, Depends, Request, responses
from starlette.responses import RedirectResponse

from config import google_config, service_config
from security import encode_jwt
from middleware.headers import get_auth_token
import persistence.database as db
import exceptions as exc  # noqa


router = APIRouter(
    tags=['Google'],
    default_response_class=responses.JSONResponse,
    dependencies=[Depends(get_auth_token)]
)

os.environ['GOOGLE_CLIENT_ID'] = google_config.GOOGLE_CLIENT_ID
os.environ['GOOGLE_CLIENT_SECRET'] = google_config.GOOGLE_CLIENT_SECRET

config = Config()
google_client_id = config('GOOGLE_CLIENT_ID')
google_client_secret = config('GOOGLE_CLIENT_SECRET')

oauth = OAuth(config)
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile https://www.googleapis.com/auth/calendar'
    }
)

@router.get('/google-login')
async def login(request: Request):
    return await oauth.google.authorize_redirect(request, google_config.GOOGLE_LOGIN_REDIRECT_URI, access_type='offline')


@router.get('/auth')
async def auth(request: Request):
    token_google = await oauth.google.authorize_access_token(request)
    user_email = token_google['userinfo']['email']
    try:
        result = await db.account.read_by_email(user_email, is_google_login=True)
        account_id = result.id
        await db.account.update_token(account_id, access_token=token_google['access_token'], refresh_token=token_google['refresh_token'])
    except exc.NotFound:
        account_id = await db.account.add(username=str(uuid4()), email=user_email, is_google_login=True, 
                                          access_token=token_google['access_token'], refresh_token=token_google['refresh_token'])
        await db.account.update_username(account_id=account_id, username='用戶_'+str(account_id))
    token = encode_jwt(account_id=account_id)
    response = RedirectResponse(url=f"{service_config.url}/login")
    response.set_cookie(key="account_id", value=str(account_id))
    response.set_cookie(key="token", value=str(token))
    return response
