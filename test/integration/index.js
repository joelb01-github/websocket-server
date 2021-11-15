/* eslint-disable no-new */
/* eslint-disable import/no-extraneous-dependencies */

const { assert } = require('chai');
const Websocket = require('ws');
const appConfig = require('../../config/config');

const { host, ports } = appConfig.get('server');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connect = async (url) => new Promise((resolve, reject) => {
  const ws = new Websocket(url);

  ws.on('open', () => {
    resolve(ws);
  });

  ws.on('close', () => {
    process.exit();
  });

  ws.on('error', () => reject(new Error('error-connecting-to-server')));
});

const baseUrl = `ws://${host}`;

describe('Server', () => {
  describe('Connections', () => {
    it('should not connect if the port is not correct.', async () => {
      const port = 1111;
      const id = 'c1234';

      const url = `${baseUrl}:${port}/chargers/${id}`;

      const socket = new Websocket(url);

      socket.on('error', (error) => {
        assert.equal(error.message, `connect ECONNREFUSED 127.0.0.1:${port}`);
      });
      socket.on('open', () => {
        assert.fail();
      });
    });

    it('should not connect if the url is not correct.', async () => {
      const port = ports.chargers;
      const id = 'c1234';

      const url = `not_the_good_url:${port}/chargers/${id}`;

      try {
        new Websocket(url);
      } catch (error) {
        assert.equal(error.message, `Invalid URL: ${url}`);
      }
    });

    it('should close the connection if the charger is not stored in the DB.', (done) => {
      const port = ports.chargers;
      const id = 'c0000';

      const url = `${baseUrl}:${port}/chargers/${id}`;

      const socket = new Websocket(url);

      socket.on('error', () => {
        assert.fail();
      });
      socket.on('open', () => {
      });
      socket.on('close', () => {
        done();
      });
    });

    it('should properly connect if the information are correct.', (done) => {
      const port = ports.chargers;
      const id = 'c1234';

      const url = `${baseUrl}:${port}/chargers/${id}`;

      const socket = new Websocket(url);

      socket.on('error', () => {
        assert.fail();
      });
      socket.on('open', () => {
        done();
      });
      socket.on('close', () => {
        assert.fail();
      });
    });
  });

  describe('Messaging', () => {
    let chargerSocket;
    let widgetSocket;

    before(async () => {
      const chargerUrl = `${baseUrl}:${ports.chargers}/chargers/c1234`;
      const widgetUrl = `${baseUrl}:${ports.widgets}/widgets/wABCD`;

      [
        chargerSocket,
        widgetSocket,
      ] = await Promise.all([
        connect(chargerUrl),
        connect(widgetUrl),
      ]);

      await sleep(1000);
    });

    it('should send the correct message to the widget when receiving from charger.', (done) => {
      const socMessage = JSON.stringify({
        event: 'StateOfCharge',
        data: {
          soc: 100,
        },
      });

      widgetSocket.on('message', (message) => {
        const parsed = JSON.parse(message.toString());
        assert.equal(parsed.data.status, 'charged');
        done();
      });

      chargerSocket.send(socMessage);
    });

    // Additional tests to be added
    // - tests all the verifications existing on server-side e.g.
    //    > message format is wrong,
    //    > id is not registeed,
    // - test the throttling
    // - test the case there are no counterparts stored in the DB
    // ...
  });
});
