import * as http from 'http';
import * as request from 'request';
import { Share, Auth, Files, File } from './types';
import debug from 'debug';
import * as _ from 'lodash';
const log = debug('io:lib:iogates');

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

  public authenticateFromUrl(share: Share): Promise<Auth> {
    log('called authenticateFromUrl');

    return new Promise((resolve: Function, reject: Function) => {
      this.getRequest().post({
        url: '/authtoken',
        json: {
          url: share.url,
          deviceId: global['machine-id']
        }
      },
        (err: Error, r: http.IncomingMessage, data: Auth) => {
          if (r.statusCode !== 200) {
            return reject(err);
          }
          log('received token: ', data.token);
          this.token = data.token;
          share.token = data.token;

          return resolve(share);
        });
    });
  }

  public readFiles(): Promise<Files> {
    log('called readFiles');

    return new Promise((resolve: Function, reject: Function) => {
      this.getRequest().get({
        url: '/files',
        json: true
      }, (err: Error, r: http.IncomingMessage, response: Files) => {
        if (r.statusCode !== 200) {
          return reject(err);
        }

        response.files = response.files.map((file: File) => {
          return File.fromPlain(file);
        });

        return resolve(response);
      });
    });
  }

  public createFiles(files: File[]): Promise<File[]> {
    return new Promise((resolve: Function, reject: Function) => {
      const filesToBeCreated = files.map((file: File) => {
        return {
          name: file.name,
          type: 'Other',
          attributes: [{ name: 'path', value: file.stream_path }]
        };
      });

      this.getRequest().post({
        url: '/files',
        json: true,
        body: { files: filesToBeCreated }
      }, (err: Error, r: http.IncomingMessage, response: Files) => {
        if (r.statusCode !== 200) {
          return reject(err);
        }

        const createdFiles = files.map((file: File) => {
          file.upload_filename = _.find(response.files, { name: file.name }).upload_filename;

          return file;
        });

        return resolve(createdFiles);
      });
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
