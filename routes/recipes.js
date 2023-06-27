const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const API_KEY = 'bdcfcfd9559641359e3d1087f112d345';

router.get('/api/recipes/:id', async (req, res) => {
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

module.exports = router;
