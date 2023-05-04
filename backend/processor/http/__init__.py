import fastapi


def register_routers(app: fastapi.FastAPI):
    from . import (
        account,
        public,
        google,
        routine,
        meet,
        calendar,
    )

    app.include_router(public.router)
    app.include_router(account.router)
    app.include_router(google.router)
    app.include_router(routine.router)
    app.include_router(meet.router)
    app.include_router(calendar.router)
