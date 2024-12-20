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
exports.notificationFunction = exports.notification = void 0;
require('dotenv').config();
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const messaging_1 = require("firebase-admin/messaging");
const profileModel_1 = require("../models/profileModel");
const sessionModel_1 = require("../models/sessionModel");
const serviceAccountPath = path_1.default.join(__dirname, '../organise-the-oldies.json');
const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf-8'));
// const serviceAccount = require("./sureiCredentials.json");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    projectId: 'organise-the-oldies-bc7a5'
});
const notification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fcmToken, title, mess } = req.body;
        if (!fcmToken) {
            return res.status(400).send({ message: "FCM token is required" });
        }
        if (!title || !mess) {
            return res.status(400).send({ message: "Title and message are required" });
        }
        const message = {
            notification: {
                title: title,
                body: mess
            },
            data: {
                title: title,
                body: mess
            },
            token: fcmToken
        };
        (0, messaging_1.getMessaging)().send(message)
            .then((response) => {
            console.log('Successfully sent message:', response);
        })
            .catch((error) => {
            console.log('Error sending message:', error);
        });
        res.status(200).send({
            message: "Message sent successfully",
            // token: response
        });
    }
    catch (error) {
        // console.error('Error sending message:', error);
        res.status(400).send({
            message: "Message sent failed",
            errorMessage: error.message
        });
    }
});
exports.notification = notification;
const notificationFunction = (req, res, type, object) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let profile = yield profileModel_1.PROFILE.find({ familyId: req.familyId, userId: { $ne: req.userId }, isDeleted: false });
        let sessionTokens = [];
        for (const users of profile) {
            let sessions = yield sessionModel_1.SESSION.findOne({ userId: users.userId, isActive: true, notificationToken: { $ne: null } }).sort({ updatedAt: -1 });
            if (sessions) {
                sessionTokens.push(sessions.notificationToken);
            }
        }
        const message = {
            notification: {
                title: object.title,
                body: object.body
            },
            data: {
                type: type,
                data: JSON.stringify(object.data),
                title: object.title,
                body: object.body,
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                },
                payload: {
                    aps: {
                        sound: 'default',
                    }
                },
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                }
            },
            tokens: sessionTokens
        };
        const silent_message = {
            data: {
                type: type,
                data: JSON.stringify(object.data),
                title: object.title,
                body: object.body,
            },
            tokens: sessionTokens
        };
        console.log(message);
        firebase_admin_1.default.messaging().sendEachForMulticast(message)
            .then((response) => {
            console.log('Successfully sent message:', JSON.stringify(response));
        })
            .catch((error) => {
            console.log('Error sending message:', JSON.parse(error));
        });
        firebase_admin_1.default.messaging().sendEachForMulticast(silent_message)
            .then((response) => {
            console.log('Successfully sent silent message:', JSON.stringify(response));
        })
            .catch((error) => {
            console.log('Error sending silent message:', JSON.parse(error));
        });
    }
    catch (error) {
        console.log('Error sending message:', error);
    }
});
exports.notificationFunction = notificationFunction;
