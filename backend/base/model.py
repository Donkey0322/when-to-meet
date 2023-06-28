from typing import NamedTuple, Union

from base import enums


class Filter(NamedTuple):
    field: str
    op: enums.FilterOperator
    value: Union[str, set, tuple, bool]


class Sorter(NamedTuple):
    field: str
    order: enums.SortOrder
