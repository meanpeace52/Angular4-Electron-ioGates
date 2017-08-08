import {Table, Column, Model, HasMany} from 'sequelize-typescript';
import { File } from './file';
/**
 * Exports File class.
 */
@Table({
  timestamps: true,
  underscored: true,
  tableName: 'shares'
})
export class Share extends Model<Share> {
  @Column({
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false
  })
  public id: number;

  @Column({
    allowNull: false
  })
  public url: string;

  @Column({
    allowNull: false
  })
  public token: string;

  @Column
  public complete: boolean;

  @HasMany(() => File)
  public files: File[];
}
