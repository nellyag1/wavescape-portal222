# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import datetime

from enum import Enum, unique, auto

from .session_activity import SessionActivityInfo
from .session_storage import SessionStorage


@unique
class SessionState(Enum):
    IDLE                        = auto()
    NEARMAP_RUNNING             = auto()
    NEARMAP_COMPLETED           = auto()
    CONFIGURATION_COMPLETED     = auto()
    READY_TO_RUN                = auto()
    VALIDATION_RUNNING          = auto()
    VALIDATION_COMPLETED        = auto()
    WAVESCAPE_RUNNING           = auto()
    WAVESCAPE_COMPLETED         = auto()
    STOPPED                     = auto()


class Session:
    def __init__(self, name: str, user_id: str):
        """
        Constructor.
        :param str name: the name of the session
        :param str user_id: the ID of the user that created this session
        """
        self.version         = 1
        self.name            = name

        self.iteration_names = list()
        self.iteration_names.append("Initial")

        self.created_by      = user_id
        self.created         = datetime.datetime.utcnow().isoformat() + 'Z'
        self.updated         = datetime.datetime.utcnow().isoformat() + 'Z'

        self.states          = set()  # a set of SessionState names
        self.states.add(SessionState.IDLE.name)

        self.storage         = SessionStorage(session_name=name)
        self.configuration   = ""

        self.nearmap         = SessionActivityInfo("", "", "")
        self.validation      = SessionActivityInfo("", "", "")
        self.wavescape       = SessionActivityInfo("", "", "")


    def touched(self) -> None:
        """
        Performs any automatic state transitions and sets the updated time string to UTC now.
        """
        READY_TO_RUN_SET = set([SessionState.NEARMAP_COMPLETED.name, SessionState.CONFIGURATION_COMPLETED.name])
        if (self.states == READY_TO_RUN_SET):
            self.set_state(SessionState.READY_TO_RUN)

        self.updated = datetime.datetime.utcnow().isoformat() + 'Z'


    def set_state(self, new_state: SessionState) -> None:
        """
        Sets the set of states to only the one state specified.
        :param SessionState new_state: the only state to have in the set
        """
        self.states.clear()
        self.states.add(new_state.name)
        self.touched()


    def add_state(self, additional_state: SessionState) -> None:
        """
        Adds the specified state to the set of states, if it is not already there.
        :param SessionState additional_state: the state to add to the set
        """
        self.states.add(additional_state.name)
        self.touched()


    def remove_state(self, old_state: SessionState) -> None:
        """
        Removes the specified state from the set of states, if it is there.
        :param SessionState old_state: the state to remove from the set
        """
        self.states.discard(old_state.name)
        self.touched()


    def current_iteration_name(self) -> str:
        """
        Returns the last name in the list of iteration names.
        """
        return self.iteration_names[-1]
