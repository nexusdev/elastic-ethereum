# elastic-ethereum
Indexes Ethereum contracts with Elasticsearch.

Both and Geth and Elasticsearch need to be running.

In order to configure Elastic Ethereum copy config/default.js to config.production.js and edit the connection configuration if necessary.

Each contract you want to index needs to be added to the `contracts` section of the configuration. Each contract has two fields:

* `address` is the address of the Ethereum contract that will have its events watched.
* `index` is the name of the Elasticsearch index that will be used.

Copy config/template.callbacks.js to config/`contract_key`.callbacks.js and customize the callbacks.

* onInit() is run everytime Elastic Ethereum starts or resumes indexing a contract.
* onCreate() is only run when the contract is starting to be indexed the first time or re-indexed from the beginning.
* getDeletes() is passed each event that is detected and should return a list of index ids to delete.
* getDocuments() is passed each event that is detected and should return a list of documents that are new or updated.

## Run
```
export NODE_ENV=production
node elastic-ethereum.js contract-key
```

## Extra contract methods
Once your contract is being successfully indexed in Elasticsearch, it makes sense to extend the contract object with some extra methods that will query the index.

* Install Elastic Ethereum as a submodule of your node program. `npm install --save elastic-ethereum`
* elasticEthereum = require('elastic-ethereum');
* `cp -a elastic-ethereum/config .`
* Configure config.production.js as above
* copy config/template.extend-contract.js to config/`contract_key`.extend-contract.js
* Implement additional methods
* After you have obtained the contract object from web3, call elasticEthereum.extendContract(`contractKey`, contractObject)
