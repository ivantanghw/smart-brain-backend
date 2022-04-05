const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

// Import controllers
const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');

// GRPC
const {ClarifaiStub, grpc} = require("clarifai-nodejs-grpc");
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key 3ef7c5cbf81b4bcc863b3abef3fc0834");

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'admin',
      database : 'smart-brain'
    }
  });

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    db.select('*').from('users')
    .then(users => {res.json(users)})
    .catch(err => res.status(400).json('Unable to access database'))
})

app.post('/signin', (req, res) => { signin.handleSignin(req, res, db, bcrypt) })
app.post('/register', register.handleRegister(db, bcrypt)) 
app.get('/profile/:id', (req, res) => { profile.handleProfile(req, res, db) })
// Update the number of "entries", below we will use the old method
app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where({
        id: id
    })
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('Unable to get/update entries'))
  })

app.post('/imageUrl', (req, res) => {
  stub.PostModelOutputs(
    {
        model_id: "a403429f2ddf4b49b307e318f00e528b",
        inputs: [
            {data: {image: {url: req.body.input}}}
        ]
    },
    metadata,
    (err, response) => {
        if (err) {
            throw new Error(err);
        }
        if (response.status.code !== 10000) {
            throw new Error("Post model outputs failed, status: " + response.status.description);
        }
        return res.json(response);
    }
  )
})

app.listen(3001, () => {
    console.log('App in running on port 3001')
});
