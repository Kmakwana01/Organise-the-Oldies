import express from "express";
var router = express.Router();
import { signup , login , token , forgotPassword , compareCode , resetPassword , logout , tokenVerify , updateFcmToken, googleAuth, appleAuth } from '../controller/userController';
import { verifyToken } from "../middleware/auth";

router.post('/signup', signup);
router.post('/login', login);
router.post('/token', token);
router.post('/forgotPassword', forgotPassword);
router.post('/compareCode', compareCode);
router.post('/resetPassword', resetPassword);
router.post('/logout', logout);
router.post('/tokenVerify', tokenVerify);
router.post('/updateFcmToken',verifyToken, updateFcmToken);

router.post('/googleAuth', googleAuth);
router.post('/appleAuth', appleAuth);

export default router;