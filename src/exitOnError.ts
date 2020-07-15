import chalk = require('chalk');

export function exitOnError(err: Error | null) {
  if (err) {
    showError(err);
    process.exit(1);
  }
}

function showError(err: Error) {
  console.error(`[${chalk.red('ERROR')}] ${err.message}`);

  if (process.env.DEBUG) {
    console.error();
    console.error(err);
  }
}
