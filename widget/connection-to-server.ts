import * as WebSocket from 'ws';

import * as Rx from 'rxjs';

export class ConnectionToServer {
  private url: string;
  protected ws: WebSocket;
  protected statusSubject: Rx.Subject<string>;

  constructor({
    url,
    id,
    statusSubject,
  }: {
    url: string;
    id: string;
    statusSubject: Rx.Subject<string>;
  }) {
    this.url = `${url}/${id}`;
    this.statusSubject = statusSubject;
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        return resolve();
      });

      this.ws.on('error', (error) => {
        console.log(error);
        return reject(new Error('error-connecting-to-server'));
      });

      this.ws.on('close', () => {
        return process.exit();
      });

      this.ws.on('message', (message: WebSocket.Data) => {
        const parsed = JSON.parse(message.toString());

        if (
          parsed?.event === 'chargingStatus' &&
          parsed.data?.status !== undefined
        ) {
          this.statusSubject.next(parsed.data.status);
        } else {
          console.log('Not a status message', message);
        }
      });
    });
  }
}

export function createConnectionToServer({
  url,
  id,
  statusSubject,
}: {
  url: string;
  id: string;
  statusSubject: Rx.Subject<string>;
}): ConnectionToServer {
  return new ConnectionToServer({ url, id, statusSubject });
}
