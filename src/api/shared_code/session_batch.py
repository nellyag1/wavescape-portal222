# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging
import requests
from dataclasses import dataclass

from azure.durable_functions import DurableOrchestrationClient

from .session import Session, SessionState
from .session_activity import SessionActivity
from .session_de import save_session
from .batch_task_wait_orchestrator_input import BatchTaskWaitOrchestratorInput
from .utilities import deserialize, get_environment_variable, serialize, to_json


@dataclass
class StartWaveScapeBody:
    session_name: str
    iteration_name: str
    container_sas: str
    table_sas: str
    configuration: object
    stages: object


@dataclass
class StartValidationBody:
    session_name: str
    container_sas: str
    table_sas: str
    configuration: object


@dataclass
class StartNearmapBody:
    session_name: str
    container_sas: str
    table_sas: str


def call_batch_activity_start_api(api_body: object, session_name: str, activity: SessionActivity) -> str:
    """
    Calls the "start"" Azure Batch API for the specified activity with the provided body.
    :param object api_body: The body of the API call
    :param str session_name: The name of the session (for error log)
    :param SessionActivity activity: What action is being initiated
    :returns str: The id of the Batch task that was just started
    :raises RuntimeError: if the result of calling the API does not indicate success
    """
    api_url = get_environment_variable("WAVESCAPE_RUNNER_API_URL")  # e.g. "https://{FUNCTION_APP}.azurewebsites.net/api
    api_key = get_environment_variable("WAVESCAPE_RUNNER_API_KEY")
    api_call = f"{activity.name.lower()}/start"
    url = f"{api_url}/{api_call}?code={api_key}"

    response = requests.post(url, data=to_json(api_body, pretty=False), headers={"Content-Type": "application/json"})

    action = f"start {activity.name.lower()} for session \"{session_name}\""
    if (not(response.ok)):
        msg = f"Failed to {action}. API={url}, status={response.status_code}, reason={response.reason}"
        logging.error(msg)
        raise RuntimeError(msg)
    logging.info(f"{action} successful, task ID = {response.text}")
    return response.text


def call_batch_activity_stop_api(session_name: str, activity: SessionActivity, task_id: str) -> None:
    """
    Calls the "stop"" Azure Batch API for the specified activity with the provided task id.
    :param str session_name: The name of the session (for error log)
    :param SessionActivity activity: What action is being initiated
    :param str task_id: The id of the task to stop.
    """
    api_url = get_environment_variable("WAVESCAPE_RUNNER_API_URL")  # e.g. "https://{FUNCTION_APP}.azurewebsites.net/api
    api_key = get_environment_variable("WAVESCAPE_RUNNER_API_KEY")
    api_call = f"{activity.name.lower()}/stop/{task_id}"
    url = f"${api_url}/{api_call}?code={api_key}"

    response = requests.post(url)
    action = f"stop {activity.name.lower()} for session \"{session_name}\""
    if (not(response.ok)):
        if (response.status_code == 410):  # 410 = Gone
            logging.info(f"{action} successful, task already deleted")
        else:
            logging.warning(f"Failed to {action}. API={url}, status={response.status_code}, reason={response.reason}")
    else:
        logging.info(f"{action} successful")


async def create_orchestrator(starter: str,
                              session_name: str,
                              wait_task_id: str,
                              completion_state_add: SessionState,
                              completion_state_remove: SessionState,
                              activity: SessionActivity,
                              check_interval_seconds: int = 60) -> str:
    """
    Create a new orchestrator to wait for the specified batch task to complete.
    :param str starter: the context
    :param str session_name: so it knows what session to update when completion occurs
    :param str wait_task_id: the id of the task for which to wait
    :param SessionState completion_state_add: the state to add to the Session's set of states when completion occurs
    :param SessionState completion_state_remove: the state to remove from the Session's set of states when completion occurs
    :param SessionActivity activity: What activity was started, either "wavescape", "nearmap", or "validation"
    :param int check_interval_seconds: how many seconds to wait between batch task status checks; optional, default is 60 seconds
    :returns str: The id of the Batch orchestrator that was just created
    :raises RuntimeError: if the result of starting a new orchestrator does not indicate success
    """
    client = DurableOrchestrationClient(starter)
    input = BatchTaskWaitOrchestratorInput(session_name, activity, wait_task_id, completion_state_add, completion_state_remove, check_interval_seconds)
    orchestration_id = await client.start_new("df_orchestrator_batch_task_wait", client_input=serialize(input))
    action = f"create orchestrator to wait for {activity.name.lower()} batch task to complete"
    if (orchestration_id is None):
        msg = f"Failed to {action}."
        logging.error(msg)
        raise RuntimeError(msg)
    logging.info(f"{action} successful, orchestrator ID = {orchestration_id}")
    return orchestration_id


