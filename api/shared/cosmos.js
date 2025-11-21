import { CosmosClient } from '@azure/cosmos';

let cachedClient;

function getEnv(name) {
  return process.env[name];
}

export function getCosmosContainer() {
  const endpoint = getEnv('COSMOS_ENDPOINT');
  const key = getEnv('COSMOS_KEY');
  const databaseId = getEnv('COSMOS_DATABASE');
  const containerId = getEnv('COSMOS_CONTAINER');

  if (!endpoint || !key || !databaseId || !containerId) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new CosmosClient({ endpoint, key });
  }

  return cachedClient.database(databaseId).container(containerId);
}
