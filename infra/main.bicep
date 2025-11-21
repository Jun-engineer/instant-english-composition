param location string = 'japaneast'
@allowed([
  'centralus'
  'eastasia'
  'eastus2'
  'westeurope'
  'westus2'
])
param staticSiteLocation string = 'eastasia'
param repositoryUrl string = ''
param repositoryBranch string = 'main'
param namePrefix string = 'iec'
param environment string = 'dev'

var uniqueSuffix = toLower(uniqueString(resourceGroup().id, namePrefix, environment))
var staticSiteName = toLower('${namePrefix}${environment}${uniqueSuffix}')
var storageAccountName = toLower(replace('${namePrefix}${environment}${uniqueSuffix}', '-', ''))
var cosmosAccountName = toLower('${namePrefix}-${environment}-${uniqueSuffix}')
var keyVaultName = toLower('${namePrefix}-kv-${environment}-${uniqueSuffix}')
var functionAppName = toLower('${namePrefix}-func-${environment}-${uniqueSuffix}')
var functionPlanName = toLower('${namePrefix}-plan-${environment}')

var staticSiteBaseProperties = {
  buildProperties: {
    appLocation: '/'
    apiLocation: '/api'
    outputLocation: 'out'
  }
  enterpriseGradeCdnStatus: 'Disabled'
}

var staticSiteRepoProperties = empty(repositoryUrl) ? {} : {
  repositoryUrl: repositoryUrl
  branch: repositoryBranch
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource functionPlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: functionPlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    maximumElasticWorkerCount: 1
  }
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    reserved: false
    serverFarmId: functionPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
      http20Enabled: true
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
}

resource staticSite 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticSiteName
  location: staticSiteLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: union(staticSiteBaseProperties, staticSiteRepoProperties)
}

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: true
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    disableKeyBasedMetadataWriteAccess: true
    publicNetworkAccess: 'Enabled'
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  name: 'iec'
  parent: cosmosAccount
  properties: {
    resource: {
      id: 'iec'
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  name: 'cards'
  parent: cosmosDatabase
  properties: {
    resource: {
      id: 'cards'
      partitionKey: {
        paths: [
          '/cefrLevel'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
    options: {}
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    accessPolicies: []
    enabledForTemplateDeployment: true
    enabledForDeployment: true
    enableRbacAuthorization: true
    publicNetworkAccess: 'Enabled'
  }
}

output staticSiteName string = staticSite.name
output functionAppHostname string = functionApp.properties.defaultHostName
output cosmosAccountEndpoint string = cosmosAccount.properties.documentEndpoint
