import collections
import itertools
from typing import Any, Tuple, List, Sequence

from base.enums import FilterOperator
from base.model import Filter


# modify from https://github.com/MagicStack/asyncpg/issues/9#issuecomment-600659015
def pyformat2psql(sql: str, parameters: dict[str, any] = None, **params) -> Tuple[str, List[Any]]:
    named_args = {**params}
    if parameters:
        named_args.update(parameters)
    positional_generator = itertools.count(1)
    positional_map = collections.defaultdict(lambda: '${}'.format(next(positional_generator)))
    formatted_query = sql % positional_map
    positional_items = sorted(
        positional_map.items(),
        key=lambda item: int(item[1].replace('$', '')),
    )
    positional_args = [named_args[named_arg] for named_arg, _ in positional_items]
    print(formatted_query, positional_args)
    return formatted_query, positional_args


def _compile_filter(filter_: Filter, suffix='') -> tuple[str, dict]:  # sql, param_dict

    # Non-single values

    if filter_.op in (FilterOperator.in_, FilterOperator.not_in):
        value_dict = {fr'{filter_.field}_{filter_.op.name}{suffix}_{i}': val for i, val in enumerate(filter_.value)}
        if not value_dict:
            return ('FALSE' if filter_.op is FilterOperator.in_ else 'TRUE'), value_dict
        if len(value_dict) > 70:  # https://postgres.cz/wiki/PostgreSQL_SQL_Tricks_I#Predicate_IN_optimalization
            values = ', '.join(fr'(%({key})s)' for key in value_dict)
            return fr'{filter_.field} {filter_.op} (VALUES {values})', value_dict
        values = ', '.join(fr'%({key})s' for key in value_dict)
        return fr'{filter_.field} {filter_.op} ({values})', value_dict

    if filter_.op in (FilterOperator.between, FilterOperator.not_between):
        lb, ub = filter_.value
        value_dict = {
            fr'{filter_.field}_{filter_.op.name}{suffix}_lb': lb,
            fr'{filter_.field}_{filter_.op.name}{suffix}_ub': ub,
        }
        values = ' AND '.join(fr'%({k})s' for k in value_dict)
        return fr"{filter_.field} {filter_.op} {values}", value_dict

    # Single value

    param_name = fr"{filter_.field}_{filter_.op.name}{suffix}"
    sql = fr"{filter_.field} {filter_.op} %({param_name})s"

    if filter_.op in (FilterOperator.like, FilterOperator.not_like):
        return sql, {param_name: f'%{escape_pg_like_str(filter_.value)}%'}

    return sql, {param_name: filter_.value}


def compile_filters(filters: Sequence[Filter]) -> tuple[str, dict]:
    conditions, params = [], {}
    for i, filter_ in enumerate(filters):
        sql, param_dict = _compile_filter(filter_, suffix=str(i))
        conditions.append(sql)
        params |= param_dict

    return ' AND '.join(conditions), params


def escape_pg_like_str(like_str: str) -> str:
    return like_str.replace('\\', '\\\\')
