import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect("mongodb+srv://alexInTech:alexInTech@cluster0.zm8clc5.mongodb.net/food-del")
    .then(() => console.log("DB Connected"));
};
