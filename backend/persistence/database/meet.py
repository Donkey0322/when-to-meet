from datetime import datetime, date
from typing import Sequence, Optional, Tuple

import asyncpg

from base import do, enums, model, vo
import exceptions as exc  # noqa

from .util import pyformat2psql, compile_filters
from . import pool_handler


async def add(title: str, invite_code: str,
              start_date: date, end_date: date,
              start_time_slot_id: int, end_time_slot_id: int,
              gen_meet_url: bool, voting_end_time: Optional[datetime] = None,
              status: enums.StatusType = enums.StatusType.voting,
              host_member_id: int = None, member_ids: Sequence[int] = None,
              guest_name: Optional[str] = None, guest_passhash: Optional[str] = None,
              description: Optional[str] = None) -> int:
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        meet_id, = await conn.fetchrow(
            r"INSERT INTO meet "
            r"            (title, invite_code, start_date,end_date, start_time_slot_id, end_time_slot_id,"
            r"            voting_end_time, gen_meet_url, status, description)"
            r"     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
            r"  RETURNING id",
            title, invite_code, start_date, end_date, start_time_slot_id, end_time_slot_id, voting_end_time,
            gen_meet_url, status, description,
        )
        if member_ids:
            await conn.executemany(
                r"INSERT INTO meet_member"
                r"            (meet_id, member_id, is_host)"
                r"     VALUES ($1, $2, $3)",
                args=[(meet_id, member_id, False) for member_id in member_ids]
            )
        if host_member_id:
            await conn.execute(
                r"INSERT INTO meet_member"
                r"            (meet_id, member_id, is_host)"
                r"     VALUES ($1, $2, $3)",
                meet_id, host_member_id, True,
            )
        if guest_name:
            await conn.execute(
                r"INSERT INTO meet_member"
                r"            (meet_id, name, pass_hash, is_host)"
                r"     VALUES ($1, $2, $3, $4)",
                meet_id, guest_name, guest_passhash, True,
            )
        return meet_id
    finally:
        await pool_handler.pool.release(conn)


async def read_meet_by_code(invite_code: str, include_deleted: bool = False) -> do.Meet:
    select_sql, select_params = pyformat2psql(
        sql=fr"SELECT id, status, start_date, end_date, start_time_slot_id, end_time_slot_id,"
            fr"       voting_end_time, title, invite_code, gen_meet_url,"
            fr"       finalized_start_date, finalized_end_date,"
            fr"       finalized_start_time_slot_id, finalized_end_time_slot_id,"
            fr"       meet_url, description"
            fr"  FROM meet"
            fr" WHERE invite_code = %(invite_code)s"
            fr" {'AND NOT is_deleted' if not include_deleted else ''}",
        invite_code=invite_code
    )
    try:
        id_, status, start_date, end_date, start_time_slot_id, end_time_slot_id, \
        voting_end_time, title, invite_code, gen_meet_url, \
        finalized_start_date, finalized_end_date, \
        finalized_start_time_slot_id, finalized_end_time_slot_id, \
        meet_url, description = await pool_handler.pool.fetchrow(select_sql, *select_params)  # noqa
    except TypeError:
        raise exc.NotFound
    return do.Meet(id=id_, status=enums.StatusType(status), start_date=start_date, end_date=end_date,
                   start_time_slot_id=start_time_slot_id, end_time_slot_id=end_time_slot_id,
                   voting_end_time=voting_end_time,
                   title=title, invite_code=invite_code, gen_meet_url=gen_meet_url,
                   finalized_start_date=finalized_start_date, finalized_end_date=finalized_end_date,
                   finalized_start_time_slot_id=finalized_start_time_slot_id,
                   finalized_end_time_slot_id=finalized_end_time_slot_id,
                   meet_url=meet_url, description=description)


