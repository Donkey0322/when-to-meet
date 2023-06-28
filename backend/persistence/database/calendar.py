from .util import pyformat2psql
from . import pool_handler
from datetime import date
import exceptions as exc  # noqa
from base import vo


async def get_event(account_id: str, start_date: date, end_date: date):
    sql, params = pyformat2psql(
        sql=fr"  SELECT invite_code, title, meet.finalized_start_date, meet.finalized_end_date,"
            fr"  finalized_start_time_slot_id, finalized_end_time_slot_id"
            fr"  FROM event"
            fr"  INNER JOIN meet"
            fr"  ON event.meet_id = meet.id"
            fr"  WHERE account_id = %(account_id)s"
            fr"  AND (meet.finalized_start_date between %(start_date)s AND %(end_date)s"
            fr"  OR meet.finalized_end_date between %(start_date)s AND %(end_date)s)",
        account_id=account_id, start_date=start_date, end_date=end_date
    )
    records = await pool_handler.pool.fetch(sql, *params)
    return [vo.CalendarEvent(invite_code=invite_code, title=title, start_date=finalized_start_date,
                             end_date=finalized_end_date, start_time_slot_id=finalized_start_time_slot_id,
                             end_time_slot_id=finalized_end_time_slot_id)
            for invite_code, title, finalized_start_date, finalized_end_date,
            finalized_start_time_slot_id, finalized_end_time_slot_id in records]
