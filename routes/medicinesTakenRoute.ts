import express from "express";
var router = express.Router();
import { create , getMedicineDetails } from '../controller/medicinesTakenController';
import { verifyToken } from "../middleware/auth";

router.post('/create', verifyToken, create);
router.post('/getMedicineDetails', verifyToken, getMedicineDetails);

export default router;