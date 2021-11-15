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

const dbMain = Db(appConfig.get('db_main'));

R.values(ports).forEach((port) => {
  const server = http.createServer();
  server.listen(port);
  servers.push(server);

  const websocketServer = new ws.Server({ server });

  hl('connection', websocketServer, ['websocket', 'req'])
    .tap(() => console.log('Connection established'))
    .map(extradtRequestInfo)
    .flatMap(verifyConnection(port))
    .tap(storingWebsocket)
    .tap(() => console.log('websockets length', R.keys(websockets).length))
    .each(({ websocket, id }) => {
      hl('message', websocket)
        // Performance measure, ensures only one data event is push downstream
        // (or into the buffer) every ms milliseconds, other values are dropped.
        .throttle(1000)
        .map(parseIncomingMessage)
        .filter(verifyMessageContent)
        .tap((message) => console.log('received valid message: %s', message))
        .map(createMessage)
        .flatMap(fetchWidgetCounterpart(id))
        .filter(verifyWidgetIsConnected)
        .errors((err) => {
          console.error('error', err);
          websocket.terminate();
        })
        .each(sendMessage);

      hl('close', websocket)
        .each(() => {
          console.log('Connection stopped');
          // removing websocket
          delete websockets[id];
          console.log('websockets length', R.keys(websockets).length);
        });
    });

  hl('error', websocketServer)
    .each((err) => console.error('Error happened', err));
});

function extradtRequestInfo({ websocket, req }) {
  const requester = req.url.split('/')[1];
  const id = req.url.split('/')[2];
  return ({ websocket, id, requester });
}

/**
 * Function to verify that the connection is legitimate.
 * Terminates websocket connection if verification fails
 */
function verifyConnection(port) {
  return ({ websocket, id, requester }) => hl([{ websocket }])
    .map(verifyRequestAddress(requester, port))
    .map(verifyIdNotNull(id))
    .flatMap(verifyDeviceIdIsRegistered(id, requester));
}

function storingWebsocket({ websocket, id }) {
  websockets[id] = websocket;
}

// there should be some verification here on message format
function parseIncomingMessage(message) {
  return JSON.parse(message.toString());
}

function verifyMessageContent(parsed) {
  return parsed?.event === 'StateOfCharge'
  && parsed?.data?.soc !== undefined;
}

function createMessage(parsed) {
  const status = defineChargingStatus(parsed);

  const message = JSON.stringify({
    event: 'chargingStatus',
    data: {
      status,
    },
  });

  return message;
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

// done inside of message event to make sure the widget is stored in websockets
function fetchWidgetCounterpart(id) {
  const dbQuery = {
    where: {
      chargerId: id,
    },
  };

  return (message) => hl(dbMain.Widget.findOne(dbQuery))
    .filter((widgetDb) => !R.isNil(widgetDb))
    .map((widgetDb) => websockets[widgetDb.id])
    .filter((widget) => !R.isNil(widget))
    .map((widget) => ({ widget, message }))
    .tap(() => console.log('Counterpart fetched'));
}

// making sure the counterpart widget is connected
function verifyWidgetIsConnected({ widget }) {
  return !R.isNil(widget);
}

function sendMessage({ widget, message }) {
  return widget.send(message);
}

function verifyRequestAddress(requester, port) {
  return ({ websocket }) => {
    if (R.isNil(requester)
    || R.isNil(ports[requester])
    || ports[requester] !== port) {
      console.error('Bad request - wrong address', requester, port);
      websocket.terminate();
    }
    return { websocket };
  };
}

function verifyIdNotNull(id) {
  return ({ websocket }) => {
    if (R.isNil(id)) {
      console.error('Bad request - device not known', id);
      websocket.terminate();
    }
    return { websocket };
  };
}

function verifyDeviceIdIsRegistered(id, requester) {
  return ({ websocket }) => hl([{ websocket }])
    .map(() => {
      const Model = requester === 'chargers'
        ? dbMain.Charger
        : dbMain.Widget;
      return { websocket, Model };
    })
    .flatMap(({ Model }) => hl(Model.findByPk(id)))
    .errors((err) => {
      console.error(`Sequelize Error: ${err}`);
      websocket.terminate();
    })
    .map((result) => {
      if (R.isNil(result)) {
        console.error(`${requester} ${id} is not registered.`);
        websocket.terminate();
      }

      return { websocket, id };
    });
}
