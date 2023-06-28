const express = require('express')
const session = require('express-session');
const app = express()
const PORT = 3001
const fetch = require('node-fetch')
const dotenv = require('dotenv')
dotenv.config()

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
// Handle user registration
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordDigest = await bcrypt.hash(password, saltRounds);

        // Insert the user profile into the database
        const newUser = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, passwordDigest]
        );

        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    } catch (error) {
        console.error('Error occurred during user registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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
        const match = await bcrypt.compare(password, user.rows[0].password);
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

// Check if the user is logged in
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
const API_KEY = process.env.SPOONACULAR_API_KEY


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
        const { id } = req.params

        // Fetch the recipe details from the Spoonacular API using the provided ID
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`)
        if (response.ok) {
            const recipe = await response.json()

            // Extract the necessary recipe details
            const { title, image, summary, extendedIngredients, instructions } = recipe

            // Normalize the extendedIngredients data
            let formattedIngredients = []
            if (extendedIngredients && Array.isArray(extendedIngredients)) {
                formattedIngredients = extendedIngredients.map((ingredient) => ingredient.original)
            }

            // Normalize the instructions data
            let formattedInstructions = []
            if (instructions && Array.isArray(instructions)) {
                formattedInstructions = instructions.map((instruction) => instruction.step)
            }

            // Return the recipe details
            res.status(200).json({
                title,
                image,
                summary,
                ingredients: formattedIngredients,
                instructions: formattedInstructions,
            })
        } else {
            console.error('Error occurred while fetching recipe details:', response.statusText)
            res.status(500).json({ message: 'Internal server error' })
        }
    } catch (error) {
        console.error('Error occurred while fetching recipe details:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

app.get('/api/recipes/:id/instructions', async (req, res) => {
    try {
        const { id } = req.params

        // Fetch the analyzed instructions from the Spoonacular API using the provided ID
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/analyzedInstructions?apiKey=${API_KEY}`)
        if (response.ok) {
            const instructions = await response.json()

            // Return the instructions data
            res.status(200).json(instructions)
        } else {
            console.error('Error occurred while fetching recipe instructions:', response.statusText)
            res.status(500).json({ message: 'Internal server error' })
        }
    } catch (error) {
        console.error('Error occurred while fetching recipe instructions:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

// Define your API endpoint for fetching random recipe
app.get('/api/random-recipe', async (req, res) => {
    try {
        // Make the API call to Spoonacular
        const response = await fetch(`https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}`)

        // Parse the response as JSON
        const data = await response.json()

        // Extract the recipe from the response data
        const recipe = data.recipes[0]

        // Send the recipe as the response
        res.json(recipe)
    } catch (error) {
        console.log('Error fetching random recipe:', error)
        res.status(500).json({ error: 'Failed to fetch random recipe' })
    }
})

// List handling route
//         |
//         |
//         V

// Create a new list (no authentication required)
app.post('/api/lists', async (req, res) => {
    try {
        const { name } = req.body;
        console.log('List name:', name); // Debug statement

        if (!req.session.user || !req.session.user.id || !req.session.user.name) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const id = req.session.user.id;

        // Insert the new list into the database with the user ID and name
        const listQuery = 'INSERT INTO lists (name, user_id) VALUES ($1, $2) RETURNING *';
        console.log('SQL query:', listQuery); // Debug statement
        const newListResult = await db.query(listQuery, [name, id]);
        console.log('New list created:', newListResult.rows[0]); // Debug statement
        res.status(201).json(newListResult.rows[0]);
    } catch (error) {
        console.error('Error occurred while creating a list:', error);
        res.status(500).json({ error: 'An error occurred while creating the list' });
    }
});



// Fetch all lists (no authentication required)
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

// Fetch a specific list by ID (no authentication required)
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

// Handle updating a list item
app.put('/api/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if the user wants to update the list name
        if (name && req.session.user) {
            // Perform authentication check
            const updatedList = await db.query('UPDATE lists SET name = $1 WHERE id = $2 AND creator = $3 RETURNING *', [
                name,
                id,
                req.session.user.id,
            ]);

            if (updatedList.rows.length === 0) {
                return res.status(404).json({ error: 'List not found or not authorized' });
            }

            res.status(200).json(updatedList.rows[0]);
        } else {
            // User only wants to update the list item without changing the name
            const updatedList = await db.query('UPDATE lists SET date = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [
                id,
            ]);

            if (updatedList.rows.length === 0) {
                return res.status(404).json({ error: 'List not found' });
            }

            res.status(200).json(updatedList.rows[0]);
        }
    } catch (error) {
        console.error('Error updating list item:', error);
        res.status(500).json({ error: 'An error occurred while updating the list item' });
    }
});

// Handle deleting a list item
app.delete('/api/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Perform authentication check
        const deletedList = await db.query('DELETE FROM lists WHERE id = $1 AND user_id = $2 RETURNING *', [
            id,
            req.session.user.id,
        ]);

        if (deletedList.rows.length === 0) {
            return res.status(404).json({ error: 'List not found or not authorized' });
        }

        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting list item:', error);
        res.status(500).json({ error: 'An error occurred while deleting the list item' });
    }
});
