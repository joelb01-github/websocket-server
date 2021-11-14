const ws = require('ws');
const R = require('ramda');

module.exports = defineWebsocketServer;

function defineWebsocketServer(websockets, server, ports, port) {
  const websocketServer = new ws.Server({ server });

  websocketServer.on('connection', (websocket, req) => {
    console.log('Connection established with: %s', req.url);

    // Verify the requester is at the right address
    const requester = req.url.split('/')[1];
    if (R.isNil(requester) || R.isNil(ports[requester]) || ports[requester] !== port) {
      console.error('Bad request', requester, port);
      websocket.terminate();
    }

    websocket.on('message', (message) => {
      console.log('received: %s', message);

      // TODO: verify sender is a charger

      const parsed = JSON.parse(message.toString());

      // verify message format
      if (parsed?.event !== 'StateOfCharge'
    || parsed?.data?.soc === undefined) {
        console.log('Wrong message format', message);
      }

      let status;

      if (parsed.data.soc === 100) {
        status = 'charged';
      } else if (parsed.data.soc >= 80) {
        status = 'charging80';
      } else {
        status = 'charging';
      }

      const newMessage = {
        event: 'chargingStatus',
        data: {
          status,
        },
      };

      websockets[1].clients.forEach((widget) => widget.send(JSON.stringify(newMessage)));
    });

    websocket.on('close', () => {
      console.log('Connection stopped');
    });
  });

  websocketServer.on('error', (err) => {
    console.error('Error happened', err);
  });

  return websocketServer;
}
