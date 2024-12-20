"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const subscriptionController_1 = require("../controller/subscriptionController");
const router = express_1.default.Router();
router.post('/verifyReceipt', auth_1.verifyToken, subscriptionController_1.verifyReceipt);
router.post('/iosWebhookV2', subscriptionController_1.iosWebhookV2);
router.get('/getTransactions', auth_1.verifyToken, subscriptionController_1.getTransactions);
router.get('/checkSubscriptionStatus', auth_1.verifyToken, subscriptionController_1.checkSubscriptionStatus);
router.get('/subscriptionStatusCheckAppleSide', auth_1.verifyToken, subscriptionController_1.subscriptionStatusCheckAppleSide);
router.get('/check', auth_1.verifyToken, subscriptionController_1.check);
exports.default = router;
