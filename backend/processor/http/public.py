from uuid import UUID, uuid4

from fastapi import APIRouter, responses, Depends
from pydantic import BaseModel

from middleware.headers import get_auth_token
from middleware.envelope import enveloped
import persistence.database as db
import persistence.email as email
from security import hash_password

router = APIRouter(tags=['Public'], dependencies=[Depends(get_auth_token)])


@router.get("/", status_code=200, response_class=responses.HTMLResponse)
async def default_page():
    return "<a href=\"/docs\">/docs</a>"


@router.get('/email-verification', tags=['Account'])
@router.post('/email-verification', tags=['Account'])
@enveloped
async def email_verification(code: UUID):
    await db.email_verification.verify_email(code=code)


class ForgetPasswordInput(BaseModel):
    email: str


@router.post('/forget-password')
@enveloped
async def forget_password(data: ForgetPasswordInput) -> None:
    account = await db.account.read_by_email(email=data.email, is_google_login=False)
    code = str(uuid4())
    await db.email_verification.add(code=code, account_id=account.id, email=account.email)
    await email.forget_password.send(to=account.email, code=code)


class ResetPasswordInput(BaseModel):
    code: str
    password: str


@router.get('/reset-password')
@router.post('/reset-password')
@enveloped
async def reset_password(data: ResetPasswordInput):
    await db.account.reset_password(code=data.code, pass_hash=hash_password(data.password))
