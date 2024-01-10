// eslint-disable-next-line import/no-import-module-exports
import http from 'http';

const serverPort = 3008; // Replace with your server port
const timeout = 60000; // Timeout in milliseconds, adjust as needed

const checkServer = (): Promise<void> => new Promise((resolve, reject) => {
  const request = http.get(`http://localhost:${serverPort}/`, (res) => {
    if (res.statusCode) {
      resolve();
    } else {
      reject(new Error('Server responded, but no status code.'));
    }
  });

  request.on('error', (err) => {
    reject(new Error(`Server did not respond. Err: ${err.message}`));
  });

  request.end();
});

const pollServer = async () => {
  const startDate = new Date();
  const startTime = Date.now();

  console.log('Starting poll of server', startDate);

  // eslint-disable-next-line consistent-return
  const poll = async (): Promise<void> => {
    try {
      await checkServer();
      console.log('Server is ready');
    } catch (error) {
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime < timeout) {
        await new Promise((resolve) => { setTimeout(resolve, 1000); }); // Wait for 1 second
        return poll();
      }
      throw new Error(`SLS server did not respond within ${timeout / 1000} seconds`);
    }
  };

  await poll();
};

module.exports = async () => {
  try {
    await pollServer();
  } catch (err) {
    console.error('Something wrong happened:\n');
    console.error(err);
    process.exit(1);
  }
};
