import express from "express";
var router = express.Router();
import { create , get , update , deleteData } from '../controller/medicinesController';
import { verifyToken } from "../middleware/auth";
import { upload } from "../util/multer";


router.post('/create', verifyToken, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), create);
router.get('/get', verifyToken,  get);
router.put('/update', verifyToken, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), update);
router.delete('/delete', verifyToken, deleteData);

export default router;