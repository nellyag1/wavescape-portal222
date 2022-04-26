# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging

import azure.functions as func

from ..shared_code.utilities import to_json
from ..shared_code.session_de import get_all_sessions


async def get_all(starter: str) -> list:
    """
    Gets all the data for all the sessions that currently exist.
    :param str starter: the context
    :returns: list of session objects
    """
    sessions = await get_all_sessions(starter)
    return sessions


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        if (req.method == "GET"):
            response = await get_all(starter)
        else:
            raise ValueError()  # if we get here, our function.json is misconfigured

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error

    return func.HttpResponse(to_json(response))
