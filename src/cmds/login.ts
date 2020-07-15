import { Argv } from 'yargs';
import { CodeArtifact } from 'aws-sdk';
import { exitOnError } from '../exitOnError';
import { createLogger } from '../logger';
import { npmLoad, npmConfigSet } from '../npmConfig';

export const command = 'login';

export const desc = 'Configure .npmrc for CodeArtifact';

export const builder = (yargs: Argv) => {
};

export const handler = (argv: any) => {
  login(argv).catch(exitOnError);
};

async function login(options: { dryRun: boolean }) {
  const {
    dryRun,
  } = options;

  const logger = createLogger(options);

  await npmLoad();

  const codeartifact = new CodeArtifact();

  const listRepositoriesResult = await codeartifact.listRepositories().promise();
  if (!listRepositoriesResult.repositories) {
    return;
  }

  const tokens: { [domain: string]: string } = {};

  async function getToken(domain: string) {
    if (tokens[domain]) {
      return tokens[domain];
    }

    const { authorizationToken } = await codeartifact.getAuthorizationToken({
      domain
    }).promise();

    if (!authorizationToken) {
      throw new Error('getAuthorizationToken() failed');
    }

    return tokens[domain] = authorizationToken;
  }

  for (const repo of listRepositoriesResult.repositories) {
    const { name, domainName, domainOwner } = repo;

    if (!name || !domainName || !domainOwner) {
      throw new Error('Invalid repository');
    }

    const token = await getToken(domainName);
    const region = codeartifact.config.region;

    const path = `//${domainName}-${domainOwner}.d.codeartifact.${region}.amazonaws.com/npm/${name}/`;

    const registryKey = `@${name}:registry`;
    const registryValue = `https:${path}`;
    const alwaysAuthKey = `${path}:always-auth`;
    const alwaysAuthValue = `true`;
    const authTokenKey = `${path}:_authToken`;
    const authTokenValue = `${token}`;

    logger.info(`npm config set ${registryKey} ${registryValue}`);
    dryRun || await npmConfigSet(registryKey, registryValue);

    logger.info(`npm config set ${alwaysAuthKey} ${alwaysAuthValue}`);
    dryRun || await npmConfigSet(alwaysAuthKey, alwaysAuthValue);

    logger.info(`npm config set ${authTokenKey} *****`);
    dryRun || await npmConfigSet(authTokenKey, authTokenValue);
  }
}
