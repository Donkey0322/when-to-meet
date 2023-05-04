from base import do
from datetime import date
from typing import Tuple, Sequence
import exceptions as exc  # noqa

import asyncpg

from .util import pyformat2psql
from . import pool_handler


async def add(meet_member_id: int, date_: date, time_slot_id: int) -> None:
    sql, params = pyformat2psql(
        sql="INSERT INTO meet_member_available_time"
            "            (meet_member_id, date, time_slot_id)"
            "     VALUES (%(meet_member_id)s, %(date)s, %(time_slot_id)s)",
        meet_member_id=meet_member_id, date=date_, time_slot_id=time_slot_id
    )
    await pool_handler.pool.execute(sql, *params)


async def browse_by_meet_member_id(meet_member_id: int) -> Sequence[do.MeetMemberAvailableTime]:
    sql, params = pyformat2psql(
        sql="SELECT meet_member_id, date, time_slot_id"
            "  FROM meet_member_available_time"
            " WHERE meet_member_id = %(meet_member_id)s"
            " ORDER BY date, time_slot_id",
        meet_member_id=meet_member_id,
    )
    results = await pool_handler.pool.fetch(sql, *params)
    return [do.MeetMemberAvailableTime(
                meet_member_id=meet_member_id,
                date=date_,
                time_slot_id=time_slot_id,
            )
            for meet_member_id, date_, time_slot_id in results]


async def browse_by_meet_id(meet_id: int) -> Sequence[do.MeetMemberAvailableTime]:
    sql, params = pyformat2psql(
        sql=fr"SELECT meet_member_id, date, time_slot_id"
            fr"  FROM meet_member_available_time"
            fr" INNER JOIN meet_member"
            fr"    ON meet_member.id = meet_member_available_time.meet_member_id"
            fr" WHERE meet_member.meet_id = %(meet_id)s",
        meet_id=meet_id,
    )
    results = await pool_handler.pool.fetch(sql, *params)
    return [do.MeetMemberAvailableTime(
                meet_member_id=meet_member_id,
                date=date_,
                time_slot_id=time_slot_id,
            )
            for meet_member_id, date_, time_slot_id in results]


async def batch_add(meet_member_id: int, time_slots: Sequence[Tuple[date, int]]):
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        await conn.executemany(
            "INSERT INTO meet_member_available_time"
            "            (meet_member_id, date, time_slot_id)"
            "     VALUES ($1, $2, $3)",
            args=[(meet_member_id, date, time_slot_id) for date, time_slot_id in time_slots],
        )
    finally:
        await pool_handler.pool.release(conn)


async def batch_delete(meet_member_id: int, time_slots: Sequence[Tuple[date, int]]):
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        await conn.executemany(
            "DELETE FROM meet_member_available_time"
            " WHERE meet_member_id = $1"
            "   AND date = $2"
            "   AND time_slot_id = $3",
            args=[(meet_member_id, date, time_slot_id) for date, time_slot_id in time_slots],
        )
    finally:
        await pool_handler.pool.release(conn)
