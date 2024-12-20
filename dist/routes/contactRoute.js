"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const contactController_1 = require("../controller/contactController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../util/multer");
const pushNotification_1 = require("../util/pushNotification");
router.post('/create', auth_1.verifyToken, contactController_1.create);
router.get('/get', auth_1.verifyToken, contactController_1.get);
router.put('/update', auth_1.verifyToken, contactController_1.update);
router.delete('/delete', auth_1.verifyToken, contactController_1.deleteContact);
router.post('/csv', auth_1.verifyToken, multer_1.upload.single('csv'), contactController_1.csvFile);
router.post('/token', pushNotification_1.notification);
exports.default = router;
