import express from "express";
var router = express.Router();
import { create , get , update , deleteData } from '../controller/keyInfoController';
import { verifyToken } from "../middleware/auth";

router.post('/create',verifyToken , create);
router.get('/get',verifyToken , get);
router.put('/update',verifyToken , update);
router.delete('/delete',verifyToken , deleteData);

export default router;