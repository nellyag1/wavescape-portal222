# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import datetime
import uuid
import random

from flask import Flask, request, Response

# Flask cant handle/import relative paths, so be explicit
from src.api.shared_code.utilities import get_environment_variable, to_json


app = Flask(__name__)


@app.route("/api/wavescape/start", methods=['POST'])
@app.route("/api/validation/start", methods=['POST'])
@app.route("/api/nearmap/start", methods=['POST'])
def activity_start():
    app.logger.info(f"{request.url_rule} body =\n{to_json(request.json)}")
    return Response(uuid.uuid4().hex, status=202)
    # return Response("error", status=500, mimetype='application/json')  # Keep for debugging


@app.route("/api/wavescape/status/<task_id>")
@app.route("/api/validation/status/<task_id>")
@app.route("/api/nearmap/status/<task_id>")
def activity_status(task_id):
    completed_chance = get_environment_variable("WAVESCAPE_RUNNER_MOCK_TASK_COMPLETED_CHANCE")
    COMPLETED_CHANCE = completed_chance if completed_chance is not None else 0.25

    failure_chance = get_environment_variable("WAVESCAPE_RUNNER_MOCK_TASK_FAILURE_CHANCE")
    FAILURE_CHANCE = failure_chance if failure_chance is not None else 0.10

    execution_info_success = {
        "additional_properties": {},
        "start_time": None,
        "end_time": datetime.datetime.utcnow().isoformat(),
        "exit_code": 0,
        "container_info": None,
        "failure_info": None,
        "retry_count": 0,
        "last_retry_time": None,
        "requeue_count": 0,
        "last_requeue_time": None,
        "result": {
            "_value_": "success",
            "_name_": "success",
            "__objclass__": {}
        }
    }

    execution_info_failure = {
        "additional_properties": {},
        "start_time": None,
        "end_time": datetime.datetime.utcnow().isoformat(),
        "exit_code": None,
        "container_info": None,
        "failure_info": {
            "additional_properties": {},
            "category": {
                "_value_": "usererror",
                "_name_": "user_error",
                "__objclass__": {}
            },
            "code": "TaskEnded",
            "message": "Task Was Ended by User Request",
            "details": None,
        },
        "retry_count": 0,
        "last_retry_time": None,
        "requeue_count": 0,
        "last_requeue_time": None,
        "result": {
            "_value_": "failure",
            "_name_": "failure",
            "__objclass__": {}
        }
    }

    # Flask automatically converts dictionaries to JSON response
    if (random.random() <= COMPLETED_CHANCE):
        return {
            "state": {"_value_": "completed"},
            "execution_info": execution_info_failure if (random.random() <= FAILURE_CHANCE) else execution_info_success
        }
    else:
        return {
            "state": {"_value_": "running"},
            "execution_info": ""
        }


@app.route("/api/wavescape/stop", methods=['POST'])
@app.route("/api/validation/stop", methods=['POST'])
@app.route("/api/nearmap/stop", methods=['POST'])
def activity_stop():
    return ""
