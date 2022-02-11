var EventSource = require('eventsource');
const { Pool, Client } = require('pg');
const dotenv = require('dotenv');
var uuid = require('uuid');

dotenv.config();

let addresses = [
    {
        "name": "Tarzan",
        "address": "0x3d7d429a7962d5d082a10558592bb7d29eb9211b"
    },
    {
        "name": "Creepy",
        "address": "0x9faa04cd0a0b0624560315c9630f36d9192c67b5"
    },
    {
        "name": "Sokratrees",
        "address": "0x418ea8e4ab433ae27390874a467a625f65f131b8"
    },
    {
        "name": "Time Bond Bot",
        "address": "0xc0bd780a50a3f49bd537cbe18fa39769579461ad"
    },
    {
        "name": "Klima Bot",
        "address": "0x5e2ace1ba9fc3552b5268bc6a35edfbda00797dd"
    },
    {
        "name": "Eth Gnosis",
        "address": "0xae9a6a7386680f4228109526f994421a51b412af"
    },
    {
        "name": "Poly Gnosis",
        "address": "0xdf924446d08c642e0b1df15089e2ab87f737a544"
    },
    {
        "name": "Arb Gnosis",
        "address": "0x43ac3521af61d774d5f4db6f24d69ec9499f1057"
    },
    {
        "name": "Arb Gnosis 2",
        "address": "0x3a308ae2912450c96fe8a76a016fe0ba17a8184d"
    },
    {
        "name": "Avax Gnosis",
        "address": "0xb435a68d8ebb99b2e9c8ce98e011619d69eb55ee"
    },
    {
        "name": "Rari Wallet",
        "address": "0xea9f4810f6e82231c5b93d455bb7f45d461098d6"
    }
]

const main = () => {
    var balances = [];
    addresses.forEach(address => {
        // let productObj = {};
        // productObj["name"] = address.name;
        // productObj["assets"] = [];
        // productObj["total"] = 0;
        var es = new EventSource(`https://api.zapper.fi/v1/balances?addresses%5B0%5D=${address.address}&nonNilOnly=true&networks%5B0%5D=ethereum&networks%5B1%5D=polygon&networks%5B2%5D=optimism&networks%5B3%5D=gnosis&networks%5B4%5D=binance-smart-chain&networks%5B5%5D=fantom&networks%5B6%5D=avalanche&networks%5B7%5D=arbitrum&networks%5B8%5D=celo&networks%5B9%5D=harmony&networks%5B10%5D=moonriver&api_key=562eee97-e90e-42ac-8e7b-363cdff5cdaa`);
        es.on('start', function(e) {
            // status event
            console.log("Event Started");
          }).on('balance', function(e) {
            // result event
            let data2 = JSON.parse(e.data);
            if (typeof(data2.balances[address.address]) !== 'undefined') {
                if (data2.balances[address.address].products.length > 0) {
                    data2.balances[address.address].products.forEach(product => {
                        // console.log(product.label)
                        product.assets.forEach(asset => {
                            asset.tokens.forEach(token => {
                                let obj = {};
                                
                                if (asset.appId != "superfluid" && (address.address != "0x3d7d429a7962d5d082a10558592bb7d29eb9211b" || address.address != "0x418ea8e4ab433ae27390874a467a625f65f131b8")) {
                                    // let obj = {}
                                    if (token.balanceUSD > 5 || token.balanceUSD < 0) {
                                        const assetItm = balances.filter(b => b.token == token.symbol && b.chain == token.network);
                                        if (assetItm.length > 0 ) {
                                            assetItm[0]['balance'] += token.balanceUSD;
                                        } else {
                                            obj['token'] = token.symbol;
                                            obj['chain'] = token.network;
                                            obj['type'] = token.type;
                                            obj['balance'] = token.balanceUSD;
                                            balances.push(obj);
                                        }
                                    }
                                }
                            })  
                        })
                    });
                }
            }
          }).on('end', function() {
            console.log('End');
            es.close();
            if (address.address == "0x9faa04cd0a0b0624560315c9630f36d9192c67b5") {
                setTimeout(function(){
                    const client = new Client(process.env.CONNSTRING)
                    client.connect();
                    let lastBalance = balances[balances.length - 1];
                    balances.forEach(balance => {
                        const selectQuery = {
                            text: 'SELECT * FROM assets WHERE name = $1 AND chain = $2',
                            values: [balance.token, balance.chain],
                        }
                        client.query(selectQuery, (err, res) => {
                            if (err) {
                                console.log(err.stack)
                            } else {
                                if (res.rowCount < 1) {
                                    const insertQuery = {
                                        text: 'INSERT INTO assets(id, name, chain, type, current_balance) VALUES ($1, $2, $3, $4, $5)',
                                        values: [uuid.v4(), balance.token, balance.chain, balance.type, balance.balance],
                                    }
                                    client.query(insertQuery, (err, res) => {
                                        if (err) {
                                            console.log(err.stack)
                                        } else {
                                            console.log('Added token')
                                            if (balance.token == lastBalance.token && balance.chain == lastBalance.chain) {
                                                client.end()
                                                console.log('Closing Connection')
                                            }
                                        }
                                    })
                                } else {
                                    const updateQuery = {
                                        text: 'UPDATE assets SET current_balance = $1 WHERE name = $2 AND chain = $3',
                                        values: [balance.balance, balance.token, balance.chain],
                                    }
                                    client.query(updateQuery, (err, res) => {
                                        if (err) {
                                            console.log(err.stack)
                                        } else {
                                            console.log('Updated balance')
                                            if (balance.token == lastBalance.token && balance.chain == lastBalance.chain) {
                                                console.log('Closing Connection')
                                                client.end()
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    })
                    // console.log('Total Balance: $' + balance);
                    // res.render('index', { balances: balances, totalBalance: balance.toFixed(2) });
                }, 8000);
                
            }
          });
    })
}

main();