import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoutes.js';
import userRouter from './routes/userRoutes.js';
import 'dotenv/config';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import bcrypt from 'bcrypt';
import userModel from './models/userModel.js';


// app config
const app = express();
const port = 4000;

// middleware
app.use(express.json());
app.use(cors());

// Auto-seed admin if none exists
const seedAdminFirst = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  console.log(">>>>Seeding admin");
  
  if (!email || !password) {
    console.log("No admin found and no ADMIN_EMAIL/ADMIN_PASSWORD in .env. Skipping auto-seed.");
    return;
  }

  const adminExists = await userModel.findOne({ email });
  if (adminExists) {
    console.log(`Admin with email ${email} already exists. Skipping.`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();
    console.log(`Admin user created: ${email}`);

};


// db connection
connectDB().then(() => seedAdminFirst());

// api endpoints
app.get('/', (req, res) => res.send("API Working"));
app.use("/api/food", foodRouter);
app.use("/images", express.static('uploads'));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use('/api/order', orderRouter);

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
})

