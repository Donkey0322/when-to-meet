from base import do, enums
from typing import Tuple, Sequence, Optional
import exceptions as exc  # noqa
from datetime import datetime, date, time

import asyncpg

from .util import pyformat2psql
from . import pool_handler


async def add(username: str, pass_hash: str = None, notification_preference: str = enums.NotificationPreference.email,
              email: str = None, access_token: str = None, refresh_token: str = None, is_google_login: bool = False) \
        -> int:
    sql, params = pyformat2psql(
        sql=fr'INSERT INTO account'
            fr'            (username, pass_hash, notification_preference, email, access_token, refresh_token, '
            fr'             is_google_login)'
            fr'     VALUES (%(username)s, %(pass_hash)s, %(notification_preference)s, %(email)s, %(access_token)s, '
            fr'             %(refresh_token)s, %(is_google_login)s)'
            fr'  RETURNING id',
        username=username, pass_hash=pass_hash, notification_preference=notification_preference, email=email,
        access_token=access_token, refresh_token=refresh_token, is_google_login=is_google_login,
    )
    try:
        id_, = await pool_handler.pool.fetchrow(sql, *params)
    except asyncpg.exceptions.UniqueViolationError:
        raise exc.UniqueViolationError
    return id_


async def update_email(account_id: int, email: str) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET email = %(email)s"
            fr" WHERE id = %(account_id)s",
        email=email, account_id=account_id,
    )
    await pool_handler.pool.execute(sql, *params)


async def update_username(account_id: int, username: str) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET username = %(username)s"
            fr" WHERE id = %(account_id)s",
        username=username, account_id=account_id,
    )
    await pool_handler.pool.execute(sql, *params)


async def update_google_token(account_id: int, access_token: str, refresh_token: str) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET access_token = %(access_token)s,"
            fr"       refresh_token = %(refresh_token)s,"
            fr"       is_google_login = %(is_google_login)s"
            fr" WHERE id = %(account_id)s",
        access_token=access_token, refresh_token=refresh_token, account_id=account_id, is_google_login=True,
    )
    await pool_handler.pool.execute(sql, *params)


async def read_by_email(email: str, is_google_login: bool = None) -> do.Account:
    sql, params = pyformat2psql(
        sql=fr"SELECT id, email, username, line_token, notification_preference, is_google_login"
            fr"  FROM account"
            fr" WHERE email = %(email)s"
            fr" {'AND is_google_login = %(is_google_login)s' if is_google_login is not None else ''}",
        email=email, is_google_login=is_google_login,
    )
    try:
        id_, email, username, line_token, notification_preference, is_google_login = \
            await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return do.Account(id=id_, email=email, username=username, line_token=line_token,
                      notification_preference=notification_preference, is_google_login=is_google_login)


async def read_by_username_or_email(identifier: str, is_google_login: bool = False) -> Tuple[int, str, bool]:
    sql, params = pyformat2psql(
        sql=fr"SELECT id, pass_hash, is_google_login"
            fr"  FROM account"
            fr" WHERE username = %(username)s"
            fr"    OR email = %(email)s"
            fr"   AND email IS NOT NULL",
        username=identifier, email=identifier, is_google_login=is_google_login
    )
    try:
        id_, pass_hash, is_google_login = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return id_, pass_hash, is_google_login


async def read_passhash(account_id: int) -> Tuple[int, str, bool]:
    sql, params = pyformat2psql(
        sql=fr"SELECT id, pass_hash, is_google_login"
            fr"  FROM account"
            fr" WHERE id = %(account_id)s"
            fr"   AND email IS NOT NULL",
        account_id=account_id,
    )
    try:
        id_, pass_hash, is_google_login = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return id_, pass_hash, is_google_login


async def reset_password(code: str, pass_hash: str) -> None:
    conn = await pool_handler.pool.acquire()
    try:
        account_id, = await conn.fetchrow(
            'SELECT account_id'
            '  FROM email_verification'
            ' WHERE code = $1',
            code
        )
    except TypeError:
        await pool_handler.pool.release(conn)
        raise exc.NotFound
    await conn.execute(
        "UPDATE email_verification"
        "   SET is_consumed = $1"
        " WHERE code = $2",
        True, code,
    )
    await conn.execute(
        "UPDATE account"
        "   SET pass_hash = $1"
        " WHERE id = $2",
        pass_hash, account_id,
    )
    await pool_handler.pool.release(conn)


async def search(identifier: str) -> Sequence[do.Account]:
    like_sql = f"%{identifier}%"
    sql, params = pyformat2psql(
        sql=fr"SELECT id, username, email, notification_preference, is_google_login,"
            fr"       line_token"
            fr"  FROM account"
            fr" WHERE (username LIKE %(like_sql)s"
            fr"    OR email LIKE %(like_sql)s)"
            fr"   AND email IS NOT NULL"
            fr" ORDER BY id",
        like_sql=like_sql,
    )
    records = await pool_handler.pool.fetch(sql, *params)
    return [do.Account(id=id_, username=username, email=email,
                       notification_preference=enums.NotificationPreference(
                           notification_preference),
                       is_google_login=is_google_login, line_token=line_token)
            for id_, username, email, notification_preference,
            is_google_login, line_token in records]


