import { createWidgetMock } from './widget.mock';

const yargs = require('yargs');

const options = yargs
  .usage('Usage: -i <chargerId> -u <url>')
  .option('i', { 
    alias: 'id', 
    describe: 'The widget ID', 
    type: 'string' })
  .option('u', {
    alias: 'url',
    describe: 'The websocket endpoint',
    type: 'string',
  }).argv;

if (!options.i) {
  options.i = 'wABCD';
}

if (!options.u) {
  options.u = 'ws://localhost:3200/widgets';
}

const widgetMock = createWidgetMock({ id: options.i, url: options.u });
widgetMock.start();
