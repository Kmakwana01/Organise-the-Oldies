"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const socketController_1 = require("../controller/socketController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../util/multer");
router.get('/get', auth_1.verifyToken, socketController_1.chatGet);
router.post('/attachment', auth_1.verifyToken, multer_1.upload.single('attachment'), socketController_1.attachment);
router.put('/allChatDelete', auth_1.verifyToken, socketController_1.deleteChat);
exports.default = router;
