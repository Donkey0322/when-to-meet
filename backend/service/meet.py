from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional, Sequence

from pydantic import BaseModel

from base import enums, do
from middleware.context import request
from processor.http.util import timezone_validate
import persistence.database as db
import persistence.email as email
import exceptions as exc  # noqa
from security import verify_password
from service.calendar import GoogleCalendar


class EditMeetInput(BaseModel):
    meet_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time_slot_id: Optional[int] = None
    end_time_slot_id: Optional[int] = None
    description: Optional[str] = None
    voting_end_time: Optional[datetime] = None
    gen_meet_url: Optional[bool] = False
    member_ids: Optional[Sequence[int]] = None
    remove_guest_names: Optional[Sequence[str]] = None
    emails: Optional[Sequence[str]] = None


async def edit_meet(meet_id: int, data: EditMeetInput):

    meet = await db.meet.read(meet_id=meet_id)
    if meet.status is enums.StatusType.confirmed and (
        meet.start_time_slot_id is not data.start_time_slot_id
        or meet.end_time_slot_id is not data.end_time_slot_id
        or meet.start_date != data.start_date or meet.end_date != data.end_date
        or meet.voting_end_time != data.voting_end_time
    ):
        raise exc.IllegalInput

    meet.start_date = data.start_date or meet.start_date
    meet.end_date = data.end_date or meet.end_date
    meet.start_time_slot_id = data.start_time_slot_id or meet.start_time_slot_id
    meet.end_time_slot_id = data.end_time_slot_id or meet.end_time_slot_id
    meet.voting_end_time = data.voting_end_time

    if meet.start_date > meet.end_date:
        raise exc.IllegalInput

    if meet.start_time_slot_id > meet.end_time_slot_id:
        raise exc.IllegalInput

    if not (0 < meet.start_time_slot_id < 49 and 0 < meet.end_time_slot_id < 49):
        raise exc.IllegalInput

    status = enums.StatusType.voting
    if meet.voting_end_time and timezone_validate(meet.voting_end_time) < request.time:
        status = enums.StatusType.waiting_for_confirm
    if meet.status is enums.StatusType.confirmed:
        status = meet.status
    meet_members = await db.meet_member.browse_meet_members_with_names(meet_id=meet_id)
    meet_member_ids = set(meet_member.member_id for meet_member in meet_members)
    member_ids = list(data.member_ids) if data.member_ids else []
    member_ids.append(request.account.id)
    removed_ids = list(meet_member_ids - set(member_ids))
    added_ids = list(set(member_ids) - meet_member_ids)

    await db.meet_member.edit(meet_id=meet_id, removed_member_ids=removed_ids,
                              added_member_ids=added_ids, remove_guest_names=data.remove_guest_names)
    if data.emails:
        for _, user_email in enumerate(set(data.emails)):
            await email.invite_to_meet.send(to=user_email, meet_code=meet.invite_code)

    host_account = await db.account.read(request.account.id)
    meet_url = None
    if data.gen_meet_url and not host_account.is_google_login:
        raise exc.IllegalInput
    if data.gen_meet_url and host_account.is_google_login and not meet.meet_url:
        meet_url = await GoogleCalendar(account_id=host_account.id).get_google_meet_url()
    await db.meet.edit(
        meet_id=meet_id,
        title=data.meet_name,
        start_date=data.start_date,
        end_date=data.end_date,
        start_time_slot_id=data.start_time_slot_id,
        end_time_slot_id=data.end_time_slot_id,
        description=data.description,
        voting_end_time=timezone_validate(meet.voting_end_time) if meet.voting_end_time else None,
        gen_meet_url=data.gen_meet_url,
        meet_url=meet_url,
        status=status,
    )


class DateSlotData(BaseModel):
    def __hash__(self):
        return hash((self.date, self.time_slot_id))

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
    meet_members = [meet_member for meet_member in meet_members if meet_member.has_voted is True]
    member_id_name_map = {meet_member.id: meet_member.name for meet_member in meet_members}

    meet_info = await db.meet.read(meet_id=meet_id)

    arranged_available_time = defaultdict(list)
    for available_time in available_times:
        if name := member_id_name_map.get(available_time.meet_member_id, None):
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
    if not meet_member.has_voted:
        await db.meet_member.update(meet_member_id=meet_member.id, has_voted=True)
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
    if not meet_member.has_voted:
        await db.meet_member.update(meet_member_id=meet_member.id, has_voted=True)
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
    if not await db.meet.is_authed(meet_id=meet_id, member_id=request.account.id, name=name):
        return False
    return True
