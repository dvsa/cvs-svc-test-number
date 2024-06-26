/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-next-line import/no-import-module-exports
import { exec } from 'child_process';

// We hook to serverless offline when firing its process
const SERVER_OK = 'http://localhost:3008';
// Serverless fires a local dynamo-db instance which is killed once the parent process is terminated
// the current serverless script checks whether a local instance is running but does not error when binding fails
// we force throwing an error so we always start from a clean slate if java.io.IOException: Failed to bind to 0.0.0.0/0.0.0.0:8006
const DYNAMO_LOCAL_ERROR_THREAD = 'Exception in thread "main"';

// eslint-disable-next-line arrow-body-style
const setupServer = (process: any) => {
  return new Promise((resolve) => {
    process.stdout.setEncoding('utf-8').on('data', (stream: any) => {
      console.log('stdout', stream);
      if (stream.includes(SERVER_OK)) {
        resolve(process);
      }
    });

    process.stderr.setEncoding('utf-8').on('data', (stream: any) => {
      console.log('stderr', stream);
      if (stream.includes(DYNAMO_LOCAL_ERROR_THREAD)) {
        throw new Error('Internal Java process crashed');
      } else if (stream.includes(SERVER_OK)) {
        resolve(process);
      }
    });

    process.on('exit', (code: any, signal: any) => {
      if (code !== 137) {
        console.info(`process terminated with code: ${code} and signal: ${signal}`);
      }
    });
  });
};

const server = exec('npm run start &', (error) => {
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
    console.error(`error starting server: ${error}`);
  }
});

module.exports = async () => {
  console.log('\nSetting up Integration tests...\n\n');
  try {
    const instance = await setupServer(server);
    // @ts-ignore
    const { pid } = instance;
    console.info(`
    start script running ✅ ...
    on pid: ${pid}
    `);
  } catch (e) {
    console.error('Something wrong happened:\n');
    console.error(e);
    process.exit(1);
  }
};
