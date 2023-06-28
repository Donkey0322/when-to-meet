import persistence.database as db
from datetime import datetime, timedelta
from base import vo
from config import google_config
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


class MeetCalendar:
    def __init__(self, account_id):
        self.id = account_id 
    
    async def get_event(self, start_date, end_date):
        events = await db.calendar.get_event(self.id, start_date, end_date)
        return events


class GoogleCalendar:
    def __init__(self, account_id):
        self.id = account_id
        self.service = None

    async def build_connection(self):
        access_token, refresh_token = await db.account.get_google_token(self.id)
        token_dict = {'access_token': access_token, 'refresh_token': refresh_token,
                      'client_id': google_config.GOOGLE_CLIENT_ID, 'client_secret': google_config.GOOGLE_CLIENT_SECRET}
        scopes = ["https://www.googleapis.com/auth/calendar"]
        creds = Credentials.from_authorized_user_info(token_dict, scopes)
        if not creds.valid:
            creds.refresh(Request())
        self.service = build('calendar', 'v3', credentials=creds)

    async def get_google_event(self, start_date, end_date):
        start_date = datetime.combine(start_date, datetime.min.time())
        end_date = end_date + timedelta(days=1)
        end_date = datetime.combine(end_date, datetime.min.time())
        formatted_start = start_date.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        formatted_end = end_date.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        events_result = self.service.events().list(calendarId='primary', timeMin=formatted_start,
                                                   timeMax=formatted_end, singleEvents=True,
                                                   orderBy='startTime').execute()
        events = events_result.get('items', [])
        if not events:
            return

        event_list = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            if len(start) != 10:
                start = datetime.strptime(start[:-6], '%Y-%m-%dT%H:%M:%S')
                end = datetime.strptime(end[:-6], '%Y-%m-%dT%H:%M:%S')
            else:
                start = datetime.strptime(start, '%Y-%m-%d')
                end = datetime.strptime(end, '%Y-%m-%d')
            color_id = event.get('colorId')
            
            if color_id:
                color = self.service.colors().get().execute()['event'][str(color_id)]['background']
            else:
                color = '#039BE5'
            event_list.append(vo.GoogleCalendarEvent(title=event['summary'], start_date=start,
                                                     end_date=end, color=color))

        return event_list

    async def get_google_meet_url(self):
        event_info = {
            'summary': 'Meeting',
            'start': {
                'dateTime': '2015-05-28T09:00:00-07:00',
                'timeZone': 'America/New_York',
            },
            'end': {
                'dateTime': '2015-05-28T17:00:00-07:00',
                'timeZone': 'America/New_York',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': '1234567890',
                },
                'entryPoints': [
                    {
                        'entryPointType': 'video',
                        'uri': '',
                    }
                ]
            },
        }

        if not self.service:
            await self.build_connection()

        event = self.service.events().insert(calendarId='primary', body=event_info, conferenceDataVersion=1).execute()
        meet_url = event['conferenceData']['entryPoints'][0]['uri']
        self.service.events().delete(calendarId='primary', eventId=event['id']).execute()
        return meet_url
