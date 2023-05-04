import datetime
import typing
from typing import Tuple, Any, Optional

import pydantic

from base import model, enums
from base.enums import FilterOperator, SortOrder
import persistence.database as db
import exceptions as exc  # noqa


class MemberInfo(pydantic.BaseModel):
    member_id: Optional[int]
    name: Optional[str]


def timezone_validate(time: datetime.datetime) -> datetime.datetime:
    converted = pydantic.datetime_parse.parse_datetime(time)

    if converted.tzinfo is not None:
        # Convert to server time
        converted = converted.astimezone().replace(tzinfo=None)

    return converted


def time_to_time_slot(time: datetime.time) -> int:
    return time.hour * 2 + int(time.minute >= 30) + 1


def parse_filter(column_types: dict[str, type], filters: typing.Optional[pydantic.Json] = None) -> typing.Sequence[model.Filter]:
    filters: list[model.Filter] = pydantic.parse_obj_as(list[model.Filter], filters or [])
    for i, filter_ in enumerate(filters):
        try:
            to_parse_type = column_types[filter_.field]
        except KeyError:
            raise exc.IllegalInput

        if filter_.op in (FilterOperator.in_, FilterOperator.not_in):
            to_parse_type = set[to_parse_type]
        if filter_.op in (FilterOperator.between, FilterOperator.not_between):
            to_parse_type = tuple[to_parse_type, to_parse_type]
        if filter_.op in (FilterOperator.like, FilterOperator.not_like):
            to_parse_type = str

        try:
            converted = model.Filter(field=filter_.field, op=filter_.op,
                                     value=pydantic.parse_obj_as(to_parse_type, filter_.value))
        except pydantic.ValidationError:
            raise exc.IllegalInput

        if filter_.op in (FilterOperator.between, FilterOperator.not_between):
            if len(converted.value) != 2:
                raise exc.IllegalInput
        if filter_.op in (FilterOperator.like, FilterOperator.not_like):
            if column_types[converted.field] != str:
                raise exc.IllegalInput

        filters[i] = converted

    return filters


def parse_sorter(column_types: dict[str, type], sorters: typing.Optional[pydantic.Json] = None) -> typing.Sequence[model.Sorter]:  # noqa
    sorters = pydantic.parse_obj_as(list[model.Sorter], sorters or [])

    if any(sorter.field not in column_types for sorter in sorters):
        raise exc.IllegalInput

    return sorters


MEET_STATUS_MAPPING = {
    enums.StatusType.voting: 'Unvoted',
    enums.StatusType.voted: 'Voted',
    enums.StatusType.need_confirm: 'Need Confirmation',
    enums.StatusType.waiting_for_confirm: 'Confirming',
    enums.StatusType.confirmed: 'Confirmed',
}


async def update_status(meet_id: int, meet, now: datetime.datetime, account_id: int = None) -> str:
    if meet.voting_end_time and now <= meet.voting_end_time:
        if await db.meet.has_voted(meet_id, account_id):
            meet.status = enums.StatusType.voted
        else:
            meet.status = enums.StatusType.voting
    elif meet.voting_end_time and now > meet.voting_end_time and meet.status is enums.StatusType.voting:
        await db.meet.update_status(meet_id, enums.StatusType.waiting_for_confirm)
        meet.status = enums.StatusType.waiting_for_confirm
    if account_id and meet.status is enums.StatusType.waiting_for_confirm and await db.meet.is_authed(meet_id=meet_id,
                                                                                                      member_id=account_id,
                                                                                                      only_host=True):
        meet.status = enums.StatusType.need_confirm
    return MEET_STATUS_MAPPING[meet.status]


async def compose_host_and_member_info(meet_id: int) -> Tuple[MemberInfo, typing.Sequence[MemberInfo]]:
    member_auth = await db.meet.get_member_id_and_auth(meet_id)
    host = None
    member_infos = []
    for (id_, name), v in member_auth.items():
        if not name:
            name = (await db.account.read(account_id=id_)).username
        if v:
            host = MemberInfo(member_id=id_, name=name)
        else:
            member_infos.append(MemberInfo(member_id=id_, name=name))

    return host, member_infos
