const express = require('express');
const app = express();
const bodyParser = require('body-parser') // body-parser
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));

const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'shop_list',
    password: 'postgres',
    port: 5432
});
client.connect()

app.get('/', (req, res) =>{
    client.query('SELECT * FROM items ORDER BY id',
        (err, results) => {
            res.render('hello.ejs', {items: results.rows})
        }
    )
})

app.post('/add', (req, res) =>{
    client.query('INSERT INTO items (name) VALUES ($1)',　[req.body.itemName],
        (error, results)=> {
            res.redirect('/')
        }
    )
})

app.get('/edit/:id', (req, res) =>{
    client.query('SELECT * FROM items WHERE id = ($1)',[req.params.id],
        (err, results) => {
            res.render('edit.ejs', {item: results.rows[0]})
        }
    )
})

app.post('/edit/:id', (req, res) => {
    client.query('UPDATE items SET name= ($1) WHERE id = ($2)', [req.body.itemName, req.params.id],
        (error, results) => {
            res.redirect('/')
        }
    )
})

app.post('/delete/:id', (req, res) => {
    client.query('DELETE FROM items WHERE id = ($1)',　[req.params.id],
        (error, results) =>{
            res.redirect('/')
        }
    )
})

app.listen(3000);