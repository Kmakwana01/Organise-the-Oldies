import express from 'express';
import { verifyToken } from '../middleware/auth';
import { verifyReceipt , iosWebhookV2 , getTransactions , checkSubscriptionStatus , subscriptionStatusCheckAppleSide , check } from '../controller/subscriptionController';
const router = express.Router();

router.post('/verifyReceipt', verifyToken, verifyReceipt)
router.post('/iosWebhookV2', iosWebhookV2)
router.get('/getTransactions', verifyToken, getTransactions)
router.get('/checkSubscriptionStatus', verifyToken, checkSubscriptionStatus)
router.get('/subscriptionStatusCheckAppleSide', verifyToken, subscriptionStatusCheckAppleSide)
router.get('/check', verifyToken, check)

export default router;

