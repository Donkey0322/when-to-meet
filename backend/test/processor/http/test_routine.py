import unittest
from unittest import mock

import security
from base import do, enums
from datetime import datetime
import processor.http.routine as routine


class TestGetRoutine(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.get_routine_db_ret_val = [do.Routine(
            account_id=1,
            weekday=enums.WeekDayType.tue,
            time_slot_id=2,
        ), do.Routine(
            account_id=1,
            weekday=enums.WeekDayType.mon,
            time_slot_id=1,
        )]
        self.expect_output = {
            'data': [routine.Routine(
                weekday=enums.WeekDayType.mon,
                time_slot_id=1,
            ), routine.Routine(
                weekday=enums.WeekDayType.tue,
                time_slot_id=2,
            )],
            'error': None,
        }

    async def test_get_routine(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.routine.get', mock.AsyncMock(return_value=self.get_routine_db_ret_val))
        async def test():
            return await routine.get_routine()

        res = await test()
        self.assertEqual(res, self.expect_output)
