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

  @Column
  public starting_point: number;

  @Column
  public ending_point: number;

  static CreateBulkChunks(file: File, chunkNumber: number): Promise<Array<Chunk>> {

    let logger = global['logger'];
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
        startingPoint = clientSize;
        bulk.push(chunk.save());
      }

      return Promise.all(bulk);
    });

  }
}