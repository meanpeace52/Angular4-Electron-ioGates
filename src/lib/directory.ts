import * as fs from 'fs';
import * as path from 'path';
import { File } from "../types";
import * as uuid from 'uuid/v1';
import { ReadStream } from "fs";
import * as mime from 'mime-types';

/**
 *  Exports class Directory.
 */
export class Directory {
  public path: string;
  constructor(path: string) {
    this.path = path;
  }

  public static getStream(path: string): ReadStream {
    return fs.createReadStream(path);
  }

  public static delete(dir: string) {
    return new Promise((resolve, reject) => {
      fs.rmdir(dir, (err) => {
        if (err instanceof Error) {
          if (/ENOENT/ig.test(err.message)) {
            return resolve();
          }

          return reject(err);
        }

        return resolve();
      });
    });
  }

  public create(): Promise<null> {
    return new Promise((resolve: Function, reject: Function) => {
      global['logger'].info('creating dir %s', this.path);
      fs.mkdir(this.path, (err: Object) => {
        if (err instanceof Error) {
          if (/EEXIST/ig.test(err.message)) {

            return resolve(null);
          }

          return reject(err);
        }

        return resolve(null);
      });
    });
  }

  public read(): Promise<File[]> {
    return this.create()
      .then(() => {
        try {
          const promise = [];
          const blobs: File[] = this.walkSync(this.path, []).map((filePath: string): File => {
            const size = fs.statSync(filePath).size;
            const fileNameSplit = filePath.split('/');
            const file = new File();
            file.name = fileNameSplit[fileNameSplit.length - 1];
            file.type = mime.lookup(file.name) || 'Other';
            file.size = size;
            file.uuid = uuid();
            file.uploaded = false;
            file.stream_path = filePath;

            return file;
          });
          blobs.forEach((file: File) => promise.push(File.createMd5(file)));

          return Promise.all(promise);
        } catch (e) {
          return Promise.reject(e);
        }
      })
      .then((file) => Promise.resolve(file));
    // return new Promise((resolve: Function, reject: Function) => {
    //
    // });
  }

  public walkSync(dir: string, fileList: string[]): string[] {
    const files = fs.readdirSync(dir);
    if (!Array.isArray(fileList)) {
      fileList = [];
    }

    files.forEach(file => {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        fileList = this.walkSync(path.join(dir, file), fileList);
      } else if (file.substr(0, 1) !== '.') {
        fileList.push(path.join(dir, file));
      }
    });

    return fileList;
  }
}
