from datetime import datetime
import unittest
from unittest import mock


import security
from base import do, enums
import exceptions as exc  # noqa
import processor.http.account as account


class TestSearchAccount(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.search_account_db_ret_val = [do.Account(
            id=1, username='wsa', email='wsa@ntu.im',
            notification_preference=enums.NotificationPreference.email,
            is_google_login=False,
            line_token=None,
        )]
        self.expect_output = {
            'data': account.SearchAccountOutput(
                accounts=[account.AccountInfo(id=1, username='wsa', email='wsa@ntu.im')],
            ),
            'error': None,
        }

    async def test_search_one_account(self):
        with mock.patch('persistence.database.account.search') as mock_func:
            mock_func.return_value = self.search_account_db_ret_val
            res = await account.search_account("Amber")
            self.assertEqual(res, self.expect_output)


class TestAddAccount(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.input_data = account.AddAccountInput(
            username='test',
            password='test',
            email='test@gmail.com',
        )
        self.happy_path_expect_output = {
            'data': account.AddAccountOutput(id=4),
            'error': None,
        }
        self.username_exist_expect_output = {
            'data': None,
            'error': exc.UsernameExists.__name__,
        }
        self.normal_email_exist_expect_output = {
            'data': None,
            'error': exc.EmailExist.__name__,
        }
        self.normal_account = do.Account(
            id=1,
            username='username',
            email='email',
            is_google_login=False,
            notification_preference=enums.NotificationPreference.email,
        )
        self.google_email_exist_expect_output = {
            'data': None,
            'error': exc.EmailRegisteredByGoogle.__name__,
        }
        self.google_account = do.Account(
            id=1,
            username='username',
            email='email',
            is_google_login=True,
            notification_preference=enums.NotificationPreference.email,
        )
        self.illegal_input_data = account.AddAccountInput(
            username='test!@#$/^%',
            password='test',
            email='test@gmail.com',
        )
        self.illegal_char_expect_output = {
            'data': None,
            'error': exc.IllegalCharacter.__name__,
        }
        self.illegal_input_guest_username = account.AddAccountInput(
            username='guest_hello',
            password='test',
            email='test@gmail.com',
        )

    async def test_add_account_happy_path(self):
        @mock.patch('persistence.database.account.read_by_email', mock.MagicMock(side_effect=exc.NotFound))
        @mock.patch('persistence.database.account.add', mock.AsyncMock(return_value=4))
        @mock.patch('persistence.database.email_verification.add', mock.AsyncMock(return_value=None))
        @mock.patch('persistence.email.verification.send', mock.AsyncMock(return_value=None))
        async def test(input_data):
            return await account.add_account(data=input_data)

        res = await test(self.input_data)
        self.assertEqual(res, self.happy_path_expect_output)

    async def test_add_account_username_exist(self):
        @mock.patch('persistence.database.account.read_by_email', mock.MagicMock(side_effect=exc.NotFound))
        @mock.patch('persistence.database.account.add', mock.AsyncMock(side_effect=exc.UniqueViolationError))
        async def test(input_data):
            return await account.add_account(data=input_data)

        res = await test(self.input_data)
        self.assertEqual(res, self.username_exist_expect_output)

    async def test_add_account_normal_email_exist(self):
        @mock.patch('persistence.database.account.read_by_email', mock.AsyncMock(return_value=self.normal_account))
        async def test(input_data):
            return await account.add_account(data=input_data)

        res = await test(self.input_data)
        self.assertEqual(res, self.normal_email_exist_expect_output)

    async def test_add_account_google_email_exist(self):
        @mock.patch('persistence.database.account.read_by_email', mock.AsyncMock(return_value=self.google_account))
        async def test(input_data):
            return await account.add_account(data=input_data)

        res = await test(self.input_data)
        self.assertEqual(res, self.google_email_exist_expect_output)

    async def test_acc_account_illegal_input(self):
        res = await account.add_account(self.illegal_input_data)
        self.assertEqual(res, self.illegal_char_expect_output)

    async def test_account_illegal_username_guest(self):
        res = await account.add_account(self.illegal_input_guest_username)
        self.assertEqual(res, self.illegal_char_expect_output)


class MockRequest:
    def __init__(self):
        pass

    def set_cookie(self, key, value):
        pass

    @property
    def account(self):
        return security.Account(id=1, time=datetime.now())


class TestAccountLogin(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.login_success_input = account.LoginInput(
            user_identifier='wsa',
            password='wsa',
        )
        self.login_failed_input = account.LoginInput(
            user_identifier='wsa',
            password='asw',
        )
        self.login_failed_expect_output = {
            'data': None,
            'error': exc.LoginFailed.__name__,
        }
        self.login_failed_google_expect_output = {
            'data': None,
            'error': exc.EmailRegisteredByGoogle.__name__,
        }

    async def test_normal_login(self):
        @mock.patch('persistence.database.account.read_by_username_or_email',
                    mock.AsyncMock(return_value=(1, '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', False)))  # noqa
        async def test(login_input, response):
            return await account.login(data=login_input, response=response)

        res = await test(self.login_success_input, MockRequest())
        self.assertEqual(res['data'].account_id, 1)

        res = await test(self.login_failed_input, MockRequest())
        self.assertEqual(res, self.login_failed_expect_output)

    async def test_login_failed_google(self):
        """
        login with password should raise exception if registered with Google account
        """
        @mock.patch('persistence.database.account.read_by_username_or_email',
                    mock.AsyncMock(return_value=(1, None, True)))  # noqa
        async def test(login_input, response):
            return await account.login(data=login_input, response=response)

        res = await test(self.login_success_input, MockRequest())
        self.assertEqual(res, self.login_failed_google_expect_output)


class TestEditAccount(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.edit_username_input = account.EditAccountInput(
            username='wsa',
        )
        self.edit_password_success_input = account.EditAccountInput(
            old_password='wsa',
            new_password='asw',
        )
        self.edit_password_failed_input = account.EditAccountInput(
            old_password='asw',
            new_password='wsa',
        )
        self.edit_email_input = account.EditAccountInput(
            email='abc@gmail.com',
        )
        self.account = do.Account(
            id=1,
            username='username',
            email='email',
            is_google_login=False,
            notification_preference=enums.NotificationPreference.email,
            line_token='test token',
        )
        self.account_without_line_token = do.Account(
            id=1,
            username='username',
            email='email',
            is_google_login=False,
            notification_preference=enums.NotificationPreference.email,
            line_token=None,
        )
        self.edit_account_success_expect_output = {
            'data': None,
            'error': None,
        }
        self.context = {'account': security.Account(id=1, time=datetime.now())}
        self.edit_username_exist_expect_output = {
            'data': None,
            'error': exc.UsernameExists.__name__,
        }
        self.edit_password_failed_expect_output = {
            'data': None,
            'error': exc.NoPermission.__name__,
        }
        self.edit_notification_preference_email_input = account.EditAccountNotificationPreferenceInput(
            preference=enums.NotificationPreference.email
        )
        self.edit_notification_preference_line_input = account.EditAccountNotificationPreferenceInput(
            preference=enums.NotificationPreference.line
        )
        self.edit_notification_preference_failed_expect_output = {
            'data': None,
            'error': exc.LineAccountNotConnected.__name__,
        }
        self.edit_account_guest_username_input = account.EditAccountInput(
            username='guest_wsa',
        )
        self.edit_account_guest_username_expect_output = {
            'data': None,
            'error': exc.IllegalCharacter.__name__,
        }

    async def test_edit_username(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account))
        @mock.patch('persistence.database.account.read_passhash',
                    mock.AsyncMock(return_value=(1, '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', None)))  # noqa
        @mock.patch('persistence.database.account.edit', mock.AsyncMock(return_value=None))
        async def test(data: account.EditAccountInput):
            return await account.edit_account(data)

        with mock.patch('persistence.database.account.is_valid_username') as is_valid_username:
            with mock.patch('persistence.database.account.read_by_email') as read_by_email:
                with mock.patch('persistence.database.email_verification.add') as email_verification_add:
                    with mock.patch('persistence.email.verification.send') as email_verification_send:
                        is_valid_username.return_value = True
                        res = await test(self.edit_username_input)
                        self.assertEqual(res, self.edit_account_success_expect_output, 'edit username: failed')
                        self.assertEqual(email_verification_add.call_count, 0, 'should not call verification.add')
                        self.assertEqual(email_verification_send.call_count, 0, 'should not call verification.send')
                        self.assertEqual(read_by_email.call_count, 0, 'should not call read by email')

                        is_valid_username.return_value = False
                        res = await test(self.edit_username_input)
                        self.assertEqual(res, self.edit_username_exist_expect_output)

    async def test_edit_password(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account))
        @mock.patch('persistence.database.account.is_valid_username', mock.AsyncMock(return_value=True))
        @mock.patch('persistence.database.account.read_passhash',
                    mock.AsyncMock(return_value=(1, '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', None)))  # noqa
        @mock.patch('persistence.database.account.edit', mock.AsyncMock(return_value=None))
        async def test(data: account.EditAccountInput):
            return await account.edit_account(data)

        with mock.patch('persistence.database.account.read_by_email') as read_by_email:
            with mock.patch('persistence.database.email_verification.add') as email_verification_add:
                with mock.patch('persistence.email.verification.send') as email_verification_send:
                    res = await test(self.edit_password_success_input)
                    self.assertEqual(res, self.edit_account_success_expect_output, 'edit username: failed')
                    self.assertEqual(email_verification_add.call_count, 0, 'should not call verification.add')
                    self.assertEqual(email_verification_send.call_count, 0, 'should not call verification.send')
                    self.assertEqual(read_by_email.call_count, 0, 'should not call read by email')

                    res = await test(self.edit_password_failed_input)
                    self.assertEqual(res, self.edit_password_failed_expect_output)

    async def test_edit_email(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account))
        @mock.patch('persistence.database.account.is_valid_username', mock.AsyncMock(return_value=True))
        @mock.patch('persistence.database.account.read_passhash',
                    mock.AsyncMock(return_value=(1, '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', None)))  # noqa
        @mock.patch('persistence.database.account.read_by_email', mock.AsyncMock(side_effect=exc.NotFound))
        @mock.patch('persistence.database.account.edit', mock.AsyncMock(return_value=None))
        async def test(data: account.EditAccountInput):
            return await account.edit_account(data)

        with mock.patch('persistence.database.email_verification.add') as email_verification_add:
            with mock.patch('persistence.email.verification.send') as email_verification_send:
                res = await test(self.edit_email_input)
                self.assertEqual(res, self.edit_account_success_expect_output, 'edit username: failed')
                self.assertEqual(email_verification_add.call_count, 1, 'should call verification.add once')
                self.assertEqual(email_verification_send.call_count, 1, 'should call verification.send once')

    async def test_edit_account_notification_preference_email(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account))
        @mock.patch('persistence.database.account.edit_notification_preference', mock.AsyncMock(return_value=None))
        async def test(data: account.EditAccountNotificationPreferenceInput):
            return await account.edit_account_notification_preference(data=data)

        res = await test(self.edit_notification_preference_email_input)
        self.assertEqual(res, self.edit_account_success_expect_output)

    async def test_edit_account_notification_preference_line(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account_without_line_token))
        @mock.patch('persistence.database.account.edit_notification_preference', mock.AsyncMock(return_value=None))
        async def test(data: account.EditAccountNotificationPreferenceInput):
            return await account.edit_account_notification_preference(data=data)

        res = await test(self.edit_notification_preference_line_input)
        self.assertEqual(res, self.edit_notification_preference_failed_expect_output)

    async def test_edit_account_guest_username(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account))
        @mock.patch('persistence.database.account.is_valid_username', mock.AsyncMock(return_value=True))
        async def test(data: account.EditAccountInput):
            return await account.edit_account(data)

        res = await test(self.edit_account_guest_username_input)
        self.assertEqual(res, self.edit_account_guest_username_expect_output)


class TestReadAccount(unittest.IsolatedAsyncioTestCase):
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
        self.read_account_success_expect_output = {
            'data': self.account,
            'error': None,
        }
        self.read_account_failed_expect_output = {
            'data': None,
            'error': exc.NoPermission.__name__,
        }

    async def test_read_account(self):
        @mock.patch('middleware.context.Request._context', self.context)
        @mock.patch('persistence.database.account.read', mock.AsyncMock(return_value=self.account))
        async def test(account_id: int):
            return await account.read_account(account_id=account_id)

        res = await test(account_id=1)
        self.assertEqual(res, self.read_account_success_expect_output)

        res = await test(account_id=2)
        self.assertEqual(res, self.read_account_failed_expect_output)
