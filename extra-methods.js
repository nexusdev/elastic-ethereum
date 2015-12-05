
var extendContract = function(contractName, contract) {

  var elasticsearch = require('elasticsearch');
  var config = require('config');

  client = new elasticsearch.Client({
    host: config.get('elasticsearch.host')
  });

  var options = cli.parse();

  var extraMethods = require('./config/' + contractName + '.extra-methods.js');
  var extraMethodKeys = extraMethods.keys();

  for (var i = 0; i < extraMethodKeys.length; i++) {
    var methodKey = extraMethodKeys[i];
    contract[methodKey] = extraMethods[methodKey];
  }
}

module.exports = {
  extendContract: extendContract
};
