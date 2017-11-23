import {Sequelize} from 'sequelize-typescript';
import {Chunk} from '../types/models/chunk';
import {File} from '../types/models/file';
import {Share} from '../types/models/share';

export class Database {
  private db: Sequelize;

  constructor(config: any) {
    this.db = new Sequelize(config);
    this.db.addModels([File, Share, Chunk]);
  }

  public getDatabase() {
    return this.db;
  }
}
