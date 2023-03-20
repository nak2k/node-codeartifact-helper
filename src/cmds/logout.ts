import { Argv } from 'yargs';
import { CodeartifactClient, ListRepositoriesCommand } from "@aws-sdk/client-codeartifact";
import { addProxyToClient } from 'aws-sdk-v3-proxy';
import { exitOnError } from '../exitOnError';
import { createLogger } from '../logger';
import { execSync } from "child_process";

export const command = 'logout';

export const desc = 'Remove configurations for CodeArtifact';

export const builder = (yargs: Argv) => {
};

export const handler = (argv: any) => {
  logout(argv).catch(exitOnError);
};

async function logout(options: { dryRun: boolean }) {
  const {
    dryRun,
  } = options;

  const logger = createLogger(options);

  const codeartifact = addProxyToClient(new CodeartifactClient({}), { throwOnNoProxy: false });

  const listRepositoriesResult = await codeartifact.send(new ListRepositoriesCommand({}));
  if (!listRepositoriesResult.repositories) {
    return;
  }

  for (const repo of listRepositoriesResult.repositories) {
    const { name, domainName, domainOwner } = repo;

    if (!name || !domainName || !domainOwner) {
      throw new Error('Invalid repository');
    }

    const region = await codeartifact.config.region();

    const path = `//${domainName}-${domainOwner}.d.codeartifact.${region}.amazonaws.com/npm/${name}/`;

    const registryKey = `@${name}:registry`;
    const alwaysAuthKey = `${path}:always-auth`;
    const authTokenKey = `${path}:_authToken`;

    const command = `npm config delete ${registryKey} ${alwaysAuthKey} ${authTokenKey}`;
    logger.info(command);
    dryRun || execSync(command);
  }
}
