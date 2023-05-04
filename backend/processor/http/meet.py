import typing
from datetime import datetime, date
import random
from typing import Optional, Sequence, Union

from fastapi import APIRouter, responses, Depends
from pydantic import BaseModel, Json

from base import enums, model, vo, do
import const
from middleware.envelope import enveloped
from middleware.headers import get_auth_token
from middleware.context import request
import persistence.database as db
import service
from service.meet import EditMeetInput, AddMemberMeetAvailableTimeInput, \
    ConfirmMeetInput, DeleteMeetMemberAvailableTimeInput
import exceptions as exc  # noqa
from security import hash_password, verify_password


from .util import parse_filter, parse_sorter, timezone_validate, update_status, compose_host_and_member_info, MemberInfo

router = APIRouter(
    tags=['Meet'],
    default_response_class=responses.JSONResponse,
    dependencies=[Depends(get_auth_token)]
)


class AddMeetInput(BaseModel):
    meet_name: str
    start_date: date
    end_date: date
    start_time_slot_id: int
    end_time_slot_id: int
    gen_meet_url: bool
    guest_name: Optional[str] = None
    guest_password: Optional[str] = None
    voting_end_time: Optional[datetime] = None
    description: Optional[str] = None
    member_ids: Optional[Sequence[int]] = None
    emails: Optional[Sequence[str]] = None


class ReadMeetOutput(BaseModel):
    id: int
    status: Union[enums.StatusType, str]
    start_date: date
    end_date: date
    start_time_slot_id: int
    end_time_slot_id: int
    meet_name: str
    invite_code: str
    gen_meet_url: bool
    voting_end_time: Optional[datetime] = None
    finalized_start_date: Optional[date] = None
    finalized_end_date: Optional[date] = None
    finalized_start_time_slot_id: Optional[int] = None
    finalized_end_time_slot_id: Optional[int] = None
    meet_url: Optional[str] = None
    description: Optional[str] = None
    host_info: Optional[MemberInfo] = None
    member_infos: Optional[Sequence[MemberInfo]] = None


@router.post('/meet')
@enveloped
async def add_meet(data: AddMeetInput) -> ReadMeetOutput:
    host_account_id = request.account.id
    if not host_account_id and not data.guest_name:
        raise exc.IllegalInput

    if data.start_date > data.end_date or data.start_time_slot_id > data.end_time_slot_id:
        raise exc.IllegalInput

    converted_voting_end_time = timezone_validate(
        data.voting_end_time) if data.voting_end_time else None
    if converted_voting_end_time and converted_voting_end_time < datetime.now():
        raise exc.IllegalInput

    if not 0 < data.start_time_slot_id < 49 and not 0 < data.end_time_slot_id < 49:
        raise exc.IllegalInput

    invite_code = ''.join(random.choice(const.AVAILABLE_CODE_CHAR)
                          for _ in range(const.INVITE_CODE_LENGTH))
    meet_id = await db.meet.add(
        title=data.meet_name,
        invite_code=invite_code,
        start_date=data.start_date,
        end_date=data.end_date,
        start_time_slot_id=data.start_time_slot_id,
        end_time_slot_id=data.end_time_slot_id,
        voting_end_time=converted_voting_end_time,
        gen_meet_url=data.gen_meet_url,
        host_member_id=host_account_id,
        member_ids=data.member_ids,
        description=data.description,
        guest_name=data.guest_name,
        guest_passhash=hash_password(data.guest_password) if data.guest_password else None,
    )
    # TODO: send email to members and emails

    meet = await db.meet.read(meet_id=meet_id)
    account_id = request.account.id
    meet.status = await update_status(meet.id, meet, request.time, account_id)
    host, member_infos = await compose_host_and_member_info(meet_id=meet.id)

    return ReadMeetOutput(
        id=meet.id,
        status=meet.status,
        start_date=meet.start_date,
        end_date=meet.end_date,
        start_time_slot_id=meet.start_time_slot_id,
        end_time_slot_id=meet.end_time_slot_id,
        voting_end_time=meet.voting_end_time,
        meet_name=meet.title,
        invite_code=meet.invite_code,
        gen_meet_url=meet.gen_meet_url,
        finalized_start_date=meet.finalized_start_date,
        finalized_end_date=meet.finalized_end_date,
        finalized_start_time_slot_id=meet.finalized_start_time_slot_id,
        finalized_end_time_slot_id=meet.finalized_end_time_slot_id,
        meet_url=meet.meet_url,
        description=meet.description,
        host_info=host,
        member_infos=member_infos,
    )


