# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging
from datetime import timedelta

import azure.durable_functions as df

from ..shared_code.batch_task_wait_orchestrator_input import BatchTaskWaitOrchestratorInput
from ..shared_code.utilities import deserialize, serialize


def batch_task_wait_orchestrator(context: df.DurableOrchestrationContext):
    """
    Azure DF Orchestrator responsible for periodically checking on the status of the specified batch task.
    This is the "eternal orchestration" pattern; it will run forever until the batch task completes,
    or until it is terminated by the session "stop" API.
    NOTE: Orchestrator functions cannot be 'async'.
    :param df.DurableOrchestrationContext context: the context
    """
    input: BatchTaskWaitOrchestratorInput = deserialize(context.get_input())

    # Wait a bit before checking the status of the task
    time_delta = timedelta(seconds=input.check_interval_seconds)
    next_check = context.current_utc_datetime + time_delta
    if (not(context.is_replaying)):  # this is broken as of Feb-2022; keeping check just in case Microsoft decides to fix it
        logging.info(f"Checking Azure batch activity={input.activity.name} task={input.batch_task_id} after {time_delta} at {next_check} UTC")
    yield context.create_timer(next_check)

    # Check the status of the task
    check_payload_dict = {"activity_name": input.activity.name, "batch_task_id": input.batch_task_id}
    status = yield context.call_activity("df_activity_check_task_status", serialize(check_payload_dict))

    # If the task is not completed, keep going
    if (status["check_again"]):
        context.continue_as_new(context.get_input())

    # Task completed, update the Session
    update_payload_dict = {
        "session_name": input.session_name,
        "add_state": input.completion_state_add,
        "remove_state": input.completion_state_remove,
        "activity": input.activity,
        "execution_info": status["execution_info"]
    }
    yield context.call_activity("df_activity_update_session", serialize(update_payload_dict))


main = df.Orchestrator.create(batch_task_wait_orchestrator)
