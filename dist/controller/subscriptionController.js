"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = exports.subscriptionStatusCheckAppleSide = exports.checkSubscriptionStatus = exports.getTransactions = exports.iosWebhookV2 = exports.verifyReceipt = void 0;
const subscriptionModel_1 = require("../models/subscriptionModel");
const subscriptionWebhookModel_1 = require("../models/subscriptionWebhookModel");
const subscriptionWebhookErrorModel_1 = require("../models/subscriptionWebhookErrorModel");
const in_app_purchase_1 = __importDefault(require("in-app-purchase"));
const fs_1 = __importDefault(require("fs"));
const app_store_server_api_1 = require("app-store-server-api");
const path_1 = __importDefault(require("path"));
const privateKeyPath = path_1.default.join(__dirname, '../AuthKey_VTDKPY779L.p8');
const KEY = fs_1.default.readFileSync(privateKeyPath, 'utf8');
const KEY_ID = process.env.KEY_ID;
const ISSUER_ID = process.env.ISSUER_ID;
const APP_BUNDLE_ID = process.env.APP_BUNDLE_ID;
// const loadRootCAs = (): any => {
//   const caFilePath = path.resolve(__dirname, '../AppleIncRootCertificate.cer');
//   if (!fs.existsSync(caFilePath)) {
//       throw new Error(`Root CA file not found at ${caFilePath}`);
//   }
//   return [fs.readFileSync(caFilePath)];
// };
const api = new app_store_server_api_1.AppStoreServerAPI(KEY, KEY_ID, ISSUER_ID, APP_BUNDLE_ID, app_store_server_api_1.Environment.Sandbox);
in_app_purchase_1.default.config({
    appleExcludeOldTransactions: false, // if you want to exclude old transaction, set this to true. Default is false
    applePassword: process.env.APPLE_PASSWORD, // this comes from iTunes Connect (You need this to valiate subscriptions)
    /* Configurations for Google Service Account validation: You can validate with just packageName, productId, and purchaseToken */
    // googleServiceAccount: {
    //   clientEmail: 'test-163@test-in-app-405713.iam.gserviceaccount.com',
    //   privateKey: KEY
    // },
    // googleServiceAccount: {
    //   clientEmail: 'test-163@test-in-app-405713.iam.gserviceaccount.com',
    //   privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVuV1xpnYgp+hM\nN1xuZFNYqx2TWBCU3aUnx641dpjk7jrmYi79/LpnMboeKv/9F7rGtA4J/wWlK9nB\nhRy4jGcxlHuIi0RpEB5vgePTdrF885V/p8rXU/UW/pYuGteQE8uTJj6ms9Ae+pJ8\nE1gxA1vWQZu9dm6HU9YaEgW9NsbvgXpZAtTotr4jZiaQ0hFMp+gTl2QwX0rejxjT\nlHV/oZpzxfJkK3kEU/L5DDSQNYtI07QQl1gP4ZZBb7u3SfMrjOQ7uYEyxihNayig\n/j9ZMEntaC9xtxSzVo/M2LAuFpuDTlxr6NzkAi87+0wI3L3QniybjJx+5jP1ZH86\nGEs+j7xHAgMBAAECggEAJZgdn8gwLz5Z1k5GrARpxMcUxL5Q7F6wlnbBZhYefuaI\n5c2Pho3WHCDbJENcFCEAccNqVMfPLmawPyIzEyNfY5FCyZn1xqVXNTYb5S6Tue7+\n9R2GyKm0Cv9tW17NXEKfJJstmhU3Hrvk2H5unPCCTwXrZ0BV4OgWWS+iYs4n4CkL\n9Xgr1yb6muyKcjZQlb11X7nPpd45IVUTRaXqCtBTq2Mf4k0InEQ4IPBgU+Hup3i9\nnLswNzXp6RqiWJ4Z42umCtlnu++G+j1xhJ4yzwUMZXiSsRMHuVV0b5Yz6jDvf4VL\n7Com2J4cH9FEKLoxBUDxcyUMalE4cir9NUujVmfNAQKBgQD4GLEeC6/I8W3qY1Ps\nEdQIsPAfg39BCeLul7Q3tOaqZI3t9IGak4bX1Lzu4aeZvBWPx2H+VAQRVKXFjnQC\nxygeH0nphXo1dv7eLLhOlLQo57F6sjvoImQZqBvsh5pS7plOCb1klnSG6t7NTfwW\n9JEWdRocJZNam6cJRy5x8QFxNwKBgQDciFrsWjX/R3wc8C9h5cZNPQI9wP9T7Cmq\nFadmGnHHHdAxy5RO3fOPNpjLAXgJJYn54fkxh9qm4PZ56CjZFezTHPsr5lcTfJv/\nFTwBLGp3IPZNfoKeKwlAM8eF/tmDusvlqw0GL/PhkU1weS6ab6NpM6CGDEYsmGA0\nvk8ZCRbVcQKBgQDxtNSyCf67jYNhjF3Rq1jhEskOWsVarvAZNVFNyH/F1+tyvfia\niUog8lEThmML4vM6vaxZ5K6F1+sdOnkJz8/k8OTIjtMOTZ1nBTiWzkdrZrdBa23z\n7bWKTX7PBRmz3GMdZV3QJsjmPOLOMED+eEz2DSZf77fM2cJ1xpSYS431JwKBgF4W\nyvwWDP2qSRirnPuepflkMyWXxxfOJYSMkowsciiq3p2wJslzRqvudkf+i3ETlAeJ\n0uC//pi+WEpws6TTBuSXc84qCzKkMoYlUCGMCqxi4tLzS9UhtWOv88uGjNT4CHAn\nh3oBUYMGlEyNV0XKpaSHw1ANwo7aQAmgvGyJBTXxAoGBAMv8ZDwDaJYqcrtk0ftr\nR7/s3w2bqdMdn9ylyeeCfsLTz8oUijwGispQnVJV/92a05MfI3zix+Wlxm7A82Dw\niX0/ZlJPplBXFHhINzFJo+qVudi8JKXS2fEUAZujgysVchjICLcRH2gxJdVOqIcF\ngkj5EyiBGHVd6z3LuSJnakIA\n-----END PRIVATE KEY-----\n'
    // },
    googleServiceAccount: {
        clientEmail: 'test-in-app@test-in-app-405713.iam.gserviceaccount.com',
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCyF8drpZn6ED3g\nqT1jgQ2CG1XAzobWMSSt7urLZ3VwYEOzuIKcqyVBRjnce0IQ8aDjuQY6SytzORMC\nRqj1VkQHOoirgc1B5jp1ISqg8TMYEIoOTI05YIBoL/SuuBskhNAXD1GaE7lSrRR2\n/ErFtc1Wxfpg7+10WZyB99SapEa3/5wT8+PENwbi4V5v3yV4YvjnTtf5qZCdVfqy\ngxjTccl9xR/tyeGW3DXhaULvi0N9ZKBnTaImxVXqACswt7btWDUTXKfLpS1pY9lr\nkcyOb1JTbULNsvcgba2KzoGhwQRzYtsxUOkBPvblByyobeH2kYYnIBoXiHoOR5fQ\ngyDL4kSBAgMBAAECggEAErrefctGVN7VayXRb4AYmBjg3Wy7EJbNiT9p0SeZ2c4+\nAI5Eqk5zlhhZKH+MFLUc2yZP6dyS/sS/Y4tj5J2EfRAiZIs7t5ULi9sHnTKQ0ZSX\nuGZDqgekqZB1ltSFAkO3kN1LEz3EzVWno9Xn1UBIDrq2mPBS1FxCUgbrBLKHP32E\nxCKS53eCPMtJOcIG5ojadQ/R0g3c+/Plj0+yvu3ViBtck9C5b5ZqswOBOmQQyDiE\nYvBYJO2F7lplg18NdI0X0IpK9Rz4r1RmkAKzK8vZ3sQ8UMUovIehBVb7QZim9jpo\nBaQHAfkeYj+D5yr7EItXtWYvepGhl8hXrLf8z3iJ4QKBgQDwqLx0MHmSYiZkS+w+\nugYuUAeATgPaWZx8AIjr5Ht25JvIkx29wHFu/SV2wPFxXuIs4KR96Wmcr74ejRWU\nretEyKTlzmazMUUsFlH66F0qW/XbPWZXaYtqCWItPGBgM6m/MzAu3MXf9fHNHCJE\ncz323i1Do1kidlcXaDsf9pHfyQKBgQC9cgm7O8XcMQquxy2BWBoCu+PmTL4+ItvG\nvhzwKinNe/QSsOLNrO9mU1RyW8EhBC74lpYCrAQhOrEIurbry0NAfqNZMnPNUBd5\nvw585CcUUHRM1wSuEAw7aOjTU0Y2iVMSTAMs36A+DJiuukM/7ulAG7H5W5MLGmcK\nkpks9ZPK+QKBgDbV6+L5rKnbLW5LEnCUiJYC7EKjBCO7qXlj0c8WR7+mhYylYPB8\nqhwlGGU/v4Qan6SkJzb9eXAXZ1WkxhcTrfkFUvV+G06XWnCaQWHPknL1c0babbhb\nN0YZD0LJcBhbjUEg08jJy1ilvMwErhY0wBjBNUUlMkk099FAkcBNuZ1pAoGAYesZ\noI8qm781eFU27g3tk9At4ZF1G4TE+Bq3tmL0rGMPKsIG2Kw0KT2U/m7yifAxnwem\njcb/c3V0n8ByX7n2DtXl9GqhdFObbrAT+vWqRVO4aScSIi3lRKfa/6+hMPsV1vU3\nBvCnUKsOF/HqZJdGNH6cJPjyLeD9tXdEePqN43ECgYBb/ZSop4ViP9vWDu4dFR5g\ndN10Lrz4xMEq1X8ffN/gzvorvEvn9dBaOG7aY+4Q14eclFh0jKIUjpcxa09V6skZ\nd4vl+MFQaOvok+njqjRashygt+NdbArdd79OLVNI5k7M3B+bfIdDU2zQwH/5diOM\nnjMDj+Q+psIp1Wj4duo7yw==\n-----END PRIVATE KEY-----\n"
    },
    /* Configurations for Google Play */
    //googlePublicKeyPath: 'path/to/public/key/directory/', // this is the path to the directory containing iap-sanbox/iap-live files
    //googlePublicKeyStrSandBox: 'publicKeySandboxString', // this is the google iap-sandbox public key string
    //googlePublicKeyStrLive: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmr/tfeAep2p1hp8/B3iMFW8oELR4kedsLwrGRM0wLvfWZoWMQyWc2vgjmieJkWCBYtYVHh6O5kpEPfjW50V0oOgRNBeoaQ7Ccnq9pJk+KyjZM2U4jx0Xt/ts/8EJYGLk93QVSYKKqADq4WXxlZigAbwXiFSA5bKEvi5fvDkuxqACd5sSY+qQQ0cogAYbpewPC9GHX59TPqkqD3gK1HphqfXt1A6oP7nPQZzBGRt9m0awy/bJaymiA0/ZoIqOL96NiVH7H5WnY6VMN5NQS+FxZiZUheBM6OqzIDb0+IapLYfrJ5e3MDJ+8/sm4KVQJN4cA0uSbWLccn28kGzvacn6WQIDAQAB', // this is the google iap-live public key string
    //googleAccToken: 'abcdef...', // optional, for Google Play subscriptions
    //googleRefToken: 'dddd...', // optional, for Google Play subscritions
    //googleClientID: '400748433104-sphopjajlssj6ma3fd8cinrquch05srl.apps.googleusercontent.com', // optional, for Google Play subscriptions
    //googleClientSecret: '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', // optional, for Google Play subscriptions
    /* Configurations for Roku */
    // rokuApiKey: 'aaaa...', // this comes from Roku Developer Dashboard
    /* Configurations for Facebook (Payments Lite) */
    // facebookAppId: '112233445566778',
    // facebookAppSecret: 'cafebabedeadbeefabcdef0123456789',
    /* Configurations all platforms */
    test: true, // For Apple and Googl Play to force Sandbox validation only
    verbose: true // Output debug logs to stdout stream
});
const verifyReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const platformType = req.body.platformType;
    const familyId = req.body.familyId;
    if (!platformType) {
        return res.status(500).send({ "status": false, "message": "Please provide platformType." });
    }
    else if (!familyId) {
        return res.status(500).send({ "status": false, "message": "Please provide familyId." });
    }
    if (platformType.toLowerCase() == "ios") {
        const receipt = req.body.receipt;
        if (!receipt) {
            return res.status(500).send({ "status": false, "message": "Please provide receipt." });
        }
        in_app_purchase_1.default.setup()
            .then(() => {
            in_app_purchase_1.default.validate(receipt).then(onSuccess).catch(onError);
        })
            .catch((error) => {
            return res.status(500).send({ "status": false, "message": "Something wrong happen", "error": error });
        });
        function onSuccess(validatedData) {
            return __awaiter(this, void 0, void 0, function* () {
                // validatedData: the actual content of the validated receipt
                // validatedData also contains the original receipt
                let options = {
                    ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
                    ignoreExpired: true // purchaseData will NOT contain exipired subscription items
                };
                // validatedData contains sandbox: true/false for Apple and Amazon
                let purchaseData = in_app_purchase_1.default.getPurchaseData(validatedData, options);
                let latestReceipts = validatedData.latest_receipt_info;
                if (latestReceipts.length > 0) {
                    let latestReceipt = latestReceipts[0];
                    let expiresDateMs = latestReceipt.expires_date_ms;
                    let originalTransactionId = latestReceipt.original_transaction_id;
                    let productId = latestReceipt.product_id;
                    let data = {
                        "familyId": familyId,
                        "originalTransactionId": originalTransactionId,
                        "expiresAt": expiresDateMs,
                        "platformType": platformType,
                        "receipt": receipt,
                        "response": JSON.stringify(validatedData),
                        "productId": productId,
                        "token": "",
                        "from": "Receipt validation",
                        "isDeleted": false
                    };
                    if (expiresDateMs) {
                        const saveWebhookData = yield subscriptionWebhookModel_1.SUBSCRIPTION_WEBHOOK.create(Object.assign({}, data));
                        // const parentSubscription = await parentSubscriptionRef.where('userId', '==', userId).get();
                        let parentSubscription = yield subscriptionModel_1.SUBSCRIPTION.findOne({ familyId });
                        data.transactionRef = saveWebhookData._id;
                        if (parentSubscription) {
                            yield subscriptionModel_1.SUBSCRIPTION.findByIdAndUpdate(parentSubscription._id, {
                                $set: Object.assign({}, data)
                            });
                        }
                        else {
                            yield subscriptionModel_1.SUBSCRIPTION.create(Object.assign({}, data));
                        }
                        return res.send({ "status": true, "message": "Receipt verified.", "data": purchaseData, "validatedData": validatedData });
                    }
                    else {
                        return res.status(403).send({ "status": false, "message": "Subscription expired.", "data": purchaseData, "validatedData": validatedData });
                    }
                }
                else {
                    return res.status(500).send({ "status": false, "message": "Can not find valid receipt.", "data": purchaseData, "validatedData": validatedData });
                }
            });
        }
        function onError(error) {
            return res.status(500).send({ "status": false, "message": "Receipt validation failed.", "error": error });
        }
    }
    else if (platformType.toLowerCase() == "android") {
        let token = req.body.purchaseToken;
        let productId = req.body.productId;
        let packageName = req.body.packageName;
        if (!token) {
            return res.status(500).send({ "status": false, "message": "Please provide token." });
        }
        else if (!productId) {
            return res.status(500).send({ "status": false, "message": "Please provide productId." });
        }
        else if (!packageName) {
            return res.status(500).send({ "status": false, "message": "Please provide packageName." });
        }
        const receipt = {
            purchaseToken: token,
            productId: productId,
            packageName: packageName,
            subscription: true,
            "developerPayload": familyId
        };
        in_app_purchase_1.default.setup()
            .then(() => {
            in_app_purchase_1.default.validate(receipt).then(onSuccess).catch(onError);
        })
            .catch((error) => {
            return res.status(500).send({ "status": false, "message": "Something wrong happen", "error": error });
        });
        function onSuccess(validatedData) {
            return __awaiter(this, void 0, void 0, function* () {
                // validatedData: the actual content of the validated receipt
                // validatedData also contains the original receipt
                let latestReceipt = validatedData;
                if (latestReceipt) {
                    let expiresDateMs = latestReceipt.expiryTimeMillis;
                    let orderId = latestReceipt.orderId;
                    let purchaseToken = latestReceipt.purchaseToken;
                    let productId = latestReceipt.productId;
                    let data = {
                        "familyId": familyId,
                        "originalTransactionId": orderId,
                        "expiresAt": expiresDateMs,
                        "platformType": platformType,
                        "receipt": "",
                        "productId": productId,
                        "response": JSON.stringify(validatedData),
                        "token": purchaseToken,
                        "from": "Receipt validation"
                    };
                    if (expiresDateMs > Date.now()) {
                        // let transactionRef = androidSubscriptionWebhookRef.doc().id;
                        // data.key = transactionRef;
                        const saveWebhookData = yield subscriptionWebhookModel_1.SUBSCRIPTION_WEBHOOK.create(data);
                        let parentSubscription = yield subscriptionModel_1.SUBSCRIPTION.findOne({ familyId });
                        // const parentSubscription = await parentSubscriptionRef.where('userId', '==', userId).get();
                        data.transactionRef = saveWebhookData._id;
                        if (parentSubscription) {
                            yield subscriptionModel_1.SUBSCRIPTION.findByIdAndUpdate(parentSubscription._id, {
                                $set: data
                            });
                        }
                        else {
                            yield subscriptionModel_1.SUBSCRIPTION.create(data);
                        }
                        return res.send({ "status": true, "message": "Receipt verified.", "data": validatedData });
                    }
                    else {
                        res.status(403).send({ "status": false, "message": "Subscription expired.", "data": validatedData });
                    }
                }
                else {
                    res.status(500).send({ "status": false, "message": "Can not find valid receipt .", "data": validatedData });
                }
            });
        }
        function onError(error) {
            res.status(500).send({ "status": false, "message": "Receipt validation failed.", "error": error });
            // failed to validate the receipt...
        }
    }
    else {
        return res.status(500).send({ "status": false, "message": "Please provide valid platform type." });
    }
});
exports.verifyReceipt = verifyReceipt;
const iosWebhookV2 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { signedPayload } = req.body;
        const verifiedNotification = yield (0, app_store_server_api_1.decodeTransaction)(signedPayload);
        verifiedNotification.data.signedTransactionInfo = yield (0, app_store_server_api_1.decodeTransaction)(verifiedNotification.data.signedTransactionInfo);
        verifiedNotification.data.signedRenewalInfo = yield (0, app_store_server_api_1.decodeRenewalInfo)(verifiedNotification.data.signedRenewalInfo);
        let { data } = verifiedNotification;
        const { expiresDate: expiresDateMs, productId, originalTransactionId, price } = data.signedTransactionInfo;
        let transactionData = {
            "originalTransactionId": originalTransactionId,
            "expiresAt": expiresDateMs,
            "platformType": "ios",
            "response": JSON.stringify(req.body),
            "productId": productId,
            "price": price,
            "token": "",
            "from": "AppleWebhook",
            "isDeleted": false
        };
        const isSubscription = yield subscriptionModel_1.SUBSCRIPTION.findOne({ originalTransactionId });
        if (isSubscription) {
            data.familyId = isSubscription.familyId;
            if (expiresDateMs > Date.now()) {
                let webhookData = yield subscriptionWebhookModel_1.SUBSCRIPTION_WEBHOOK.create(transactionData);
                data.transactionRef = webhookData._id;
                yield subscriptionModel_1.SUBSCRIPTION.findByIdAndUpdate(isSubscription._id, { $set: transactionData });
                return res.status(200).send({
                    "status": true,
                    "message": "Receipt received.",
                    "data": verifiedNotification
                });
            }
            else {
                data.reason = "Subsciption is expired";
                data.response = JSON.stringify(req.body);
                let transactionWebhookError = yield subscriptionWebhookErrorModel_1.SUBSCRIPTION_WEBHOOK_ERROR.create(transactionData);
                return res.status(500).send({
                    "status": false,
                    "message": "Subscription expired.",
                    "data": verifiedNotification
                });
            }
        }
        else {
            data.reason = "familyId not found in subscription.";
            data.response = JSON.stringify(req.body);
            let transactionWebhookError = yield subscriptionWebhookErrorModel_1.SUBSCRIPTION_WEBHOOK_ERROR.create(transactionData);
            return res.status(500).send({
                "status": false,
                "message": "Receipt received but familyId not found.",
                "data": verifiedNotification
            });
        }
    }
    catch (error) {
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
});
exports.iosWebhookV2 = iosWebhookV2;
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { originalTransactionId } = req.body;
        if (!originalTransactionId)
            throw new Error('originalTransactionId is required.');
        const response = yield api.getTransactionHistory(originalTransactionId);
        const transactions = yield (0, app_store_server_api_1.decodeTransactions)(response.signedTransactions);
        res.status(200).json({
            message: "Transaction Get Successfully.",
            data: transactions
        });
    }
    catch (error) {
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
});
exports.getTransactions = getTransactions;
const checkSubscriptionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { familyId } = req.query;
        if (!familyId)
            throw new Error('familyId is required.');
        const subscription = yield subscriptionModel_1.SUBSCRIPTION.findOne({ familyId });
        if (!subscription)
            throw new Error('No valid subscription found.');
        const expiresDateMs = subscription.expiresAt;
        console.log(expiresDateMs);
        console.log(Date.now());
        console.log("Condition :- ", parseInt(expiresDateMs) > Date.now());
        if (parseInt(expiresDateMs) > Date.now()) {
            return res.status(200).send({
                status: 200,
                message: "Subscription is active.",
                data: subscription
            });
        }
        else {
            return res.status(403).send({
                status: 403,
                message: "Subscription expired.",
                data: subscription
            });
        }
    }
    catch (error) {
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
});
exports.checkSubscriptionStatus = checkSubscriptionStatus;
const subscriptionStatusCheckAppleSide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { originalTransactionId } = req.query;
        if (!originalTransactionId)
            throw new Error('originalTransactionId is required.');
        const response = yield api.getSubscriptionStatuses(originalTransactionId);
        const item = response.data[0].lastTransactions.find(item => item.originalTransactionId === originalTransactionId);
        if (!item)
            throw new Error('No matching transaction found.');
        const transactionInfo = yield (0, app_store_server_api_1.decodeTransaction)(item.signedTransactionInfo);
        res.status(200).json({
            message: "TransactionInfo Get Successfully.",
            data: transactionInfo
        });
    }
    catch (error) {
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
});
exports.subscriptionStatusCheckAppleSide = subscriptionStatusCheckAppleSide;
const check = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield api.requestTestNotification();
        res.status(200).json({
            message: "TransactionInfo Get Successfully.",
            data: response
        });
    }
    catch (error) {
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
});
exports.check = check;
// export const appleNotificationV1VerifyReceipt = async (req : Request, res : Response) => {
//     let unifiedReceipt = req.body.unified_receipt;
//     if (unifiedReceipt) {
//       let latestReceipts = unifiedReceipt.latest_receipt_info;
//       if (latestReceipts.length > 0) {
//         let latestReceipt = latestReceipts[0];
//         let expiresDateMs = latestReceipt.expires_date_ms;
//         let userId = "";
//         let originalTransactionId = latestReceipt.original_transaction_id;
//         let productId = latestReceipt.product_id;
//         let data : any = {
//           "originalTransactionId": originalTransactionId,
//           // "updatedAt": Date.now(),
//           "expiresAt": expiresDateMs,
//           "platformType": "ios",
//           "response": JSON.stringify(req.body),
//           "productId": productId,
//           "token": "",
//           "from": "AppleWebhook"
//         };
//         const parentSubscription = await SUBSCRIPTION.findOne({ originalTransactionId : originalTransactionId })
//         if (parentSubscription) {
//           let userId = parentSubscription.userId;
//           data.userId = userId
//           if (expiresDateMs > Date.now()) {
//             let webhookData = await SUBSCRIPTION_WEBHOOK.create({
//               ...data
//             })
//             data.transactionRef = webhookData._id
//             await SUBSCRIPTION.findByIdAndUpdate(parentSubscription._id,{
//               $set : {
//                 ...data
//               }
//             })
//             return res.status(200).send({ "status": true, "message": "Receipt received.", "data": unifiedReceipt });
//           } else {
//             // data.createdAt = Date.now()
//             data.reason = "Subsciption is expired"
//             data.receipt = JSON.stringify(unifiedReceipt)
//             let transactionWebhookError = await SUBSCRIPTION_WEBHOOK_ERROR.create({
//               ...data
//             })
//             return res.status(500).send({ "status": false, "message": "Subscription expired.", "data": unifiedReceipt });
//           }
//         } else {
//           // let transactionRef = appleSubscriptionWebhookErrorRef.doc().id;
//           // data.key = transactionRef;
//           // data.createdAt = Date.now()
//           data.reason = "userId not found in parent subscription tabel"
//           data.receipt = JSON.stringify(unifiedReceipt)
//           // await appleSubscriptionWebhookErrorRef.doc(transactionRef).set(data);
//           let transactionWebhookError = await SUBSCRIPTION_WEBHOOK_ERROR.create({
//             ...data
//           })
//           return res.status(500).send({ "status": false, "message": "Receipt received but parent uid not found.", "data": JSON.stringify(req.body) });
//         }
//       } else {
//         let transactionWebhookError = await SUBSCRIPTION_WEBHOOK_ERROR.create({
//              reason : "Can not find latest receipt",
//              response : JSON.stringify(req.body)
//         })
//         return res.status(500).send({ "status": false, "message": "Can not find latest receipt.", "data": JSON.stringify(req.body) });
//       }
//     } else {
//       let data : any = {
//         "originalTransactionId": "",
//         // "createdAt": Date.now(),
//         // "updatedAt": Date.now(),
//         "expiresAt": 0,
//         "platformType": "ios",
//         "receipt": "",
//         "productId": "",
//         "token": "",
//         "from": "AppleWebhook"
//       };
//       // let transactionRef = appleSubscriptionWebhookErrorRef.doc().id;
//       // data.key = transactionRef;
//       data.reason = "Can not find unifiedReceipt"
//       data.receipt = ""
//       data.response = JSON.stringify(req.body);
//       let transactionWebhookError = await SUBSCRIPTION_WEBHOOK_ERROR.create({
//         ...data,
//       })
//       return res.status(500).send({ "status": false, "message": "Can not find unifiedReceipt." });
//     }
// }
// export const androidNotificationV1 = async (req : Request, res : Response) => {
//   return res.send("Android notification v1  !");
// }
// export const checkSubscriptionStatus = async (req : Request, res : Response) => {
//   let userId = req.body.userId;
//   if (userId) {
//     const parentSubscription = await SUBSCRIPTION.findOne({ userId });
//     if (parentSubscription) {
//       // var doc = parentSubscription.docs[0].data();
//       let expiresDateMs : any = parentSubscription.expireAt;
//       if (expiresDateMs > Date.now()) {
//        return res.status(200).send({ "status": true, "message": "Subscription is active.", "data": parentSubscription });
//       } else {
//         let platformType = parentSubscription.platformType.toLowerCase()
//         if (platformType == "android") {
//           let token = parentSubscription.token;
//           let productId = parentSubscription.productId;
//           let packageName = "com.atesta.inapp"
//           // validateGoogleReceipt(userId, platformType, token, productId, packageName, req, res)
//           const receipt = {
//             purchaseToken: token,
//             productId: productId,
//             packageName: packageName,
//             subscription: true,
//             "developerPayload": userId
//           };
//           iap.setup()
//             .then(() => {
//               iap.validate(receipt).then(onSuccess).catch(onError);
//             })
//             .catch((error) => {
//                 return res.status(500).send({ "status": false, "message": "Something wrong happen", "error": error });
//               // error...
//             });
//           async function onSuccess(validatedData : any) {
//             // validatedData: the actual content of the validated receipt
//             // validatedData also contains the original receipt
//             let latestReceipt = validatedData
//             if (latestReceipt) {
//               let expiresDateMs = latestReceipt.expiryTimeMillis;
//               let orderId = latestReceipt.orderId;
//               let purchaseToken = latestReceipt.purchaseToken;
//               let productId = latestReceipt.productId;
//               let data : any = {
//                 "userId": userId,
//                 "originalTransactionId": orderId,
//                 // "updatedAt": Date.now(),
//                 "expiresAt": expiresDateMs,
//                 "platformType": platformType,
//                 "receipt": "",
//                 "productId": productId,
//                 "response": JSON.stringify(validatedData),
//                 "token": "",
//                 "from": "Receipt validation"
//               };
//               if (expiresDateMs > Date.now()) {
//                 // let transactionRef = androidSubscriptionWebhookRef.doc().id;
//                 // data.key = transactionRef;
//                 const saveWebhookData = await SUBSCRIPTION_WEBHOOK.create({
//                     ...data  
//                 })
//                 let parentSubscription : any = await SUBSCRIPTION.findOne({ userId })
//                 // const parentSubscription = await parentSubscriptionRef.where('userId', '==', userId).get();
//                 data.transactionRef = saveWebhookData._id;
//                 if (parentSubscription) {
//                   await SUBSCRIPTION.findByIdAndUpdate(parentSubscription._id,{
//                       $set : {
//                         ...data
//                       }
//                     })
//                 } else {
//                     await SUBSCRIPTION.create({
//                         ...data
//                     })
//                 }
//                 return res.send({ "status": true, "message": "Receipt verified.", "data": validatedData });
//               } else {
//                 res.status(403).send({ "status": false, "message": "Subscription expired.", "data": validatedData });
//               }
//             } else {
//               res.status(500).send({ "status": false, "message": "Can not find valid receipt .", "data": validatedData });
//             }
//           }
//           function onError(error : any) {
//             res.status(500).send({ "status": false, "message": "Receipt validation failed.", "error": error });
//           }
//         } else {
//           res.status(403).send({ "status": false, "message": "Subscription expired.", "data": parentSubscription });
//         }
//       }
//     } else {
//       return res.status(403).send({ "status": false, "message": "No valid subscription found." });
//     }
//   } else {
//     res.status(400).send({ "status": false, "message": "Please provide userId." });
//   }
// }
// export const verifier = async (req : Request , res : Response) => {
//   try {
//           const appleRootCAs: Buffer[] = loadRootCAs() // Specific implementation may vary
//           const enableOnlineChecks = true
//           const environment = Environment.SANDBOX
//           const appAppleId = undefined // appAppleId is required when the environment is Production
//           const verifier = new SignedDataVerifier(appleRootCAs, enableOnlineChecks, environment, bundleId, appAppleId)
//           const notificationPayload = "ey..."
//           const verifiedNotification = await verifier.verifyAndDecodeNotification(notificationPayload)
//           res.status(200).json({
//               message : "Transaction Get Successfully.",
//               data : verifiedNotification
//           })
//       } catch (error : any) {
//           res.status(400).json({
//               status: "Failed",
//               message: error.message,
//           });
//       }
// }
