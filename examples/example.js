'use strict';

var Rho = require('../lib/model.js');

var Client = Rho.define('client', {
  callbackUrl: Rho.STRING,
  clientId: {
    type: Rho.STRING,
    primaryKey: true,
    field: 'clientId'
  },
  clientSecret: Rho.STRING,
  grantTypes: Rho.JSON,
  projectId: Rho.INTEGER,
  providerId: Rho.INTEGER
}, {});

Client.create({
  callbackUrl: 'http://127.0.0.1/callbackUrl',
  clientId: 'Client',
  clientSecret: 'Secret',
  grantTypes: [
    'authorization_code',
    'refresh_token'
  ]
});

Client.find({
  clientId: 'Client'
}).then(function(client) {
  console.log('Found: %j', client);
  process.exit(0);
}).catch(function(err) {
  console.error(err);
  process.exit(1);
});
