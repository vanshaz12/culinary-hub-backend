const express = require('express');
const router = express.Router();
const db = require('../db/db');
// const app = express()
// app.use(express.json());

// Create a new list
router.post('/lists', async (req, res) => {
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
});

// Fetch all lists created by the user
router.get('/lists', async (req, res) => {
    try {
        const userId = req.session.user.id; // Assuming the user ID is stored in the session

        // Retrieve lists created by the logged-in user from the database
        const lists = await db.query('SELECT * FROM lists WHERE user_id = $1', [userId]);

        res.status(200).json(lists.rows);
    } catch (error) {
        console.error('Error fetching lists:', error);
        res.status(500).json({ error: 'An error occurred while fetching the lists' });
    }
});

// Update a list item
router.put('/lists/:id', async (req, res) => {
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

// Delete a list item
router.delete('/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;

        // Perform authentication and authorization check
        const deletedList = await db.query('DELETE FROM lists WHERE id = $1 AND user_id = $2 RETURNING *', [
            id,
            userId,
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

// Add a recipe to a list
router.post('/lists/:listId/recipes', async (req, res) => {
    const listId = parseInt(req.params.listId);
    const { spoonacularId, title } = req.body;

    try {
        // Check if the list exists
        const checkListQuery = 'SELECT * FROM lists WHERE id = $1';
        const listResult = await db.query(checkListQuery, [listId]);

        if (listResult.rowCount === 0) {
            // List not found, send a 404 response
            return res.status(404).json({ error: 'List not found' });
        }

        // Insert the recipe title into the list_recipes table
        const insertRecipeQuery = 'INSERT INTO list_recipes (list_id, title) VALUES ($1, $2) RETURNING *';
        const insertedRecipe = await db.query(insertRecipeQuery, [listId, title]);

        res.status(201).json(insertedRecipe.rows[0]);
    } catch (error) {
        console.error('Error occurred while adding the recipe to the list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch recipes in a list
router.get('/lists/:listId/recipes', async (req, res) => {
    const listId = parseInt(req.params.listId);

    try {
        // Retrieve the recipes associated with the list from the list_recipes table
        const recipes = await db.query('SELECT * FROM list_recipes WHERE list_id = $1', [listId]);

        res.status(200).json(recipes.rows);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'An error occurred while fetching the recipes' });
    }
});

// Fetch a list by ID
router.get('/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve the list item from the database based on the provided ID
        const list = await db.query('SELECT * FROM lists WHERE id = $1', [id]);

        if (list.rowCount === 0) {
            // List not found, send a 404 response
            return res.status(404).json({ error: 'List not found' });
        }

        res.status(200).json(list.rows[0]);
    } catch (error) {
        console.error('Error fetching list item:', error);
        res.status(500).json({ error: 'An error occurred while fetching the list item' });
    }
});

module.exports = router;
