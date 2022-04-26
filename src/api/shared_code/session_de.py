# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging
from typing import Optional

from azure.durable_functions import DurableOrchestrationClient
import azure.durable_functions as df

from ..shared_code.session_storage import get_table_service_client
from .session import Session
from .utilities import serialize, deserialize


def make_entity_id(session_name: str) -> df.EntityId:
    """
    Build the entity identifier, incorporating the session name.
    :param str session_name: the name of the session
    :returns df.EntityId: the durable function entity id
    """
    # The name is the name of the folder containing the code for the Durable Entity
    return df.EntityId(name="df_entity_session", key=session_name)


async def save_session(session: Session, starter: str) -> None:
    """
    Save the session object as a Durable Entity (DE).
    :param Session session: the session object to persist
    :param str starter: the context
    """
    client = DurableOrchestrationClient(starter)
    entityId = make_entity_id(session.name)
    session_json = serialize(session)
    await client.signal_entity(entityId, operation_name="save", operation_input=session_json)


async def get_session(session_name: str, starter: str) -> Optional[Session]:
    """
    Retrieve the session data (pickleable JSON) from its Durable Entity (DE).
    :param str session_name: the name of the session for which to retrieve its JSON
    :param str starter: the context
    :returns: Session object or None
    """
    client = DurableOrchestrationClient(starter)
    entityId = make_entity_id(session_name)
    entity_state_response = await client.read_entity_state(entityId)
    entity_state = None
    if (entity_state_response.entity_exists):
        entity_state = deserialize(str(entity_state_response.entity_state))
    return entity_state


async def get_all_sessions(starter: str) -> list:
    """
    Retrieve all the sessions' data from all the Durable Entities.
    :param str starter: the context
    :returns list: a list of Session objects
    """
    # +-------------------------------------------------------------------------------------------
    # | You would think that you can do the following according to the Microsoft documentation:
    # |     client = DurableOrchestrationClient(starter)
    # |     all_instances = await client.get_status_all()
    # | but that will not work because both of the functions:
    # |     - get_status_all()
    #       - get_status_by()
    # | return only the first 100 instances and there is no paging mechanism in the Python SDK.
    # +-------------------------------------------------------------------------------------------

    DE_TABLE_NAME = "DurableTaskInstances"
    all_instances = list(get_table_service_client().get_table_client(DE_TABLE_NAME).list_entities())

    sessions = []  # A list of Session objects
    logging.info(f"Found {len(all_instances)} total durable instances")
    for instance in all_instances:
        if (instance["PartitionKey"].startswith("@df_entity_session@")):  # ignore orchestrators
            input_column = deserialize(instance["Input"])
            obj = deserialize(deserialize(input_column["state"]))  # yes, twice, because the state JSON string is wrapped in single quotes
            sessions.append(obj)
    logging.info(f"Returning {len(sessions)} sessions; others were orchestrators")
    return sessions


async def terminate_orchestrator(orchestrator_id: str, reason: str, starter: str) -> None:
    """
    Terminates the specified orchestrator, providing the specified reason.
    :param str orchestrator_id: The instance id of the orchestrator.
    :param str reason: The reason for terminating this orchestrator.
    :param str starter: The context.
    """
    client = df.DurableOrchestrationClient(starter)
    try:
        await client.terminate(orchestrator_id, reason)
        logging.info(f"orchestrator termination successful, id={orchestrator_id}, reason={reason}")
    except Exception as ex:
        #  This may happen if the session is stopped after a completed orchestrator has already been automatically removed by the Azure DF system.
        logging.warning(f"orchestrator termination failed with an unexpected status code, id={orchestrator_id}, exception=\n{repr(ex)}")
