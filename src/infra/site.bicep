/*
 +----------------------------------------------------------------------------
 | Copyright (c) 2022 Pivotal Commware
 | All rights reserved.
 | 
 | site.bicep
 | All staticwebapp resources
 +----------------------------------------------------------------------------
*/

param appName string
param functionAppName string
param repoUrl string
param branch string
param location string = resourceGroup().location

resource functionApp 'Microsoft.Web/sites@2021-02-01' existing = {
  name: functionAppName
}

resource staticWebApp 'Microsoft.Web/staticSites@2020-12-01' = {
  name: appName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    //provider: 'DevOps'  // NOTE ignore warning, property is required
    repositoryUrl: repoUrl
    branch: branch
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

output staticAppName string = staticWebApp.name
