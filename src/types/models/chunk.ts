import {
  Table,
  Column,
  Model,
  ForeignKey, BelongsTo
} from 'sequelize-typescript';
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
  public static STORE_CHUNKS(chunks: Chunk[]): Promise<Chunk[]> {
    return global['_DB'].transaction((t: any) => {
      const chunkBulk = [];
      for (const chunk of chunks) {
        chunkBulk.push(chunk.save({
          transaction: t
        }));
      }

      return Promise.all(chunkBulk);
    });
  }
  public static CREATE_CHUNKS(file: File, threads: number): Chunk[] {
    // let logger = global['logger'];
    const bulk = [];
    let clientSize = file.size;
    if (file.size > 10485760) {
      clientSize = Math.ceil(file.size / threads);
    }
    let startingPoint = 0;

    for (let i = 0; i < threads; i += 1) {
      let endPoint = startingPoint + clientSize - 1;
      if (endPoint > file.size || (i === threads - 1 && endPoint < file.size)) {
        endPoint = file.size;
        clientSize = endPoint - startingPoint;
      }
      const chunk = new Chunk();
      chunk.file_id = file.id;
      chunk.starting_point = startingPoint;
      chunk.ending_point = endPoint;
      chunk.uuid = uuid();
      chunk.size = clientSize;
      startingPoint = chunk.ending_point + 1;
      bulk.push(chunk);
    }

    return bulk;
  }

  public static BulkSave(chunks: Chunk[]): Promise<Chunk[]> {
    return global['_DB'].transaction( (transaction: any) => {
      const bulk = [];
      chunks.forEach((chunk: Chunk) => {
        bulk.push(chunk.save());
      });

      return Promise.all(bulk);
    });
  }

  @Column({
    primaryKey: true,
    unique: true,
    autoIncrement: true
  })
  public id: number;

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
}