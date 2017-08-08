import * as http from 'http';
import * as request from 'request';
import { Share, Auth, Files } from './types';

/**
 * API wrapper class for IOGates
 */
export class IOGates {
  private token: string;
  private baseUrl: string;
  constructor() {
    this.baseUrl = 'https://share-web02-transferapp.iogates.com/api';
    this.token = '';
  }

  public authenticateFromUrl(shareUrl: string): Promise<Auth> {
    return new Promise((resolve: Function, reject: Function) => {
      this.getRequest().post({
        url: '/authtoken',
        json: {
          url: shareUrl
        }
      },
        (err: Error, r: http.IncomingMessage, data: Auth) => {
          if (r.statusCode !== 200) {
            return reject(err);
          }
          this.token = data.token;
          const share = new Share({
            url: shareUrl,
            dir: '',
            token: '',
            complete: false
          });
          share
            .save()
            .then(() => {
              return resolve(data);
            });
        });
    });
  }

  public readFiles(): Promise<Files> {
    return new Promise((resolve: Function, reject: Function) => {
      this.getRequest().get({
        url: '/files',
        json: true
      }, (err: Error, r: http.IncomingMessage, response: Files) => {
        if (r.statusCode !== 200) {
          return reject(err);
        }

        return resolve(response);
      });
    });
  }

  private getRequest() {
    const options = {
      baseUrl: this.baseUrl,
      headers: {
        token: ''
      }
    };
    if (this.token.length > 0) {
      options.headers.token = this.token;
    }

    return request.defaults(options);
  }
}
