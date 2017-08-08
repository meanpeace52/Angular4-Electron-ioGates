import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';

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
    unique: true
  })
  public id: number;

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

  @Column
  public md5: string;

  @ForeignKey(() => Share)
  public shareId: number;

  @BelongsTo(() => Share, 'shareId')
  public share: Share;
}
