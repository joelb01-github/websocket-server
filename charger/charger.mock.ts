import {
  ConnectionToServer,
  createConnectionToServer,
} from './connection-to-server';

import { createSoCPrompter } from './soc.prompter';

import * as Rx from 'rxjs';

export class ChargerMock {
  protected socsSubject: Rx.Subject<number>;
  protected connectionToServer: ConnectionToServer;

  protected id: string;
  protected url: string;

  constructor({ id, url }: { id: string; url: string }) {
    this.socsSubject = new Rx.Subject<number>();
    this.id = id;
    this.url = url;
  }

  public async start(): Promise<void> {
    this.connectionToServer = createConnectionToServer({
      url: this.url,
      id: this.id,
    });

    await this.connectionToServer.connect();

    this.socsSubject.subscribe((value) =>
      this.connectionToServer.getSendSoCFn()(value)
    );

    const soCPrompter = createSoCPrompter({ socsSubject: this.socsSubject });
    soCPrompter.startPrompting();
  }
}

export function createChargerMock({
  id,
  url,
}: {
  id: string;
  url: string;
}): ChargerMock {
  return new ChargerMock({ id, url });
}
