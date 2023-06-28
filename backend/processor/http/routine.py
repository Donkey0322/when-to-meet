from fastapi import APIRouter, responses, Depends
from pydantic import BaseModel
from middleware.headers import get_auth_token
from middleware.envelope import enveloped
from middleware.context import request
import persistence.database as db
from base.enums import WeekDayType
from typing import Sequence

router = APIRouter(
    tags=['Routine'],
    default_response_class=responses.JSONResponse,
    dependencies=[Depends(get_auth_token)]
)


class Routine(BaseModel):
    weekday: WeekDayType
    time_slot_id: int


weekdayValue = {
    'MON': 1,
    'TUE': 2,
    'WED': 3,
    'THU': 4,
    'FRI': 5,
    'SAT': 6,
    'SUN': 7
}


@router.post('/routine')
@enveloped
async def add_routine(data: Sequence[Routine]):
    account_id = request.account.id
    await db.routine.batch_add(
        account_id=account_id,
        routines=[(routine.weekday, routine.time_slot_id) for routine in data],
    )


@router.delete('/routine')
@enveloped
async def delete_routine(data: Sequence[Routine]):
    account_id = request.account.id
    await db.routine.batch_delete(
        account_id=account_id,
        routines=[(routine.weekday, routine.time_slot_id) for routine in data],
    )


@router.get('/routine')
@enveloped
async def get_routine():
    account_id = request.account.id
    routines = await db.routine.get(account_id=account_id)

    routines.sort(key=lambda x: (weekdayValue[x.weekday], x.time_slot_id))
    return [Routine(weekday=routine.weekday, time_slot_id=routine.time_slot_id) for routine in routines]
    
    

