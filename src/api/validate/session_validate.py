# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import azure.functions as func
import logging

from ..shared_code.session_storage import SITES_BLOB_PATH
from ..shared_code.sites import create_table_from_sites
from ..shared_code.session import Session, SessionState
from ..shared_code.session_activity import SessionActivity
from ..shared_code.utilities import to_json
from ..shared_code.session_batch import start_validation
from ..shared_code.api_strings import already_running_text, initiated_text, missing_configuration_json, missing_sites_json
from ..shared_code.find_session import find_session


async def post(session: Session, starter: str) -> func.HttpResponse:
    """
    Starts the validation batch task.
    :param Session session: The session.
    :param str starter: The context.
    :returns func.HttpResponse: an HttpResponse object.
    """
    # Ensure that the session has been configured
    if (not session.configuration):
        return func.HttpResponse(missing_configuration_json, status_code=400)  # 400 = Bad Request

    # Ensure that sites have been uploaded to Azure Blob container
    if (not session.storage.blob_exists(SITES_BLOB_PATH)):
        return func.HttpResponse(missing_sites_json, status_code=400)  # 400 = Bad Request

    # Ensure that only one Validation activity is running at a time
    if (SessionState.VALIDATION_RUNNING.name in session.states):
        msg = already_running_text(SessionActivity.VALIDATION, session.name, session.validation.task_id)
        logging.info(msg)
        return func.HttpResponse(to_json(msg), status_code=400)  # 400 = Bad Request

    create_table_from_sites(session)

    await start_validation(session, starter)

    logging.info(initiated_text(SessionActivity.VALIDATION, session.name, session.validation.task_id))

    return func.HttpResponse(status_code=202)  # 202 = Accepted


async def get(session: Session) -> func.HttpResponse:
    """
    Gets the two log files, "stdout.txt" and "stderr.txt", produced and published by the batch validation task.
    """
    response = session.storage.read_logs(session.validation.task_id)
    return func.HttpResponse(to_json(response))


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        # Retrieve the Session object from the durable entity
        session: Session = await find_session(req, starter)
        if (session is None):
            return func.HttpResponse(status_code=410)  # 410 = Gone

        if (req.method == "POST"):
            return await post(session, starter)
        elif (req.method == "GET"):
            return await get(session)
        else:
            raise ValueError()  # if we get here, our function.json is misconfigured

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error
