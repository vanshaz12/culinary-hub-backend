const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.SPOONACULAR_API_KEY

// Search recipes
router.get('/search-recipes', async (req, res) => {
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
});

// Fetch recipe details
router.get('/recipes/:id', async (req, res) => {
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

// Fetch recipe instructions
router.get('/recipes/:id/instructions', async (req, res) => {
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
});

// Fetch random recipe
router.get('/random-recipe', async (req, res) => {
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
});

module.exports = router;