async def read(account_id: int) -> do.Account:
    sql, params = pyformat2psql(
        sql=fr"SELECT id, username, email, notification_preference, is_google_login,"
            fr"       line_token"
            fr"  FROM account"
            fr" WHERE id = %(account_id)s",
        account_id=account_id,
    )
    try:
        id_, username, email, notification_preference, is_google_login, line_token = \
            await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return do.Account(id=id_, email=email, username=username, line_token=line_token,
                      notification_preference=notification_preference, is_google_login=is_google_login)


async def get_google_token(account_id: int):
    sql, params = pyformat2psql(
        sql=fr"  SELECT access_token, refresh_token"
            fr"    FROM account"
            fr"  WHERE id = %(account_id)s",
        account_id=account_id
    )  
    try:
        access_token, refresh_token = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return access_token, refresh_token


async def get_email(member_id: int) -> do.AccountMail:
    sql, params = pyformat2psql(
        sql=fr"SELECT email, username"
            fr"  FROM account"
            fr" WHERE id = %(member_id)s",
        member_id=member_id
    )
    try:
        email, username = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return do.AccountMail(email=email, username=username)


async def get_not_yet_vote_emails(start_time: datetime, end_time: datetime) -> Sequence[do.MeetAndAccountPreference]:
    sql, params = pyformat2psql(
        sql=fr"SELECT DISTINCT meet.title, account.email, account.username, CAST(meet.voting_end_time AS DATE), "
            fr"                meet.invite_code, account.line_token, account.notification_preference"
            fr"           FROM meet"
            fr"     INNER JOIN meet_member"
            fr"             ON meet.id = meet_member.meet_id"
            fr"     INNER JOIN account"
            fr"             ON account.id = meet_member.member_id"
            fr"          WHERE meet.voting_end_time BETWEEN %(start_time)s AND %(end_time)s"
            fr"         EXCEPT ("
            fr"SELECT DISTINCT meet.title, account.email, account.username, CAST(meet.voting_end_time AS DATE), "
            fr"                meet.invite_code, account.line_token, account.notification_preference"
            fr"           FROM meet"
            fr"     INNER JOIN meet_member"
            fr"             ON meet.id = meet_member.meet_id"
            fr"     INNER JOIN meet_member_available_time"
            fr"             ON meet_member.id = meet_member_available_time.meet_member_id"
            fr"     INNER JOIN account"
            fr"             ON account.id = meet_member.member_id"
            fr"          WHERE meet.voting_end_time BETWEEN %(start_time)s AND %(end_time)s)",
        start_time=start_time, end_time=end_time
    )
    try:
        records = await pool_handler.pool.fetch(sql, *params)
    except TypeError:
        raise exc.NotFound
    return [do.MeetAndAccountPreference(meet_title=title, username=username, email=email, time=voting_end_time,
                                        meet_code=invite_code, line_token=line_token,
                                        notification_preference=preference)
            for title, email, username, voting_end_time, invite_code, line_token, preference in records]


async def get_event_member_emails(start_time: time, end_time: time, start_date: date)\
        -> Sequence[do.MeetAndAccountPreference]:
    sql, params = pyformat2psql(
        sql=fr"SELECT DISTINCT meet.title, account.email, account.username, time_slot.start_time, meet.invite_code,"
            fr"                account.line_token, account.notification_preference"
            fr"           FROM event"
            fr"     INNER JOIN meet"
            fr"             ON meet.id = event.meet_id"
            fr"     INNER JOIN account"
            fr"             ON event.account_id = account.id"
            fr"     INNER JOIN time_slot"
            fr"             ON meet.finalized_start_time_slot_id = time_slot.id"
            fr"          WHERE time_slot.start_time BETWEEN %(start_time)s AND %(end_time)s"
            fr"            AND meet.finalized_start_date = %(start_date)s",
        start_time=start_time, end_time=end_time, start_date=start_date,
    )
    try:
        records = await pool_handler.pool.fetch(sql, *params)
    except TypeError:
        raise exc.NotFound
    return [do.MeetAndAccountPreference(meet_title=title, username=username, email=email, time=start_time,
                                        meet_code=invite_code, line_token=line_token,
                                        notification_preference=preference)
            for title, email, username, start_time, invite_code, line_token, preference in records]


async def is_valid_username(username: str) -> bool:
    sql, params = pyformat2psql(
        sql=fr"SELECT COUNT(*)"
            fr"  FROM account"
            fr" WHERE username = %(username)s",
        username=username,
    )
    cnt, = await pool_handler.pool.fetchrow(sql, *params)
    return cnt == 0


async def update_line_token(account_id: int, token: str) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET line_token = %(token)s"
            fr" WHERE id = %(account_id)s",
        token=token, account_id=account_id,
    )
    await pool_handler.pool.execute(sql, *params)


async def edit_notification_preference(account_id: int, preference: enums.NotificationPreference) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET notification_preference = %(preference)s"
            fr" WHERE id = %(account_id)s",
        preference=preference, account_id=account_id,
    )
    await pool_handler.pool.execute(sql, *params)


async def edit(account_id: int, username: Optional[str] = None, pass_hash: Optional[str] = None):
    update_params = {}
    if username is not None:
        update_params['username'] = username
    if pass_hash is not None:
        update_params['pass_hash'] = pass_hash
    if not update_params:
        return

    set_sql = ', '.join(fr"{field_name} = %({field_name})s" for field_name in update_params)

    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET {set_sql}"
            fr" WHERE id = %(account_id)s",
        account_id=account_id, **update_params,
    )
    await pool_handler.pool.execute(sql, *params)
