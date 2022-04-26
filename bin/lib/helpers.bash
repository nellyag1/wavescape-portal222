#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | lib/helpers.bash
# | Functions which are used throughout other shell scripts
# +----------------------------------------------------------------------------

## logging helpers, error will also exit
## usage: 
##    info ...
##   error ....
function info { >&1 echo "$@"; }
function error { >&2 echo "$@"; exit 1; }


## ADO pipeline variable output
## usage:  vsoOutput myVariable "randomValue"
function vsoOutput {
    key=$1
    val=$2

    # only output if we are running on an ADO agent
    if [ ! -z "${AGENT_WORKFOLDER}" ]; then
        echo "##vso[task.setvariable variable=$key;isOutput=true;]$val" # remember to use double quotes
    fi
    info "$key:  $val"
}


## AZ Cli login helper, will not relogin
## usage: azLogin
function azLogin {
    if ! $(az account show &> /dev/null); then
        info "logging into azure"
        az login --use-device-code
    
        if [ ! -z "$AZURE_SUBSCRIPTION" ]; then
            az account set --subscription $AZURE_SUBSCRIPTION
        fi
    fi
}