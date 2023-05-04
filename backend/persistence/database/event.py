import exceptions as exc  # noqa

from .util import pyformat2psql
from . import pool_handler


async def add(meet_id: int, account_id: int) -> None:
    sql, params = pyformat2psql(
        sql=fr"INSERT INTO event"
            fr"            (meet_id, account_id)"
            fr"     VALUES (%(meet_id)s, %(account_id)s)",
        meet_id=meet_id, account_id=account_id,
    )
    await pool_handler.pool.execute(sql, *params)
