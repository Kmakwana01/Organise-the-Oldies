import express from "express";
var router = express.Router();
import { create , get , deleteData } from '../controller/notificationController';
import { verifyToken } from "../middleware/auth";
import { upload } from "../util/multer";

router.post('/create', verifyToken, upload.single('audio'), create);
router.get('/get', verifyToken, get);
router.delete('/delete', verifyToken, deleteData);

export default router;