import _ from 'lodash';
import redis from './redis';
import util from 'util';

class Rho {
  values: string[];
  options: string[];

  constructor(values: string[], options: string[]) {
    this.values = values;
    this.options = options;
  }

  save(options: { timestamps: boolean }): Promise<null> {
    if (!_.isUndefined(options) && !_.isPlainObject(options)) {
      throw new Error(
        'The argument passed to findOne must be an options object'
      );
    }

    const values = this.values;
    const keys: string[] = [];

    keys.push(this.Model.name);

    if (options.timestamps === true) {
      values.createdAt = _.now();
    }

    _.filter(this.Model.attributes, {
      primaryKey: true
    }).forEach(function (primaryKey: { field: string | number }) {
      keys.push(
        util.format('%s:%s', primaryKey.field, values[primaryKey.field] || 0)
      );
    });

    return new Promise(function (resolve, reject) {
      redis
        .hmset(keys.join(':'), values)
        .then(function (result: unknown) {
          resolve(result);
        })
        .catch(function (err: any) {
          reject(err);
        });
    });
  }
}

export default Rho;
