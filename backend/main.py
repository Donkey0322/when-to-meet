from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import app_config

app = FastAPI(
    title=app_config.title,
    docs_url=app_config.docs_url,
    redoc_url=app_config.redoc_url,
)

origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:3006',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event('startup')
async def app_startup():
    from config import db_config
    from persistence.database import pool_handler
    await pool_handler.initialize(db_config=db_config)

    from config import smtp_config
    from persistence.email import smtp_handler
    await smtp_handler.initialize(smtp_config=smtp_config)


@app.on_event('shutdown')
async def app_shutdown():
    from persistence.database import pool_handler
    await pool_handler.close()

    from persistence.email import smtp_handler
    await smtp_handler.close()


import middleware.auth
app.middleware('http')(middleware.auth.middleware)

import starlette_context.middleware
app.add_middleware(starlette_context.middleware.RawContextMiddleware)

import processor.http
processor.http.register_routers(app)

import middleware.exception_handler
app.middleware('http')(middleware.exception_handler.catch_exceptions_middleware)

from starlette.middleware.sessions import SessionMiddleware
from config import session_config
app.add_middleware(SessionMiddleware, secret_key=session_config)
