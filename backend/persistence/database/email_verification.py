from uuid import UUID

import asyncpg
import exceptions as exc  # noqa

from .util import pyformat2psql
from . import pool_handler


async def add(code: str, account_id: int, email: str):
    sql, params = pyformat2psql(
        sql=fr"INSERT INTO email_verification (code, account_id, email)"
            fr"     VALUES (%(code)s, %(account_id)s, %(email)s)",
        code=code, account_id=account_id, email=email,
    )
    await pool_handler.pool.execute(sql, *params)


async def verify_email(code: UUID):
    conn: asyncpg.connection.Connection = await pool_handler.pool.acquire()
    try:
        account_id, email = await conn.fetchrow(
            fr"SELECT account_id, email"
            fr"  FROM email_verification"
            fr" WHERE code = $1",
            code)
    except TypeError:
        await pool_handler.pool.release(conn)
        raise exc.NotFound

    await conn.execute(
        fr"UPDATE email_verification"
        fr"   SET is_consumed = $1"
        fr" WHERE code = $2",
        True, code,
    )

    await conn.execute(
        fr"UPDATE account"
        fr"   SET email = $1"
        fr" WHERE id = $2",
        email, account_id,
    )
    await pool_handler.pool.release(conn)
