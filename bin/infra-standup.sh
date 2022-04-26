#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | infra-standup.sh
# | standup azure infrastructure
# +----------------------------------------------------------------------------
cd $(dirname $0)/..
set -e
source ./bin/lib/helpers.bash
source ./bin/lib/infra.bash

azLogin

template=src/infra/main.bicep
deploymentName=$AZURE_DEFAULTS_GROUP
environmentType=${ENVIRONMENT_TYPE:-dev}
repoUrl=${GIT_REPO_URL:-"https://example.com/project.git"}
branch=${GIT_BRANCH_NAME:-"undefined"}

## create resource group if missing
info "Resource Group: $AZURE_DEFAULTS_GROUP"
if ! $(az group exists); then 
    az group create --name $AZURE_DEFAULTS_GROUP --location $AZURE_DEFAULTS_LOCATION
    az group wait --created
fi

## deploy infrastructure
info "Deploying bicep templates..."
info "repourl ..... $repoUrl" 
az deployment group create \
    --name $deploymentName \
    --template-file $template \
    --parameters \
        environmentType="$environmentType" \
        runnerResourceGroupName="$WS_RUNNER_GROUP" \
        repoUrl="$repoUrl" \
        branch="$branch"

if ! $(az deployment group wait --created --name $deploymentName); then
    info "Main Error:"
    az deployment group show -n ${deployentName} | jq
    info "Batch Error:"
    az deployment group show -n ${deployentName}-batch | jq
    info "API Error:"
    az deployment group show -n ${deployentName}-api | jq
    error "Deployment had errors, see above"
fi


info "Collect and show outputs"
az deployment group show --name $deploymentName --query 'properties.outputs' |
jq -r 'to_entries | .[] | [.key, .value.value] |@tsv' |
while IFS=$'\t' read -r key val; do
    vsoOutput $key $val
done

## connect authentication
functionAppName=$(outputLookup functionAppName)
staticAppName=$(outputLookup staticAppName)

functionAppId=$(az functionapp show --name $functionAppName --query 'id' -o tsv)
connections=$(az staticwebapp functions show -n $staticAppName)

if [ "$connections" == "[]" ]; then
    info "Connecting function app to static web app"
    az staticwebapp functions link \
        --name $staticAppName \
        --function-resource-id $functionAppId
fi


info "looking up deployment token"
token=$(az staticwebapp secrets list --name $staticAppName --query 'properties.apiKey' -otsv)
vsoOutput deploymentToken $token