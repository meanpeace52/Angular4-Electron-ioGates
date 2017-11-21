import * as Bluebird from 'bluebird';
import { Table, Column, Model, HasMany, Sequelize } from 'sequelize-typescript';
import {IShare} from '../../lib/ishare';
import { File } from './file';
/**
 * Exports Share class.
 */
@Table({
  timestamps: true,
  underscored: true,
  tableName: 'shares'
})
export class Share extends Model<Share> implements IShare {
  public static DIRECTION_UPLOAD: string = 'upload';
  public static DIRECT_DOWNLOAD: string = 'download';
  public static DIRECT_BI: string = 'BI';

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

  public static LOOKUP(shareUrl: string, destination: string): Bluebird<Share> {
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

    return Bluebird.resolve(<any>promise);
  }

  static ForTableOutput(shares: Object[]) {
    const arr = [];
    shares.forEach((share: Object) => {
      arr.push(Object.keys(share).map(key => share[key]));
    });

    return arr;
  }

  static DeleteByUrl(shareUrl: string) {
    const runFn = Share
      .findOne({
        where: {
          url: shareUrl
        }
      })
      .then(share => {
        if (!share) return null;

        return share.destroy({ force: true });
      });

    return Bluebird.resolve(runFn);
  }

  static DeleteById(id: number) {
    const runFn = Share
      .findOne({
        where: {
          id: id
        }
      })
      .then(share => {
        if (!share) return null;
        return share.destroy({ force: true });
      });

    return Bluebird.resolve(runFn);
  }

  static DeleteByDir(dir: string) {
    const runFn = Share
      .findOne({
        where: {
          dir: dir
        }
      })
      .then(share => {
        if (!share) return null;
        return share.destroy({ force: true });
      });

    return Bluebird.resolve(runFn);
  }
}
