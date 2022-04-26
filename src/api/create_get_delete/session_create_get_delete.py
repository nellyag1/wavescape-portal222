# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging

import azure.functions as func

from ..shared_code.utilities import is_none_or_whitespace, to_json
from ..shared_code.session import Session
from ..shared_code.session_de import save_session
from ..shared_code.api_strings import missing_session_json, invalid_body_json, missing_body_param_json, storage_exists_json
from ..shared_code.find_session import find_session


async def create(req: func.HttpRequest, starter: str) -> object:
    """
    Creates the specified session, if it does not already exist.
    :param func.HttpRequest req: the HTTP request
    :param str starter: the context
    :returns: an HttpResponse object
    """
    session_name = req.route_params.get("sessionName")
    if (is_none_or_whitespace(session_name)):
        return func.HttpResponse(missing_session_json, status_code=400)  # 400 = Bad Request

    # Get the user id from the body of the request
    try:
        body = req.get_json()
    except Exception:
        return func.HttpResponse(invalid_body_json, status_code=400)  # 400 = Bad Request

    user_id = body.get("userId")
    if (is_none_or_whitespace(user_id)):
        return func.HttpResponse(missing_body_param_json("userId"), status_code=400)  # 400 = Bad Request

    # Create the session object and Azure blob container
    session = Session(session_name, user_id)

    if (not session.storage.create_blob_container()):
        return func.HttpResponse(storage_exists_json("container", session.storage.blob_container), status_code=400)  # 400 = Bad Request

    # Tell the durable entity to save this session
    await save_session(session, starter)

    logging.info(f"New session created \"{session.name}\"")

    return func.HttpResponse(to_json(f"{req.url}"), status_code=201)  # 201 = Created


async def get(req: func.HttpRequest, starter: str) -> object:
    """
    Gets the data of the specified session.
    :param func.HttpRequest req: the HTTP request object
    :param str starter: the context
    :returns: an HttpResponse object
    """
    # Retrieve the Session object from the durable entity
    session = await find_session(req, starter)
    if (session is None):
        return func.HttpResponse(status_code=410)  # 410 = Gone

    # Send it off in pretty JSON format without all the meta fields
    return func.HttpResponse(to_json(session))


async def delete(req: func.HttpRequest, starter: str) -> object:
    """
    Deletes the specified session if it is in the STOPPED state.
    :param func.HttpRequest req: the HTTP request object
    :param str starter: the context
    :returns: an HttpResponse object
    """
    # Retrieve the Session object from the durable entity
    session = await find_session(req, starter)
    if (session is None):
        return func.HttpResponse(status_code=410)  # 410 = Gone

    # TODO - Ensure that the session's state is STOPPED
    # TODO - Delete the session's container from Azure blob storage
    # TODO - Delete the session's table from Azure table storage
    # TODO - Delete the session's Durable Entity

    return func.HttpResponse(status_code=204)  # 204 = No Content


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        if (req.method == "PUT"):
            return await create(req, starter)
        elif (req.method == "GET"):
            return await get(req, starter)
        elif (req.method == "DELETE"):
            return await delete(req, starter)
        else:
            raise ValueError()  # if we get here, our function.json is misconfigured

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error
