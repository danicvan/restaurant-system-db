const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs").promises;
const cartRoutes = require("./cartRoutes");

const app = express();
const PORT = 3000;
const JWT_SECRET = "123456";

// Increase payload size limit to 50MB
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

// Allow requests from all origins
app.use(cors());

const usersFilePath = "data/users.json";

async function getUsers() {
    try {
        const data = await fs.readFile(usersFilePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading users file:", error);
        return [];
    }
}

async function saveUsers(users) {
    try {
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
    } catch (error) {
        console.error("Error saving users file:", error);
    }
}

const users = [
    { id: 1, username: "user1", passwordHash: "$2a$10$YXUS3pYyaXwluC/OQ5.hgu63aCswVMEL.nLcDWJ/uGQpv5Mxq76D2" }, // Password: password1
    { id: 2, username: "user2", passwordHash: "$2a$10$5FzAmFfp.8XuI7H2i62okufbp/.QYISw8L6VzEDBxseI6iqzGQ8lG" }, // Password: password2
  ];

// Middleware to verify JWT
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.user = decoded;
        next();
    });
}

app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await getUsers();

        // Check if the username already exists
        if (users.some((user) => user.username === username)) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Hash the password
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        const newUser = { id: users.length + 1, username, passwordHash };
        users.push(newUser);

        await saveUsers(users);

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await getUsers();

        // Find the user by username
        const user = users.find((user) => user.username === username);

        // If user not found or password is incorrect, return error
        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            console.log("login failed")
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token: token });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Protected route example
app.get("/protected", verifyToken, (req, res) => {
    res.json({message: "This is a protected route"});
});

// Use the cartRoutes module
app.use("/api", cartRoutes);

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

app.get("/products", async (req, res) => {
    try {
        const data = await fs.readFile("data/products.json", "utf-8");
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error reading orders file: ", error);
        res.status(500).send("Internal Server Error");
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

app.get("/cart", async (req, res) => {
    try {
        const data = await fs.readFile("data/cart.json", "utf-8");
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error reading orders file: ", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/cart", async (req, res) => {
    try {
        const newCart = req.body;
        await saveProductToCart(newCart);
        res.json({ message: "Cart data saved successfully!" });
    } catch (error) {
        console.error("error saving cart data:", error);
        res.status(500).json({ error: "Internal Sever Error" });
    }
});

app.put("/api/cart", async (req, res) => {
    try {
        const updatedCart = req.body; // Get the updated cart data from the request body
        console.log(`updatedCart: ${updatedCart}`);
        await saveCartToFile(updatedCart); // Save the updated cart data to the cart.json file
        res.json({ message: "Cart updated successfully!" }); // Send a success response
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Send an error response
    }
});

app.delete("/cart/:itemId?", async (req, res) => {
    debugger;

    try {
        const itemId = req.params.itemId;

        if (!itemId) {
            await fs.writeFile("data/cart.json", "[]", "utf-8");
            return res.json({
                message: "All items removed from the cart successfully!",
            });
        } else {
            const existingData = await fs.readFile("data/cart.json", "utf-8");
            const cartItems = JSON.parse(existingData);
            const itemIndex = cartItems.findIndex((item) => item.code === itemId);

            if (itemIndex === -1) {
                return res.status(404).json({ error: "Item not found in the cart" });
            }

            cartItems.splice(itemIndex, 1);

            await fs.writeFile(
                "data/cart.json",
                JSON.stringify(cartItems, null, 2),
                "utf-8"
            );

            res.json({ message: "Item removed from the cart successfully!" });
        }
    } catch (error) {
        console.error("Error removing item from the cart:", error);
        res.status(500).json({ error: "Internet Server Error" });
    }
});

async function saveCartToFile(updatedCart) {
    await fs.writeFile(
        "data/cart.json",
        JSON.stringify(updatedCart, null, 2),
        "utf-8"
    );
}

async function savePurchaseToFile(newPurchase) {
    let existingData = [];
    try {
        const data = await fs.readFile("data/orders.json", "utf-8");
        existingData = JSON.parse(data);
        console.log("savePurchaseToFile, existingData:", existingData);
        console.log("existingData.length:", existingData.length);
    } catch (error) {
        console.error("Error reading products file:", error);
    }

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
        console.log("saveProductToFile, existingData:", existingData);
        console.log("existingData.length:", existingData.length);
    } catch (error) {
        console.error("Error reading products file:", error);
    }

    const lastCode =
        existingData.length > 0 ? existingData[existingData.length - 1].code : 0;
    const newCode = generateUniqueCode(lastCode);

    newProduct.code = newCode;
    existingData.push(newProduct);

    await fs.writeFile(
        "data/products.json",
        JSON.stringify(existingData, null, 2),
        "utf-8"
    );
}

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

// Handle preflight requests
app.options('*', cors());

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
