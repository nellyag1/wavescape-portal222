/*
 +----------------------------------------------------------------------------
 | Copyright (c) 2022 Pivotal Commware
 | All rights reserved.
 | 
 | main.bicep
 | Main entry for IAC, contains common resources
 +----------------------------------------------------------------------------
*/

@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentType string = 'dev'
param runnerResourceGroupName string
param repoUrl string
param branch string
param location string = resourceGroup().location

var environSlug = environmentType == 'staging' ? 'stag' : environmentType
var prefix = 'wsp${environSlug}${uniqueString(resourceGroup().id)}'

var accountName = prefix
var storageAccountName = accountName
var appInsightsName = '${deployment().name}-appInsights'

/////////////////////
//   Base Resources
/////////////////////
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-06-01' = {
  name: storageAccountName
  kind:  'StorageV2'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2021-06-01' = {
  name: 'default'
  parent: storageAccount
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2021-06-01' = {
  name: 'default'
  parent: storageAccount
}


resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: { 
    Application_Type: 'web'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
  //tags: {
  //  // circular dependency means we can't reference functionApp directly  /subscriptions/<subscriptionId>/resourceGroups/<rg-name>/providers/Microsoft.Web/sites/<appName>"
  //   'hidden-link:/subscriptions/${subscription().id}/resourceGroups/${resourceGroup().name}/providers/Microsoft.Web/sites/${functionAppName}': 'Resource'
  //}
}


/////////////////////
//   Modules
/////////////////////
module api 'api.bicep' = {
  name: '${deployment().name}-api'
  params: {
    runnerResourceGroupName: runnerResourceGroupName
    storageAccountName: storageAccount.name
    appInsightsName: appInsights.name
    apiName: '${deployment().name}-api'
    location: location
  }
}

module site 'site.bicep' = {
  name: '${deployment().name}-site'
  params: {
    appName: '${deployment().name}-site'
    functionAppName: api.outputs.functionAppName
    repoUrl: repoUrl
    branch: branch
    location: location
  }
}

output functionAppName string = api.outputs.functionAppName
output staticAppName string = site.outputs.staticAppName
output appInsightsConnString string = appInsights.properties.ConnectionString
