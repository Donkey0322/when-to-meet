"""
data objects
"""
from datetime import datetime, date, time
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from base import enums


@dataclass
class Account:
    id: int
    username: str
    email: str
    notification_preference: enums.NotificationPreference
    is_google_login: bool
    line_token: Optional[str] = None


@dataclass
class Event:
    meet_id: int
    account_id: int


@dataclass
class Meet:
    id: int
    status: enums.StatusType
    start_date: date
    end_date: date
    start_time_slot_id: int
    end_time_slot_id: int
    title: str
    invite_code: str
    gen_meet_url: bool
    voting_end_time: Optional[datetime] = None
    finalized_start_date: Optional[date] = None
    finalized_end_date: Optional[date] = None
    finalized_start_time_slot_id: Optional[int] = None
    finalized_end_time_slot_id: Optional[int] = None
    meet_url: Optional[str] = None
    description: Optional[str] = None


@dataclass
class MeetMember:
    id: int
    meet_id: int
    is_host: bool
    has_voted: bool
    name: Optional[str] = None
    member_id: Optional[int] = None


@dataclass
class MeetMemberAvailableTime:
    meet_member_id: int
    date: datetime.date
    time_slot_id: int


@dataclass
class Routine:
    account_id: int
    weekday: enums.WeekDayType
    time_slot_id: int


@dataclass
class TimeSlot:
    id: int
    start_time: time
    end_time: time


@dataclass
class S3File:
    uuid: UUID
    key: str
    bucket: str


@dataclass
class AccountMail:
    username: str
    email: str


@dataclass
class MeetAndAccountPreference:
    meet_title: str
    username: str
    email: str
    time: time
    meet_code: str
    line_token: str
    notification_preference: enums.NotificationPreference
