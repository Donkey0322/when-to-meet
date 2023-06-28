from datetime import datetime, date
from typing import Optional, Sequence
import unittest
from unittest.mock import patch, AsyncMock

from base import do, enums
import exceptions as exc  # noqa
import security
from service import meet
from service.meet import DateSlotData


class TestEditMeet(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.meet = do.Meet(
            id=1,
            status=enums.StatusType.voting,
            start_date=date(2023, 8, 16),
            end_date=date(2023, 8, 20),
            start_time_slot_id=5,
            end_time_slot_id=15,
            gen_meet_url=False,
            invite_code='asdf',
            title='meet_name',
        )
        self.edit_meet_expect_output = None

    @staticmethod
    def _compose_input(
            meet_name: Optional[str] = None,
            start_date: Optional[date] = None,
            end_date: Optional[date] = None,
            start_time_slot_id: Optional[int] = None,
            end_time_slot_id: Optional[int] = None,
            description: Optional[str] = None,
            voting_end_time: Optional[datetime] = None,
            gen_meet_url: Optional[bool] = False,
            member_ids: Optional[Sequence[int]] = None,
            remove_guest_names: Optional[Sequence[str]] = None,
            emails: Optional[Sequence[str]] = None,
    ):
        return meet.EditMeetInput(
            meet_name=meet_name, start_date=start_date, end_date=end_date,
            start_time_slot_id=start_time_slot_id, end_time_slot_id=end_time_slot_id,
            description=description, voting_end_time=voting_end_time,
            gen_meet_url=gen_meet_url, member_ids=member_ids,
            remove_guest_names=remove_guest_names, emails=emails,
        )

    async def _gen_test_function(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet_member.browse_meet_members_with_names', AsyncMock())
        @patch('persistence.database.meet_member.edit', AsyncMock())
        @patch('persistence.database.account.read', AsyncMock())
        @patch('persistence.database.meet.edit', AsyncMock(return_value=None))
        async def test(meet_id: int, data: meet.EditMeetInput):
            return await meet.edit_meet(meet_id=meet_id, data=data)

        return test

    async def test_edit_meet_happy_path(self):
        test = await self._gen_test_function()
        success_testcases = [
            (self._compose_input(start_date=date(2023, 8, 16), end_date=date(2023, 8, 20)),
             self.edit_meet_expect_output),
            (self._compose_input(start_time_slot_id=1, end_time_slot_id=5), self.edit_meet_expect_output),
        ]
        failed_testcases = [
            (self._compose_input(start_date=date(2023, 8, 20), end_date=date(2023, 8, 16)), exc.IllegalInput),
            (self._compose_input(start_time_slot_id=48, end_time_slot_id=1), exc.IllegalInput)
        ]
        with patch('persistence.email.invite_to_meet.send') as send_email:
            with patch('service.calendar.GoogleCalendar.get_google_meet_url') as get_meet_url:
                for testcase, output in success_testcases:
                    res = await test(meet_id=1, data=testcase)
                    self.assertEqual(res, output)
                    self.assertEqual(send_email.call_count, 0)
                    self.assertEqual(get_meet_url.call_count, 0)

                for testcase, error in failed_testcases:
                    try:
                        await test(meet_id=1, data=testcase)
                    except exc.IllegalInput:
                        pass
                    else:
                        raise Exception
                    self.assertEqual(send_email.call_count, 0)
                    self.assertEqual(get_meet_url.call_count, 0)

    async def test_edit_meet_gen_meet_url(self):
        test = await self._gen_test_function()
        testcases = [
            (self._compose_input(gen_meet_url=False), 0),
            (self._compose_input(gen_meet_url=True), 1)
        ]
        for testcase, call_count in testcases:
            with patch('service.calendar.GoogleCalendar.get_google_meet_url') as get_meet_url:
                await test(meet_id=1, data=testcase)
                self.assertEqual(get_meet_url.call_count, call_count)

    async def test_edit_meet_email(self):
        test = await self._gen_test_function()
        testcases = [
            (self._compose_input(emails=['a', 'b', 'c']), 3),
            (self._compose_input(emails=['a']), 1),
            (self._compose_input(emails=[]), 0),
        ]
        for testcase, call_count in testcases:
            with patch('persistence.email.invite_to_meet.send') as send_email:
                await test(meet_id=1, data=testcase)
                self.assertEqual(send_email.call_count, call_count)


class TestBrowseAllMemberAvailableTime(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.meet = do.Meet(
            id=1,
            status=enums.StatusType.voting,
            start_date=date(2023, 8, 16),
            end_date=date(2023, 8, 17),
            start_time_slot_id=5,
            end_time_slot_id=8,
            gen_meet_url=False,
            invite_code='asdf',
            title='meet_name',
        )
        self.available_time = [
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=6,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=7,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=8,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=2,
                date=date(2023, 8, 16),
                time_slot_id=1,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=2,
                date=date(2023, 8, 16),
                time_slot_id=2,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=2,
                date=date(2023, 8, 16),
                time_slot_id=3,
            ),
        ]
        self.meet_member = [
            do.MeetMember(
                id=1,
                meet_id=1,
                is_host=True,
                name='host',
                member_id=1,
                has_voted=True,
            ),
            do.MeetMember(
                id=2,
                meet_id=1,
                is_host=True,
                name='normal',
                member_id=2,
                has_voted=True,
            ),
        ]
        self.expect_output = meet.BrowseAllMemberAvailableTimeOutput(
            data=[
                DateSlotData(date=date(2023, 8, 16), time_slot_id=5, available_members=[],
                             unavailable_members=['normal', 'host']),
                DateSlotData(date=date(2023, 8, 16), time_slot_id=6, available_members=['host'],
                             unavailable_members=['normal']),
                DateSlotData(date=date(2023, 8, 16), time_slot_id=7, available_members=['host'],
                             unavailable_members=['normal']),
                DateSlotData(date=date(2023, 8, 16), time_slot_id=8, available_members=['host'],
                             unavailable_members=['normal']),
                DateSlotData(date=date(2023, 8, 17), time_slot_id=5, available_members=[],
                             unavailable_members=['normal', 'host']),
                DateSlotData(date=date(2023, 8, 17), time_slot_id=6, available_members=[],
                             unavailable_members=['normal', 'host']),
                DateSlotData(date=date(2023, 8, 17), time_slot_id=7, available_members=[],
                             unavailable_members=['normal', 'host']),
                DateSlotData(date=date(2023, 8, 17), time_slot_id=8, available_members=[],
                             unavailable_members=['normal', 'host']),
            ]
        )

    @staticmethod
    def _compare_output(outputs: meet.BrowseAllMemberAvailableTimeOutput,
                        expect_outputs: meet.BrowseAllMemberAvailableTimeOutput) -> bool:
        for output, expect_output in zip(outputs.data, expect_outputs.data):
            if output.date != expect_output.date:
                return False
            if output.time_slot_id != expect_output.time_slot_id:
                return False
            if sorted(output.available_members) != sorted(expect_output.available_members):
                return False
            if sorted(output.unavailable_members) != sorted(expect_output.unavailable_members):
                return False
        return True

    async def test_browse_all_member_available_time_happy_path(self):
        @patch('persistence.database.available_time.browse_by_meet_id', AsyncMock(return_value=self.available_time))
        @patch('persistence.database.meet_member.browse_meet_members_with_names',
               AsyncMock(return_value=self.meet_member))
        @patch('persistence.database.meet.read', AsyncMock(return_value=self.meet))
        async def test(meet_id: int):
            return await meet.browse_all_member_available_time(meet_id)

        res = await test(meet_id=1)
        self.assertTrue(self._compare_output(res, self.expect_output))


class TestBrowseMemberAvailableTime(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.meet_member = do.MeetMember(
            id=1,
            meet_id=1,
            is_host=True,
            name='host',
            member_id=1,
            has_voted=True,
        )
        self.available_time = [
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=6,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=7,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=8,
            ),
        ]

    async def test_browse_member_available_time_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet_member.read', AsyncMock(return_value=self.meet_member))
        @patch('persistence.database.available_time.browse_by_meet_member_id',
               AsyncMock(return_value=self.available_time))
        async def test(meet_id: int):
            return await meet.browse_member_available_time(meet_id)

        res = await test(meet_id=1)
        self.assertEqual(res, self.available_time)


class TestDeleteMeet(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}

    async def _gen_test_function(self, auth_map):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.get_member_id_and_auth', AsyncMock(return_value=auth_map))
        async def test(meet_id: int):
            return await meet.delete_meet(meet_id=meet_id)

        return test

    async def test_delete_meet_host(self):
        auth_map = {
            (1, None): True,
        }
        test = await self._gen_test_function(auth_map=auth_map)
        with patch('persistence.database.meet.delete') as delete_meet:
            with patch('persistence.database.meet.leave') as leave_meet:
                await test(meet_id=1)
                self.assertEqual(delete_meet.call_count, 1)
                self.assertEqual(leave_meet.call_count, 0)

    async def test_delete_meet_normal(self):
        auth_map = {
            (1, None): False,
        }
        test = await self._gen_test_function(auth_map=auth_map)
        with patch('persistence.database.meet.delete') as delete_meet:
            with patch('persistence.database.meet.leave') as leave_meet:
                await test(meet_id=1)
                self.assertEqual(delete_meet.call_count, 0)
                self.assertEqual(leave_meet.call_count, 1)

    async def test_delete_meet_no_permission(self):
        auth_map = {}
        test = await self._gen_test_function(auth_map=auth_map)
        with patch('persistence.database.meet.delete') as delete_meet:
            with patch('persistence.database.meet.leave') as leave_meet:
                try:
                    await test(meet_id=1)
                    raise
                except exc.NoPermission:
                    pass
                self.assertEqual(delete_meet.call_count, 0)
                self.assertEqual(leave_meet.call_count, 0)


class TestAddMemberMeetAvailableTime(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.input_ = meet.AddMemberMeetAvailableTimeInput(
            name=None,
            password=None,
            time_slots=[
                meet.Slot(date=date(2023, 8, 16), time_slot_id=5),
            ],
        )
        self.voted_meet_member = do.MeetMember(
            id=1,
            meet_id=1,
            is_host=True,
            name='host',
            member_id=1,
            has_voted=True,
        )
        self.unvoted_meet_member = do.MeetMember(
            id=1,
            meet_id=1,
            is_host=True,
            name='host',
            member_id=1,
            has_voted=False,
        )

    async def _gen_test_function(self, meet_member: do.MeetMember):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet_member.read', AsyncMock(return_value=meet_member))
        @patch('persistence.database.available_time.batch_add', AsyncMock(return_value=None))
        async def test(meet_id: int, data: meet.AddMemberMeetAvailableTimeInput):
            return await meet.add_member_meet_available_time(meet_id, data=data)

        return test

    async def test_add_member_meet_available_time_happy_path(self):
        test = await self._gen_test_function(self.voted_meet_member)
        with patch('persistence.database.meet_member.update') as update:
            res = await test(meet_id=1, data=self.input_)
            self.assertEqual(res, None)
            self.assertEqual(update.call_count, 0)

    async def test_add_member_meet_available_time_unvoted(self):
        test = await self._gen_test_function(self.unvoted_meet_member)
        with patch('persistence.database.meet_member.update') as update:
            res = await test(meet_id=1, data=self.input_)
            self.assertEqual(res, None)
            self.assertEqual(update.call_count, 1)


class TestConfirm(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.input_ = meet.ConfirmMeetInput(
            start_date=date(2023, 8, 16),
            end_date=date(2023, 8, 16),
            start_time_slot_id=6,
            end_time_slot_id=8,
        )
        self.available_time = [
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=6,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=7,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=1,
                date=date(2023, 8, 16),
                time_slot_id=8,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=2,
                date=date(2023, 8, 16),
                time_slot_id=1,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=2,
                date=date(2023, 8, 16),
                time_slot_id=2,
            ),
            do.MeetMemberAvailableTime(
                meet_member_id=2,
                date=date(2023, 8, 16),
                time_slot_id=3,
            ),
        ]
        self.meet_member = [
            do.MeetMember(
                id=1,
                meet_id=1,
                is_host=True,
                name='host',
                member_id=1,
                has_voted=True,
            ),
            do.MeetMember(
                id=2,
                meet_id=1,
                is_host=False,
                name='normal',
                member_id=2,
                has_voted=True,
            ),
        ]

    async def test_confirm_happy_path(self):
        @patch('persistence.database.meet.edit', AsyncMock(return_value=None))
        @patch('persistence.database.available_time.browse_by_meet_id', AsyncMock(return_value=self.available_time))
        @patch('persistence.database.meet_member.browse_meet_members_with_names', AsyncMock(return_value=self.meet_member))
        async def test(meet_id: int, data: meet.ConfirmMeetInput):
            await meet.confirm(meet_id=meet_id, data=data)

        with patch('persistence.database.event.add') as add_event:
            res = await test(meet_id=1, data=self.input_)
            self.assertEqual(res, None)
            self.assertEqual(add_event.call_count, 1)


class TestDeleteMeetMemberAvailableTime(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.input_ = meet.DeleteMeetMemberAvailableTimeInput(
            name=None,
            password=None,
            time_slots=[
              meet.Slot(date=date(2023, 8, 16), time_slot_id=5),
            ],
        )

    async def _gen_test_function(self, meet_member):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet_member.read', AsyncMock(return_value=meet_member))
        @patch('persistence.database.available_time.batch_delete', AsyncMock(return_value=None))
        async def test(meet_id: int, data: meet.DeleteMeetMemberAvailableTimeInput):
            return await meet.delete_meet_member_available_time(meet_id=meet_id, data=data)

        return test

    async def test_delete_meet_member_available_time_hapy_path(self):
        meet_member = do.MeetMember(
            id=1,
            meet_id=1,
            is_host=True,
            name='host',
            member_id=1,
            has_voted=True,
        )
        test = await self._gen_test_function(meet_member=meet_member)
        with patch('persistence.database.meet_member.update') as update:
            res = await test(meet_id=1, data=self.input_)
            self.assertEqual(res, None)
            self.assertEqual(update.call_count, 0)

    async def test_delete_meet_member_available_time_unvoted(self):
        meet_member = do.MeetMember(
            id=1,
            meet_id=1,
            is_host=True,
            name='host',
            member_id=1,
            has_voted=False,
        )
        test = await self._gen_test_function(meet_member=meet_member)
        with patch('persistence.database.meet_member.update') as update:
            res = await test(meet_id=1, data=self.input_)
            self.assertEqual(res, None)
            self.assertEqual(update.call_count, 1)


class TestIsAuthed(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}

    async def _gen_test_function(self, is_authed: bool, hash_data):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet_member.read_by_meet_id_and_name', AsyncMock(return_value=hash_data))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=is_authed))
        async def test(meet_id: int, name: Optional[str] = None, password: Optional[str] = None):
            return await meet.is_authed(meet_id=meet_id, name=name, password=password)

        return test

    async def test_is_authed_happy_path(self):
        test = await self._gen_test_function(is_authed=True, hash_data=None)
        res = await test(meet_id=1, name=None, password=None)
        self.assertTrue(res)

    async def test_is_authed_guest_no_password(self):
        test = await self._gen_test_function(is_authed=False, hash_data=(None, None))
        res = await test(meet_id=1, name='wsa', password=None)
        self.assertTrue(res)

    async def test_is_authed_guest_with_password(self):
        test = await self._gen_test_function(is_authed=False, hash_data=(None, '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug'))  # noqa
        res = await test(meet_id=1, name='wsa', password='wsa')
        self.assertTrue(res)

    async def test_is_authed_guest_with_wrong_password(self):
        test = await self._gen_test_function(is_authed=False, hash_data=(None, '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug'))  # noqa
        res = await test(meet_id=1, name='wsa', password='asw')
        self.assertFalse(res)
