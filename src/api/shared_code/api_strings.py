# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

from ..shared_code.utilities import to_json
from ..shared_code.session_activity import SessionActivity


# +---------------------------------------
# | JSON formatted strings
# +---------------------------------------
missing_session_json = to_json("sessionName is None, Empty, or Whitespace; please refer to API documentation")

invalid_body_json = to_json("body does not contain valid JSON data; please refer to API documentation")

missing_configuration_json = to_json("the session has not yet been configured")

missing_sites_json = to_json("sites have not been uploaded to Azure Blob container")

missing_sites_table_json = to_json("sites table for this session does not exist; run validation or WaveScape first")


def missing_body_param_json(param: str) -> str:
    "body does not contain \"{param}\"; please refer to API documentation"
    return to_json(f"body does not contain \"{param}\"; please refer to API documentation")


def missing_query_param_json(param: str) -> str:
    "\"{param}\" query parameter not provided; please refer to API documentation"
    return to_json(f"\"{param}\" query parameter not provided; please refer to API documentation")


def invalid_b64_json(param: str) -> str:
    "\"{param}\" is not a valid Base64 encoded string; please refer to API documentation"
    return to_json(f"\"{param}\" is not a valid Base64 encoded string; please refer to API documentation")


def blob_exists_json(blob: str) -> str:
    "Azure blob \"{blob}\" already exists for this session"
    return to_json(f"Azure blob \"{blob}\" already exists for this session")


def storage_exists_json(type: str, name: str) -> str:
    "Azure {type} \"{name}\" already exists"
    return to_json(f"Azure {type} \"{name}\" already exists")


def sites_entity_missing_field(type: str, name: str) -> str:
    "an {type} entity is missing the required \"{name}\" property; please refer to API documentation"
    return to_json(f"an {type} entity is missing the required \"{name}\" property; please refer to API documentation")


def sites_entity_cannot_specify(type: str, name: str) -> str:
    "a {type} entity cannot specify the \"{name}\" property; please refer to API documentation"
    return to_json(f"a {type} entity cannot specify the \"{name}\" property; please refer to API documentation")


def sites_body_missing_both(collection1: str, collection2: str) -> str:
    "body missing both lists of entities, \"{collection1}\" and \"{collection2}\"; please refer to API documentation"
    return to_json(f"body missing both lists of entities, \"{collection1}\" and \"{collection2}\"; please refer to API documentation")


# +---------------------------------------
# | Plain text strings
# +---------------------------------------
def already_running_text(activity: SessionActivity, session_name: str, task_id: str) -> str:
    "Attempt to start {activity.name} when already running for session \"{session_name}\", task id = {task_id}"
    return f"Attempt to start {activity.name} when already running for session \"{session_name}\", task id = {task_id}"


def initiated_text(activity: SessionActivity, session_name: str, task_id: str) -> str:
    "{activity.name} kicked-off for session \"{session_name}\", task id = {task_id}"
    return f"{activity.name} kicked-off for session \"{session_name}\", task id = {task_id}"


def sites_no_entities(type: str) -> str:
    "sites PATCH, no {type} entities"
    return f"sites PATCH, no {type} entities"
