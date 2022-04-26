# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from enum import Enum, unique, auto
from dataclasses import dataclass


@unique
class SessionActivity(Enum):
    WAVESCAPE  = auto()
    NEARMAP    = auto()
    VALIDATION = auto()


@dataclass
class SessionActivityInfo:
    task_id: str
    orchestrator_id: str
    execution_info: str
