'use strict';

var util = require('util');

var _ = require('lodash');

var Promise = require('bluebird');

function determineTCPPort(tcp_port) {
  if (process.env.REDIS_PORT.split(":").length > 0) {
    tcp_port = process.env.REDIS_PORT.split(":")[2];
  }
  return tcp_port;
}

var tcp_port = determineTCPPort();

function determineRedisHost(tcp_port, redis_host) {
  if (!tcp_port) {
    tcp_port = "6379";
  }

  var env_redis_host = "REDIS_PORT_" + tcp_port + "_TCP_ADDR";

  return redis_host || process.env[env_redis_host];
}

var redis_host = determineRedisHost(tcp_port);

var Redis = require('ioredis');
var redis = new Redis({
  host: redis_host,
  port: tcp_port,
  family: 4, // 4 (IPv4) or 6 (IPv6)
  db: 0 // todo add model index
});

Redis.Command.setReplyTransformer('hgetall', function(result) {
  if (Array.isArray(result)) {
    result = _.map(result, function(str) {
      // var result = false;
      try {
        str = JSON.parse(str);
      } catch (e) {
        return str;
      }
      return str;
    });

    var obj = {};
    for (var i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1];
    }
    return obj;
  }
  return result;
});

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
