"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const siblingAndGrandParentController_1 = require("../controller/siblingAndGrandParentController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../util/multer");
router.post('/create', auth_1.verifyToken, multer_1.upload.single('image'), siblingAndGrandParentController_1.create);
router.get('/get', auth_1.verifyToken, siblingAndGrandParentController_1.get);
router.put('/update', auth_1.verifyToken, multer_1.upload.single('image'), siblingAndGrandParentController_1.update);
router.delete('/delete', auth_1.verifyToken, siblingAndGrandParentController_1.deleteData);
router.get('/getProfile', auth_1.verifyToken, siblingAndGrandParentController_1.getDataFromId);
router.post('/login', siblingAndGrandParentController_1.login);
exports.default = router;
