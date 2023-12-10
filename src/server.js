const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/orders", (req, res) => {

    try {
        const data = JSON.parse(fs.readFileSync("data/orders.json"));
        res.json(data);

    } catch (error) {

        console.error("Error reading orders file: ", error);
        res.status(500).send("Internet Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
