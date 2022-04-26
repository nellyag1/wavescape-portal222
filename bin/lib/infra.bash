#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | lib/infra.bash
# | Helpers to interact with Azure infrastructure
# +----------------------------------------------------------------------------

function outputLookup {
    name=$1;
    az deployment group show \
        --name $AZURE_DEFAULTS_GROUP \
        --query "properties.outputs.${name}.value" -otsv
}

function updateApiConfig {
    fnApp=$1; key=$2; val=$3;
    info "Updating $fnApp config: $key = $val"
    az functionapp config appsettings set --name $fnApp --settings "$key=$val" 1>/dev/null
}