import { Table, Column, Model, HasMany, Sequelize } from 'sequelize-typescript';
import { File } from './file';
/**
 * Exports Share class.
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

  @Column({
    type: Sequelize.ENUM({
      values: ['UPLOAD', 'DOWNLOAD', 'BI']
    }),
    defaultValue: 'DOWNLOAD'
  })
  public direction: string;

  @Column
  public dir: string;

  @Column
  public complete: boolean;

  @HasMany(() => File)
  public files: File[];

  static DIRECTION_UPLOAD = 'upload';
  static DIRECT_DOWNLOAD = 'download';

  public static LOOKUP(shareUrl: string, destination: string): Promise<Share> {
    const promise = Share
      .findOrCreate({
        where: {
          url: shareUrl,
          dir: destination
        },
        defaults: {
          token: '',
          complete: false
        }
      })
      .spread((share: Share) => {
        return share;
      });

    return Promise.resolve(promise);
  }

  static ForTableOutput(shares: Array<Object>) {
    const arr = [];
    shares.forEach(share => {
      arr.push(Object.keys(share).map(key => share[key]));
    });
    return arr;
  }
}
