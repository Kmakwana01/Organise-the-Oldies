import express from "express";
var router = express.Router();
import { create , get , deleteData , update , getDataFromId, login } from '../controller/siblingAndGrandParentController';
import { verifyToken } from "../middleware/auth";
import { upload } from "../util/multer";

router.post('/create', verifyToken, upload.single('image'), create);
router.get('/get', verifyToken, get);
router.put('/update', verifyToken,upload.single('image'), update);
router.delete('/delete', verifyToken, deleteData);

router.get('/getProfile', verifyToken, getDataFromId);
router.post('/login', login);

export default router;