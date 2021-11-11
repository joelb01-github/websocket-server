import {
  ConnectionToServer,
  createConnectionToServer,
} from './connection-to-server';

import {
  ChargeStatusIndicator,
  createChargeStatusIndicator,
} from './charge-status.indicator';

import * as Rx from 'rxjs';

export class WidgetMock {
  protected statusSubject: Rx.Subject<string>;
  protected connectionToServer: ConnectionToServer;
  protected chargeStatusIndicator: ChargeStatusIndicator;

  protected id: string;
  protected url: string;

  constructor({ id, url }: { id: string; url: string }) {
    this.statusSubject = new Rx.Subject<string>();
    this.id = id;
    this.url = url;
  }

  public async start(): Promise<void> {
    this.chargeStatusIndicator = createChargeStatusIndicator();

    this.statusSubject.subscribe((status) =>
      this.chargeStatusIndicator.getUpdateFn()(status)
    );

    this.connectionToServer = createConnectionToServer({
      url: this.url,
      id: this.id,
      statusSubject: this.statusSubject,
    });

    await this.connectionToServer.connect();
  }
}

export function createWidgetMock({
  id,
  url,
}: {
  id: string;
  url: string;
}): WidgetMock {
  return new WidgetMock({ id, url });
}
