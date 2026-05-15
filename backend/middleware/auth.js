import jwt from "jsonwebtoken";

const authMiddleware = async(req, res, next) => {
  console.log('Request baby', req.headers);
  const {token} = req.headers;
  if (!token) {
    return res.json({success: false, message: "Not Authorized. Please login Again"})
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = token_decode.id;
    req.userRole = token_decode.role;
    next();
  } catch (error) {
    console.log('We have an error: ',error.name);
    if (error.name === "TokenExpiredError") {
      return res.json({success: false, message: "Token expired", expired: true});
    }
    res.json({success: false, message: "Invalid token. Please login again."})
  }
}

const adminMiddleware = async(req, res, next) => {
  if (req.userRole !== "admin") {
    return res.json({success: false, message: "Access denied. Admin only."})
  }
  next();
}

export { authMiddleware, adminMiddleware };