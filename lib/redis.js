'use strict';

var _ = require('lodash');
var Redis = require('ioredis');

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

var redis = new Redis({
  host: redis_host,
  port: tcp_port,
  family: 4, // 4 (IPv4) or 6 (IPv6)
  db: 0 // todo add model index
});

module.exports = redis;
