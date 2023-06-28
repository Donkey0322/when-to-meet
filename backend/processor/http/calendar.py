from fastapi import APIRouter, Depends, responses
from middleware.context import request
from middleware.envelope import enveloped
from middleware.headers import get_auth_token
from service.calendar import MeetCalendar, GoogleCalendar
from datetime import date

router = APIRouter(
    tags=['Calendar'],
    default_response_class=responses.JSONResponse,
    dependencies=[Depends(get_auth_token)]
)


@router.get('/meet-calendar')
@enveloped
async def get_event(start_date: date, end_date: date):
    account_id = request.account.id
    calendar = MeetCalendar(account_id)
    events = await calendar.get_event(start_date=start_date, end_date=end_date)
    return events


@router.get('/google-calendar')
@enveloped
async def get_google_event(start_date: date, end_date: date):
    account_id = request.account.id
    google_calendar = GoogleCalendar(account_id)
    await google_calendar.build_connection()
    events = await google_calendar.get_google_event(start_date=start_date, end_date=end_date)
    return events


@router.get('/google-meet-url')
@enveloped
async def get_google_meet_url():
    account_id = request.account.id
    google_calendar = GoogleCalendar(account_id)
    return await google_calendar.get_google_meet_url()
