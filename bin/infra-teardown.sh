#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | infra-teardown.sh
# | Teardown azure infrastructure
# +----------------------------------------------------------------------------
cd $(dirname $0)/..
set -e
source ./bin/lib/helpers.bash

azLogin

# delete resource group if it exists
if $(az group exists); then 
    info "Deleting resource group '$AZURE_DEFAULTS_GROUP'"
    az group delete #--name $AZURE_DEFAULTS_GROUP
    az group wait --deleted
fi