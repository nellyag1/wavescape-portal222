# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from typing import Optional

import azure.functions as func

from .utilities import is_none_or_whitespace
from .session import Session
from .session_de import get_session


async def find_session(req: func.HttpRequest, starter: str) -> Optional[Session]:
    """
    Returns the session object for the session name given in the route, or None if it does not exist.
    :param func.HttpRequest req: the HTTP request object
    :param str starter: the context
    :returns: Session object or None
    """
    session_name = req.route_params.get("sessionName")
    if (is_none_or_whitespace(session_name)):
        return None

    # Retrieve the Session object from the durable entity
    return await get_session(session_name, starter)
