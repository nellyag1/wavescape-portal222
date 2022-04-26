# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import azure.functions as func
import logging

from ..shared_code.utilities import serialize
from ..shared_code.session import SessionState
from ..shared_code.session_de import save_session
from ..shared_code.api_strings import invalid_body_json
from ..shared_code.find_session import find_session


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        # Retrieve the Session object from the durable entity
        session = await find_session(req, starter)
        if (session is None):
            return func.HttpResponse(status_code=410)  # 410 = Gone

        # Get the configuration from the body of the request
        try:
            body = req.get_json()
        except Exception:
            return func.HttpResponse(invalid_body_json, status_code=400)  # 400 = Bad Request

        session.configuration = serialize(body)  # serialize, because we need to be able to reconstruct the object later

        # Update the Session state and save it
        session.add_state(SessionState.CONFIGURATION_COMPLETED)
        session.remove_state(SessionState.VALIDATION_COMPLETED)
        session.remove_state(SessionState.WAVESCAPE_COMPLETED)
        await save_session(session, starter)

        logging.info(f"Configuration saved for session \"{session.name}\"")

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error

    return func.HttpResponse(status_code=204)  # 204 = No Content
