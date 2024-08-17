import express from "express";
var router = express.Router();
import { create , get , update } from '../controller/sendMailUserController';
import { verifyToken } from "../middleware/auth";

router.post('/create', verifyToken, create);
router.get('/get', verifyToken, get);
router.put('/update', verifyToken, update);

export default router;