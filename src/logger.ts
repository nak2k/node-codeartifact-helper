import { green } from 'chalk';

export function createLogger(options: { dryRun: boolean }) {
  const {
    dryRun,
  } = options;

  return {
    info(msg: string) {
      if (dryRun) {
        console.info(`[${green('Skip')}] ${msg}`);
      } else {
        console.info(msg);
      }
    }
  };
}
