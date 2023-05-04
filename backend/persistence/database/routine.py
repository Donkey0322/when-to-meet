import exceptions as exc  # noqa
from base.enums import WeekDayType
from .util import pyformat2psql
from . import pool_handler
from base import do
import asyncpg
from typing import Sequence, Tuple


async def batch_add(account_id: int, routines: Sequence[Tuple[WeekDayType, int]]):
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        await conn.executemany(
            "INSERT INTO routine"
            "            (account_id, weekday, time_slot_id)"
            "     VALUES ($1, $2, $3)",
            args=[(account_id, weekday, time_slot_id) for weekday, time_slot_id in routines],
        )
    finally:
        await pool_handler.pool.release(conn)


async def batch_delete(account_id: int, routines: Sequence[Tuple[WeekDayType, int]]):
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        await conn.executemany(
            "DELETE FROM routine"
            "   WHERE account_id = $1"
            "     AND weekday = $2"
            "     AND time_slot_id = $3",
            args=[(account_id, weekday, time_slot_id) for weekday, time_slot_id in routines],
        )
    finally:
        await pool_handler.pool.release(conn)


async def get(account_id: int):
    sql, params = pyformat2psql(
        sql=fr"SELECT account_id, weekday, time_slot_id" 
            fr"  FROM routine"
            fr" WHERE account_id = %(account_id)s",
        account_id=account_id,
    )
    
    rows = await pool_handler.pool.fetch(sql, *params)
    return [do.Routine(account_id=row['account_id'], weekday=row['weekday'], time_slot_id=row['time_slot_id'])
            for row in rows]

    