# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging

import azure.functions as func

from ..shared_code.session import SessionState
from ..shared_code.session_activity import SessionActivity
from ..shared_code.session_batch import call_batch_activity_stop_api
from ..shared_code.session_de import save_session, terminate_orchestrator
from ..shared_code.utilities import is_none_or_whitespace
from ..shared_code.find_session import find_session


async def stop_orchestrator(session_name: str, activity: SessionActivity, id: str, starter: str) -> None:
    """
    Stops the specified orchestrator, if there is one.
    :param str session_name: The name of the session.
    :param SessionActivity activity: The particular activity being stopped.
    :param str id: The orchestrator's instance id
    :param str starter: The context.
    """
    if (not is_none_or_whitespace(id)):
        await terminate_orchestrator(id, "session stopped by user", starter)
    else:
        logging.info(f"skipping orchestrator stop; {activity.name} orchestrator for session \"{session_name}\" has never been created")


def stop_task(session_name: str, activity: SessionActivity, id: str) -> None:
    """
    Stops the specified batch task, if there is one.
    :param str session_name: The name of the session.
    :param SessionActivity activity: The particular activity being stopped.
    :param str id: The activity's task's id.
    """
    if (not is_none_or_whitespace(id)):
        call_batch_activity_stop_api(session_name, activity, id)
    else:
        logging.info(f"skipping task stop; {activity.name} batch task for session \"{session_name}\" has never been run")


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        # Retrieve the Session object from the durable entity
        session = await find_session(req, starter)
        if (session is None):
            return func.HttpResponse(status_code=410)  # 410 = Gone

        # Terminate any orchestrators
        await stop_orchestrator(session.name, SessionActivity.NEARMAP, session.nearmap.orchestrator_id, starter)
        await stop_orchestrator(session.name, SessionActivity.VALIDATION, session.validation.orchestrator_id, starter)
        await stop_orchestrator(session.name, SessionActivity.WAVESCAPE, session.wavescape.orchestrator_id, starter)

        # Terminate any batch tasks
        stop_task(session.name, SessionActivity.NEARMAP, session.nearmap.task_id)
        stop_task(session.name, SessionActivity.VALIDATION, session.validation.task_id)
        stop_task(session.name, SessionActivity.WAVESCAPE, session.wavescape.task_id)

        # Change the state to stopped and save the session
        session.set_state(SessionState.STOPPED)
        await save_session(session, starter)

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error

    return func.HttpResponse(status_code=204)  # 204 = No Content
