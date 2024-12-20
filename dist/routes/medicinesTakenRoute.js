"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const medicinesTakenController_1 = require("../controller/medicinesTakenController");
const auth_1 = require("../middleware/auth");
router.post('/create', auth_1.verifyToken, medicinesTakenController_1.create);
router.post('/getMedicineDetails', auth_1.verifyToken, medicinesTakenController_1.getMedicineDetails);
exports.default = router;
