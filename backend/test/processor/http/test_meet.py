from datetime import datetime, date
from typing import Optional
import unittest
from unittest.mock import patch, AsyncMock


import security
from base import do, enums, vo
import exceptions as exc  # noqa
import processor.http.meet as meet
from service.meet import Slot


class TestAddMeet(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.account = do.Account(
            id=1,
            username='username',
            email='email',
            is_google_login=False,
            notification_preference=enums.NotificationPreference.email,
            line_token='test token',
        )
        self.add_meet_input = meet.AddMeetInput(
            meet_name='test',
            start_date='2023-08-16',
            end_date='2023-08-20',
            start_time_slot_id=5,
            end_time_slot_id=15,
            gen_meet_url=False,
            guest_name=None,
            guest_password=None,
            voting_end_time=None,
            description=None,
            member_ids=None,
            email=None,
        )
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
        self.host = meet.MemberInfo(
            account_id=1,
            email='email',
            name='username',
        )
        self.member_infos = []
        self.read_meet_output = meet.ReadMeetOutput(
            id=1,
            status='Unvoted',
            start_date='2023-08-16',
            end_date='2023-08-20',
            start_time_slot_id=5,
            end_time_slot_id=15,
            gen_meet_url=False,
            invite_code='asdf',
            meet_name='meet_name',
            host_info=self.host,
            member_infos=self.member_infos
        )
        self.add_meet_expect_output = {
            'data': self.read_meet_output,
            'error': None,
        }
        self.illegal_input_expect_output = {
            'data': None,
            'error': exc.IllegalInput.__name__,
        }
        self.guest_context = {'account': security.Account(id=None, time=datetime.now())}
        self.add_meet_illegal_character_input = meet.AddMeetInput(
            meet_name='test',
            start_date='2023-08-16',
            end_date='2023-08-20',
            start_time_slot_id=5,
            end_time_slot_id=15,
            gen_meet_url=False,
            guest_name='guest_wsa',
            guest_password=None,
            voting_end_time=None,
            description=None,
            member_ids=None,
            email=None,
        )
        self.illegal_character_expect_output = {
            'data': None,
            'error': exc.IllegalCharacter.__name__,
        }

    async def test_add_meet_happy_flow(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.account.read', AsyncMock(return_value=self.account))
        @patch('service.calendar.GoogleCalendar.get_google_meet_url', AsyncMock(return_value=None))
        @patch('persistence.database.meet.add', AsyncMock(return_value=1))
        @patch('persistence.database.meet.read', AsyncMock(return_value=self.meet))
        @patch('processor.http.meet.update_status', AsyncMock(return_value='Unvoted'))
        @patch('processor.http.meet.compose_host_and_member_info',
               AsyncMock(return_value=(self.host, self.member_infos)))
        async def test(data: meet.AddMeetInput):
            return await meet.add_meet(data=data)

        res = await test(self.add_meet_input)
        self.assertEqual(res, self.add_meet_expect_output)

    @staticmethod
    def compose_illegal_input(start_date: Optional[date] = date(2023, 8, 16),
                              end_date: Optional[date] = date(2023, 8, 20),
                              start_time_slot_id: Optional[int] = 5, end_time_slot_id: Optional[int] = 15,
                              guest_name: Optional[str] = None):
        return meet.AddMeetInput(
            meet_name='test',
            start_date=start_date,
            end_date=end_date,
            start_time_slot_id=start_time_slot_id,
            end_time_slot_id=end_time_slot_id,
            gen_meet_url=False,
            guest_name=guest_name,
            guest_password=None,
            voting_end_time=None,
            description=None,
            member_ids=None,
            email=None,
        )

    async def test_add_meet_illegal_input(self):
        @patch('middleware.context.Request._context', self.context)
        async def test(data: meet.AddMeetInput):
            return await meet.add_meet(data=data)

        testcases = [
            self.compose_illegal_input(start_date=date(2023, 8, 20), end_date=date(2023, 8, 16)),
            self.compose_illegal_input(start_time_slot_id=15, end_time_slot_id=5),
        ]

        for testcase in testcases:
            res = await test(data=testcase)
            self.assertEqual(res, self.illegal_input_expect_output)

    async def test_add_meet_illegal_character(self):
        @patch('middleware.context.Request._context', self.guest_context)
        async def test(data: meet.AddMeetInput):
            return await meet.add_meet(data=data)

        res = await test(self.add_meet_illegal_character_input)
        self.assertEqual(res, self.illegal_character_expect_output)


class TestBrowseMeet(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.meets = [
            vo.BrowseMeetByAccount(
                meet_id=1,
                invite_code='a',
                host_account_id=1,
                host_username='username',
                title='title',
                start_date=date(2023, 8, 16),
                end_date=date(2023, 8, 20),
                start_time_slot_id=5,
                end_time_slot_id=15,
                status=enums.StatusType.waiting_for_confirm,
            ),
            vo.BrowseMeetByAccount(
                meet_id=2,
                invite_code='b',
                host_account_id=1,
                host_username='username',
                title='title',
                start_date=date(2023, 8, 16),
                end_date=date(2023, 8, 20),
                start_time_slot_id=5,
                end_time_slot_id=15,
                status=enums.StatusType.voting,
            )
        ]
        self.expect_output = {
            'data': [
                vo.BrowseMeetByAccount(
                    meet_id=1,
                    invite_code='a',
                    host_account_id=1,
                    host_username='username',
                    title='title',
                    start_date=date(2023, 8, 16),
                    end_date=date(2023, 8, 20),
                    start_time_slot_id=5,
                    end_time_slot_id=15,
                    status='Unvoted',
                ),
                vo.BrowseMeetByAccount(
                    meet_id=2,
                    invite_code='b',
                    host_account_id=1,
                    host_username='username',
                    title='title',
                    start_date=date(2023, 8, 16),
                    end_date=date(2023, 8, 20),
                    start_time_slot_id=5,
                    end_time_slot_id=15,
                    status='Unvoted',
                )
            ],
            'error': None,
        }

    async def test_browse_meet_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.browse_by_account_id', AsyncMock(return_value=self.meets))
        @patch('processor.http.meet.update_status', AsyncMock(return_value='Unvoted'))
        async def test():
            return await meet.browse_meet()

        res = await test()
        self.assertEqual(res, self.expect_output)


class TestJoinMeetByInviteCode(unittest.IsolatedAsyncioTestCase):
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
        self.host = meet.MemberInfo(
            account_id=1,
            email='email',
            name='Amber',
        )
        self.member_infos = [
            meet.MemberInfo(
                account_id=2,
                email='email',
                name='Donkey',
            ),
            meet.MemberInfo(
                account_id=3,
                email='email',
                name='Benson',
            )
        ]
        self.meet_members = [
            do.MeetMember(
                id=1,
                meet_id=1,
                is_host=True,
                has_voted=True,
                name='Amber',
                member_id=1,
            ),
            do.MeetMember(
                id=2,
                meet_id=1,
                is_host=False,
                has_voted=True,
                name='Donkey',
                member_id=2,
            ),
            do.MeetMember(
                id=3,
                meet_id=1,
                is_host=False,
                has_voted=True,
                name='Benson',
                member_id=3,
            ),
        ]
        self.join_meet_input = meet.JoinMeetInput(
            name=None,
            password=None,
        )
        self.expect_output = {
            'data': meet.ReadMeetOutput(
                        id=1,
                        status='Unvoted',
                        start_date=date(2023, 8, 16),
                        end_date=date(2023, 8, 20),
                        start_time_slot_id=5,
                        end_time_slot_id=15,
                        gen_meet_url=False,
                        invite_code='asdf',
                        meet_name='meet_name',
                        host_info=self.host,
                        member_infos=self.member_infos
                    ),
            'error': None,
        }

    async def test_join_meet_by_invite_code_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet_member.browse_meet_members_with_names',
               AsyncMock(return_value=self.meet_members))
        @patch('persistence.database.meet.add_member', AsyncMock(return_value=None))
        @patch('processor.http.meet.update_status', AsyncMock(return_value='Unvoted'))
        @patch('processor.http.meet.compose_host_and_member_info',
               AsyncMock(return_value=(self.host, self.member_infos)))
        async def test(code: str, data: meet.JoinMeetInput):
            return await meet.join_meet_by_invite_code(code=code, data=data)

        res = await test('code', self.join_meet_input)
        self.assertEqual(res, self.expect_output)


class TestReadMeetByCode(unittest.IsolatedAsyncioTestCase):
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
        self.host = meet.MemberInfo(
            account_id=1,
            email='email',
            name='username',
        )
        self.member_infos = []
        self.read_meet_output = meet.ReadMeetOutput(
            id=1,
            status='Unvoted',
            start_date='2023-08-16',
            end_date='2023-08-20',
            start_time_slot_id=5,
            end_time_slot_id=15,
            gen_meet_url=False,
            invite_code='asdf',
            meet_name='meet_name',
            host_info=self.host,
            member_infos=self.member_infos
        )
        self.read_meet_expect_output = {
            'data': self.read_meet_output,
            'error': None,
        }

    async def test_read_meet_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('processor.http.meet.update_status', AsyncMock(return_value='Unvoted'))
        @patch('processor.http.meet.compose_host_and_member_info',
               AsyncMock(return_value=(self.host, self.member_infos)))
        async def test(code: str):
            return await meet.read_meet_by_code(code=code)

        res = await test('code')
        self.assertEqual(res, self.read_meet_expect_output)


class TestDeleteMeetByCode(unittest.IsolatedAsyncioTestCase):
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
        self.expect_output = {
            'data': None,
            'error': None,
        }
        self.no_permission_expect_output = {
            'data': None,
            'error': exc.NoPermission.__name__,
        }

    async def test_delete_meet_by_code(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.delete_meet', AsyncMock(return_value=None))
        async def test(code: str):
            return await meet.delete_meet_by_code(code)

        res = await test('test_code')
        self.assertEqual(res, self.expect_output)

    async def test_delete_meet_by_code_no_permission(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=False))
        @patch('service.meet.delete_meet', AsyncMock(return_value=None))
        async def test(code: str):
            return await meet.delete_meet_by_code(code)

        res = await test('test_code')
        self.assertEqual(res, self.no_permission_expect_output)


class TestEditMeetByCode(unittest.IsolatedAsyncioTestCase):
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
        self.expect_output = {
            'data': None,
            'error': None,
        }
        self.no_permission_expect_output = {
            'data': None,
            'error': exc.NoPermission.__name__,
        }

    async def test_edit_meet_by_code_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.edit_meet', AsyncMock(return_value=None))
        async def test(code: str, data=None):
            return await meet.edit_meet_by_code(code, data)

        res = await test('test_code')
        self.assertEqual(res, self.expect_output)

    async def test_edit_meet_by_code_no_permission(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=False))
        @patch('service.meet.edit_meet', AsyncMock(return_value=None))
        async def test(code: str, data=None):
            return await meet.edit_meet_by_code(code, data)

        res = await test('test_code')
        self.assertEqual(res, self.no_permission_expect_output)


class TestBrowseAllMemberAvailableTimeByCode(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
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
        self.available_time_output = meet.BrowseAllMemberAvailableTimeOutput(
            data=[
                meet.DateSlotData(
                    date=date(2022, 8, 16),
                    time_slot_id=1,
                    available_members=['a', 'b', 'c'],
                    unavailable_members=['d', 'e', 'f'],
                )
            ]
        )
        self.expect_output = {
            'data': self.available_time_output,
            'error': None,
        }

    async def test_browse_all_member_available_time_by_code_happy_path(self):
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('service.meet.browse_all_member_available_time', AsyncMock(return_value=self.available_time_output))
        async def test(code: str):
            return await meet.browse_all_member_available_time_by_code(code)

        res = await test('code')
        self.assertEqual(res, self.expect_output)


class TestBrowseMemberAvailableTimeByCode(unittest.IsolatedAsyncioTestCase):
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
        self.available_time_output = meet.BrowseAllMemberAvailableTimeOutput(
            data=[
                meet.DateSlotData(
                    date=date(2022, 8, 16),
                    time_slot_id=1,
                    available_members=['a', 'b', 'c'],
                    unavailable_members=['d', 'e', 'f'],
                )
            ]
        )
        self.expect_output = {
            'data': self.available_time_output,
            'error': None,
        }

    async def test_browse_member_available_time_by_code_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('service.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.browse_member_available_time', AsyncMock(return_value=self.available_time_output))
        async def test(code: str):
            return await meet.browse_member_available_time_by_code(code)

        res = await test('code')
        self.assertEqual(res, self.expect_output)


class TestConfirmMeetByCode(unittest.IsolatedAsyncioTestCase):
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
        self.expect_output = {
            'data': None,
            'error': None,
        }
        self.illegal_input_expect_output = {
            'data': None,
            'error': exc.IllegalInput.__name__,
        }

    @staticmethod
    def _compose_confirm_meet_input(start_date: date = date(2023, 8, 16), end_date: date = date(2023, 8, 20),
                                    start_time_slot_id: int = 1, end_time_slot_id: int = 48):
        return meet.ConfirmMeetInput(
            start_date=start_date,
            end_date=end_date,
            start_time_slot_id=start_time_slot_id,
            end_time_slot_id=end_time_slot_id,
        )

    async def test_confirm_meet_by_code_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.confirm', AsyncMock(return_value=None))
        async def test(code: str, data: meet.ConfirmMeetInput):
            return await meet.confirm_meet_by_code(code=code, data=data)

        res = await test('code', self._compose_confirm_meet_input())
        self.assertEqual(res, self.expect_output)

    async def test_confirm_meet_by_code_illegal_input(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('persistence.database.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.confirm', AsyncMock(return_value=None))
        async def test(code: str, data: meet.ConfirmMeetInput):
            return await meet.confirm_meet_by_code(code=code, data=data)

        testcases = [
            self._compose_confirm_meet_input(start_date=date(2023, 8, 10), end_date=date(2023, 7, 10)),
            self._compose_confirm_meet_input(start_time_slot_id=48, end_time_slot_id=1),
        ]

        for testcase in testcases:
            res = await test('code', testcase)
            self.assertEqual(res, self.illegal_input_expect_output)


class TestAddMemberMeetAvailableTimeByCode(unittest.IsolatedAsyncioTestCase):
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
        self.add_member_available_time_input = meet.AddMemberMeetAvailableTimeInput(
            name=None,
            password=None,
            time_slots=[
                Slot(date=date(2023, 8, 16), time_slot_id=6),
            ],
        )
        self.add_member_available_time_illegal_input = meet.AddMemberMeetAvailableTimeInput(
            name=None,
            password=None,
            time_slots=[
                Slot(date=date(2023, 9, 20), time_slot_id=1),
            ],
        )
        self.expect_output = {
            'data': None,
            'error': None,
        }
        self.illegal_input_expect_output = {
            'data': None,
            'error': exc.IllegalInput.__name__,
        }

    async def test_add_member_meet_available_time_by_code_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('service.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.add_member_meet_available_time', AsyncMock(return_value=None))
        async def test(code: str, data: meet.AddMemberMeetAvailableTimeInput):
            return await meet.add_member_meet_available_time_by_code(code=code, data=data)

        res = await test('code', self.add_member_available_time_input)
        self.assertEqual(res, self.expect_output)

    async def test_add_member_meet_available_time_by_code_illegal_input(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('service.meet.is_authed', AsyncMock(return_value=True))
        async def test(code: str, data: meet.AddMemberMeetAvailableTimeInput):
            return await meet.add_member_meet_available_time_by_code(code=code, data=data)

        res = await test('code', self.add_member_available_time_illegal_input)
        self.assertEqual(res, self.illegal_input_expect_output)


class TestDeleteMemberMeetAvailableTimeByCode(unittest.IsolatedAsyncioTestCase):
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
        self.input_ = meet.DeleteMeetMemberAvailableTimeInput(
            name=None,
            password=None,
            time_slots=[
                Slot(date=date(2023, 8, 16), time_slot_id=1),
            ],
        )
        self.expect_output = {
            'data': None,
            'error': None,
        }

    async def test_delete_member_meet_available_time_by_code_happy_path(self):
        @patch('middleware.context.Request._context', self.context)
        @patch('persistence.database.meet.read_meet_by_code', AsyncMock(return_value=self.meet))
        @patch('service.meet.is_authed', AsyncMock(return_value=True))
        @patch('service.meet.delete_meet_member_available_time', AsyncMock(return_value=None))
        async def test(code: str, data: meet.DeleteMeetMemberAvailableTimeInput):
            return await meet.delete_member_meet_available_time_by_code(code=code, data=data)

        res = await test('code', self.input_)
        self.assertEqual(res, self.expect_output)
