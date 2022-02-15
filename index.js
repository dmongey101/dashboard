var EventSource = require('eventsource');
var PORT = process.env.PORT || 3000
const express = require('express')
const app = express()
const server = require('http').Server(app)
const path = require('path');
const { Pool, Client } = require('pg');
const dotenv = require('dotenv');
const { assert } = require('console');

dotenv.config();

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', './views')
app.set('view engine', 'ejs')

const connectionString = process.env.CONNSTRING

app.get('/', async (req, res) => {
    let balances = [];
    const pool = new Pool({
        connectionString,
    })

    const yesterday = new Date(Date.now() - (24*3600000)).toISOString();

    const selectQuery = {
        text: 'SELECT * FROM assets WHERE current_balance > 5 OR current_balance < 0',
        values: [],
    }

    const res1 = await pool.query(selectQuery);
    console.log(res1.rowCount)
    let total = 0
    if (res1.rowCount > 0) {
        for await (let asset of res1.rows) {
            let obj = {}
            obj["name"] = asset.name
            obj["type"] = asset.type
            obj["chain"] = asset.chain
            obj["current_balance"] = asset.current_balance
            obj["change"] = 0
            const selectAssetQuery = {
                text: 'SELECT * FROM token_balances WHERE asset_id = $1 AND tick < $2 ORDER BY tick DESC LIMIT 1;',
                values: [asset.id, yesterday],
            }
            if (asset.name == 'fgOHM-6') {
                console.log(selectAssetQuery)
            }
            const res2 = await pool.query(selectAssetQuery);
            if (res2.rowCount > 0) {
                obj["change"] = ((asset["current_balance"] - res2.rows[0]["balanceusd"]) / res2.rows[0]["balanceusd"]) * 100
            }
            total += asset.current_balance
            balances.push(obj)
        }
        balances.sort((a, b) => {
            let fa = a.current_balance,
                fb = b.current_balance;
        
            if (fa > fb) {
                return -1;
            }
            if (fa < fb) {
                return 1;
            }
            return 0;
        });
    }
    await pool.end()
    console.log(balances)
    res.render('index', {page: 'Treasury', balances: balances, totalBalance: total.toFixed(2)})
})

app.get('/stables', (req, res) => {
    const client = new Client(process.env.CONNSTRING)
    try {
        client.connect();
    } catch (err) {
        console.log(err);
    }
    const selectQuery = {
        text: `SELECT * FROM assets where type = 'stablecoin'`,
        values: [],
    }
    client.query(selectQuery, (err, query_res) => {
        if (err) {
            console.log(err);
        } else {
            if (query_res.rows.length > 0) {
                let total = 0
                query_res.rows.forEach(asset => {
                    total += asset.current_balance
                })
                query_res.rows.sort((a, b) => {
                    let fa = a.current_balance,
                        fb = b.current_balance;
                
                    if (fa > fb) {
                        return -1;
                    }
                    if (fa < fb) {
                        return 1;
                    }
                    return 0;
                });
                client.end()
                res.render('index', {page: 'Stables', balances: query_res.rows, totalBalance: total.toFixed(2)})
            }
        }
    })
})

app.get('/nfts', (req, res) => {
    const client = new Client(process.env.CONNSTRING)
    try {
        client.connect();
    } catch (err) {
        console.log(err);
    }
    const selectQuery = {
        text: `SELECT * FROM assets where type = 'nft'`,
        values: [],
    }
    client.query(selectQuery, (err, query_res) => {
        if (err) {
            console.log(err);
        } else {
            if (query_res.rows.length > 0) {
                let total = 0
                query_res.rows.forEach(asset => {
                    total += asset.current_balance
                })
                query_res.rows.sort((a, b) => {
                    let fa = a.current_balance,
                        fb = b.current_balance;
                
                    if (fa > fb) {
                        return -1;
                    }
                    if (fa < fb) {
                        return 1;
                    }
                    return 0;
                });
                client.end()
                res.render('index', {page: 'NFTs', balances: query_res.rows, totalBalance: total.toFixed(2)})
            }
        }
    })
})

app.get('/debt', (req, res) => {
    const client = new Client(process.env.CONNSTRING)
    try {
        client.connect();
    } catch (err) {
        console.log(err);
    }
    const selectQuery = {
        text: `SELECT * FROM assets where current_balance < 0`,
        values: [],
    }
    client.query(selectQuery, (err, query_res) => {
        if (err) {
            console.log(err);
        } else {
            if (query_res.rows.length > 0) {
                let total = 0
                query_res.rows.forEach(asset => {
                    total += asset.current_balance
                })
                query_res.rows.sort((a, b) => {
                    let fa = a.current_balance,
                        fb = b.current_balance;
                
                    if (fa > fb) {
                        return -1;
                    }
                    if (fa < fb) {
                        return 1;
                    }
                    return 0;
                });
                client.end()
                res.render('index', {page: 'Debt', balances: query_res.rows, totalBalance: total.toFixed(2)})
            }
        }
    })
})

server.listen(PORT)