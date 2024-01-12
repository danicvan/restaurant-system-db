// cartRoutes.js

const express = require('express');
const authenticateUserMiddleware = require('./middleware/authenticateUser');
const saveProductToCart = require('./helpers/saveProductToCart');

const router = express.Router();

router.get('/cart', async (req, res) => {
    try {
        const data = await fs.readFile('data/cart.json', 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading cart file:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/cart', authenticateUserMiddleware, async (req, res) => {
    try {
        const newCart = req.body;
        await saveProductToCart(newCart);
        res.json({ message: 'Cart data saved successfully!' });
    } catch (error) {
        console.error('Error saving cart data:', error);
        res.status(500).json({ error: 'Internal Sever Error' });
    }
});

module.exports = router;
