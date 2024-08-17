import express from "express";
var router = express.Router();
import { chatGet , attachment , deleteChat} from '../controller/socketController';
import { verifyToken } from "../middleware/auth";
import { upload } from "../util/multer";

router.get('/get',verifyToken , chatGet);
router.post('/attachment',verifyToken ,upload.single('attachment'), attachment);

router.put('/allChatDelete',verifyToken , deleteChat);

export default router;