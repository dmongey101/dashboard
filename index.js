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
        text: 'SELECT * FROM assets WHERE current_balance > 0',
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
                res.render('index', {balances: query_res.rows, totalBalance: total})
            }
            client.end()
        }
    })
})

server.listen(PORT)