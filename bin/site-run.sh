#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | site-run.sh
# | Runs react with additional setup steps
# +----------------------------------------------------------------------------
set -e
cd $(dirname $0)/..
source ./bin/lib/helpers.bash
source ./bin/lib/infra.bash

azLogin

## If default azure group does not exist (ie no infra stood-up) then default to the staging environment
if ! $(az group show &>/dev/null); then
    export AZURE_DEFAULTS_GROUP=ws-portal-staging
fi

appInsightsConn=$(outputLookup appInsightsConnString)
export REACT_APP_APPLICATION_INSIGHTS_CONNECTION_STRING=$appInsightsConn
cd src/portal
npm run start