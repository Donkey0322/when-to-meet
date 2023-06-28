from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional, Union

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
    status: Union[enums.StatusType, str]
    voting_end_time: Optional[datetime] = None
    finalized_start_date: Optional[date] = None
    finalized_end_date: Optional[date] = None
    finalized_start_time_slot_id: Optional[int] = None
    finalized_end_time_slot_id: Optional[int] = None
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
    start_date: datetime
    end_date: datetime
    color: str
    

    