import persistence.database as db
from datetime import datetime 
from base import vo
from config import google_config
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


class MeetCalendar:
    def __init__(self, account_id):
        self.id = account_id 
    
    async def get_event(self, start_date, end_date):
        events = await db.calendar.get_event(self.id, start_date, end_date)
        return(events)
    
class GoogleCalendar:
    def __init__(self, account_id):
        self.id = account_id
    
    async def build_connection(self):
        access_token, refresh_token = await db.account.get_google_token(self.id)
        token_dict = {'access_token': access_token, 'refresh_token': refresh_token,
                      'client_id':google_config.GOOGLE_CLIENT_ID, 'client_secret':google_config.GOOGLE_CLIENT_SECRET}
        SCOPES = ["https://www.googleapis.com/auth/calendar"]
        creds = Credentials.from_authorized_user_info(token_dict, SCOPES)
        if not creds.valid:
            creds.refresh(Request())
        self.service = build('calendar', 'v3', credentials=creds)
            
    async def get_google_event(self, start_date, end_date):
        start_date = datetime.combine(start_date, datetime.min.time())
        end_date = datetime.combine(end_date, datetime.max.time())
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
            start = datetime.fromisoformat(start).date()
            end = datetime.fromisoformat(end).date()
            color_id = event.get('colorId')
            if color_id:
                color = self.service.colors().get().execute()['calendar'][str(color_id)]['background']
            else:
                color = '#039BE5'
            event_list.append(vo.GoogleCalendarEvent(title=event['summary'], start_date=start, end_date=end, color=color))
            
        return event_list