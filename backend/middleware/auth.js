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
    console.log(error);
    res.json({success: false, message: "Invalid or expired token. Please login again."})
  }
}

const adminMiddleware = async(req, res, next) => {
  if (req.userRole !== "admin") {
    return res.json({success: false, message: "Access denied. Admin only."})
  }
  next();
}

export { authMiddleware, adminMiddleware };