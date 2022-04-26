# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from datetime import datetime, timedelta
import logging

import azure.functions as func
from azure.storage.blob import generate_blob_sas, BlobSasPermissions

from ..shared_code.session_storage import get_storage_account_key, get_storage_account_name
from ..shared_code.utilities import is_none_or_whitespace, to_json
from ..shared_code.api_strings import missing_session_json, missing_query_param_json


WRITE_PERMISSION_PARAM = "write"
WRITE_WINDOW = timedelta(minutes=15)

READ_PERMISSION_PARAM = "read"
READ_WINDOW = timedelta(minutes=15)


def generate_link(container_name: str, blob_name: str, permission: str):
    """
    Generates the SAS URI for accessing the specified resource with the specified permission.
    Requires the 'STORAGE_ACCOUNT_NAME' and 'STORAGE_ACCOUNT_ACCESS_KEY' environment variables to be set appropriately.
    :param str container_name: the name of the session
    :param str blob_name: the path to the blob, e.g. 'path/file_name.txt'
    :param str permission: the requested access right; must be either "read" or "write"
    """
    account_name = get_storage_account_name()

    if (permission == READ_PERMISSION_PARAM):
        sas_permission = BlobSasPermissions(read=True)
        sas_duration = READ_WINDOW
    elif (permission == WRITE_PERMISSION_PARAM):
        sas_permission = BlobSasPermissions(write=True)
        sas_duration = WRITE_WINDOW
    else:
        raise ValueError(f"Unexpected permission param: {permission}")

    sas = generate_blob_sas(account_name=account_name,
                            container_name=container_name,
                            blob_name=blob_name,
                            account_key=get_storage_account_key(),
                            permission=sas_permission,
                            expiry=datetime.utcnow() + sas_duration)

    return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas}"


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        session_name = req.route_params.get("sessionName")
        if (is_none_or_whitespace(session_name)):
            return func.HttpResponse(missing_session_json, status_code=400)  # 400 = Bad Request

        blob_path = req.params.get("blobPath")
        if (is_none_or_whitespace(blob_path)):
            return func.HttpResponse(missing_query_param_json("blobPath"), status_code=400)  # 400 = Bad Request

        PERMISSION_QUERY_PARAM = "permission"
        permission = req.params.get(PERMISSION_QUERY_PARAM)
        if (is_none_or_whitespace(permission)):
            return func.HttpResponse(missing_query_param_json(PERMISSION_QUERY_PARAM), status_code=400)  # 400 = Bad Request

        permission = permission.lower()
        if (permission != READ_PERMISSION_PARAM and permission != WRITE_PERMISSION_PARAM):
            return func.HttpResponse(to_json(f"\"{PERMISSION_QUERY_PARAM}\" query parameter must be either \"{READ_PERMISSION_PARAM}\" or \"{WRITE_PERMISSION_PARAM}\""), status_code=400)  # 400 = Bad Request

        sas_uri = generate_link(container_name=session_name, blob_name=blob_path, permission=permission)

    except Exception as ex:
        logging.exception(ex)
        return func.HttpResponse(repr(ex), status_code=500)  # 500 = Internal Server Error

    return func.HttpResponse(to_json(sas_uri))
