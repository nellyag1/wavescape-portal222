#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | api-deploy.sh
# | Deploys build artifact to function app (ADO and local)
# +----------------------------------------------------------------------------
set -e
cd $(dirname $0)/..
source ./bin/lib/helpers.bash
source ./bin/lib/infra.bash

azLogin

functionAppName=$(outputLookup functionAppName)

package=$1
if [ -z "$package" ]; then
    package=$(pwd)/src/api/api.zip
fi

info "Deploying $package to $functionAppName"
az functionapp deployment source config-zip \
    -n $functionAppName \
    --src "$package"