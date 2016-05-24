'use strict';

var _ = require('lodash');
var Instance = require('./instance.js');
var Promise = require('bluebird');
var redis = require('./redis.js');
var util = require('util');

function Model(name, attributes, options) {
  this.name = name;
  this.attributes = attributes;
  this.options = options;

  this.Instance = function() {
    Instance.apply(this, arguments);
  };

  util.inherits(this.Instance, Instance);

  this.Instance.prototype.Model = this;
}

var define = function define(modelName, attributes, options) {
  var model = new Model(modelName, attributes, options);

  return model;
};

module.exports.define = define;

module.exports.INTEGER = function() {};
module.exports.STRING = function() {};
module.exports.JSON = function() {};
module.exports.UUID = function() {};

Model.prototype.findOne = function(options) {
  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw new Error(
      'The argument passed to findOne must be an options object');
  }

  var keys = [];
  keys.push(this.name);

  _.filter(this.attributes, {
    primaryKey: true
  }).forEach(function(primaryKey) {
    keys.push(util.format('%s:%s', primaryKey.field, options[primaryKey.field] ||
      0));
  });

  return new Promise(function(resolve, reject) {
    redis.hgetall(keys.join(':'))
      .then(function(result) {
        resolve(result);
      })
      .catch(function(err) {
        reject(err);
      });
  });
};

Model.prototype.find = Model.prototype.findOne;

Model.prototype.create = function(values, options) {
  options = options || {};

  return this.build(values, {}).save(options);
};

Model.prototype.build = function(values, options) {
  return new this.Instance(values, options);
};
