const express = require("express");
app.use(express.json());

async function saveProductToCart(newCart) {
    let existingData = [];
    try {
        const data = await fs.readFile("data/cart.json", "utf-8");
        existingData = JSON.parse(data);
        console.log("saveCartToFile, existingData:", existingData);
        console.log("existingData.length:", existingData.length);
    } catch (error) {
        console.error("Error reading cart file:", error);
    }

    const lastCode =
        existingData.length > 0 ? existingData[existingData.length - 1].code : 0;
    const newCode = generateUniqueCode(lastCode);

    newCart.code = newCode;
    existingData.push(newCart);

    await fs.writeFile(
        "data/cart.json",
        JSON.stringify(existingData, null, 2),
        "utf-8"
    );
}

module.exports = saveProductToCart;