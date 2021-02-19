import { Argv } from 'yargs';
import { CodeArtifact } from 'aws-sdk';
import proxy from 'proxy-agent';
import { exitOnError } from '../exitOnError';
import { createLogger } from '../logger';
import { npmLoad, npmConfigDelete } from '../npmConfig';

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

  await npmLoad();

  const codeartifact = new CodeArtifact({
    httpOptions: {
      agent: proxy(),
    },
  });

  const listRepositoriesResult = await codeartifact.listRepositories().promise();
  if (!listRepositoriesResult.repositories) {
    return;
  }

  for (const repo of listRepositoriesResult.repositories) {
    const { name, domainName, domainOwner } = repo;

    if (!name || !domainName || !domainOwner) {
      throw new Error('Invalid repository');
    }

    const region = codeartifact.config.region;

    const path = `//${domainName}-${domainOwner}.d.codeartifact.${region}.amazonaws.com/npm/${name}/`;

    const registryKey = `@${name}:registry`;
    const alwaysAuthKey = `${path}:always-auth`;
    const authTokenKey = `${path}:_authToken`;

    logger.info(`npm config delete ${registryKey}`);
    dryRun || await npmConfigDelete(registryKey);

    logger.info(`npm config delete ${alwaysAuthKey}`);
    dryRun || await npmConfigDelete(alwaysAuthKey);

    logger.info(`npm config delete ${authTokenKey}`);
    dryRun || await npmConfigDelete(authTokenKey);
  }
}
