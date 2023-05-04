import typing
import enum

T = typing.TypeVar("T")


class StrEnum(str, enum.Enum):
    pass


class StatusType(StrEnum):
    voting = 'VOTING'
    voted = 'VOTED'
    need_confirm = 'NEED_CONFIRM'
    waiting_for_confirm = 'WAITING_FOR_CONFIRM'
    confirmed = 'CONFIRMED'


class WeekDayType(StrEnum):
    mon = 'MON'
    tue = 'TUE'
    wed = 'WED'
    thu = 'THU'
    fri = 'FRI'
    sat = 'SAT'
    sun = 'SUN'


class NotificationPreference(StrEnum):
    email = 'EMAIL'
    line = 'LINE'


class SortOrder(StrEnum):
    asc = 'ASC'
    desc = 'DESC'


class FilterOperator(StrEnum):
    gt = greater_than = '>'
    ge = greater_equal = '>='
    eq = equal = '='
    ne = neq = not_equal = '!='
    lt = less_than = '<'
    le = less_equal = '<='

    in_ = 'IN'
    nin = not_in = 'NOT IN'
    bt = between = 'BETWEEN'
    nbt = not_between = 'NOT BETWEEN'

    like = 'LIKE'
    nlike = not_like = 'NOT LIKE'
