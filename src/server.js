const express = require("express");
const cors = require("cors"); // Import the cors middleware
const fs = require("fs").promises;

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors()); // Use the cors middleware

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

async function savePurchaseToFile(newPurchase) {
  let existingData = [];
  try {
    const data = await fs.readFile("data/orders.json", "utf-8");
    existingData = JSON.parse(data);
  } catch (error) {}

  existingData.push(newPurchase);

  await fs.writeFile("data/orders.json", JSON.stringify(existingData, null, 2), 'utf-8');
}

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
