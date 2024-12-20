"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const notificationController_1 = require("../controller/notificationController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../util/multer");
router.post('/create', auth_1.verifyToken, multer_1.upload.single('audio'), notificationController_1.create);
router.get('/get', auth_1.verifyToken, notificationController_1.get);
router.delete('/delete', auth_1.verifyToken, notificationController_1.deleteData);
exports.default = router;
