"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const homePageController_1 = require("../controller/homePageController");
const auth_1 = require("../middleware/auth");
router.get('/get', auth_1.verifyToken, homePageController_1.getHome);
exports.default = router;
