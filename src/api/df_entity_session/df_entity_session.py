# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# +----------------------------------------------------------------------------

import azure.durable_functions as df


def entity_function(context: df.DurableEntityContext):
    operation = context.operation_name
    if operation == "save":
        current_value = context.get_input()
        context.set_state(current_value)
    elif operation == "get":
        current_value = context.get_state(lambda: 0)
        context.set_result(current_value)


main = df.Entity.create(entity_function)
