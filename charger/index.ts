import { createChargerMock } from './charger.mock';

const yargs = require('yargs');

const options = yargs
  .usage('Usage: -i <chargerId> -u <url>')
  .option('i', { alias: 'id', describe: 'The charger ID', type: 'string' })
  .option('u', {
    alias: 'url',
    describe: 'The websocket endpoint',
    type: 'string',
  }).argv;

if (!options.i) {
  options.i = 'c1234';
}

if (!options.u) {
  options.u = 'ws://localhost:3100/chargers';
}

const chargerMock = createChargerMock({ id: options.i, url: options.u });
chargerMock.start();
