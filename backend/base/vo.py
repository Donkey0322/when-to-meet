from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from base import enums


@dataclass
class BrowseMeetByAccount:
    meet_id: int
    invite_code: str
    host_account_id: Optional[int]
    host_username: Optional[str]
    title: str
    start_date: date
    end_date: date
    start_time_slot_id: int
    end_time_slot_id: int
    status: enums.StatusType
    voting_end_time: Optional[datetime] = None
    meet_url: Optional[str] = None


@dataclass
class CalendarEvent:
    invite_code: str
    title: str
    start_date: date
    end_date: date
    start_time_slot_id: int
    end_time_slot_id: int
    
@dataclass
class GoogleCalendarEvent:
    title: str
    start_date: date
    end_date: date
    color: str
    

    