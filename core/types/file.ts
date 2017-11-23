import * as Bluebird from 'bluebird';
import { createHash } from 'crypto';
import * as fs from 'fs';
import {IFile} from '../interfaces/ifile';

export class File implements IFile {
  public created: Date;
  public destination: string;
  public download: string;
  public downloaded: boolean;
  public href: string;
  public id: number;
  public file_id: number;
  public md5: string;
  public name: string;
  public parent: number|null;
  public size: number;
  public stream_path: string;
  public type: string;
  public upload_filename: string;
  public uploaded: boolean;
  public uuid: string;

  public static CREATE_MD5(file: File): Bluebird<File> {
    const hash = createHash('md5');
    const stream = fs.createReadStream(file.stream_path);

    return new Bluebird((resolve: Function, reject: Function) => {
      stream.on('data', (data: string) => hash.update(data));

      stream.on('end', () => {
        file.md5 = hash.digest('hex');

        return resolve(file);
      });
    });

  }

  public isDirectory(): boolean {
    return this.type === 'dir';
  }

  public save() {};
}
