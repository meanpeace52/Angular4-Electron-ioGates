import * as http from 'http';
import * as request from 'request-promise-native';
import { File, Share, AuthResponse } from './types';
import debug from 'debug';
import * as _ from 'lodash';
const log = console.log;

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

  public static GET_BASE_URL(url: string): string {
    const re = /^(https?:\/\/[a-zA-Z\-._0-9]+)(\/.*)$/i;
    const matches = re.exec(url);
    if (matches !== null) {
      return matches[1];
    } else {
      throw Error('Unknown Share URL scheme');
    }
  }

  public authenticateFromUrl(share: Share) {
    return this
      .getRequest()
      .post({
        url: `/authtoken`,
        json: {
          url: share.url,
          deviceId: +new Date() // CHANGE IT.
        }
      })
      .then((data: AuthResponse) => {
        console.log('R: ', data);
        share.token = this.token = data.token;
        return data;
      })
      .catch(err => {
        const response: request.FullResponse = err.response.toJSON();
        console.log(response);
      });
  }

  public setToken(token: string) {
    this.token = token;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public setApiUrlFromShareUrl(url: string) {
    this.setBaseUrl(`${IOGates.GET_BASE_URL(url)}/api`);
  }

  public getRequest() {
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
