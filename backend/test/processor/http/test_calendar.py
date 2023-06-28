from datetime import date, datetime
import unittest
from unittest.mock import patch, AsyncMock


import security
from base import do, enums, vo
import exceptions as exc  # noqa
import processor.http.calendar as calendar


class TestGetEvent(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.events = [
            vo.CalendarEvent(
                invite_code=1,
                title='a',
                start_date=date(2023, 8, 16),
                end_date=date(2023, 8, 16),
                start_time_slot_id=10,
                end_time_slot_id=12
            ),
            vo.CalendarEvent(
                invite_code=2,
                title='b',
                start_date=date(2023, 9, 16),
                end_date=date(2023, 9, 16),
                start_time_slot_id=11,
                end_time_slot_id=13
            )
        ]
        self.expect_output = {
            'data': self.events,
            'error': None
        }

    async def test_get_event(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.calendar.get_event', AsyncMock(return_value=self.events))
        async def test():
            return await calendar.get_event(start_date=date(2023, 9, 1), end_date=date(2023, 9, 30))

        res = await test()
        self.assertEqual(res, self.expect_output)