async def read(meet_id: int, include_deleted: bool = False) -> do.Meet:
    sql, params = pyformat2psql(
        sql=fr"SELECT id, status, start_date, end_date, start_time_slot_id, end_time_slot_id,"
            fr"       voting_end_time, title, invite_code, gen_meet_url,"
            fr"       finalized_start_date, finalized_end_date,"
            fr"       finalized_start_time_slot_id, finalized_end_time_slot_id,"
            fr"       meet_url, description"
            fr"  FROM meet"
            fr" WHERE id = %(meet_id)s"
            fr" {'AND NOT is_deleted' if not include_deleted else ''}",
        meet_id=meet_id,
    )
    try:
        id_, status, start_date, end_date, start_time_slot_id, end_time_slot_id, \
        voting_end_time, title, invite_code, gen_meet_url, \
        finalized_start_date, finalized_end_date, \
        finalized_start_time_slot_id, finalized_end_time_slot_id, \
        meet_url, description = await pool_handler.pool.fetchrow(sql, *params)  # noqa
    except TypeError:
        raise exc.NotFound
    return do.Meet(id=id_, status=enums.StatusType(status), start_date=start_date, end_date=end_date,
                   start_time_slot_id=start_time_slot_id, end_time_slot_id=end_time_slot_id,
                   voting_end_time=voting_end_time,
                   title=title, invite_code=invite_code, gen_meet_url=gen_meet_url,
                   finalized_start_date=finalized_start_date, finalized_end_date=finalized_end_date,
                   finalized_start_time_slot_id=finalized_start_time_slot_id,
                   finalized_end_time_slot_id=finalized_end_time_slot_id,
                   meet_url=meet_url, description=description)


async def is_authed(meet_id: int, member_id: int = None, name: str = None, only_host: bool = False) -> bool:
    if not member_id and not name:
        return False

    sql, params = pyformat2psql(
        sql=fr"SELECT * FROM meet_member"
            fr" WHERE meet_id = %(meet_id)s"
            fr" {'AND member_id = %(member_id)s' if member_id else ''}"
            fr" {'AND name = %(name)s' if name else ''}"
            fr" {'AND is_host' if only_host else ''}",
        meet_id=meet_id, member_id=member_id, name=name,
    )
    result = await pool_handler.pool.fetch(sql, *params)
    return True if result else False


async def delete(meet_id: int) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE meet"
            fr"   SET is_deleted = %(is_deleted)s"
            fr" WHERE id = %(meet_id)s",
        is_deleted=True, meet_id=meet_id,
    )
    await pool_handler.pool.execute(sql, *params)


async def get_member_id_and_auth(meet_id: int) -> dict[Tuple[int, Optional[str]], bool]:
    sql, params = pyformat2psql(
        sql=fr"SELECT member_id, name, is_host"
            fr"  FROM meet_member"
            fr" WHERE meet_id = %(meet_id)s",
        meet_id=meet_id
    )
    record = await pool_handler.pool.fetch(sql, *params)
    return {(id_, name): is_host for id_, name, is_host in record}


async def leave(meet_id: int, account_id: int) -> None:
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        meet_member_id, = await conn.fetchrow(
            fr"SELECT id FROM meet_member"
            fr" WHERE meet_id = $1"
            fr"   AND member_id = $2",
            meet_id, account_id,
        )
        await conn.execute(
            fr"DELETE FROM meet_member_available_time"
            fr" WHERE meet_member_id = $1",
            meet_member_id,
        )
        await conn.execute(
            fr"DELETE FROM meet_member"
            fr" WHERE id = $1",
            meet_member_id,
        )
    finally:
        await pool_handler.pool.release(conn)


async def edit(meet_id: int,
               title: Optional[str] = None,
               start_date: Optional[date] = None, end_date: Optional[date] = None,
               start_time_slot_id: Optional[int] = None, end_time_slot_id: Optional[int] = None,
               description: Optional[str] = None, voting_end_time: Optional[datetime] = None,
               gen_meet_url: Optional[bool] = None, status: Optional[enums.StatusType] = None,
               finalized_start_date: Optional[date] = None, finalized_end_date: Optional[date] = None,
               finalized_start_time_slot_id: Optional[int] = None, finalized_end_time_slot_id: Optional[int] = None) \
        -> None:
    update_params = {}
    if title:
        update_params['title'] = title
    if start_date:
        update_params['start_date'] = start_date
    if end_date:
        update_params['end_date'] = end_date
    if start_time_slot_id:
        update_params['start_time_slot_id'] = start_time_slot_id
    if end_time_slot_id:
        update_params['end_time_slot_id'] = end_time_slot_id
    if description:
        update_params['description'] = description
    if voting_end_time:
        update_params['voting_end_time'] = voting_end_time
    if gen_meet_url is not None:
        update_params['gen_meet_url'] = gen_meet_url
    if status:
        update_params['status'] = status
    if finalized_start_date:
        update_params['finalized_start_date'] = finalized_start_date
    if finalized_end_date:
        update_params['finalized_end_date'] = finalized_end_date
    if finalized_start_time_slot_id:
        update_params['finalized_start_time_slot_id'] = finalized_start_time_slot_id
    if finalized_end_time_slot_id:
        update_params['finalized_end_time_slot_id'] = finalized_end_time_slot_id
    if not update_params:
        return

    set_sql = ', '.join(fr"{field_name} = %({field_name})s" for field_name in update_params)

    sql, params = pyformat2psql(
        sql=fr"UPDATE meet"
            fr"   SET {set_sql}"
            fr" WHERE id = %(meet_id)s",
        meet_id=meet_id, **update_params
    )
    await pool_handler.pool.execute(sql, *params)


