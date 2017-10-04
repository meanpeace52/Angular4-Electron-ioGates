import {
  Table,
  Column,
  Model,
  ForeignKey, BelongsTo
} from 'sequelize-typescript';
// import { UploadResponse } from '../uploadResponse';
import { Share } from './share';
// import { createHash } from 'crypto'
// import * as fs from 'fs';
import { File } from './file';
import * as uuid from 'uuid/v1';


/**
 * Exports File class.
 */
@Table({
  timestamps: true,
  underscored: true,
  tableName: 'chunks'
})
export class Chunk extends Model<Chunk> {
  @Column({
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  public id: number;

  @Column
  public upload_filename: string;

  @Column({
    defaultValue: false
  })
  public uploaded: boolean;

  @Column({
    defaultValue: 0
  })
  public offset: number;

  @Column
  public resume_url: string;

  @Column
  public uuid: string;

  @ForeignKey(() => File)
  public file_id: number;

  @ForeignKey(() => Share)
  public share_id: number;

  @BelongsTo(() => Share, 'share_id')
  public share: Share;

  @BelongsTo(() => File, 'file_id')
  public file: File;

  @Column
  public starting_point: number;

  @Column
  public ending_point: number;

  @Column
  public size: number;

  @Column
  public upload_started: number;


  static CreateBulkChunks(file: File, chunkNumber: number): Array<Chunk> {

    // let logger = global['logger'];
    return global['_DB'].transaction(function transactionFn(transaction) {
      const bulk = [];
      let clientSize = Math.ceil(file.size / chunkNumber);
      let startingPoint = 0;

      for (let i  = 0; i < chunkNumber; i++) {
        let chunk = new Chunk();
        chunk.file_id = file.file_id;
        chunk.upload_filename = file.upload_filename;
        chunk.starting_point = startingPoint;
        chunk.ending_point = startingPoint + clientSize;
        chunk.uuid = uuid();
        chunk.size = clientSize;
        startingPoint = clientSize;
        bulk.push(chunk);
      }

      return bulk;
    });

  }

  static BulkSave(chunks: Chunk[]): Promise<Chunk> {
    return global['_DB'].transaction(function transactionFn(transaction) {
      const bulk = [];
      chunks.forEach((chunk: Chunk) => {
        const record = chunk.get({plain: true});
        delete record['id'];
        const fn = Chunk
          .update(record,{
            where: {
              id: chunk.id,
              uuid: chunk.uuid
            },
            transaction: transaction
          })
          .spread((savedChunk: Chunk, created) => savedChunk);

        bulk.push(fn);

        return Promise.all(bulk);
      })
    });
  }
}