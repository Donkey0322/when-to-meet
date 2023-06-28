import unittest
from unittest import mock
from uuid import UUID, uuid4

from base import do, enums
import processor.http.public as public


class TestEmailVerification(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.expect_output = {
            'data': None,
            'error': None,
        }

    async def test_email_verification(self):
        @mock.patch('persistence.database.email_verification.verify_email', mock.AsyncMock(return_value=None))
        async def test(code: UUID):
            return await public.email_verification(code=code)

        res = await test(uuid4())
        self.assertEqual(res, self.expect_output)


class TestForgetPassword(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.account = do.Account(
            id=1,
            username='username',
            email='email',
            is_google_login=False,
            notification_preference=enums.NotificationPreference.email,
            line_token='test token',
        )
        self.forget_password_input = public.ForgetPasswordInput(email='test@gmail.com')
        self.expect_output = {
            'data': None,
            'error': None,
        }

    async def test_forget_password(self):
        @mock.patch('persistence.database.account.read_by_email', mock.AsyncMock(return_value=self.account))
        async def test(data: public.ForgetPasswordInput):
            return await public.forget_password(data=data)

        with mock.patch('persistence.database.email_verification.add') as add_verification:
            with mock.patch('persistence.email.forget_password.send') as send_email:
                res = await test(self.forget_password_input)
                self.assertEqual(res, self.expect_output)
                self.assertEqual(add_verification.call_count, 1)
                self.assertEqual(send_email.call_count, 1)


class TestResetPassword(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.reset_input = public.ResetPasswordInput(code=str(uuid4()), password='password')
        self.expect_output = {
            'data': None,
            'error': None,
        }

    async def test_reset_password(self):
        with mock.patch('persistence.database.account.reset_password') as reset_password:
            res = await public.reset_password(self.reset_input)
            self.assertEqual(res, self.expect_output)
            self.assertEqual(reset_password.call_count, 1)
