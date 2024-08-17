import express from "express";
var router = express.Router();
import { getHome } from '../controller/homePageController';
import { verifyToken } from "../middleware/auth";

router.get('/get',verifyToken , getHome);

export default router;