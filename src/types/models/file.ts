import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';
import { UploadResponse } from '../uploadResponse';
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
  public fileId: number;

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

  @ForeignKey(() => Share)
  public shareId: number;

  @BelongsTo(() => Share, 'shareId')
  public share: Share;

  public static STORE_FILES(response: UploadResponse[], share: Share): Promise<any> {
    const promise = [];
    response.forEach((upload: UploadResponse) => {
      const file = new File();
      file.name = upload.file.name;
      file.type = upload.file.type;
      file.parent = upload.file.parent;
      file.href = upload.file.href;
      file.download = upload.file.download;
      file.md5 = upload.file.md5;
      file.shareId = share.id;
      promise.push(file.save());
    });

    return Promise.all(promise);
  }

  public static bulkSave(files: File[], share: Share) : Promise<File[]> {
    const bulk = [];
    const toDownload = [];
    files.forEach(file => {
      const record = {
        fileId: file.id,
        name: file.name,
        type: file.type,
        parent: file.parent,
        href: file.href,
        download: file.download,
        downloaded: false,
        md5: file.md5,
        shareId: share.id
      };   
      const fn = File
        .findOrCreate({
          where: {
            fileId: file.id,
            shareId: share.id
          },
          defaults: record
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
  }
}