async def browse_by_account_id(account_id: int, filters: Sequence[model.Filter], sorters: Sequence[model.Sorter]) \
        -> list[vo.BrowseMeetByAccount]:
    column_mapper = {
        'name': 'meet.title',
        'host': 'host.username',
        'status': 'status',
        'start_date': 'start_date',
        'end_date': 'end_date',
        'voting_end_time': 'voting_end_time'
    }
    filters = [model.Filter(field=column_mapper[f.field], op=f.op, value=f.value) for f in filters]
    cond_sql, cond_params = compile_filters(filters=filters)
    sort_sql = ' ,'.join(f"{sorter.field} {sorter.order}" for sorter in sorters)
    sql, params = pyformat2psql(
        sql=fr"SELECT meet.id, invite_code, title, start_date, end_date, status, start_time_slot_id, end_time_slot_id,"
            fr"       voting_end_time, meet_url, tbl1.member_id, "
            fr"       host.username"
            fr"  FROM meet"
            fr" INNER JOIN meet_member tbl1"
            fr"         ON meet.id = tbl1.meet_id"
            fr"        AND tbl1.member_id = %(account_id)s"
            fr"  LEFT JOIN meet_member tbl2"
            fr"         ON meet.id = tbl2.meet_id"
            fr"        AND tbl2.is_host"
            fr"  LEFT JOIN account host"
            fr"         ON host.id = tbl2.member_id"
            fr"        AND NOT is_deleted"
            fr"   {f'WHERE {cond_sql}' if cond_sql else ''}"
            fr"   {f'ORDER BY {sort_sql}' if sort_sql else ''}",
        **cond_params, account_id=account_id,
    )
    records = await pool_handler.pool.fetch(sql, *params)
    return [vo.BrowseMeetByAccount(meet_id=meet_id, invite_code=invite_code, host_account_id=host_account_id,
                                   host_username=host_username, title=title, start_date=start_date, end_date=end_date,
                                   start_time_slot_id=start_time_slot_id, end_time_slot_id=end_time_slot_id,
                                   status=enums.StatusType(status), voting_end_time=voting_end_time, meet_url=meet_url)
            for meet_id, invite_code, title, start_date, end_date, status, start_time_slot_id, end_time_slot_id,
                voting_end_time, meet_url, host_account_id, host_username in records]  # noqa


async def has_voted(meet_id: int, account_id: int) -> bool:
    sql, params = pyformat2psql(
        sql=fr'SELECT COUNT(*)'
            fr'  FROM meet_member_available_time'
            fr' INNER JOIN meet_member on meet_member_available_time.meet_member_id = meet_member.id'
            fr' WHERE meet_id = %(meet_id)s'
            fr'   AND meet_member.member_id = %(account_id)s',
        meet_id=meet_id, account_id=account_id,
    )
    count, = await pool_handler.pool.fetchrow(sql, *params)
    return count > 0


async def update_status(meet_id: int, status: enums.StatusType) -> None:
    sql, params = pyformat2psql(
        sql=fr'UPDATE meet'
            fr'   SET status = %(status)s'
            fr' WHERE id = %(meet_id)s',
        status=status, meet_id=meet_id
    )
    await pool_handler.pool.execute(sql, *params)


async def add_member(meet_id: int, account_id: Optional[int] = None,
                     name: Optional[str] = None, pass_hash: Optional[str] = None) -> None:
    sql, params = pyformat2psql(
        sql=fr'INSERT INTO meet_member'
            fr'            (name, member_id, meet_id, pass_hash)'
            fr'     VALUES (%(name)s, %(member_id)s, %(meet_id)s, %(pass_hash)s)',
        name=name, member_id=account_id, meet_id=meet_id, pass_hash=pass_hash,
    )
    await pool_handler.pool.execute(sql, *params)
