'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var redis = require('./redis.js');
var util = require('util');

function Instance(values, options) {
  this.values = values;
  this.options = options;
}

Instance.prototype.save = function(options) {
  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw new Error(
      'The argument passed to findOne must be an options object');
  }

  var values = this.values;
  var keys = [];
  keys.push(this.Model.name);

  if (options.timestamps === true) {
    values.createdAt = _.now();
  }

  _.filter(this.Model.attributes, {
    primaryKey: true
  }).forEach(function(primaryKey) {
    keys.push(util.format('%s:%s', primaryKey.field, values[primaryKey.field] ||
      0));
  });

  return new Promise(function(resolve, reject) {
    redis.hmset(keys.join(':'), values)
      .then(function(result) {
        resolve(result);
      })
      .catch(function(err) {
        reject(err);
      });
  });
};

module.exports = Instance;
