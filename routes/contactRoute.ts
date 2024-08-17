import express from "express";
var router = express.Router();
import { create , get , update , deleteContact , csvFile } from '../controller/contactController';
import { verifyToken } from "../middleware/auth";
import { upload } from "../util/multer";
import { notification } from "../util/pushNotification";

router.post('/create',verifyToken , create);
router.get('/get',verifyToken , get);
router.put('/update',verifyToken , update);
router.delete('/delete',verifyToken , deleteContact);
router.post('/csv',verifyToken ,upload.single('csv'), csvFile);

router.post('/token', notification);

export default router;