from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional, Sequence

from pydantic import BaseModel

from base import enums, do
from middleware.context import request
from processor.http.util import timezone_validate
import persistence.database as db
import exceptions as exc  # noqa
from security import verify_password


class EditMeetInput(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time_slot_id: Optional[int] = None
    end_time_slot_id: Optional[int] = None
    description: Optional[str] = None
    voting_end_time: Optional[datetime] = None
    gen_meet_url: Optional[bool] = False


async def edit_meet(meet_id: int, data: EditMeetInput):

    meet = await db.meet.read(meet_id=meet_id)
    meet.start_date = data.start_date or meet.start_date
    meet.end_date = data.end_date or meet.end_date
    meet.start_time_slot_id = data.start_time_slot_id or meet.start_time_slot_id
    meet.end_time_slot_id = data.end_time_slot_id or meet.end_time_slot_id
    meet.voting_end_time = data.voting_end_time or meet.voting_end_time

    if meet.start_date > meet.end_date:
        raise exc.IllegalInput

    if meet.start_time_slot_id > meet.end_time_slot_id:
        raise exc.IllegalInput

    status = enums.StatusType.voting
    if meet.voting_end_time and meet.voting_end_time < request.time:
        status = enums.StatusType.waiting_for_confirm
    await db.meet.edit(
        meet_id=meet_id,
        title=data.title,
        start_date=data.start_date,
        end_date=data.end_date,
        start_time_slot_id=data.start_time_slot_id,
        end_time_slot_id=data.end_time_slot_id,
        description=data.description,
        voting_end_time=timezone_validate(meet.voting_end_time),
        gen_meet_url=data.gen_meet_url,
        status=status,
    )


class DateSlotData(BaseModel):
    date: date
    time_slot_id: int
    available_members: Sequence[str]
    unavailable_members: Sequence[str]


class BrowseAllMemberAvailableTimeOutput(BaseModel):
    data: Sequence[DateSlotData]


async def browse_all_member_available_time(meet_id: int) \
        -> BrowseAllMemberAvailableTimeOutput:
    available_times = await db.available_time.browse_by_meet_id(meet_id)
    meet_members = await db.meet_member.browse_meet_members_with_names(meet_id=meet_id)
    member_id_name_map = {meet_member.id: meet_member.name for meet_member in meet_members}

    meet_info = await db.meet.read(meet_id=meet_id)

    arranged_available_time = defaultdict(list)
    for available_time in available_times:
        name = member_id_name_map[available_time.meet_member_id]
        arranged_available_time[(available_time.date, available_time.time_slot_id)].append(name)

    ret = []
    start_date = meet_info.start_date
    delta = timedelta(days=1)
    while start_date <= meet_info.end_date:
        for time_slot_id in range(meet_info.start_time_slot_id, meet_info.end_time_slot_id + 1):
            avail_member = arranged_available_time[(start_date, time_slot_id)]
            unavail_member = list(set(member_id_name_map.values()) - set(avail_member))
            ret.append(DateSlotData(
                date=start_date,
                time_slot_id=time_slot_id,
                available_members=avail_member,
                unavailable_members=unavail_member,
            ))
        start_date += delta
    return BrowseAllMemberAvailableTimeOutput(data=ret)


async def browse_member_available_time(meet_id: int, name: Optional[str] = None) \
        -> Sequence[do.MeetMemberAvailableTime]:
    meet_member = await db.meet_member.read(meet_id, account_id=request.account.id, name=name)
    available_times = await db.available_time.browse_by_meet_member_id(meet_member.id)
    return available_times


async def delete_meet(meet_id: int) -> None:
    meet_members = await db.meet.get_member_id_and_auth(meet_id=meet_id)
    try:
        is_host = meet_members[request.account.id, None]
    except KeyError:
        raise exc.NoPermission

    if is_host:
        await db.meet.delete(meet_id)
    else:
        await db.meet.leave(meet_id, request.account.id)


class Slot(BaseModel):
    date: date
    time_slot_id: int


class AddMemberMeetAvailableTimeInput(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    time_slots: Sequence[Slot]


async def add_member_meet_available_time(meet_id: int, data: AddMemberMeetAvailableTimeInput):
    meet_member = await db.meet_member.read(meet_id=meet_id, account_id=request.account.id, name=data.name)
    await db.available_time.batch_add(
        meet_member_id=meet_member.id,
        time_slots=[(time_slot.date, time_slot.time_slot_id) for time_slot in data.time_slots],
    )


class ConfirmMeetInput(BaseModel):
    start_date: date
    end_date: date
    start_time_slot_id: int
    end_time_slot_id: int


async def confirm(meet_id: int, data: ConfirmMeetInput):
    await db.meet.edit(
        meet_id=meet_id,
        finalized_start_time_slot_id=data.start_time_slot_id,
        finalized_end_time_slot_id=data.end_time_slot_id,
        finalized_start_date=data.start_date,
        finalized_end_date=data.end_date,
        status=enums.StatusType.confirmed,
    )

    meet_member_available_times = await db.available_time.browse_by_meet_id(meet_id=meet_id)
    member_time = defaultdict(list)
    for available_time in meet_member_available_times:
        member_time[available_time.meet_member_id].append((available_time.date, available_time.time_slot_id))

    confirmed_times = set()
    start_date = data.start_date
    delta = timedelta(days=1)
    while start_date <= data.end_date:
        confirmed_times.update(set((start_date, time_slot_id)
                                   for time_slot_id in range(data.start_time_slot_id, data.end_time_slot_id + 1)))
        start_date += delta

    # TODO: maybe make a transaction or batch insert ?
    meet_members = await db.meet_member.browse_meet_members_with_names(meet_id=meet_id)
    member_id_account_id_map = {meet_member.id: meet_member.member_id for meet_member in meet_members}
    for member_id, available_times in member_time.items():
        if all(confirmed_time in available_times for confirmed_time in confirmed_times):
            account_id = member_id_account_id_map.get(member_id, None)
            if account_id:
                await db.event.add(meet_id, account_id)


class DeleteMeetMemberAvailableTimeInput(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    time_slots: Sequence[Slot]


async def delete_meet_member_available_time(meet_id: int, data: DeleteMeetMemberAvailableTimeInput):
    meet_member = await db.meet_member.read(meet_id=meet_id, account_id=request.account.id, name=data.name)
    await db.available_time.batch_delete(
        meet_member_id=meet_member.id,
        time_slots=[(time_slot.date, time_slot.time_slot_id) for time_slot in data.time_slots],
    )


async def is_authed(meet_id: int, name: Optional[str] = None, password: Optional[str] = None):
    if name:
        *_, pass_hash = await db.meet_member.read_by_meet_id_and_name(meet_id=meet_id, name=name)
        if pass_hash and not verify_password(password, pass_hash):
            return False
        return True
    if not db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, name=name):
        return False
    return True
