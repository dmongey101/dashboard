var EventSource = require('eventsource');
const { Pool, Client } = require('pg');
const dotenv = require('dotenv');
var uuid = require('uuid');
const ethers = require('ethers')
const LPTokenABI = require('./abis/LPToken.json')
const ProtofiMasterChefABI = require('./abis/ProtofiMasterChef.json')

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

const connectionString = process.env.CONNSTRING

const provider = new ethers.providers.JsonRpcProvider('https://rpc.ftm.tools/')
let wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
wallet = wallet.connect(provider);

const main = () => {
    const pool = new Pool({
        connectionString,
    })
    var balances = []
    var tokenTotalBalance = 0
    var nftTotalBalance = 0
    addresses.forEach(address => {
        var es = new EventSource(`https://api.zapper.fi/v1/balances?addresses%5B0%5D=${address.address}&nonNilOnly=true&networks%5B0%5D=ethereum&networks%5B1%5D=polygon&networks%5B2%5D=optimism&networks%5B3%5D=gnosis&networks%5B4%5D=binance-smart-chain&networks%5B5%5D=fantom&networks%5B6%5D=avalanche&networks%5B7%5D=arbitrum&networks%5B8%5D=celo&networks%5B9%5D=harmony&networks%5B10%5D=moonriver&api_key=562eee97-e90e-42ac-8e7b-363cdff5cdaa`);
        es.on('start', function(e) {
            // status event
            console.log("Event Started")
          }).on('balance', function(e) {
            // result event
            let data2 = JSON.parse(e.data);
            if (data2.balances[address.address] !== undefined || data2.balances[address.address] !== null || typeof(data2.balances[address.address]) != "undefined") {
                if (data2.balances[address.address].products.length > 0) {
                    data2.balances[address.address].products.forEach(product => {
                        // console.log(product.label)
                        product.assets.forEach(asset => {
                            asset.tokens.forEach(token => {
                                let obj = {};
                                if (asset.appId != "superfluid" && (address.address != "0x3d7d429a7962d5d082a10558592bb7d29eb9211b" || address.address != "0x418ea8e4ab433ae27390874a467a625f65f131b8")) {
                                    const assetItm = balances.filter(b => b.token == token.symbol && b.chain == token.network)
                                    if (assetItm.length > 0 ) {
                                        assetItm[0]['balance'] += token.balanceUSD
                                    } else {
                                        obj['token'] = token.symbol
                                        obj['chain'] = token.network
                                        obj['type'] = token.type
                                        obj['balance'] = token.balanceUSD
                                        balances.push(obj)
                                    }
                                    if (token.symbol == 'USDC' && token.network == 'fantom') {
                                        console.log(token.balanceUSD)
                                    }
                                    if (token.balanceUSD > 0) {
                                        if (token.type == 'nft') {
                                            nftTotalBalance += token.balanceUSD                    
                                        } else {
                                            tokenTotalBalance += token.balanceUSD
                                        }
                                    }
                                }
                            })  
                        })
                    });
                }
            }
          }).on('end', async () => {

            console.log('End');
            es.close();

            let nullCheckString = '('
            if (address.address == "0x9faa04cd0a0b0624560315c9630f36d9192c67b5") {
                setTimeout(async () => {
                    for await (let balance of balances) {
                        try {
                            let tokenType
                            let allocation
                            if (balance.type == 'nft') {
                                tokenType = 'nfts'
                                allocation = (balance.balance / nftTotalBalance) * 100
                            } else {
                                if (balance.token == 'USDC' && balance.chain == 'fantom') {
                                    console.log(token.balanceUSD)
                                    console.log('*******************')
                                    console.log('*******************')
                                    console.log('*******************')
                                    console.log('*******************')
                                    console.log('*******************')
                                }
                                tokenType = 'tokens'
                                allocation = (balance.balance / tokenTotalBalance) * 100
                            }

                            nullCheckString += `'${balance.token}'` + ','

                            const selectQuery = {
                                 text: `SELECT * FROM ${tokenType} WHERE name = $1 AND chain = $2`,
                                values: [balance.token, balance.chain],
                            }
                            const res1 = await pool.query(selectQuery)
                            if (res1.rowCount < 1) {
                                const insertQuery = {
                                    text: `INSERT INTO ${tokenType} (id, name, chain, type, current_balance, portfolio_allocation) VALUES ($1, $2, $3, $4, $5, $6)`,
                                    values: [uuid.v4(), balance.token, balance.chain, balance.type, balance.balance, allocation],
                                }
                                await pool.query(insertQuery)
                                console.log('Added token')
                            } else {
                                const updateQuery = {
                                    text: `UPDATE ${tokenType} SET current_balance = $1, portfolio_allocation = $2 WHERE name = $3 AND chain = $4`,
                                    values: [balance.balance, allocation, balance.token, balance.chain],
                                }
                                await pool.query(updateQuery)
                                console.log('Updated balance')
                            }
                        } catch (err) {
                            console.log(err)
                        }
                    }
                    nullCheckString = nullCheckString.slice(0, -1)
                    nullCheckString += ')'
                    console.log(nullCheckString)
                    const setZeroQueryTokens = {
                        text: `UPDATE tokens SET current_balance = 0, portfolio_allocation = 0 WHERE name not in ${nullCheckString}`,
                        values: [],
                    }
                    const setZeroQueryNFTS = {
                        text: `UPDATE nfts SET current_balance = 0, portfolio_allocation = 0 WHERE name not in ${nullCheckString}`,
                        values: [],
                    }
                    try {
                        await pool.query(setZeroQueryTokens)
                        await pool.query(setZeroQueryNFTS)
    
                    } catch (err) {
                        console.log(err)
                    }

                    await pool.end()
                }, 15000);
                
            }
          });
    })
}

const test = async () => {
    const pool = new Pool({
        connectionString,
    })

    const protoLpContract = new ethers.Contract('0x427EFB4C731b38530C29Ce475B249A15f028cc8A', LPTokenABI.abi, wallet)
    const protofiMasterChefContract = new ethers.Contract("0xa71f52aee8311c22b6329EF7715A5B8aBF1c6588", ProtofiMasterChefABI.abi, provider)

    const reserves = await protoLpContract.getReserves()
    let marketPrice = reserves[0] / reserves[1] * 1000000000000
    let balance = await protofiMasterChefContract.userInfo(3, '0x307B92039FbF218D79FF9BFb0E55a9087cc407A2')
    balance = ethers.utils.formatEther(balance.amount)
    console.log(marketPrice)
    console.log(balance)
    const protoBalanceUSD = marketPrice * balance
    console.log(protoBalanceUSD)


//     const selectQuery = {
//         text: `SELECT * FROM nfts WHERE current_balance > 0`,
//        values: [],
//    }
//    const res1 = await pool.query(selectQuery)
//    let balance = 0
//    res1.rows.forEach(asset => {
//         balance += asset.portfolio_allocation
//    })
//    console.log(balance)
//    pool.end()
}

main();