import express from 'express';
import { adminLogin, loginUser, refreshAccessToken, registerUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin-login", adminLogin);
userRouter.post("/refresh-token", refreshAccessToken);

export default userRouter;