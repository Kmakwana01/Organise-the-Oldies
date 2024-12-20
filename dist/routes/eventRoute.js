"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const eventController_1 = require("../controller/eventController");
const auth_1 = require("../middleware/auth");
router.post('/create', auth_1.verifyToken, eventController_1.create);
router.get('/get', auth_1.verifyToken, eventController_1.get);
router.put('/update', auth_1.verifyToken, eventController_1.update);
router.delete('/delete', auth_1.verifyToken, eventController_1.deleteData);
exports.default = router;
