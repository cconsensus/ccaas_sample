# CCONSENSUS STOCK SKU ACCOUNT SUPPLY

![DEVELOPMENT](http://img.shields.io/static/v1?label=STATUS&message=DEVELOPMENT&color=YELLOW&style=for-the-badge)

Hyperledger Fabric Smart Contract for enabling track supply stock skus (The product supply accounts)
This was developed as base to show CCAAS deployment strategy and enable chaincode debug.

## VERSION AND HINTS

![npm](https://img.shields.io/badge/npm-v8.11.0-blue)
![node](https://img.shields.io/badge/node-v16.15.1-blue)

This is a NodeJS (Typescript) developed chaincode. Tested with Hyperledger Fabric Test Network
of [Fabric Samples](https://github.com/hyperledger/fabric-samples) running Hyperledger Fabric version 2.4.3:

```
vagrant@vagrant:/vagrant/go/src/github.com/hyperledger/davidfdr/fabric-samples/test-network$ peer version
peer:
 Version: 2.4.3
 Commit SHA: 9711fb5d0
 Go version: go1.17.5
 OS/Arch: linux/amd64
 Chaincode:
  Base Docker Label: org.hyperledger.fabric
  Docker Namespace: hyperledger
```

## BRING NETWORK UP

```
./network.sh up createChannel -ca -c mychannel -s couchdb
./addOrg3.sh up -ca -c mychannel -s couchdb
```

### ORG VARIABLES

-> Assuming usage of test network of fabric samples.

### BUILD NODE PACKAGE:

Go to the package.json directory (assuming that you have setup nodeJS / npm )

```
npm install
npm run package
```

### TROUBLESHOOTING CHECK CHAINCODE

```
peer lifecycle chaincode queryinstalled
peer lifecycle chaincode querycommitted --channelID mychannel
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name ccskuproductstockaccount --version 1.0.5 --sequence 5 \
--tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
--output json \
| jq .
```

## Build, deploy and install chaincode as a service CCAAS (Deploy external strategy)

### Build chaincode docker image

```shell
docker build -t cconsensus/ccskuproductstockaccount:1.0.0 .
```

### Package, build docker image, install, aprove and commit the chaincode definition

- This chaincode is using external deployment strategy:
  - [Fabric Chaincode External](https://github.com/hyperledger/fabric-samples/tree/main/asset-transfer-basic/chaincode-external])
- Remember to set the /etc/hosts where HLF is running to resolve the chaincode external DNS set @ connection.json file.

1. Go to package/ directory (where connection.json and metadata.json is)
	- :star: connection.json: file to set where the peer will acess the running chaincode.
	- :star: metadata.json: file with chaincode metadata.

```bash
cd package
tar cfz code.tar.gz connection.json ../META-INF
tar cfz ccskuproductstockaccount.tgz metadata.json code.tar.gz
```
or
```bash
cd package
./package.sh
```

2. Install generated package:

```bash
. ./scripts/envVar.sh
setGlobals 1 
peer lifecycle chaincode install ~/Projetos/cconsensus_supplychain/chaincodes/cc-sku-product-stock-account/package/ccskuproductstockaccount.tgz
setGlobals 2
peer lifecycle chaincode install ~/Projetos/cconsensus_supplychain/chaincodes/cc-sku-product-stock-account/package/ccskuproductstockaccount.tgz
```

3. Extract the packageId definition:

:sun_with_face: Install package command return:
```
[cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: ccskuproductstockaccount:82a9448370182efdd10db774f06ed75499029bde367acbea94a85eb5c41a98d5
```
4. Update setEnv.sh (if you want to run in debugmode) variable with generated package ID:

```bash
export CHAINCODE_SERVER_ADDRESS=ccskuproductstockaccount.192.168.33.22.nip.io:9997
export CHAINCODE_ID=ccskuproductstockaccount:82a9448370182efdd10db774f06ed75499029bde367acbea94a85eb5c41a98d5
export FABRIC_LOGGING_SPEC=DEBUG
export CORE_CHAINCODE_LOGGING_LEVEL=DEBUG
```
:fire: This sample is using [nip.io](https://nip.io/) dns service. Using nip.io we do not need to change the /etc/hosts file.
@see https://nip.io/
5. Starts the container for each peer (Make sure that you have build the chaincode docker image)

```bash
docker run -it --rm --name peer0org1.ccskuproductstockaccount.cconsensus.com.br --hostname peer0org1.ccskuproductstockaccount.cconsensus.com.br --env-file chaincode.env --network=fabric_test cconsensus/ccskuproductstockaccount:1.0.0
docker run -it --rm --name peer0org2.ccskuproductstockaccount.cconsensus.com.br --hostname peer0org2.ccskuproductstockaccount.cconsensus.com.br --env-file chaincodeorg2.env --network=fabric_test cconsensus/ccskuproductstockaccount:1.0.0
```

or with docker compose:

```bash
docker-compose -f docker-compose-chaincode.yaml up -d
```

or using preferable IDE fo debugging:

```bash
npm install
npm run build
npm run start:server-debug
```

6. Aprove the definition for all peers:

- :fire: Use specifc endorsement policy to need only one org to endorse. To receive only one requisition from the peer.

```bash
setGlobals 1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
--channelID mychannel --name ccskuproductstockaccount --sequence 1 --version 1.0.1 \
--package-id ccskuproductstockaccount:82a9448370182efdd10db774f06ed75499029bde367acbea94a85eb5c41a98d5 \
--signature-policy "OR('Org1MSP.member', 'Org2MSP.member')" \
--tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
setGlobals 2
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
--channelID mychannel --name ccskuproductstockaccount --sequence 1 --version 1.0.1 \
--package-id ccskuproductstockaccount:82a9448370182efdd10db774f06ed75499029bde367acbea94a85eb5c41a98d5 \
--signature-policy "OR('Org1MSP.member', 'Org2MSP.member')" \
--tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

7. Commits the definition

- :fire: Use specifc endorsement policy to need only one org to endorse. To receive only one requisition from the peer.

```bash
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel \
--name ccskuproductstockaccount --version 1.0.1 --sequence 1 --tls \
--cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
--peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
--signature-policy "OR('Org1MSP.member', 'Org2MSP.member')" \
--peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt 
```


8. Test the chaincode.
- payload test
```json
{
  "tenantId":"tenantId",
  "sku":"sku",
  "sequence":1
}
```
```bash
peer chaincode query -C mychannel -n ccskuproductstockaccount -c '{"Args":["skuProductStockAccountExists","{\"tenantId\":\"tenantId\",\"sku\":\"sku\",\"sequece\":1}"]}'
```

#### ORG1

```
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

#### ORG2

```
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
```

#### ORG3

```
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051
```
