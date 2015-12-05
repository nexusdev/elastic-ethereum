# elastic-ethereum
Indexes Ethereum contracts with Elasticsearch.

Both and Geth and Elasticsearch need to be running.

In order to configure Elastic Ethereum copy config/default.js to config.production.js and edit the connection configuration if necessary.

For each contract you want to watch you need to add a key to the contracts configuration. The key is just an identifier. The value is an object with two fields. `address` is the address of the Ethereum contract that will have its events watched. `index` is the name of the Elasticsearch index that will be used.

Copy config/template.callbacks.js to config/`contract_key`.callbacks.js and customize the callbacks.

* onInit() is run everytime Elastic Ethereum starts or resumes indexing a contract.
* onCreate() is only run when the contract is starting to be indexed the first time or re-indexed from the beginning.
* getDeletes() is passed each event that is detected and should return a list of index ids to delete.
* getDocuments() is passed each event that is detected and should return a list of documents that are new or updated.

##Run
```
export NODE_ENV=production
node elastic-ethereum.js contract-key
```

