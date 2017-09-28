import { IActivity } from './iactivity';
import * as WebSocket from 'ws';
import { File } from '../types';
import * as Debug from 'debug';
const debug = Debug('activity:download');

export class DownloadActivity implements IActivity {
  type: string;
  channel: string;
  socket: WebSocket;
  file: File;

  constructor() {
    this.type = 'download';
  }

  public attachFile(file: File) {
    this.file = file;
    return this;
  }

  public onceReady() {
    debug('run..');
    return new Promise(resolve => {
      const url = 'https://push.iogates.com/pub/' + this.getChannel();
      debug('url: ' + url);
      this.socket = new WebSocket(url);
      this.socket.on('open', () => {
        debug('ready');
        return resolve();
      });
      this.socket.on('error', (err) => {
        debug(err);
      });
    });
  }

  public getChannel() {
    return this.channel = 'updates';
  }

  public getFile() {
    return this.file;
  }

  public send(payload) {
    debug('sending' + JSON.stringify(payload));    
    this.socket.send(JSON.stringify(payload));
    return payload;
  }

  public start() {
    const payload = {
      type: this.type,
      action: "start",
      payload: {
        file: this.file.file_id
      }
    };
    return this.send(payload);
  }

  public resume() {
    const payload = {
      type: this.type,
      action: "resume",
      payload: {
        file: this.file.file_id
      }
    };
    return this.send(payload);
  }

  public progress(percent: number, rate: number) {
    const payload = {
      type: this.type,
      action: "progress",
      payload: {
        file: this.file.id,
        percent: percent,
        rate: rate
      }
    };
    this.socket.send(payload);
  }

  public completed() {
    const payload = {
      type: this.type,
      action: "complete",
      payload: {
        file: this.file.id
      }
    };
    this.socket.send(payload);
  }

  public getType() {
    return this.type;
  }
}