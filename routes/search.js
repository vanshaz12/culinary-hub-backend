const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const API_KEY = 'bdcfcfd9559641359e3d1087f112d345';
const API_URL = 'https://api.spoonacular.com/recipes';

router.get('/api/recipes/:id/instructions', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the analyzed instructions from the Spoonacular API using the provided ID
        const response = await fetch(`${API_URL}/${id}/analyzedInstructions?apiKey=${API_KEY}`);
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

router.get('/api/search-recipes', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await fetch(`${API_URL}/complexSearch?apiKey=${API_KEY}&query=${query}`);
        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            console.error('Error occurred during recipe search:', response.statusText);
            res.status(500).json({ error: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error occurred during recipe search:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
