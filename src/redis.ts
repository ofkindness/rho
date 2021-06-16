import _ from 'lodash';
import Redis from 'ioredis';

function determineTCPPort(tcp_port?: string) {
  if (process.env.REDIS_PORT) {
    // .split(':').length > 0
    tcp_port = process.env.REDIS_PORT.split(':')[2];
  }
  return tcp_port || '';
}

const tcp_port = determineTCPPort();

function determineRedisHost(tcp_port: string, redis_host?: string) {
  if (!tcp_port) {
    tcp_port = '6379';
  }

  const env_redis_host = 'REDIS_PORT_' + tcp_port + '_TCP_ADDR';

  return redis_host || process.env[env_redis_host];
}

const redis_host = determineRedisHost(tcp_port);

Redis.Command.setReplyTransformer('hgetall', function (result) {
  if (Array.isArray(result)) {
    result = _.map(result, function (str) {
      // var result = false;
      try {
        str = JSON.parse(str);
      } catch (e) {
        return str;
      }
      return str;
    });

    const obj: any = {};
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1];
    }
    return obj;
  }
  return result;
});

const redis = new Redis({
  host: redis_host,
  port: tcp_port,
  family: 4, // 4 (IPv4) or 6 (IPv6)
  db: 0 // todo add model index
});

export default redis;
