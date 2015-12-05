var elasticsearch = require('elasticsearch');
var config = require('config');

module.exports = function(contractName, contract) {

  elasticsearchClient = new elasticsearch.Client({
    host: config.get('elasticsearch.host')
  });

  var extendContract = require('./config/' + contractName + '.extend-contract.js');
  extendContract(contract);
}
