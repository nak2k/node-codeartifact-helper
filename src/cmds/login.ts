import { Argv } from 'yargs';
import { CodeartifactClient, GetAuthorizationTokenCommand, ListRepositoriesCommand } from "@aws-sdk/client-codeartifact";
import { addProxyToClient } from 'aws-sdk-v3-proxy';
import { exitOnError } from '../exitOnError';
import { createLogger } from '../logger';
import { execSync } from "child_process";

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

  const codeartifact = addProxyToClient(new CodeartifactClient({}), { throwOnNoProxy: false });

  const listRepositoriesResult = await codeartifact.send(new ListRepositoriesCommand({}));
  if (!listRepositoriesResult.repositories) {
    return;
  }

  const tokens: { [domain: string]: string } = {};

  async function getToken(domain: string) {
    if (tokens[domain]) {
      return tokens[domain];
    }

    const { authorizationToken } = await codeartifact.send(new GetAuthorizationTokenCommand({
      domain,
    }));

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
    const region = await codeartifact.config.region();

    const path = `//${domainName}-${domainOwner}.d.codeartifact.${region}.amazonaws.com/npm/${name}/`;

    const registryKey = `@${name}:registry`;
    const registryValue = `https:${path}`;
    const authTokenKey = `${path}:_authToken`;
    const authTokenValue = `${token}`;

    const command = `npm config set ${registryKey}=${registryValue} ${authTokenKey}=*****`;
    logger.info(command);
    dryRun || execSync(command.replace("*****", authTokenValue));
  }
}
