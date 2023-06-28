import unittest
from unittest import mock
from starlette.requests import Request
from base import do, enums
import exceptions as exc  # noqa
import processor.http.google as google

class TestGoogleLogin(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.token = {
            'userinfo':{
                'email': 'lichi@gmail.com'
            },
            'access_token': 'access_token',
            'refresh_token':'refresh_token'
        }
        query_string = 'query_string'
        query_string_denided = 'error=access_denied'
        
        self.input_data = Request(scope={'type': 'http', 'path': '/', 'query_string': query_string.encode('utf-8')})
        
        self.normal_account = do.Account(
            id=4,
            username='username',
            email='email',
            is_google_login=True,
            notification_preference=enums.NotificationPreference.email,
        )
        self.denied_input = Request(scope={'type': 'http', 'path': '/', 'query_string': query_string_denided.encode('utf-8')})


    async def test_auth_signup(self):
        @mock.patch('processor.http.google.oauth.google.authorize_access_token', mock.AsyncMock(return_value=self.token))
        @mock.patch('persistence.database.account.read_by_email', mock.MagicMock(side_effect=exc.NotFound))
        @mock.patch('persistence.database.account.add', mock.AsyncMock(return_value=4))
        @mock.patch('persistence.database.account.update_username', mock.AsyncMock(return_value=None))
        async def test(input_data):
            return await google.auth(request=input_data)
        res = await test(self.input_data)
        self.assertEqual(res.status_code, 307)
    
    async def test_auth_login(self):
        @mock.patch('processor.http.google.oauth.google.authorize_access_token', mock.AsyncMock(return_value=self.token))
        @mock.patch('persistence.database.account.read_by_email', mock.AsyncMock(return_value=self.normal_account))
        @mock.patch('persistence.database.account.update_google_token', mock.AsyncMock(return_value=None))
        async def test(input_data):
            return await google.auth(request=input_data)
        res = await test(self.input_data)
        self.assertEqual(res.status_code, 307)
        
    async def test_auth_denied(self):
        res = await google.auth(self.denied_input)
        self.assertEqual(res.status_code, 307)
    