async def start_nearmap(session: Session, starter: str) -> None:
    """
    Initiate Nearmap processing.
    :param Session session: the session object
    :param str starter: the context
    """
    MAX_PROCESSING_TIME_HOURS = 1

    # Construct the body that the Batch API needs
    body = StartNearmapBody(session.name,
                            session.storage.get_container_sas_uri(MAX_PROCESSING_TIME_HOURS),
                            session.storage.get_table_sas_uri(MAX_PROCESSING_TIME_HOURS))

    # Call the Nearmap kick-off Batch API
    session.nearmap.task_id = call_batch_activity_start_api(body, session.name, SessionActivity.NEARMAP)

    # Update and save the Session now in case the next part fails
    session.set_state(SessionState.NEARMAP_RUNNING)
    await save_session(session, starter)

    # Create an orchestrator to wait for Nearmap to complete
    session.nearmap.orchestrator_id = await create_orchestrator(starter,
                                                                session.name,
                                                                session.nearmap.task_id,
                                                                completion_state_add=SessionState.NEARMAP_COMPLETED,
                                                                completion_state_remove=SessionState.NEARMAP_RUNNING,
                                                                activity=SessionActivity.NEARMAP)

    # Update and save the Session
    session.touched()
    await save_session(session, starter)


async def start_wavescape(session: Session, stages: object, starter: str) -> None:
    """
    Initiate WaveScape processing.
    :param Session session: The session object
    :param object stage: The WaveScape stages collection
    :param str starter: The context
    """
    MAX_PROCESSING_TIME_HOURS = 12

    # Construct the body that the Batch API needs
    body = StartWaveScapeBody(session.name,
                              session.current_iteration_name(),
                              session.storage.get_container_sas_uri(MAX_PROCESSING_TIME_HOURS),
                              session.storage.get_table_sas_uri(MAX_PROCESSING_TIME_HOURS),
                              deserialize(session.configuration),
                              stages)

    # Call the WaveScape kick-off Batch API
    session.wavescape.task_id = call_batch_activity_start_api(body, session.name, SessionActivity.WAVESCAPE)

    # Update the session's state, and save the Session now in case the next part fails
    session.remove_state(SessionState.STOPPED)
    session.remove_state(SessionState.WAVESCAPE_COMPLETED)
    session.add_state(SessionState.READY_TO_RUN)  # In case we are coming from the stopped state
    session.add_state(SessionState.WAVESCAPE_RUNNING)
    await save_session(session, starter)

    # Create an orchestrator to wait for WaveScape to complete
    session.wavescape.orchestrator_id = await create_orchestrator(starter,
                                                                  session.name,
                                                                  session.wavescape.task_id,
                                                                  completion_state_add=SessionState.WAVESCAPE_COMPLETED,
                                                                  completion_state_remove=SessionState.WAVESCAPE_RUNNING,
                                                                  activity=SessionActivity.WAVESCAPE)

    # Update and save the Session
    session.touched()
    await save_session(session, starter)


async def start_validation(session: Session, starter: str) -> None:
    """
    Initiate Validation processing.
    :param Session session: the session object
    :param str starter: the context
    """
    MAX_PROCESSING_TIME_HOURS = 1

    # Construct the body that the Batch API needs
    body = StartValidationBody(session.name,
                               session.storage.get_container_sas_uri(MAX_PROCESSING_TIME_HOURS),
                               session.storage.get_table_sas_uri(MAX_PROCESSING_TIME_HOURS),
                               deserialize(session.configuration))

    # Call the Validation kick-off Batch API
    session.validation.task_id = call_batch_activity_start_api(body, session.name, SessionActivity.VALIDATION)

    # Update the session's state, and save the Session now in case the next part fails
    session.remove_state(SessionState.STOPPED)
    session.remove_state(SessionState.VALIDATION_COMPLETED)
    session.add_state(SessionState.READY_TO_RUN)  # In case we are coming from the stopped state
    session.add_state(SessionState.VALIDATION_RUNNING)
    await save_session(session, starter)

    # Create an orchestrator to wait for Validation to complete
    session.validation.orchestrator_id = await create_orchestrator(starter,
                                                                   session.name,
                                                                   session.validation.task_id,
                                                                   completion_state_add=SessionState.VALIDATION_COMPLETED,
                                                                   completion_state_remove=SessionState.VALIDATION_RUNNING,
                                                                   activity=SessionActivity.VALIDATION)

    # Update and save the Session
    session.touched()
    await save_session(session, starter)
