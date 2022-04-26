# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from dataclasses import dataclass

from .session import SessionState
from .session_activity import SessionActivity


@dataclass
class BatchTaskWaitOrchestratorInput:
    """
    Parameters to the batch_task_wait_orchestrator.
    session_name:            the name of the session associated with this orchestrator (so it can update its state)
    activity:                the activity just started, either "wavescape", "nearmap", or "validation"
    batch_task_id:           the task id necessary for the "status" API
    completion_state_add:    the SessionState to add to the Session's set of states when the task completes
    completion_state_remove: the SessionState to remove from the Session's set of states when the task completes
    check_interval_seconds:  how many seconds to wait between batch task status checks; optional, default is 60 seconds
    """
    session_name: str
    activity: SessionActivity
    batch_task_id: str
    completion_state_add: SessionState
    completion_state_remove: SessionState
    check_interval_seconds: int = 60
