# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import os
import jsonpickle
from typing import Optional


def is_none_or_whitespace(input: str) -> bool:
    """
    Determines if the input string is empty or not.
    :param str input: The string to check
    :returns bool: True if the input string is None, Empty, or all whitespace characters, False otherwise
    """
    return not (input and input.strip())


def to_json(input: object, pretty=True) -> str:
    """
    Converts the provided Python object into a pretty JSON string using 'jsonpickle'.
    :param object input: The Python object to convert
    :param bool pretty: Whether or not to pretty-print the result with indentation of 4 spaces
    :returns str: The JSON string representation of the Python object
    """
    indent_level = 4 if pretty else None
    return jsonpickle.encode(input, indent=indent_level, unpicklable=False)


def serialize(input: object) -> str:
    """
    Converts the provided Python object into a decodeable JSON string using 'jsonpickle'.
    :param object input: The Python object to convert
    :returns str: The decodeable JSON string representation of the Python object
    """
    return jsonpickle.encode(input)


def deserialize(input: str) -> object:
    """
    Converts the provided JSON string into a Python object using 'jsonpickle'.
    :param str input: The decodeable JSON string representation of the Python object
    :returns object: The Python object
    """
    return jsonpickle.decode(input)


def get_environment_variable(name) -> Optional[str]:
    """
    Returns the value of the specified environment variable.
    Returns None if the value of the environment variable is None or whitespace.
    :param str name: The name of the environment variable.
    :returns: The value of the environment variable or None.
    """
    value = os.environ.get(name)
    if (is_none_or_whitespace(value)):
        return None
    return value


def str_to_bool(value: str) -> bool:
    """
    Converts the specified string its Boolean equivalent.
    :param str value: the string to convert
    :returns bool: True if the parameter represents affirmative, False otherwise
    """
    return str(value).lower() in ("true", "yes", "y", "t", "1")
