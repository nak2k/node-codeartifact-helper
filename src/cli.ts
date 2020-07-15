import yargs = require('yargs');
import { exitOnError } from "./exitOnError";

async function main() {
  yargs
    .commandDir('cmds')
    .demandCommand()
    .options({
      verbose: {
        alias: 'v',
        describe: 'Verbose mode',
        type: 'boolean',
      },
      'dry-run': {
        type: 'boolean',
      },
    })
    .completion()
    .version()
    .help()
    .argv;
}

main().catch(exitOnError);
