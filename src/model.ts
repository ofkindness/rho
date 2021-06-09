import _ from 'lodash';
import Instance from './index';
import redis from './redis';
import util from 'util');

function Model(name: any, attributes: any, options: any) {
  this.name = name;
  this.attributes = attributes;
  this.options = options;

  this.Instance = function () {
    Instance.apply(this, arguments);
  };

  util.inherits(this.Instance, Instance);

  this.Instance.prototype.Model = this;
}

var define = function define(modelName: any, attributes: any, options: any) {
  var model = new Model(modelName, attributes, options);

  return model;
};

export default define;

Model.prototype.findOne = function (options: { [x: string]: any; }) {
  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw new Error('The argument passed to findOne must be an options object');
  }

  var keys: string[] = [];
  keys.push(this.name);

  _.filter(this.attributes, {
    primaryKey: true
  }).forEach(function (primaryKey) {
    keys.push(
      util.format('%s:%s', primaryKey.field, options[primaryKey.field] || 0)
    );
  });

  return new Promise(function (resolve, reject) {
    redis
      .hgetall(keys.join(':'))
      .then(function (result) {
        resolve(result);
      })
      .catch(function (err) {
        reject(err);
      });
  });
};

Model.prototype.find = Model.prototype.findOne;

Model.prototype.create = function (values: any, options: {}) {
  options = options || {};

  return this.build(values, {}).save(options);
};

Model.prototype.build = function (values: any, options: any) {
  return new this.Instance(values, options);
};
