from base import do, enums
from typing import Tuple, Sequence
import exceptions as exc  # noqa

import asyncpg

from .util import pyformat2psql
from . import pool_handler


async def add(username: str, pass_hash: str = None, notification_preference: str = enums.NotificationPreference.email,
              email: str = None, access_token: str = None, refresh_token: str = None,is_google_login: bool = False) -> int:
    sql, params = pyformat2psql(
        sql=fr'INSERT INTO account'
            fr'            (username, pass_hash, notification_preference, email, access_token, refresh_token, is_google_login)'
            fr'     VALUES (%(username)s, %(pass_hash)s, %(notification_preference)s, %(email)s, %(access_token)s, %(refresh_token)s, %(is_google_login)s)'
            fr'  RETURNING id',
        username=username, pass_hash=pass_hash, notification_preference=notification_preference, email=email,
        access_token=access_token, refresh_token=refresh_token,is_google_login=is_google_login,
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
    
async def update_token(account_id: int, access_token : str, refresh_token : str) -> None:
    sql, params = pyformat2psql(
        sql=fr"UPDATE account"
            fr"   SET access_token = %(access_token)s,"
            fr"       refresh_token = %(refresh_token)s"
            fr" WHERE id = %(account_id)s",
        access_token=access_token, refresh_token=refresh_token, account_id=account_id,
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
        id_, email, username, line_token, notification_preference, is_google_login = await pool_handler.pool.fetchrow(sql, *params)
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
            fr"  FROM account"
            fr"  WHERE id = %(account_id)s",
        account_id=account_id
    )  
    try:
        access_token, refresh_token = await pool_handler.pool.fetchrow(sql, *params)
    except TypeError:
        raise exc.NotFound
    return access_token, refresh_token