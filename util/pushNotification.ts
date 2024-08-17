require('dotenv').config();
import admin from "firebase-admin";
import { Request , Response , NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from "path";
import { getMessaging } from 'firebase-admin/messaging';
import { PROFILE } from "../models/profileModel";
import { SESSION } from "../models/sessionModel";

const serviceAccountPath = path.join(__dirname, '../organise-the-oldies.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// const serviceAccount = require("./sureiCredentials.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'organise-the-oldies-bc7a5'
});

export const notification = async (req : Request, res : Response) => {
    try {
        const { fcmToken , title , mess } = req.body;
        if (!fcmToken) {
            return res.status(400).send({ message: "FCM token is required" });
        }
        
        if (!title || !mess) {
            return res.status(400).send({ message: "Title and message are required" });
        }

        const message = {
            notification : {
                title : title,
                body : mess
            },
            data : {
                title : title,
                body : mess
            },
            token : fcmToken
        }
        
        getMessaging().send(message)
            .then((response:any) => {
            console.log('Successfully sent message:', response);
            })
            .catch((error :any) => {
            console.log('Error sending message:', error);
            })

        res.status(200).send({
            message: "Message sent successfully",
            // token: response
        });

    } catch (error:any) {
        // console.error('Error sending message:', error);

        res.status(400).send({
            message: "Message sent failed",
            errorMessage: error.message
        });

    }
};

export const notificationFunction = async (req : Request , res : Response , type : any , object : any ) => {
    try {

        let profile = await PROFILE.find({ familyId : req.familyId , userId : { $ne : req.userId }, isDeleted : false });
        let sessionTokens = [];
        for (const users of profile) {
            let sessions = await SESSION.findOne({ userId : users.userId , isActive : true , notificationToken : { $ne : null }}).sort({ updatedAt : -1 });
            if(sessions) {
                sessionTokens.push(sessions.notificationToken)
            }
        }

        const message:any = {
            notification : {
                title : object.title,
                body : object.body
            },
            data : {
                type : type,
                data : JSON.stringify(object.data),
                title : object.title,
                body : object.body,
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
        }

        const silent_message: any = {
            data: {
                type: type,
                data: JSON.stringify(object.data),
                title: object.title,
                body: object.body,
            },
            tokens: sessionTokens
        }

        console.log(message)

        admin.messaging().sendEachForMulticast(message)
            .then((response:any) => {
            console.log('Successfully sent message:', JSON.stringify(response));
            })
            .catch((error :any) => {
            console.log('Error sending message:', JSON.parse(error));
            })

        admin.messaging().sendEachForMulticast(silent_message)
            .then((response: any) => {
                console.log('Successfully sent silent message:', JSON.stringify(response));
            })
            .catch((error: any) => {
                console.log('Error sending silent message:', JSON.parse(error));
            })

    } catch (error:any) {
        console.log('Error sending message:', error);
    }
};
