from fastapi import Request, responses

import exceptions as exc  # noqa


async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        if isinstance(e, exc.NormalException):
            return responses.JSONResponse(
                {
                    'data': None,
                    'error': e.__class__.__name__,
                },
                status_code=200)
        else:
            print(e)
            return responses.Response("Internal Server Error", status_code=500)
