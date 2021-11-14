/* eslint-disable no-console */
const ws = require('ws');
const http = require('http');
const hl = require('highland');
const R = require('ramda');

const ports = {
  chargers: 3100,
  widgets: 3200,
};
const connections = {
  c1234: 'wABCD',
};
const servers = [];
const websockets = [];

R.values(ports).forEach((port) => {
  const server = http.createServer();
  server.listen(port);
  servers.push(server);

  const websocketServer = new ws.Server({ server });

  websocketServer.on('connection', (websocket, req) => {
    console.log('Connection established');
    const requester = req.url.split('/')[1];
    const id = req.url.split('/')[2];

    // Verify the requester is at the right address
    if (R.isNil(requester) || R.isNil(ports[requester]) || ports[requester] !== port) {
      console.error('Bad request', requester, port);
      websocket.terminate();
    }

    // Verify the device id is known
    if (R.isNil(id) || R.isNil(ports[requester]) || ports[requester] !== port) {
      console.error('Bad request', id, port);
      websocket.terminate();
    }

    hl('message', websocket)
    // Security that ensures that only one data event is push downstream
    // (or into the buffer) every ms milliseconds, other values are dropped.
      .throttle(1000)

      .tap((message) => console.log('received: %s', message))

    // verify sender is a charger

    // parse incoming message
      .map((message) => JSON.parse(message.toString()))

    // verify message format
      .reject((parsed) => parsed?.event !== 'StateOfCharge'
        || parsed?.data?.soc === undefined)

    // define status
      .map((parsed) => {
        if (parsed.data.soc === 100) {
          return 'charged';
        } if (parsed.data.soc >= 80) {
          return 'charging80';
        }
        return 'charging';
      })

    // create message to be sent
      .map((status) => ({
        event: 'chargingStatus',
        data: {
          status,
        },
      }))

    // fetch clients
    // send message to each client
    ;

    // websocket.on('message', (message) => {
    //   websockets[1].clients.forEach((widget) => widget.send(JSON.stringify(newMessage)));
    // });

    websocket.on('close', () => {
      console.log('Connection stopped');
    });
  });

  hl('error', websocketServer)
    .forEach((err) => console.error('Error happened', err));

  websockets.push(websocketServer);
});
