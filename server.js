const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

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

/* db is working
db.select().from('users').then(data => {
    console.log(data)
});
*/

const app = express();

const database = {
    users: [
        {
            id: '123',
            name: 'John',
            email:'john@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Sally',
            email:'sally@gmail.com',
            password: 'bananas',
            entries: 0,
            joined: new Date()
        }
    ],
    login: [
        {
            id: '987',
            hash: '',
            email: 'john@gmail.com'
        }
    ]
}

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json(database.users);
})

// Sign in route
app.post('/signin', (req, res) => {
    if (req.body.email === database.users[0].email && req.body.password === database.users[0].password) {
        res.json(database.users[0]);
    } else {
        res.status(400).json('Error loggin in')
    }
})

// Register route
app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    bcrypt.hash(password, null, null, function(err, hash) {
        console.log(`A new user is joined, password is: ${hash}`);
    });
    db('users')
        .returning('*')
        .insert({
            name: name,
            email: email,
            joined: new Date()
        })
        .then(user => {
            // returning the user object
            res.json(user[0]);
        })
        .catch(err => res.status(400).json('Unable to register'))
})
    /* We are not going to use below OLD method:
    database.users.push({
        id: '125',
        name: name,
        email: email,
        // password: password,
        entries: 0,
        joined: new Date()
    })
    */

// Get user based on id
app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false
    db.select('*').from('users').where({'id': id})
        .then(user =>
        console.log(user[0]));
    // database.users.forEach(user => {
    //     if (user.id === id) {
    //         found = true;
    //         return res.json(user);
    //     } 
    // })
    if (!found) {
        res.status(400).json('User not found')
    }
})

// Update the number of "entries"
app.put('/image', (req, res) => {
    const { id } = req.body;
    let found = false
    database.users.forEach(user => {
        if (user.id === id) {
            found = true;
            user.entries ++;    
            return res.json(user.entries);
        } 
    })
    if (!found) {
        res.status(400).json('User not found')
    }
})

//Bcrypt to encrypt passwords


// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(3001, () => {
    console.log('App in running on port 3001')
});

/*
**************Brainstorm session***************
/                                       --> res = this is working
/signin                                 --> POST (send user information); then res success/fail
/register                               --> POST (add data to database); return new user object
/profile/:userId (with optional param)  --> GET; return user
/image                                  --> PUT (update user info); return updated user object

*/