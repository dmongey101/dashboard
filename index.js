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
    res.render('index', {page: 'Treasury', balances: balances, totalBalance: total.toFixed(2)})
})

app.get('/stables', async (req, res) => {
    let balances = [];
    const pool = new Pool({
        connectionString,
    })
    const selectQuery = {
        text: `SELECT * FROM assets where type = 'stablecoin'`,
        values: [],
    }

    const yesterday = new Date(Date.now() - (24*3600000)).toISOString();
    
    const res1 = await pool.query(selectQuery)
    if (res1.rowCount > 0) {
        let total = 0

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
        await pool.end()
        res.render('index', {page: 'Stables', balances: balances, totalBalance: total.toFixed(2)})
    }
})

app.get('/nfts', async (req, res) => {
    let balances = [];
    const pool = new Pool({
        connectionString,
    })
    const selectQuery = {
        text: `SELECT * FROM assets where type = 'nft'`,
        values: [],
    }

    const yesterday = new Date(Date.now() - (24*3600000)).toISOString();
    
    const res1 = await pool.query(selectQuery)
    if (res1.rowCount > 0) {
        let total = 0

        for await (let asset of res1.rows) {
            let obj = {}
            obj["name"] = asset.name
            obj["type"] = asset.type
            obj["chain"] = asset.chain
            obj["current_balance"] = asset.current_balance
            obj["change"] = 0
            const selectAssetQuery = {
                text: 'SELECT * FROM nft_balances WHERE asset_id = $1 AND tick < $2 ORDER BY tick DESC LIMIT 1;',
                values: [asset.id, yesterday],
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
        await pool.end()
        res.render('index', {page: 'NFTs', balances: balances, totalBalance: total.toFixed(2)})
    }
})

app.get('/debt', async (req, res) => {
    let balances = [];
    const pool = new Pool({
        connectionString,
    })
    const selectQuery = {
        text: `SELECT * FROM assets where current_balance < 0`,
        values: [],
    }

    const yesterday = new Date(Date.now() - (24*3600000)).toISOString();
    
    const res1 = await pool.query(selectQuery)
    if (res1.rowCount > 0) {
        let total = 0

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
        await pool.end()
        res.render('index', {page: 'Debt', balances: balances, totalBalance: total.toFixed(2)})
    }
})

server.listen(PORT)