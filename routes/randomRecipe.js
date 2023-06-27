const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const API_KEY = 'bdcfcfd9559641359e3d1087f112d345';
const API_URL = 'https://api.spoonacular.com/recipes';

router.get('/api/random-recipe', async (req, res) => {
    try {
        // Make the API call to Spoonacular
        const response = await fetch(`https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}`);

        // Parse the response as JSON
        const data = await response.json();

        // Extract the recipe from the response data
        const recipe = data.recipes[0];

        // Send the recipe as the response
        res.json(recipe);
    } catch (error) {
        console.log('Error fetching random recipe:', error);
        res.status(500).json({ error: 'Failed to fetch random recipe' });
    }
});

module.exports = router;
