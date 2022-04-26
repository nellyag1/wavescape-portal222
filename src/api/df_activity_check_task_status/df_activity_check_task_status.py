# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import logging
import requests

from ..shared_code.utilities import deserialize, get_environment_variable, serialize


def main(payload: str) -> bool:
    """
    Call the appropriate batch 'status' API to determine whether or not the specified batch task is completed.
    NOTE: Activity functions must always return something.
    :param str payload: serialized dictionary of parameters
    :returns bool: whether or not to check again later: True if API call failed with 404 or the task is not completed, False otherwise
    """
    # Extract the parameters
    input_dict = deserialize(payload)
    activity_name: str = input_dict["activity_name"]
    batch_task_id: str = input_dict["batch_task_id"]

    # Call the batch API to retrieve the status of the batch task
    api_url = get_environment_variable("WAVESCAPE_RUNNER_API_URL")  # e.g. "https://{FUNCTION_APP}.azurewebsites.net/api
    api_key = get_environment_variable("WAVESCAPE_RUNNER_API_KEY")
    api_call = f"{activity_name.lower()}/status/{batch_task_id}"
    url = f"{api_url}/{api_call}?code={api_key}"

    response = requests.get(url)

    # Process the response
    execution_info: str = ""
    check_again: bool = True
    if (response.status_code != requests.codes.ok):
        logging.error(f"Failed to get Azure batch task status. API={url}, status={response.status_code}, reason={response.reason}")
        check_again = False

        # Special handling:
        if (response.status_code == 404):
            # 404 = Not Found; the requested resource could not be found but may be available in the future. Subsequent requests are permissible.
            check_again = True
        # The status API should return a 410 (Gone) for when the task no longer exists, meaning we will not check again.
    else:
        state = (deserialize(response.content)['state'])["_value_"]
        if (state == "completed"):
            execution_info = serialize(deserialize(response.content)['execution_info'])
            logging.info(f"Azure batch activity={activity_name} task={batch_task_id} completed, result={execution_info}")
            check_again = False
        else:
            logging.info(f"Azure batch activity={activity_name} task={batch_task_id} not yet completed, state={state}")

    return {"check_again": check_again, "execution_info": execution_info}
