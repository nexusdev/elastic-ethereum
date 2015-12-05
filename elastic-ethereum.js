var Web3 = require('web3');
web3 = new Web3();
var elasticsearch = require('elasticsearch');
var config = require('config');
var commandLineArgs = require('command-line-args');

var cli = commandLineArgs([
  { name: 'contract', alias: 'c', type: String, defaultOption: true },
  { name: 'reindex', alias: 'r', type: Boolean }
]);

var options = cli.parse();
var index = config.contracts[options.contract].index;

web3.setProvider(new web3.providers.HttpProvider(config.get('ethereum.provider')));

var abi = require('./config/' + options.contract + '.abi.json');
contract = web3.eth.contract(abi);

client = new elasticsearch.Client({
  host: config.get('elasticsearch.host')
});

var callbacks = require('./config/' + options.contract + '.callbacks.js');
callbacks.onInit();

var lastBlockNumber;
var lastLogIndex;

var queue = [];
var processing = false;

if (options.reindex) {
  client.indices.delete({index: index}).then(function() {
      step1();
  }, function() {
      console.log("error");
  });
}
else {
  step1();
}

function step1() {
  // Get last log processed.
  client.indices.refresh({
    index: config.index
  }, function (error, response) {
    console.log(error);
    client.get({
      index: index,
      type: 'elastic-ethereum',
      id: 0
    }, function (error, response) {
      if (!error) {
        lastBlockNumber = response._source.lastBlockNumber;
        lastLogIndex = response._source.lastLogIndex;
        console.log('Last: ' + lastBlockNumber + ':' + lastLogIndex);
      }
      else {
        lastBlockNumber = 0;
        callbacks.onCreate();
      }

      step2();
    })
  });
}

function step2() {
  var filter = web3.eth.filter({fromBlock: lastBlockNumber, toBlock: 'latest', address: config.contracts[options.contract].address});

  filter.watch(function(error, result) {
    // Check if we have indexed this log before.
    if (result.blockNumber == lastBlockNumber && result.logIndex <= lastLogIndex)  {
      return;
    }
    
    console.log(result.blockNumber + ':' + result.logIndex);

    var deletes = callbacks.getDeletes(result);
    var documents = callbacks.getDocuments(result);

    queue.push({deletes: deletes, documents: documents});

    client.index({
      index: index,
      type: 'elastic-ethereum',
      id: 0,
      body: {
        lastBlockNumber: result.blockNumber,
        lastLogIndex: result.logIndex
      }
    }, function (error, response) {
      if (!error) {
        console.log(response);
      }
    });

    if (!processing) {
      processQueue();
    }
  });
}

function processQueue() {
  if (queue.length == 0) {
    return;
  }
  processing = true;

  if (queue[0].hasOwnProperty('deletes')) {
    for (type in queue[0].deletes) {
      for (id in queue[0].deletes[type]) {
        client.delete({
          index: index,
          type: type,
          id: queue[0].deletes[type][id]
        }, function (error, response) {
          console.log(response);
          if (!processing) {
            processQueue();
          }
        });
      }
    }
    delete queue[0].deletes
  }
  else {
    for (type in queue[0].documents) {
      for (id in queue[0].documents[type]) {
        client.index({
          index: index,
          type: type,
          id: id,
          body: queue[0].documents[type][id]
        }, function (error, response) {
          if (!error) {
            console.log(response);
            if (!processing) {
              processQueue();
            }
          }
        });
      }
    }
  }
  
  queue.shift();

  processing = false;
}
