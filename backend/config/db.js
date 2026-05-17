import mongoose from "mongoose";
import "dotenv/config";

export const connectDB = async () => {
  try {
  await mongoose
    .connect("mongodb+srv://alexInTech:alexInTech@cluster0.zm8clc5.mongodb.net/food-del")
    console.log("DB Connected");
  } catch (error) {
    console.log("Mongo Error:", error.message);
  }
};
