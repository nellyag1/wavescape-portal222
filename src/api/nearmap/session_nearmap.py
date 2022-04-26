# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import base64
import logging

import azure.functions as func

from ..shared_code.session import Session, SessionState
from ..shared_code.session_activity import SessionActivity
from ..shared_code.session_storage import AOI_BLOB_PATH
from ..shared_code.utilities import is_none_or_whitespace, str_to_bool, to_json
from ..shared_code.session_batch import start_nearmap
from ..shared_code.api_strings import invalid_body_json, missing_body_param_json, invalid_b64_json, blob_exists_json, already_running_text, initiated_text
from ..shared_code.find_session import find_session


async def post(session: Session, req: func.HttpRequest, starter: str) -> func.HttpResponse:
    """
    Saves the AOI file and starts the Nearmap batch task.
    :param Session session: The session.
    :param func.HttpRequest req: The HTTP request.
    :param str starter: The context.
    :returns func.HttpResponse: an HttpResponse object.
    """
    AOI_PARAM_NAME = "aoi"

    # Get the AOI (Base64 string representation) from the body of the request and make sure we can decode it
    try:
        body = req.get_json()
    except Exception:
        return func.HttpResponse(invalid_body_json, status_code=400)  # 400 = Bad Request

    aoi_b64 = body.get(AOI_PARAM_NAME)
    if (is_none_or_whitespace(aoi_b64)):
        return func.HttpResponse(missing_body_param_json(AOI_PARAM_NAME), status_code=400)  # 400 = Bad Request

    try:
        aoi_bytes = base64.b64decode(aoi_b64, validate=True)
    except Exception:
        return func.HttpResponse(invalid_b64_json(AOI_PARAM_NAME), status_code=400)  # 400 = Bad Request

    # Maybe error if the blob already exists
    optional_overwrite = body.get("overwrite")
    overwrite = not is_none_or_whitespace(optional_overwrite) and str_to_bool(optional_overwrite)
    if (session.storage.blob_exists(AOI_BLOB_PATH) and not overwrite):
        return func.HttpResponse(blob_exists_json(AOI_BLOB_PATH), status_code=400)  # 400 = Bad Request

    # Ensure that only one Nearmap activity is running at a time
    if (SessionState.NEARMAP_RUNNING.name in session.states):
        msg = already_running_text(SessionActivity.NEARMAP, session.name, session.nearmap.task_id)
        logging.info(msg)
        return func.HttpResponse(to_json(msg), status_code=400)  # 400 = Bad Request

    # Save the AOI file to the cloud and tell the durable entity to start Nearmap
    session.storage.save_file(AOI_BLOB_PATH, aoi_bytes, overwrite)
    await start_nearmap(session, starter)

    logging.info(initiated_text(SessionActivity.NEARMAP, session.name, session.nearmap.task_id))

    return func.HttpResponse(status_code=202)  # 202 = Accepted


async def get(session: Session) -> func.HttpResponse:
    """
    Gets the two log files, "stdout.txt" and "stderr.txt", produced and published by the batch Nearmap task.
    """
    response = session.storage.read_logs(session.nearmap.task_id)
    return func.HttpResponse(to_json(response))


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        # Retrieve the Session object from the durable entity
        session: Session = await find_session(req, starter)
        if (session is None):
            return func.HttpResponse(status_code=410)  # 410 = Gone

        if (req.method == "POST"):
            return await post(session, req, starter)
        elif (req.method == "GET"):
            return await get(session)
        else:
            raise ValueError()  # if we get here, our function.json is misconfigured

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error
