var Web3 = require('web3');
var web3 = new Web3();
var elasticsearch = require('elasticsearch');
var config = require('config');

var index = config.get('elasticsearch.index');

web3.setProvider(new web3.providers.HttpProvider(config.get('ethereum.provider')));


var abi = require('./config/' + process.env.NODE_ENV + '.abi.json');
var contract = web3.eth.contract(abi);

var client = new elasticsearch.Client({
  host: config.get('elasticsearch.host')
});

var callbacks = require('./config/' + process.env.NODE_ENV + '.callbacks.js');
callbacks.onInit();

var lastBlockNumber = -1;
var lastLogIndex;

// Get last log processed.
client.get({
  index: index,
  type: 'elastic-ethereum',
  id: 0
}, function (error, response) {
  if (!error) {
    lastBlockNumber = response._source.lastBlockNumber;
    lastLogIndex = response._source.lastLogIndex;
  }
  else {
    callbacks.onCreate();
  }

  watch();
});

function watch() {
  var filter = web3.eth.filter({fromBlock: lastBlockNumber, toBlock: 'latest', address: config.get('ethereum.contract_address')});

  filter.watch(function(error, result) {
    // Check if we have indexed this log before.
    if (result.blockNumber == lastBlockNumber && result.logIndex <= lastLogIndex)  {
      return;
    }

    console.log(result.blockNumber + ':' + result.logIndex);

    // Delete documents.
    var deletes = callbacks.getDeletes(result);
    for (type in deletes) {
      for (id in deletes[type]) {
        client.delete({
          index: index,
          type: type,
          id: deletes[type][id]
        }, function (error, response) {
          console.log(response);
        });
      }
    }

    // Index documents.
    var documents = callbacks.getDocuments(result);
    for (type in documents) {
      for (id in documents[type]) {
        client.index({
          index: index,
          type: type,
          id: id,
          body: documents[type][id]
        }, function (error, response) {
          console.log(response);
        });
      }
    }

    client.index({
      index: index,
      type: 'elastic-ethereum',
      id: 0,
      body: {
        lastBlockNumber: result.blockNumber,
        lastLogIndex: result.logIndex
      }
    }, function (error, response) {
      console.log(response);
    });

  });
}
