var EventSource = require('eventsource');
var PORT = process.env.PORT || 3000
const express = require('express')
const app = express()
const server = require('http').Server(app)
const path = require('path');
const { Pool, Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    const client = new Client(process.env.CONNSTRING)
    try {
        client.connect();
    } catch (err) {
        console.log(err);
    }

    const selectQuery = {
        text: 'SELECT * FROM assets WHERE current_balance > 5 OR current_balance < 0',
        values: [],
    }
    client.query(selectQuery, (err, query_res) => {
        if (err) {
            console.log(err.stack)
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
                res.render('index', {page: 'Treasury', balances: query_res.rows, totalBalance: total.toFixed(2)})
            }
        }
    })
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