import * as Debug from 'debug';
import { IActivity } from '../interfaces/iactivity';
import {IFile} from '../interfaces/ifile';
import {isUndefined} from 'util';
import * as WebSocket from 'ws';
const debug = Debug('activity:download');

export class DownloadActivity implements IActivity {
  public action: string;
  private channel: string | undefined;
  private socket: WebSocket;
  private file: IFile;

  constructor(channel: string | undefined) {
    this.action = 'download';
    this.channel = channel;
  }

  public attachFile(file: IFile) {
    this.file = file;

    return this;
  }

  public onceReady() {
    debug('run..');

    return new Promise((resolve: Function, reject: Function) => {
      debug('no channel, not connecting');
      if (isUndefined(this.channel)) {
        return resolve();
      }
      const url = `https://push.iogates.com/pub/${this.getChannel()}`;
      debug(`url: ${url}`);
      this.socket = new WebSocket(url);
      this.socket.on('open', () => {
        debug('ready');

        return resolve();
      });
      this.socket.on('error', (err: Error) => {
        debug(err);

        return reject(err);
      });
    });
  }

  public getChannel() {
    return this.channel;
  }

  public getFile() {
    return this.file;
  }

  public send(payload: any) {
    if (isUndefined(this.channel)) {
      return false;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      debug(`sending ${JSON.stringify(payload)}`);

      return this.socket.send(JSON.stringify(payload), (err: Error) => {
        if (err) {
          debug(`Error sending ${JSON.stringify(payload)}. ${Error}`);

          return false;
        }

        return true;
      });
    } else {
      debug('Socket not open');

      return false;
    }
  }

  public start() {
    const payload = {
      type: this.action,
      action: 'start',
      payload: {
        file: this.file.file_id,
      },
    };

    return this.send(payload);
  }

  public resume() {
    const payload = {
      type: this.action,
      action: 'resume',
      payload: {
        file: this.file.file_id,
      },
    };

    return this.send(payload);
  }

  public progress(percent: number, rate: number) {
    const payload = {
      type: this.action,
      action: 'progress',
      payload: {
        file: this.file.file_id,
        percent: percent,
        rate: rate,
      },
    };

    return this.send(payload);
  }

  public completed() {
    const payload = {
      type: this.action,
      action: 'complete',
      payload: {
        file: this.file.file_id,
      },
    };

    return this.send(payload);
  }

  public failed(err?: string) {
    const payload = {
      type: this.action,
      action: 'failed',
      payload: {
        file: this.file.file_id,
        reason: err,
      },
    };

    return this.send(payload);
  }

  public getType() {
    return this.action;
  }
}
