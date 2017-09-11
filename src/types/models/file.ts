import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';
// import { UploadResponse } from '../uploadResponse';
import { Share } from './share';
import { createHash } from 'crypto'
import * as fs from 'fs';
// import * as winston from 'winston';

/**
 * Exports File class.
 */
@Table({
  timestamps: true,
  underscored: true,
  tableName: 'files'
})
export class File extends Model<File> {
  @Column({
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  public id: number;

  @Column
  public file_id: number;

  @Column
  public name: string;

  @Column
  public upload_filename: string;

  @Column
  public type: string;

  @Column
  public parent: number;

  @Column
  public href: string;

  @Column
  public download: string;

  @Column({
    defaultValue: false
  })
  public downloaded: boolean;

  @Column({
    defaultValue: false
  })
  public uploaded: boolean;

  @Column
  public md5: string;

  @Column
  public destination: string;

  @Column
  public size: number;

  @Column
  public stream_path: string;

  @Column
  public uuid: string;

  @Column
  public resume_able: boolean;

  @Column({
    defaultValue: false
  })
  public uploadStarted: boolean;

  @ForeignKey(() => Share)
  public share_id: number;

  @BelongsTo(() => Share, 'share_id')
  public share: Share;

  public isDirectory() {
    return this.type === 'dir';
  }

  public static bulkSave(files: File[], share: Share): Promise<File[]> {
    return global['_DB'].transaction(function transactionFn(transaction) {
      const bulk = [];
      const toDownload = [];
      files.forEach(file => {
        const record = file.get({plain: true});
        delete record['id'];
        record.share_id = share.id;
        const fn = File
          .findOrCreate({
            where: {
              file_id: file.file_id,
              share_id: share.id
            },
            defaults: record,
            transaction: transaction
          })
          .spread((savedFile: File, created) => {
            if (savedFile.downloaded === false) {
              toDownload.push(savedFile);
            } else {
              console.log(`File <${file.name}>`, 'already exists, skipping download...');
            }
            return savedFile;
          });
        bulk.push(fn);
      });
      return Promise
        .all(bulk)
        .then(() => {
          return toDownload;
        });
    });
  }

  public static filterForDownload(files: File[]): Promise<Array<File>> {
    const download = [];
    const ids = [];
    files.forEach(file => ids.push(file.id));
    const promise = File
      .findAll({
        where: {
          file_id: ids
        },
        attributes: ['fileId'],
        raw: true
      })
      .then((existingFiles: File[]) => {
        const foundIds = existingFiles.map(r => r.file_id);
        files.forEach(file => {
          if (foundIds.indexOf(file.file_id) === -1) {
            download.push(file);
          }
        });
        return download;
      });
    return Promise.resolve(promise);
  }

  public static saveReadStreamFiles(files: File[], share: Share): Promise<Array<File>> {
    return global['_DB'].transaction(function transactionFn(transaction) {
      const bulk = [];
      const toUpload = [];
      files.forEach(file => {
        const record = file.get({plain: true});
        delete record['id'];
        record.share_id = share.id;
        const fn = File
          .findOrCreate({
            where: {
              md5: file.md5,
              stream_path: file.stream_path
            },
            defaults: record,
            transaction: transaction
          })
          .spread((savedFile: File, created) => {
            if (!savedFile.uploaded) {
              toUpload.push(savedFile);
            } else {
              console.log(`File <${file.name}>`, 'already uploaded, skipping upload...');
            }
            return savedFile;
          });
        bulk.push(fn);
      });
      return Promise
        .all(bulk)
        .then(() => {
          return toUpload;
        });
    });
    // let promises = [];
    //
    // files.forEach(file => {
    //   file.share_id = share.id;
    //   let promise = File
    //     .findOrCreate({
    //       where: {
    //         md5: file.md5,
    //         stream_path: file.stream_path
    //       },
    //       defaults: file
    //     })
    //     .spread((file) => file);
    //   promises.push(promise);
    // });
    //
    // return Promise.resolve(promises);
  }

  public static createMd5(file: File): Promise<File> {
    let hash = createHash('md5');
    let stream = fs.createReadStream(file.stream_path);

    return new Promise((resolve: Function, reject: Function) => {
      stream.on('data', (data) => hash.update(data));

      stream.on('end', () => {
        file.md5 = hash.digest('hex');
        return resolve(file);
      })
    })

  }

  public static fromPlain(file: object): File {
    file['file_id'] = Number(file['id']);
    return new File(file);
  }

}
