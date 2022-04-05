const handleSignin = (req, res, db, bcrypt) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('The form submission is incorrect.')
    }
    db.select('email', 'hash').from('login')
        .where('email','=', email)
        .then(data => {
            const isPwValid = bcrypt.compareSync(password, data[0].hash);
            if (isPwValid) {
                return db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('Unable to get user information'))
            } else {
                return res.status(400).json('User not found')
            }
        })
        .catch(err => res.status(400).json('Wrong credentials'))
}

module.exports = {
    handleSignin: handleSignin
}