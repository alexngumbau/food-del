import express from 'express';
import { adminLogin, createAdmin, listAdmins, loginUser, refreshAccessToken, registerUser } from '../controllers/userController.js';
import { adminMiddleware, authMiddleware } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin-login", adminLogin);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.post("/create-admin",authMiddleware, adminMiddleware,  createAdmin);
userRouter.get("/list-admins", authMiddleware, adminMiddleware, listAdmins);

export default userRouter;