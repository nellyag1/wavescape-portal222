/*
 +----------------------------------------------------------------------------
 | Copyright (c) 2022 Pivotal Commware
 | All rights reserved.
 | 
 | api.bicep
 | All functionapp resources
 +----------------------------------------------------------------------------
*/

param apiName string
param storageAccountName string
param runnerResourceGroupName string
param appInsightsName string
param location string = resourceGroup().location

var functionAppName = '${apiName}-functionApp'
var hostingPlanName = '${apiName}-hostingPlan'

var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'


resource storageAccount 'Microsoft.Storage/storageAccounts@2021-06-01' existing = {
  name: storageAccountName
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: appInsightsName
}

resource hostingPlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: hostingPlanName
  location: location
  kind: 'functionapp,linux'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
    size: 'Y1'
    family: 'Y'
    capacity: 0
  }
  properties: {
    reserved: true
  }
}

resource runnerApi 'Microsoft.Web/sites@2021-02-01' existing = {
  name: '${runnerResourceGroupName}-api-functionApp'
  scope: resourceGroup(runnerResourceGroupName)
}

resource functionApp 'Microsoft.Web/sites@2021-02-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    httpsOnly: true
    serverFarmId: hostingPlan.id
    reserved: true
    clientAffinityEnabled: true
    siteConfig: {
      numberOfWorkers: 1
      linuxFxVersion: 'PYTHON|3.9'
      appSettings: [
        {
          'name': 'APPINSIGHTS_INSTRUMENTATIONKEY'
          'value': appInsights.properties.InstrumentationKey
        }
        {
          name: 'AzureWebJobsStorage'
          value: storageConnectionString
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: storageConnectionString
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'WAVESCAPE_RUNNER_API_URL'
          value: 'https://${runnerApi.properties.hostNames[0]}/api'
        }
        {
          name: 'WAVESCAPE_RUNNER_API_KEY'
          value: listkeys('${runnerApi.id}/host/default', '2016-08-01').functionKeys.default
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'STORAGE_ACCOUNT_KEY'
          value: storageAccount.listKeys().keys[0].value
        }
        {
          name: 'AZURE_SUBSCRIPTION_ID'
          value: split(subscription().id, '/')[2]
        }
        {
          name: 'STORAGE_ACCOUNT_RESOURCE_GROUP_NAME'
          value: resourceGroup().name
        }
      ]
    }
  }
}

output functionAppName string = functionAppName
