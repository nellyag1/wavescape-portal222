# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging

from ..shared_code.session_activity import SessionActivity
from ..shared_code.utilities import deserialize
from ..shared_code.session_de import get_session, save_session
from ..shared_code.session import Session, SessionState


async def main(payload: str, starter: str) -> None:
    """
    Update the indicated Session by first adding the 'add_state' and then removing the 'remove_state'.
    NOTE: Activity functions must always return something.
    :param str payload: serialized dictionary of parameters
    :returns: None
    """
    # Extract the parameters
    input_dict = deserialize(payload)
    session_name: str = input_dict["session_name"]
    add_state: SessionState = input_dict["add_state"]
    remove_state: SessionState = input_dict["remove_state"]
    activity: SessionActivity = input_dict["activity"]
    execution_info = input_dict["execution_info"]

    # Get the Session and update it
    session: Session = await get_session(session_name, starter)
    if (session is not None):
        session.add_state(add_state)        # One of the *_COMPLETED
        session.remove_state(remove_state)  # One of the *_RUNNING

        if (activity == SessionActivity.NEARMAP):
            session.nearmap.execution_info = execution_info
        if (activity == SessionActivity.VALIDATION):
            session.validation.execution_info = execution_info
        if (activity == SessionActivity.WAVESCAPE):
            session.wavescape.execution_info = execution_info

        await save_session(session, starter)
        return "Success"
    else:
        logging.error(f"Session not found, session_name={session_name}")
        return "Failure"
