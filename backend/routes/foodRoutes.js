import express from "express";
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import multer from "multer";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const foodRouter = express.Router();

// image storage engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`)
  }
})

const upload = multer({storage:storage});

foodRouter.post('/add', authMiddleware, adminMiddleware, upload.single("image"), addFood);
foodRouter.get('/list', listFood);
foodRouter.post('/remove', authMiddleware, adminMiddleware, removeFood)

export default foodRouter;
