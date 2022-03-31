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
    console.log(data) --> returns all data inside 'users'
});
*/


const app = express();

/* We are not needing this database
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
*/

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    db.select('*').from('users')
    .then(users => {res.json(users)})
    .catch(err => res.status(400).json('Unable to access database'))
})

// Sign in route
app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
        .where('email','=', req.body.email)
        .then(data => {
            const isPwValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isPwValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('Unable to get user information'))
            } else {
                res.status(400).json('User not found')
            }
        })
        .catch(err => res.status(400).json('Wrong credentials'))
    /* Old Method
    if (req.body.email === database.users[0].email && req.body.password === database.users[0].password) {
        res.json(database.users[0]);
    } else {
        res.status(400).json('Error loggin in')
    }
    */
})

//    bcrypt.hash(password, null, null, function(err, hash) {
//    console.log(`A new user is joined, password is: ${hash}`);
// });
//Bcrypt to encrypt passwords

// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

// Register route
app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        // with trx - syntax is different
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            // Be aware of the syntax - different from above!
            trx('users')
            .returning('*')
            .insert({
                name: name,
                email: loginEmail[0].email,
                joined: new Date()
            })
            .then(user => {
                // returning the user object
                res.json(user[0]);
            })
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .catch(err => res.status(400).json('Unable to register'))
    })
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
    db.select('*').from('users').where({'id': id})
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.status(400).json('User Not Found')
            }
        })
        .catch(err => res.status(400).json('Error getting user'))
    /* database.users.forEach(user => {
         if (user.id === id) {
             found = true;
             return res.json(user);
         } 
        })
    */
})

// Update the number of "entries"
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
    /* Old method

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
    */

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