/* eslint-disable no-console */
const ws = require('ws');
const http = require('http');
const hl = require('highland');
const R = require('ramda');

const appConfig = require('../config/config');
const Db = require('../database/index');

const { ports } = appConfig.get('server');
const servers = [];
const websockets = {};

// TODO: replace by DB
const connections = {
  c1234: 'wABCD',
};

const dbMain = Db(appConfig.get('db_main'));

R.values(ports).forEach((port) => {
  const server = http.createServer();
  server.listen(port);
  servers.push(server);

  const websocketServer = new ws.Server({ server });

  websocketServer.on('connection', async (websocket, req) => {
    console.log('Connection established');

    const id = await verifyConnection(websocket, req, port);

    // storing websocket
    websockets[id] = websocket;
    console.log('websockets length', R.keys(websockets).length);

    hl('message', websocket)
      // Performance measure, ensures only one data event is push downstream
      // (or into the buffer) every ms milliseconds, other values are dropped.
      .throttle(1000)
      .map(parseIncomingMessage)
      .filter(verifyMessageContent)
      .tap((message) => console.log('received valid message: %s', message))
      .map(defineChargingStatus)
      .map(createMessage)
      .map(fetchWidgetCounterpart(id))
      .filter(verifyWidgetIsConnected)
      // error management; actions can be added here
      .errors((err) => console.error('error', err))
      .each(sendMessage);

    hl('close', websocket)
      .each(() => {
        console.log('Connection stopped');
        // removing websocket
        R.dissoc(id, websockets);
        console.log('websockets length', R.keys(websockets).length);
      });
  });

  hl('error', websocketServer)
    .each((err) => console.error('Error happened', err));
});

/**
 * Function to verify that the connection is legitimate.
 * Terminates websocket connection if verification fails
 */
async function verifyConnection(websocket, req, port) {
  const requester = req.url.split('/')[1];
  const id = req.url.split('/')[2];

  verifyRequestAddress(websocket, requester, port);
  await verifyDeviceIdIsRegistered(websocket, id, requester, port);

  return id;
}

// there should be some verification here on message format
function parseIncomingMessage(message) {
  return JSON.parse(message.toString());
}

function verifyMessageContent(parsed) {
  return parsed?.event === 'StateOfCharge'
  && parsed?.data?.soc !== undefined;
}

// Different status could be taken from either db or config
// for better maintenance
function defineChargingStatus(parsed) {
  if (parsed.data.soc === 100) {
    return 'charged';
  } if (parsed.data.soc >= 80) {
    return 'charging80';
  }
  return 'charging';
}

function createMessage(status) {
  return JSON.stringify({
    event: 'chargingStatus',
    data: {
      status,
    },
  });
}

// done inside of message event to make sure the widget is connected
function fetchWidgetCounterpart(id) {
  return (message) => {
    console.log('fetching widget');
    const widgetId = connections[id];
    const widget = websockets[widgetId];
    return { widget, message };
  };
}

// making sure the counterpart widget is connected
function verifyWidgetIsConnected({ widget }) {
  return !R.isNil(widget);
}

function sendMessage({ widget, message }) {
  return widget.send(message);
}

function verifyRequestAddress(websocket, requester, port) {
  if (R.isNil(requester)
  || R.isNil(ports[requester])
  || ports[requester] !== port) {
    console.error('Bad request - wrong address', requester, port);
    websocket.terminate();
  }
}

async function verifyDeviceIdIsRegistered(websocket, id, requester, port) {
  let result;

  if (R.isNil(id)) {
    console.error('Bad request - device not known', id, port);
    websocket.terminate();
  }

  const Model = requester === 'chargers'
    ? dbMain.Charger
    : dbMain.Widget;

  try {
    result = await Model.findByPk(id);
  } catch (err) {
    console.error(`Sequelize Error: ${err}`);
    websocket.terminate();
  }

  if (R.isNil(result)) {
    console.error(`${requester} ${id} is not registered.`);
    websocket.terminate();
  }
}
