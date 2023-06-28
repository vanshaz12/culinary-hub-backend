const express = require('express')
const session = require('express-session');
const app = express()
const PORT = 3001
const fetch = require('node-fetch')
const dotenv = require('dotenv')
dotenv.config()

const usersRoutes = require('./routes/usersRoutes');
const recipesRoutes = require('./routes/recipesRoutes');
const listsRoutes = require('./routes/listsRoutes');
app.listen(PORT, () => console.log(`Server is listening here: http://localhost:${PORT}`))

app.use(
    session({
        key: 'user_sid',
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }
    })
);

function logger(req, res, next) {
    console.log(`${new Date()} ${req.method} ${req.path}`)

    // next() calls the next function in middleware to run
    next()
}

app.use(logger)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', usersRoutes);
app.use('/api', recipesRoutes);
app.use('/api', listsRoutes);




if (process.env.NODE_ENV === 'production') {
    const path = require('path')
    app.use(express.static(path.join(__dirname, 'build')));

    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}