@router.get('/meet/{meet_id}')
@enveloped
async def read_meet(meet_id: int, name: Optional[str] = None, password: Optional[str] = None) -> ReadMeetOutput:
    if not service.meet.is_authed(meet_id=meet_id, name=name, password=password):
        raise exc.NoPermission

    meet = await db.meet.read(meet_id=meet_id)
    try:
        account_id = request.account.id
    except exc.NoPermission:
        account_id = None
    meet.status = await update_status(meet.id, meet, request.time, account_id)
    host, member_infos = await compose_host_and_member_info(meet_id=meet.id)

    return ReadMeetOutput(
        id=meet.id,
        status=meet.status,
        start_date=meet.start_date,
        end_date=meet.end_date,
        start_time_slot_id=meet.start_time_slot_id,
        end_time_slot_id=meet.end_time_slot_id,
        voting_end_time=meet.voting_end_time,
        meet_name=meet.title,
        invite_code=meet.invite_code,
        gen_meet_url=meet.gen_meet_url,
        finalized_start_date=meet.finalized_start_date,
        finalized_end_date=meet.finalized_end_date,
        finalized_start_time_slot_id=meet.finalized_start_time_slot_id,
        finalized_end_time_slot_id=meet.finalized_end_time_slot_id,
        meet_url=meet.meet_url,
        description=meet.description,
        host_info=host,
        member_infos=member_infos,
    )


@router.delete('/meet/{meet_id}')
@enveloped
async def delete_meet(meet_id: int) -> None:
    await service.meet.delete_meet(meet_id=meet_id)


@router.patch('/meet/[meet_id}')
@enveloped
async def edit_meet(meet_id: int, data: EditMeetInput) -> None:
    await service.meet.edit_meet(meet_id=meet_id, data=data)


BROWSE_MEET_COLUMNS = {
    'name': str,
    'host': str,
    'status': enums.StatusType,
    'start_date': date,
    'end_date': date,
    'voting_end_time': datetime,
}


async def meet_filter(filters: typing.Optional[Json] = None) -> Sequence[model.Filter]:
    return parse_filter(BROWSE_MEET_COLUMNS, filters)


async def meet_sorter(sorters: typing.Optional[Json] = None) -> Sequence[model.Sorter]:
    return parse_sorter(BROWSE_MEET_COLUMNS, sorters)


@router.get('/meet')
@enveloped
async def browse_meet(filters: Sequence[model.Filter] = Depends(meet_filter),
                      sorters: Sequence[model.Sorter] = Depends(meet_sorter))\
        -> Sequence[vo.BrowseMeetByAccount]:
    # TODO: find ways to use partial function in Depends

    meets = await db.meet.browse_by_account_id(account_id=request.account.id, filters=filters, sorters=sorters)
    for i, meet in enumerate(meets):
        meet.status = await update_status(meet.meet_id, meet, request.time, request.account.id)
        meets[i] = meet

    return meets


