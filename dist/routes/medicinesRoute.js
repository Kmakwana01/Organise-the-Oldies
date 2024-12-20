"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const medicinesController_1 = require("../controller/medicinesController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../util/multer");
router.post('/create', auth_1.verifyToken, multer_1.upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), medicinesController_1.create);
router.get('/get', auth_1.verifyToken, medicinesController_1.get);
router.put('/update', auth_1.verifyToken, multer_1.upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), medicinesController_1.update);
router.delete('/delete', auth_1.verifyToken, medicinesController_1.deleteData);
exports.default = router;
