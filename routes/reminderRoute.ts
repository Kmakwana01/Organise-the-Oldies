import express from "express";
var router = express.Router();
import { create , get , update , deleteData } from '../controller/reminderController';
import { verifyToken } from "../middleware/auth";
import { upload } from "../util/multer";

router.post('/create', verifyToken, upload.single('voice'), create);
router.get('/get', verifyToken, get);
router.put('/update', verifyToken, upload.single('voice'), update);
router.delete('/delete', verifyToken, deleteData);

export default router;