const jwt = require('jsonwebtoken');

const secretKey = 'yourSecretKey'; // Replace with your actual secret key

const authenticateUserMiddleware = (req, res, next) => {
  // Get the token from the request headers, query, or cookies, as per your setup
  const token = req.headers.authorization || req.query.token || req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(token, secretKey);

    // Attach the user information to the request object
    req.user = decoded.user;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

module.exports = authenticateUserMiddleware;