class JoinMeetInput(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None


@router.post('/meet/code/{code}')
@enveloped
async def join_meet_by_invite_code(code: str, data: JoinMeetInput):
    account_id = request.account.id
    if not account_id and not data.name:
        raise exc.IllegalInput

    meet = await db.meet.read_meet_by_code(invite_code=code)
    await db.meet.add_member(meet_id=meet.id, account_id=account_id,
                             name=data.name, pass_hash=hash_password(data.password) if data.password else None)

    meet.status = await update_status(meet.id, meet, request.time, account_id)
    host, member_infos = await compose_host_and_member_info(meet_id=meet.id)

    return ReadMeetOutput(
        id=meet.id,
        status=meet.status,
        start_date=meet.start_date,
        end_date=meet.end_date,
        start_time_slot_id=meet.start_time_slot_id,
        end_time_slot_id=meet.end_time_slot_id,
        voting_end_time=meet.voting_end_time,
        meet_name=meet.title,
        invite_code=meet.invite_code,
        gen_meet_url=meet.gen_meet_url,
        finalized_start_date=meet.finalized_start_date,
        finalized_end_date=meet.finalized_end_date,
        finalized_start_time_slot_id=meet.finalized_start_time_slot_id,
        finalized_end_time_slot_id=meet.finalized_end_time_slot_id,
        meet_url=meet.meet_url,
        description=meet.description,
        host_info=host,
        member_infos=member_infos,
    )


@router.get('/meet/code/{code}')
@enveloped
async def read_meet_by_code(code: str) -> ReadMeetOutput:
    meet = await db.meet.read_meet_by_code(invite_code=code)

    account_id = request.account.id

    meet.status = await update_status(meet.id, meet, request.time, account_id)
    host, member_infos = await compose_host_and_member_info(meet_id=meet.id)

    return ReadMeetOutput(
        id=meet.id,
        status=meet.status,
        start_date=meet.start_date,
        end_date=meet.end_date,
        start_time_slot_id=meet.start_time_slot_id,
        end_time_slot_id=meet.end_time_slot_id,
        voting_end_time=meet.voting_end_time,
        meet_name=meet.title,
        invite_code=meet.invite_code,
        gen_meet_url=meet.gen_meet_url,
        finalized_start_date=meet.finalized_start_date,
        finalized_end_date=meet.finalized_end_date,
        finalized_start_time_slot_id=meet.finalized_start_time_slot_id,
        finalized_end_time_slot_id=meet.finalized_end_time_slot_id,
        meet_url=meet.meet_url,
        description=meet.description,
        host_info=host,
        member_infos=member_infos,
    )


@router.get('/meet/{meet_id}/available_time')
@enveloped
async def browse_member_available_time_by_meet_id(meet_id: int, name: Optional[str] = None) \
        -> Sequence[do.MeetMemberAvailableTime]:
    account_id = request.account.id
    if not account_id and not name:
        raise exc.NoPermission
    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, name=name):
        raise exc.NoPermission

    return await service.meet.browse_member_available_time(meet_id=meet_id, name=name)


class DateSlotData(BaseModel):
    date: date
    time_slot_id: int
    available_members: Sequence[str]
    unavailable_members: Sequence[str]


class BrowseAllMemberAvailableTimeOutput(BaseModel):
    data: Sequence[DateSlotData]


@router.get('/meet/{meet_id}/available_time/all')
@enveloped
async def browse_all_member_available_time(meet_id: int) \
        -> BrowseAllMemberAvailableTimeOutput:
    return await service.meet.browse_all_member_available_time(meet_id=meet_id)


@router.post('/meet/{meet_id}/confirm')
@enveloped
async def confirm_meet(meet_id: int, data: ConfirmMeetInput) -> None:
    account_id = request.account.id
    if not account_id:
        raise exc.NoPermission

    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, only_host=True):
        raise exc.NoPermission

    if data.start_date > data.end_date:
        raise exc.IllegalInput
    if data.start_time_slot_id > data.end_time_slot_id:
        raise exc.IllegalInput

    await service.meet.confirm(meet_id=meet_id, data=data)


@router.delete('/meet/code/{code}')
@enveloped
async def delete_meet_by_code(code: str) -> None:
    meet_id = (await db.meet.read_meet_by_code(invite_code=code)).id
    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id):
        raise exc.NoPermission
    await service.meet.delete_meet(meet_id=meet_id)


@router.patch('/meet/code/{code}')
@enveloped
async def edit_meet_by_code(code: str, data: EditMeetInput) -> None:
    meet_id = (await db.meet.read_meet_by_code(invite_code=code)).id
    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, only_host=True):
        raise exc.NoPermission
    await service.meet.edit_meet(meet_id, data=data)


