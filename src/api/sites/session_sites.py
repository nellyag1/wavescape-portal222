# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import base64
import logging
import azure.functions as func

from azure.core.exceptions import ResourceNotFoundError

from ..shared_code.sites import batch_upsert_entities
from ..shared_code.session import Session
from ..shared_code.session_storage import RAW_SITES_BLOB_PATH, SITES_BLOB_PATH, get_table_service_client
from ..shared_code.utilities import is_none_or_whitespace, str_to_bool, to_json
from ..shared_code.api_strings import (
    invalid_body_json,
    missing_sites_table_json,
    missing_body_param_json,
    invalid_b64_json,
    blob_exists_json,
    sites_body_missing_both,
    sites_entity_cannot_specify,
    sites_entity_missing_field,
    sites_no_entities
)
from ..shared_code.find_session import find_session


async def put(session: Session, req: func.HttpRequest, starter: str) -> func.HttpResponse:
    """
    Saves the original sites data to the session's Azure blob container: the "raw" (a CSV file) and the "processed" (a GeoJSON file).
    :param Session session: The session object.
    :param func.HttpRequest req: The HTTP request object.
    :param str starter: The context.
    :returns: An HttpResponse object.
    """
    RAW_PARAM_NAME = "raw"
    PROCESSED_PARAM_NAME = "processed"

    # Get the sites data from the body of the request:
    # - raw (CSV), Base64 string representation because CSV files have required newline characters in them
    # - processed (GeoJSON object)
    try:
        body = req.get_json()
    except Exception:
        return func.HttpResponse(invalid_body_json, status_code=400)  # 400 = Bad Request

    raw_b64 = body.get(RAW_PARAM_NAME)
    if (is_none_or_whitespace(raw_b64)):
        return func.HttpResponse(missing_body_param_json(RAW_PARAM_NAME), status_code=400)  # 400 = Bad Request

    # Decode the Base64 encoded CSV file
    try:
        raw_bytes = base64.b64decode(raw_b64, validate=True)
    except Exception:
        return func.HttpResponse(invalid_b64_json(RAW_PARAM_NAME), status_code=400)  # 400 = Bad Request

    processed = body.get(PROCESSED_PARAM_NAME)

    # Maybe error if the blobs already exist
    optional_overwrite = body.get("overwrite")
    overwrite = not is_none_or_whitespace(optional_overwrite) and str_to_bool(optional_overwrite)
    if (session.storage.blob_exists(RAW_SITES_BLOB_PATH) and not overwrite):
        return func.HttpResponse(blob_exists_json(RAW_SITES_BLOB_PATH), status_code=400)  # 400 = Bad Request
    if (session.storage.blob_exists(SITES_BLOB_PATH) and not overwrite):
        return func.HttpResponse(blob_exists_json(SITES_BLOB_PATH), status_code=400)  # 400 = Bad Request

    # Save the data to the cloud
    session.storage.save_file(RAW_SITES_BLOB_PATH, raw_bytes, overwrite)
    session.storage.save_file(SITES_BLOB_PATH, to_json(processed, pretty=False), overwrite)

    return func.HttpResponse(status_code=204)  # 204 = No Content


async def get(session: Session) -> func.HttpResponse:
    """
    Gets the sites data from Azure table storage and returns it as a JSON list of objects; list may be empty.
    NOTE: This table is created and populated the first time either Validation or WaveScape is initiated.
    :param Session session: The session object.
    :returns: An HttpResponse object.
    """
    try:
        sites = []
        for entity in get_table_service_client().get_table_client(session.storage.table).list_entities():
            sites.append(entity)
    except ResourceNotFoundError:
        return func.HttpResponse(missing_sites_table_json, status_code=400)  # 400 = Bad Request

    return func.HttpResponse(to_json(sites))


async def patch(session: Session, req: func.HttpRequest, starter: str) -> func.HttpResponse:
    """
    Upserts the sites data in Azure table storage.
    NOTE: This table is created and populated the first time either Validation or WaveScape is initiated.
    :param Session session: The session object.
    :param func.HttpRequest req: The HTTP request object.
    :param str starter: The context.
    :returns: An HttpResponse object.
    """
    ROWS_SECTION_NAME       = "rows"
    ROW_KEY_REQUIRED_NAME   = "RowKey"
    ENABLED_REQUIRED_NAME   = "enabled"  # a Boolean
    UPDATED_COLLECTION_NAME = "updated"
    NEW_COLLECTION_NAME     = "new"

    # Get the rows data from the body of the request:
    try:
        body = req.get_json()
    except Exception:
        return func.HttpResponse(invalid_body_json, status_code=400)  # 400 = Bad Request
    rows = body.get(ROWS_SECTION_NAME)
    if not rows:
        return func.HttpResponse(missing_body_param_json(ROWS_SECTION_NAME), status_code=400)  # 400 = Bad Request

    # Ensure there is at least 1 of the 2 required collections
    updated_entities = rows.get(UPDATED_COLLECTION_NAME)
    new_entities = rows.get(NEW_COLLECTION_NAME)
    if ((not (updated_entities or new_entities)) or ((len(updated_entities) == 0) and (len(new_entities) == 0))):
        return func.HttpResponse(sites_body_missing_both(UPDATED_COLLECTION_NAME, NEW_COLLECTION_NAME), status_code=400)  # 400 = Bad Request

    # Ensure that all updated entities have all the required fields
    for updated_entity in updated_entities:
        if (is_none_or_whitespace(updated_entity.get(ROW_KEY_REQUIRED_NAME))):
            return func.HttpResponse(sites_entity_missing_field("updated", ROW_KEY_REQUIRED_NAME), status_code=400)  # 400 = Bad Request
        if (updated_entity.get(ENABLED_REQUIRED_NAME) is None):
            return func.HttpResponse(sites_entity_missing_field("updated", ENABLED_REQUIRED_NAME), status_code=400)  # 400 = Bad Request

    # Ensure that all new entities have only the data fields
    for new_entity in new_entities:
        if (not is_none_or_whitespace(new_entity.get(ROW_KEY_REQUIRED_NAME))):
            return func.HttpResponse(sites_entity_cannot_specify("new", ROW_KEY_REQUIRED_NAME), status_code=400)  # 400 = Bad Request
        if (new_entity.get(ENABLED_REQUIRED_NAME) is None):
            return func.HttpResponse(sites_entity_missing_field("new", ENABLED_REQUIRED_NAME), status_code=400)  # 400 = Bad Request

    client = get_table_service_client().get_table_client(session.storage.table)

    # Updated the changed entities
    if (updated_entities):
        logging.info(f"sites PATCH, updating these existing entities:\n{updated_entities}")
        batch_upsert_entities(client, (entity for entity in updated_entities))
    else:
        logging.info(sites_no_entities("updated"))

    # Add the new entities
    if (new_entities):
        logging.info(f"sites PATCH, adding these new entities:\n{new_entities}")
        batch_upsert_entities(client, (entity for entity in new_entities))
    else:
        logging.info(sites_no_entities("new"))

    return func.HttpResponse(status_code=204)  # 204 = No Content


async def main(req: func.HttpRequest, starter: str) -> func.HttpResponse:
    try:
        # Retrieve the Session object from the durable entity
        session: Session = await find_session(req, starter)
        if (session is None):
            return func.HttpResponse(status_code=410)  # 410 = Gone

        if (req.method == "PUT"):
            return await put(session, req, starter)
        elif (req.method == "GET"):
            return await get(session)
        elif (req.method == "PATCH"):
            return await patch(session, req, starter)
        else:
            raise ValueError()  # if we get here, our function.json is misconfigured

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error
