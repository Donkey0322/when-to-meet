from dataclasses import dataclass
from typing import Sequence, Optional
from uuid import uuid4

from fastapi import APIRouter, responses, Depends, Response
from pydantic import BaseModel

from base.enums import NotificationPreference
from base import do
from security import encode_jwt, verify_password, hash_password
from middleware.context import request
from middleware.envelope import enveloped
from middleware.headers import get_auth_token
import persistence.database as db
from persistence.email import verification
import exceptions as exc  # noqa


router = APIRouter(
    tags=['Account'],
    default_response_class=responses.JSONResponse,
    dependencies=[Depends(get_auth_token)]
)

USERNAME_PROHIBITED_CHARS = r'@`#$%&*\/?'


class AddAccountInput(BaseModel):
    username: str
    password: str
    email: str


@dataclass
class AddAccountOutput:
    id: int


@router.post('/account')
@enveloped
async def add_account(data: AddAccountInput) -> AddAccountOutput:
    if any(char in data.username for char in USERNAME_PROHIBITED_CHARS):
        raise exc.IllegalCharacter

    if data.username.startswith('guest_'):
        raise exc.IllegalCharacter

    try:
        if account := await db.account.read_by_email(data.email):
            if account.is_google_login:
                raise exc.EmailRegisteredByGoogle
            raise exc.EmailExist
    except exc.NotFound:
        pass

    try:
        account_id = await db.account.add(username=data.username,
                                          pass_hash=hash_password(data.password))
    except exc.UniqueViolationError:
        raise exc.UsernameExists

    verification_code = str(uuid4())
    await db.email_verification.add(code=verification_code, account_id=account_id, email=data.email)
    await verification.send(to=data.email, code=verification_code, username=data.username)
    return AddAccountOutput(id=account_id)


class LoginInput(BaseModel):
    user_identifier: str
    password: str


@dataclass
class LoginOutput:
    account_id: int
    token: str


@router.post('/login')
@enveloped
async def login(data: LoginInput, response: Response) -> LoginOutput:
    try:
        account_id, pass_hash, is_google_login = await db.account.read_by_username_or_email(
            identifier=data.user_identifier)
    except exc.NotFound:
        raise exc.LoginFailed
    if is_google_login:
        raise exc.EmailRegisteredByGoogle

    if not verify_password(data.password, pass_hash):
        raise exc.LoginFailed

    token = encode_jwt(account_id=account_id, is_google_login=is_google_login)
    response.set_cookie(key="account_id", value=str(account_id))
    response.set_cookie(key="token", value=str(token))
    return LoginOutput(account_id=account_id, token=token)


class AccountInfo(BaseModel):
    id: int
    username: str
    email: str


class SearchAccountOutput(BaseModel):
    accounts: Optional[Sequence[AccountInfo]]


@router.get('/account/search')
@enveloped
async def search_account(identifier: str) -> SearchAccountOutput:
    accounts = await db.account.search(identifier=identifier)
    return SearchAccountOutput(
        accounts=[AccountInfo(id=account.id, username=account.username, email=account.email)
                  for account in accounts])


class EditAccountInput(BaseModel):
    username: Optional[str] = None
    old_password: Optional[str] = None
    new_password: Optional[str] = None
    email: Optional[str] = None


@router.patch('/account')
@enveloped
async def edit_account(data: EditAccountInput) -> None:
    if not request.account.id:
        raise exc.NoPermission
    account_id = request.account.id
    account = await db.account.read(account_id)

    if data.username != account.username and not await db.account.is_valid_username(data.username):
        raise exc.UsernameExists

    if data.username and data.username.startswith('guest_'):
        raise exc.IllegalCharacter

    account_id, pass_hash, _ = await db.account.read_passhash(account_id=request.account.id)
    if data.old_password and not verify_password(password=data.old_password, pass_hash=pass_hash):
        raise exc.NoPermission

    if data.email is not None and account.email != data.email:
        try:
            if acc := await db.account.read_by_email(data.email):
                if acc.is_google_login:
                    raise exc.EmailRegisteredByGoogle
                raise exc.EmailExist
        except exc.NotFound:
            verification_code = str(uuid4())
            await db.email_verification.add(code=verification_code, account_id=account_id, email=data.email)
            await verification.send(to=data.email, code=verification_code, username=data.username)

    await db.account.edit(account_id=account_id,
                          username=data.username,
                          pass_hash=hash_password(data.new_password) if data.new_password else None)


class EditAccountNotificationPreferenceInput(BaseModel):
    preference: NotificationPreference


@router.patch('/account/notification-preference')
@enveloped
async def edit_account_notification_preference(data: EditAccountNotificationPreferenceInput) -> None:
    if not request.account.id:
        raise exc.NoPermission

    account_id = request.account.id
    account = await db.account.read(account_id=account_id)
    if data.preference is NotificationPreference.line and not account.line_token:
        raise exc.LineAccountNotConnected
    await db.account.edit_notification_preference(account_id=account_id, preference=data.preference)


@router.get('/account/{account_id}')
@enveloped
async def read_account(account_id: int) -> do.Account:
    if account_id is not request.account.id:
        raise exc.NoPermission

    account = await db.account.read(account_id=account_id)
    return account