@router.get('/meet/code/{code}/available_time/all')
@enveloped
async def browse_all_member_available_time_by_code(code: str) \
        -> BrowseAllMemberAvailableTimeOutput:
    meet_id = (await db.meet.read_meet_by_code(invite_code=code)).id
    return await service.meet.browse_all_member_available_time(meet_id=meet_id)


@router.get('/meet/code/{code}/available_time')
@enveloped
async def browse_member_available_time_by_code(code: str, name: Optional[str] = None) \
        -> Sequence[do.MeetMemberAvailableTime]:
    account_id = request.account.id
    if not account_id and not name:
        raise exc.NoPermission
    meet_id = (await db.meet.read_meet_by_code(invite_code=code)).id
    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, name=name):
        raise exc.NoPermission

    return await service.meet.browse_member_available_time(meet_id=meet_id, name=name)


@router.post('/meet/code/{code}/confirm')
@enveloped
async def confirm_meet_by_code(code: str, data: ConfirmMeetInput) -> None:
    account_id = request.account.id
    if not account_id:
        raise exc.NoPermission

    meet_id = (await db.meet.read_meet_by_code(invite_code=code)).id
    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, only_host=True):
        raise exc.NoPermission

    if data.start_date > data.end_date:
        raise exc.IllegalInput
    if data.start_time_slot_id > data.end_time_slot_id:
        raise exc.IllegalInput

    await service.meet.confirm(meet_id=meet_id, data=data)


@router.post('/meet/{meet_id}/available_time')
@enveloped
async def add_member_meet_available_time(meet_id: int, data: AddMemberMeetAvailableTimeInput):
    account_id = request.account.id
    if not account_id and not data.name:
        raise exc.IllegalInput

    if not await service.meet.is_authed(meet_id=meet_id, name=data.name, password=data.password):
        raise exc.NoPermission

    meet = await db.meet.read(meet_id=meet_id)
    if any(not meet.start_time_slot_id <= time_slot.time_slot_id <= meet.end_time_slot_id for time_slot in
           data.time_slots):
        raise exc.IllegalInput

    if any(not meet.start_date <= time_slot.date <= meet.end_date for time_slot in data.time_slots):
        raise exc.IllegalInput
    await service.meet.add_member_meet_available_time(meet_id, data=data)


@router.post('/meet/code/{code}/available_time')
@enveloped
async def add_member_meet_available_time_by_code(code: str, data: AddMemberMeetAvailableTimeInput):
    account_id = request.account.id
    if not account_id and not data.name:
        raise exc.IllegalInput

    meet = await db.meet.read_meet_by_code(invite_code=code)
    if not await service.meet.is_authed(meet_id=meet.id, name=data.name, password=data.password):
        raise exc.NoPermission
    if any(not meet.start_time_slot_id <= time_slot.time_slot_id <= meet.end_time_slot_id for time_slot in data.time_slots):  # noqa
        raise exc.IllegalInput

    if any(not meet.start_date <= time_slot.date <= meet.end_date for time_slot in data.time_slots):
        raise exc.IllegalInput
    await service.meet.add_member_meet_available_time(meet_id=meet.id, data=data)


@router.delete('/meet/{meet_id}/available_time')
@enveloped
async def delete_member_meet_available_time(meet_id: int, data: DeleteMeetMemberAvailableTimeInput):
    if not await service.meet.is_authed(meet_id=meet_id, name=data.name, password=data.password):
        raise exc.NoPermission
    await service.meet.delete_meet_member_available_time(meet_id=meet_id, data=data)


@router.delete('/meet/code/{code}/available_time')
@enveloped
async def delete_member_meet_available_time_by_code(code: str, data: DeleteMeetMemberAvailableTimeInput):
    meet = await db.meet.read_meet_by_code(invite_code=code)
    if not await service.meet.is_authed(meet_id=meet.id, name=data.name, password=data.password):
        raise exc.NoPermission
    await service.meet.delete_meet_member_available_time(meet_id=meet.id, data=data)
