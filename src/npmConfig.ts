import type * as NPM from 'npm';

type NPMStatic = typeof NPM;
type NPMConfig = typeof NPM.config;

const npm = require('current-npm') as NPMStatic;

export async function npmLoad() {
  await new Promise<NPMConfig>((resolve, reject) => {
    npm.load((err, npmConf) => {
      if (err) {
        return reject(err);
      }

      resolve(npmConf);
    });
  });
}

export function npmConfigDelete(key: string) {
  return new Promise((resolve, reject) => {
    npm.commands.config(['delete', key], err => {
      err ? reject(err) : resolve();
    });
  });
}

export function npmConfigSet(key: string, value: string) {
  return new Promise((resolve, reject) => {
    npm.commands.config(['set', key, value], err => {
      err ? reject(err) : resolve();
    });
  });
}
