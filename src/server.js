const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get("/orders", async (req, res) => {
    try {
        const data = await fs.readFile("data/orders.json", "utf-8");
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error reading orders file: ", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/orders", async (req, res) => {
    try {
        const newPurchase = req.body;
        await savePurchaseToFile(newPurchase);
        res.json({ message: "Purchase data saved successfully!" });
    } catch (error) {
        console.error("Error saving purchase data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/products", async (req, res) => {
    try {
      const newProduct = req.body;
      await saveProductToFile(newProduct);
      res.json({ message: "Product data saved successfully!" });
    } catch (error) {
      console.error("Error saving product data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

async function savePurchaseToFile(newPurchase) {
    let existingData = [];
    try {
        const data = await fs.readFile("data/orders.json", "utf-8");
        existingData = JSON.parse(data);
        console.log("savePurchaseToFile, existingData:", existingData);
        console.log("existingData.length:", existingData.length);
    } catch (error) { }

    // Generate a unique code for the new purchase
    const lastCode =
        existingData.length > 0 ? existingData[existingData.length - 1].code : 0;
    const newCode = generateUniqueCode(lastCode);

    // Assign the new code to the new purchase
    newPurchase.code = newCode;

    existingData.push(newPurchase);

    await fs.writeFile(
        "data/orders.json",
        JSON.stringify(existingData, null, 2),
        "utf-8"
    );
}

async function saveProductToFile(newProduct) {
    let existingData = [];
    try {
      const data = await fs.readFile("data/products.json", "utf-8");
      existingData = JSON.parse(data);
    } catch (error) {
      console.error('Error reading products file:', error);
    }
  
    const lastCode = existingData.length > 0 ? existingData[existingData.length - 1].code : 0;
    const newCode = generateUniqueCode(lastCode);
  
    newProduct.code = newCode;
    existingData.push(newProduct);
  
    await fs.writeFile('data/products.json', JSON.stringify(existingData, null, 2), 'utf-8');
  }

function generateUniqueCode(lastCode) {
    const prefix = "";

    // Check if lastCode is not a string or does not start with the specified prefix
    if (typeof lastCode !== "string" || !lastCode.startsWith(prefix)) {
        // If the lastCode is not in the expected format, assume it's the first entry
        return `${prefix}1`;
    }

    // Extract the numeric part from the lastCode using regex
    const match = lastCode.slice(prefix.length).match(/(\d+)$/);

    // If no numeric part is found, throw an error
    if (!match) {
        throw new Error("Unable to extract numeric part from last code");
    }

    // Parse the numeric part as an integer
    const lastNumericCode = parseInt(match[0], 10);

    // If the parsed numeric part is not a valid number, throw an error
    if (isNaN(lastNumericCode)) {
        throw new Error("Invalid numeric part in last code");
    }

    // Generate a new numeric code by incrementing the last numeric code
    const newNumericCode = lastNumericCode + 1;

    // Combine the prefix and the new numeric code to create the new code
    return `${prefix}${newNumericCode}`;
}

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
