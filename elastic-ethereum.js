var Web3 = require('web3');
var web3 = new Web3();
var elasticsearch = require('elasticsearch');
var config = require('config');

web3.setProvider(new web3.providers.HttpProvider(config.get('ethereum.provider')));
