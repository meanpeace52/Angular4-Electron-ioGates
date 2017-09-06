import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';
// import { UploadResponse } from '../uploadResponse';
import { Share } from './share';
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

  @Column({
    allowNull: false
  })
  public file_id: number;

  @Column
  public name: string;

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

  @Column
  public md5: string; 

  @Column
  public destination: string;

  @ForeignKey(() => Share)
  public share_id: number;

  @BelongsTo(() => Share, 'shareId')
  public share: Share;

  public isDirectory() {
    return this.type === 'dir';
  }

  public static bulkSave(files: File[], share: Share): Promise<File[]> {
    return global['_DB'].transaction(function transactionFn(transaction) {
      const bulk = [];
      const toDownload = [];
      files.forEach(file => {
        const record = {
          file_id: file.id,
          name: file.name,
          type: file.type,
          parent: file.parent,
          href: file.href,
          download: file.download,
          downloaded: false,
          md5: file.md5,
          share_id: share.id
        };
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
          fileId: ids
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

}
