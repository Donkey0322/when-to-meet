from fastapi import APIRouter, responses, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from config import line_config
import exceptions as exc  # noqa
from middleware.envelope import enveloped
from middleware.context import request
from middleware.headers import get_auth_token
from persistence import database as db
from service.line import line_handler
import security


router = APIRouter(
    tags=['Line'],
    default_response_class=responses.JSONResponse,
    dependencies=[Depends(get_auth_token)]
)


class GetLineBotUrlOutput(BaseModel):
    url: str


@router.get("/line-bot")
@enveloped
async def get_line_bot_url() -> GetLineBotUrlOutput:
    return GetLineBotUrlOutput(url=line_config.line_bot_url)


@router.post('/line')
@router.get('/line')
async def connect_account_to_line(token: str):
    account_id = (security.decode_jwt(token, request.time)).id
    if not account_id:
        raise exc.NoPermission
    token = security.encode_jwt(
        account_id=account_id,
        is_google_login=request.account.is_google_login,
    )
    redirect_uri = line_handler.compose_redirect_uri(token)
    print(redirect_uri)
    return RedirectResponse(redirect_uri)


@router.get('/account/line')
@enveloped
async def update_account_line_token(code: str, state: str):
    account_id = (security.decode_jwt(state, request.time)).id
    if not account_id:
        raise exc.NoPermission
    user_id = await line_handler.login(code)
    await db.account.update_line_token(account_id=account_id, token=user_id)