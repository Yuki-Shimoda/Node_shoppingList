const express = require('express');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');

const bodyParser = require('body-parser') // body-parser
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'))

const { Client　} = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'shop_list',
    password: 'postgres',
    port: 5432
});
client.connect()

app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
  );

app.use((req, res, next) => {
    if(req.session.username) {
        res.locals.username = req.session.username
    }
    next();
})

app.get('/', (req, res) =>{
    if(req.session.user_id) {
        client.query('SELECT * FROM items WHERE user_id = ($1) ORDER BY id',
        [req.session.user_id],
            (err, results) => {
                res.render('index.ejs', {items: results.rows})
            }
        )
    } else {
        res.render('index.ejs', {items: []})
    }

})

app.get('/add', (req, res) =>{
    if (req.session.user_id) {
        res.render('add.ejs')
    } else {
        res.render('login.ejs',{error: []})
    }
})

app.post('/add', (req, res) =>{
    client.query('INSERT INTO items (name, user_id) VALUES ($1, $2)',　[req.body.itemName, req.session.user_id],
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

app.get('/login', (req, res) =>{
    res.render('login.ejs', {error: ''})
})

app.post('/login', (req, res) =>{
    const email = req.body.email
    client.query('SELECT * FROM users WHERE email = ($1)',[email],
    (error, results) => {
        if (results.rows.length > 0) {
            const plain = req.body.password
            const hash = results.rows[0].password
            bcrypt.compare(plain, hash, (error, isEqual) => {
                if(isEqual) {
                    req.session.username = results.rows[0].name;
                    req.session.user_id = results.rows[0].id;
                    res.redirect('/')
                } else {
                    res.render('login.ejs', {error: 'パスワードが間違っています'})
                }
            })
        } else {
            res.render('login.ejs', {error: '登録がありません'})
        }
    })
})

app.get('/logout', (req, res) => {
    req.session.username = '';
    req.session.user_id = '';
    res.redirect('/')
})

app.get('/signup', (req, res) => {
    const errors = []
    res.render('signup.ejs', {errors: []});
})

app.post('/signup', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];
    client.query('SELECT * FROM users WHERE email = ($1)',
    [email],
    (error, results) => {
        if(results.rows.length > 0) {
            errors.push('すでにユーザー情報があります')
            res.render('signup.ejs', {errors: errors})
        } else {
        bcrypt.hash(password, 10, (error, hash) => {
            client.query('INSERT into users (name, email, password) VALUES ($1, $2, $3) RETURNING id', //RETURNINGを使うことでINSERTしたレコードの情報を返してくれる 
            [username, email, hash],
                (error, results) => {
                    // console.log(results.rows[0].id)
                    req.session.username = username;
                    req.session.user_id = results.rows[0].id
                    res.redirect('/')
                })
        })
 
        }
    })

})
app.listen(3000);