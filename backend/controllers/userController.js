import userModel from "../models/userModel.js";
import jwt from 'jsonwebtoken';
import bycrypt from 'bcrypt';
import validator from 'validator';




// login user
const loginUser = async (req,res) => {
  const {email, password} = req.body;
  try {
    const user = await userModel.findOne({email});
    if (!user) {
      return res.json({success: false, message: "Invalid email or password"});
    }

    const isMatch = await bycrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({success: false, message: "Invalid email or password"});
    }

    const accessToken = createToken(user._id, user.role, "6m");
    const refreshToken = createToken(user._id, user.role, "7d");

    res.json({success: true, token: accessToken, refreshToken});

  } catch (error) {
    console.log(error);
    res.json({success: false, message: "Server error. Please try again later."})
  }
}

// admin login
const adminLogin = async (req, res) => {
  const {email, password} = req.body;
  try {
    const user = await userModel.findOne({email});
    if (!user) {
      return res.json({success: false, message: "Invalid email or password"});
    }

    const isMatch = await bycrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({success: false, message: "Invalid email or password"});
    }
    if (user.role !== "admin") {
      return res.json({success: false, message: "Access denied. Admins only."});
    }

    const accessToken = createToken(user._id, user.role, "6m");
    const refreshToken = createToken(user._id, user.role, "7d");

    res.json({success: true, token: accessToken, refreshToken});
  } catch (error) {
    console.log(error);
    res.json({success: false, message: "Sever error. Please try again later."});
  }
}

const createToken = (id, role, expiresIn) => {
  const secret = expiresIn === "7d" ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  return jwt.sign({id, role} , secret, {expiresIn});
}

// refresh token
const refreshAccessToken = (req, res) => {
  const {refreshToken} = req.body;
  if (!refreshToken) {
    return res.json({success: false, message: "No refresh token provided"});
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = createToken(decoded.id, decoded.role, "6m");
    res.json({success: true, token: accessToken});
  } catch (error) {
    res.json({success: false, message: "Invalid or expired refresh token. Please login again."});
  }
}


// register user
const registerUser = async(req, res) => {
  const {name, password, email} = req.body;
  try {
    const exists = await userModel.findOne({email});
    if (exists) {
      return res.json({success: false, message: "User already exists"});
    }

    // validate email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({success: false, message: "Please enter a valid email"});
    }
    if (password.length < 8) {
      return res.json({success: false, message: "Password must be at least 8 characters long"})
    }

    // hashing user password
    const salt = await bycrypt.genSalt(10);
    const hashedPassword = await bycrypt.hash(password, salt);
    
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword
    });

    const user = await newUser.save();
    const token = createToken(user._id, user.role);

    res.json({success: true, token});

  } catch (error) {
    console.log(error);
    res.json({success: false, message:"Error"});
  }
}






export {loginUser, registerUser, adminLogin, refreshAccessToken};