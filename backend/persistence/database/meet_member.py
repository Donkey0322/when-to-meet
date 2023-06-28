import asyncpg

from base import do
from typing import Optional, Sequence, Tuple
import exceptions as exc  # noqa

from .util import pyformat2psql
from . import pool_handler


async def read(meet_id: int, account_id: Optional[int] = None, name: Optional[str] = None) -> do.MeetMember:
    name = f"guest_{name}" if name else None
    sql, params = pyformat2psql(
        sql=fr"SELECT id, meet_id, is_host, name, member_id, has_voted"
            fr"  FROM meet_member"
            fr" WHERE meet_id = %(meet_id)s"
            fr"  AND (member_id = %(account_id)s"
            fr"    OR name = %(name)s)",
        meet_id=meet_id, account_id=account_id, name=name,
    )
    try:
        id_, meet_id, is_host, name, member_id, has_voted = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return do.MeetMember(id=id_, meet_id=meet_id, is_host=is_host, name=name, member_id=member_id, has_voted=has_voted)


async def browse_meet_members_with_names(meet_id: int) -> Sequence[do.MeetMember]:
    sql, params = pyformat2psql(
        sql=fr"SELECT meet_member.id, meet_id, is_host, meet_member.name, member_id, account.username, has_voted"
            fr"  FROM meet_member"
            fr"  LEFT JOIN account"
            fr"         ON account.id = meet_member.member_id"
            fr" WHERE meet_member.meet_id = %(meet_id)s",
        meet_id=meet_id,
    )
    results = await pool_handler.pool.fetch(sql, *params)
    return [do.MeetMember(
                id=id_,
                meet_id=meet_id,
                is_host=is_host,
                name=name if name else username,
                member_id=member_id,
                has_voted=has_voted,
            )
            for id_, meet_id, is_host, name, member_id, username, has_voted in results]


async def read_by_meet_id_and_name(meet_id: int, name: str) -> Tuple[int, str, str]:
    name = f"guest_{name}"
    sql, params = pyformat2psql(
        sql=fr"SELECT id, name, pass_hash"
            fr"  FROM meet_member"
            fr" WHERE meet_id = %(meet_id)s"
            fr"   AND name = %(name)s",
        meet_id=meet_id, name=name,
    )
    try:
        id_, name, pass_hash = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return id_, name, pass_hash


async def edit(meet_id: int, added_member_ids: Sequence[int], removed_member_ids: Sequence[int],
               remove_guest_names: Optional[Sequence[str]] = None):
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    print(added_member_ids, removed_member_ids)
    try:
        if removed_member_ids:
            await conn.executemany(
                "DELETE FROM meet_member_available_time"
                " WHERE meet_member_id IN ("
                "       SELECT id"
                "         FROM meet_member"
                "        WHERE member_id = $1"
                ")",
                args=[[removed_id] for removed_id in removed_member_ids],
            )
            await conn.executemany(
                "DELETE FROM meet_member"
                " WHERE member_id = $1",
                args=[[removed_id] for removed_id in removed_member_ids],
            )
        if added_member_ids:
            await conn.executemany(
                "INSERT INTO meet_member"
                "            (member_id, meet_id)"
                "     VALUES ($1, $2)",
                args=[(member_id, meet_id) for member_id in added_member_ids]
            )
        if remove_guest_names:
            await conn.executemany(
                "DELETE FROM meet_member"
                " WHERE name = $1",
                args=[[f"guest_{name}"] for name in remove_guest_names],
            )
    finally:
        await pool_handler.pool.release(conn)


async def update(meet_member_id: int, has_voted: bool = None) -> None:
    update_params = {}
    if has_voted is not None:
        update_params['has_voted'] = has_voted
    if not update_params:
        return

    set_sql = ', '.join(fr"{field_name} = %({field_name})s" for field_name in update_params)
    sql, params = pyformat2psql(
        sql=fr"UPDATE meet_member"
            fr"   SET {set_sql}"
            fr" WHERE id = %(meet_member_id)s",
        meet_member_id=meet_member_id, **update_params,
    )
    await pool_handler.pool.execute(sql, *params)
