"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const sendMailUserController_1 = require("../controller/sendMailUserController");
const auth_1 = require("../middleware/auth");
router.post('/create', auth_1.verifyToken, sendMailUserController_1.create);
router.get('/get', auth_1.verifyToken, sendMailUserController_1.get);
router.put('/update', auth_1.verifyToken, sendMailUserController_1.update);
exports.default = router;
