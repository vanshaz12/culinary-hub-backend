const express = require('express');
const router = express.Router();
const db = require('../db/db');

const isAuthenticated = (req, res, next) => {
    // Check if the user is authenticated
    if (req.session.user) {
        next(); // User is authenticated, proceed to the next middleware or route handler
    } else {
        res.status(401).json({ message: 'Unauthorized' }); // User is not authenticated, return unauthorized status
    }
};

router.post('/api/lists/:listId/items', async (req, res) => {
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

router.post('/api/lists', isAuthenticated, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.session.user.id;

        const newList = await db.query(
            'INSERT INTO lists (name, user_id) VALUES ($1, $2) RETURNING *',
            [name, userId]
        );

        res.status(201).json(newList.rows[0]);
    } catch (error) {
        console.error('Error occurred while creating a list item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/api/lists', async (req, res) => {
    try {
        // Retrieve all lists from the database
        const lists = await db.query('SELECT * FROM lists');

        res.status(200).json(lists.rows);
    } catch (error) {
        console.error('Error fetching lists:', error);
        res.status(500).json({ error: 'An error occurred while fetching the lists' });
    }
});

router.get('/api/lists/:id', async (req, res) => {
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


router.put('/api/lists/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.session.user.id;

        const updatedList = await db.query(
            'UPDATE lists SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [name, id, userId]
        );

        if (updatedList.rows.length === 0) {
            return res.status(404).json({ message: 'List item not found or unauthorized' });
        }

        res.status(200).json(updatedList.rows[0]);
    } catch (error) {
        console.error('Error occurred while updating a list item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.delete('/api/lists/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;

        const deletedList = await db.query(
            'DELETE FROM lists WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (deletedList.rows.length === 0) {
            return res.status(404).json({ message: 'List item not found or unauthorized' });
        }

        res.status(200).json({ message: 'List item deleted successfully' });
    } catch (error) {
        console.error('Error occurred while deleting a list item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
