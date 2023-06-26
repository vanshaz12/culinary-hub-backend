const express = require('express')
const session = require('express-session');
const app = express()
const cors = require('cors')
const PORT = 3001
const fetch = require('node-fetch')

app.use(cors())

// Import the necessary dependencies for interacting with the database
const db = require('./db/db')
const bcrypt = require('bcrypt')

app.listen(PORT, () => console.log(`Server is listening here: http://localhost:${PORT}`))

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to the server')
})

app.use(
    session({
        key: 'user_sid',
        secret: 'jvdjsvcjvcjsvcmhscmfg3i7g',
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
// Handle user registration
app.post('/api/signup', async (req, res) => {
    // Check if the itemName is null or empty
    if (!itemName) {
        console.error('Item name cannot be empty');
        return;
    }
    try {
        const { name, email, password } = req.body

        // Check if the user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // Hash the password
        const saltRounds = 10
        const passwordDigest = await bcrypt.hash(password, saltRounds)

        // Insert the user profile into the database
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_digest) VALUES ($1, $2, $3) RETURNING *',
            [name, email, passwordDigest]
        )

        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] })
    } catch (error) {
        console.error('Error occurred during user registration:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

// Handle user login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare the provided password with the stored password
        const match = await bcrypt.compare(password, user.rows[0].password_digest);
        if (!match) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Set the session data
        req.session.user = {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
        };

        // Login successful
        console.log('User logged in:', user.rows[0].name);
        res.status(200).json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
        console.error('Error occurred during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Check if the user is logged in
app.get('/api/check-login', (req, res) => {
    console.log('req.session.user:', req.session.user);
    if (req.session.user) {
        // User is logged in
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        // User is not logged in
        res.status(200).json({ loggedIn: false });
    }
});


//Logging the user out 
// User logout
app.get('/api/logout', (req, res) => {
    // Clear the session data
    req.session.destroy((err) => {
        if (err) {
            console.error('Error occurred during logout:', err);
            res.clearCookie('user_sid')
            res.status(500).json({ message: 'Internal server error' });
        } else {
            res.clearCookie('user_sid')
            res.status(200).json({ message: 'Logout successful' });
        }
    });
});


const API_KEY = 'bdcfcfd9559641359e2535faefbfa73d'


app.get('/api/search-recipes', async (req, res) => {
    try {
        const { query } = req.query
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=${query}`)
        if (response.ok) {
            const data = await response.json()
            res.json(data)
        } else {
            console.error('Error occurred during recipe search:', response.statusText)
            res.status(500).json({ error: 'Internal server error' })
        }
    } catch (error) {
        console.error('Error occurred during recipe search:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/api/recipes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the recipe details from the Spoonacular API using the provided ID
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`);
        if (response.ok) {
            const recipe = await response.json();

            // Extract the necessary recipe details
            const { title, image, summary, extendedIngredients, instructions } = recipe;

            // Normalize the extendedIngredients data
            let formattedIngredients = [];
            if (extendedIngredients && Array.isArray(extendedIngredients)) {
                formattedIngredients = extendedIngredients.map((ingredient) => ingredient.original);
            }

            // Normalize the instructions data
            let formattedInstructions = [];
            if (instructions && Array.isArray(instructions)) {
                formattedInstructions = instructions.map((instruction) => instruction.step);
            }

            // Return the recipe details
            res.status(200).json({
                title,
                image,
                summary,
                ingredients: formattedIngredients,
                instructions: formattedInstructions,
            });
        } else {
            console.error('Error occurred while fetching recipe details:', response.statusText);
            res.status(500).json({ message: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error occurred while fetching recipe details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/recipes/:id/instructions', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the analyzed instructions from the Spoonacular API using the provided ID
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/analyzedInstructions?apiKey=${API_KEY}`);
        if (response.ok) {
            const instructions = await response.json();

            // Return the instructions data
            res.status(200).json(instructions);
        } else {
            console.error('Error occurred while fetching recipe instructions:', response.statusText);
            res.status(500).json({ message: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error occurred while fetching recipe instructions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/lists/:listId/items', async (req, res) => {
    try {
        const { listId } = req.params;
        const { name } = req.body;

        // Check if the user is authenticated and the session is set
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify that the user has the necessary permissions to create items in the list
        const listQuery = 'SELECT * FROM lists WHERE id = $1 AND user_id = $2';
        const listResult = await pool.query(listQuery, [listId, req.session.user.id]);

        if (listResult.rows.length === 0) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Insert the new list item into the database
        const itemQuery = 'INSERT INTO list_items (list_id, name) VALUES ($1, $2) RETURNING *';
        const newItemResult = await pool.query(itemQuery, [listId, name]);

        res.status(201).json(newItemResult.rows[0]);
    } catch (error) {
        console.error('Error occurred while creating a list item:', error);
        res.status(500).json({ error: 'An error occurred while creating the list item' });
    }
});

// Create a new list
app.post('/api/lists', async (req, res) => {
    try {
        // Check if the user is authenticated and the session is set
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get the necessary data from the request body
        const { name } = req.body;
        const userId = req.session.user.id;

        // Insert the new list into the database
        const newList = await db.query('INSERT INTO lists (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name]);

        res.status(201).json(newList.rows[0]);
    } catch (error) {
        console.error('Error occurred while creating a list:', error);
        res.status(500).json({ error: 'An error occurred while creating the list' });
    }
});



// Fetch all lists
app.get('/api/lists', async (req, res) => {
    try {
        // Retrieve all lists from the database
        const lists = await db.query('SELECT * FROM lists');

        res.status(200).json(lists.rows);
    } catch (error) {
        console.error('Error fetching lists:', error);
        res.status(500).json({ error: 'An error occurred while fetching the lists' });
    }
});

// Fetch a specific list by ID
app.get('/api/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve the list from the database based on the provided ID
        const list = await db.query('SELECT * FROM lists WHERE id = $1', [id]);

        if (list.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.status(200).json(list.rows[0]);
    } catch (error) {
        console.error('Error fetching list:', error);
        res.status(500).json({ error: 'An error occurred while fetching the list' });
    }
});

// Update a specific list by ID
app.put('/api/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Update the list in the database based on the provided ID
        const updatedList = await db.query('UPDATE lists SET name = $1 WHERE id = $2 RETURNING *', [name, id]);

        if (updatedList.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.status(200).json(updatedList.rows[0]);
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ error: 'An error occurred while updating the list' });
    }
});

// Delete a specific list by ID
app.delete('/api/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete the list from the database based on the provided ID
        const deletedList = await db.query('DELETE FROM lists WHERE id = $1 RETURNING *', [id]);

        if (deletedList.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.status(200).json(deletedList.rows[0]);
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({ error: 'An error occurred while deleting the list' });
    }
});


