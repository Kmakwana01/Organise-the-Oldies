import { EVENT } from "../models/eventModel";
import { EVENT_USER } from "../models/eventUser";
import { PROFILE } from "../models/profileModel";
import { USER } from "../models/userModel";
import { Response , Request , NextFunction } from "express";
import { CONTACT } from "../models/contactModel";
import { KEY_INFO_USER } from "../models/keyInfoUserModel";
import { KEY_INFO } from "../models/keyInfoModel";
import { MEDICINES } from "../models/medicinesModel";
import { MEDICINES_USER } from "../models/medicinesUser";
import { REMINDER } from "../models/reminderModel";
import { REMINDER_USER } from "../models/reminderUserModel";
import { CONVERSATION } from "../models/conversationModel";
import { CONVERSATION_USER } from "../models/conversationUserModel";
import { CHAT } from "../models/chatModel";
import { ATTACHMENT } from "../models/attachmentModel";
import path from "path";
import fs from "fs";
import jwt from 'jsonwebtoken';
import { SESSION } from "../models/sessionModel";
import { TOKEN } from "../models/tokenModel";
import crypto from "crypto";
import crypto_js from 'crypto-js';
import bcrypt from 'bcrypt';
const main_socket = require("../socket");
const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();
import { errorMail , extractLineNumber } from "../util/email";
import mongoose from "mongoose";

export const create = async (req : Request, res : Response , next : NextFunction) => {
    try {
        const { firstName, lastName , role , email , password } = req.body;
        if(!firstName) throw new Error('FirstName is required.');
        if(!lastName) throw new Error('LastName is required.');
        if(!role) throw new Error('Role is required.');
        if(!email) throw new Error('Email is required.');

        if(role === 'grandParent') {

            let grandParentFind : any = await PROFILE.find({ familyId : req.familyId , isDeleted : false }).populate('userId');
            console.log('first')
            let filterData = grandParentFind.filter((fil: any) => fil.userId?.role === 'grandParent');

            if(filterData.length == 2) {
                throw new Error('You have already added the maximum number of grandparents allowed (2).');
            }
        } else {
            let siblingParentFind: any = await PROFILE.find({ familyId: req.familyId, isDeleted: false }).populate('userId');
            let filterData = siblingParentFind.filter((fil: any) => fil.userId.role === 'sibling');
            if (filterData.length == 2) {
                throw new Error('You have already added the maximum number of sibling allowed (2).');
            }
        }

        let emailFind = await USER.findOne({ email : email , isDeleted : false });
        if(emailFind && (emailFind.email != 'null')) throw new Error('Email already exists.');

        const userResponse = await USER.create({
            email : req.body.email,
            password : password ? await bcrypt.hash(password,8) : null,
            role : req.body.role,
            isDeleted : false,
            deletedBy : null
        });
        console.log(userResponse);
        
        let images = null;
        if(req.file) {
            images = req.file.filename
        }

        const profile = await PROFILE.create({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            image : images,
            familyId : req.familyId,
            createdBy : req.userId,
            userId : userResponse._id,
            isDeleted : false,
            deletedBy : null
        });

        let response : any = await profile.populate({
            path: 'userId',
            select: ['-password', '-socialMediaType']
        });

        const encryptedUserId = crypto_js.AES.encrypt(response.userId._id.toString(), secretKey).toString();
        response.userId._doc.encryptedUserId = encryptedUserId

        let responseKey = {
            key : 'grandParentAndSiblingCreate',
            grandParentAndSibling : response
        }

        main_socket.broadcastGrandParent(responseKey , req.familyId);

        res.status(201).json({
            status : 201,
            message : 'Data created successfully.',
            data : response
        })
        
    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const get = async (req: Request, res: Response , next: NextFunction) => {
    try {

        const familyId = req.query.familyId;
        if(!familyId) throw new Error('FamilyId is required.');
        const response = await PROFILE.aggregate([
            {
                $match: {
                    familyId: familyId,
                    isDeleted: false,
                    userId : { $ne : new mongoose.Types.ObjectId(req.userId) }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    firstName:1,
                    lastName : 1,
                    image : 1,
                    familyId: 1,
                    userId : {
                        _id: '$user._id',
                        email: '$user.email',
                        role : '$user.role',
                        isDeleted : '$user.isDeleted',
                        deletedBy : '$user.deletedBy',
                        createdAt : '$user.createdAt',
                        updatedAt : '$user.updatedAt'
                    },
                    createdBy : 1,
                    isDeleted : 1,
                    deletedBy : 1,
                    createdAt : 1,
                    updatedAt : 1,
                }
            }
        ]);

        const encryptedResponse = response.map((item: any) => {
            const encryptedUserId = crypto_js.AES.encrypt(item.userId._id.toString(), secretKey).toString();
            return {
                ...item,
                userId: {
                    ...item.userId,
                    encryptedUserId : encryptedUserId
                }
            };
        });

        res.status(200).json({
            status : 200,
            message : 'Data retrieved successfully.',
            data : encryptedResponse
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId , firstName , lastName , email } = req.body;
        switch (true) {
            case !userId: throw new Error('userId is required.')
            case !firstName: throw new Error('firstName is required.')
            case !lastName: throw new Error('lastName is required.')
            case !email: throw new Error('email is required.')
            default:
                break;
        }

        let userFind = await USER.findOne({ _id : userId , isDeleted : false });
        if(!userFind) {
            throw new Error('This user does not exist.')
        } else {

            let Email:any = await USER.findOne({ email , isDeleted : false});
            if(Email && (userId !== Email._id.toString())) {
                throw new Error('This email already exists.')
            }

            let userResponse:any = await USER.findByIdAndUpdate(userId,{
                email : req.body.email
            },{new : true});

            let profileFind = await PROFILE.findOne({ userId : userId });

            let images;
            if(req.file) {
                images = req.file.filename;
            } else {
                images = profileFind?.image;
            }

            let profile = await PROFILE.findOneAndUpdate({ userId : userId },{
                firstName,
                lastName,
                image : images
            },{new : true})

            let populateProfile: any = await profile?.populate({
                path: 'userId',
                select: ['-password', '-socialMediaType']
            })

            const encryptedUserId = crypto_js.AES.encrypt(populateProfile.userId._id.toString(), secretKey).toString();
            populateProfile.userId._doc.encryptedUserId = encryptedUserId
            

            console.log("==========> " + populateProfile);
            

            let responseKey = {
                key : 'grandParentAndSiblingUpdate',
                grandParentAndSibling: populateProfile
            }
    
            main_socket.broadcastGrandParent(responseKey , req.familyId);

            res.status(202).json({
                status : 202,
                message : 'Data updated successfully.',
                data : populateProfile
            })
        }
        
    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const deleteData = async (req: Request, res: Response, next: NextFunction) => {
    try {

        if(!req.query.userId) throw new Error('userId is required.')
        let userFind = await USER.findOne({ _id : req.query.userId , isDeleted : false });
        if(!userFind) {
            throw new Error('This user does not exist.');
        } else {
            let profileFindData = await PROFILE.findOne({ userId : userFind._id })

            if(userFind?.role === 'parent') {

                let profileFind = await PROFILE.findOne({ userId : userFind._id });
                let allProfile = await PROFILE.find({ familyId : profileFind?.familyId , isDeleted : false});
                let userId = allProfile.map((user) => user.userId);

                await EVENT_USER.deleteMany({ userId : { $in : userId } });
                await EVENT.deleteMany({ familyId : profileFind?.familyId });

                await CONTACT.deleteMany({ familyId : profileFind?.familyId });

                await KEY_INFO_USER.deleteMany({ userId : { $in : userId } });
                await KEY_INFO.deleteMany({ familyId : profileFind?.familyId })

                await MEDICINES_USER.deleteMany({ userId : { $in : userId } });
                const medicines = await MEDICINES.find({ familyId : profileFind?.familyId });
                if(medicines.length > 0) {
                    for (const medicine of medicines) {
                        if(medicine.photo) {
                            const imagePath = path.join( 'public', 'images', path.basename(medicine?.photo));
                            if(imagePath) {
                                if (fs.existsSync(imagePath)) {
                                    fs.unlink(imagePath, (err:any) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        } else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                } else {
                                    console.log(`Medicine photo path does not exist: ${imagePath}`);
                                }
                            }
                        }

                        if(medicine.voice) {
                            const audioPath = path.join( 'public', 'audio', path.basename(medicine?.voice));
                            if(audioPath) {
                                if (fs.existsSync(audioPath)) {
                                    fs.unlink(audioPath, (err:any) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        } else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                } else {
                                    console.log(`Medicine voice path does not exist: ${audioPath}`);
                                }
                            }
                        }

                        await MEDICINES.deleteOne({ _id : medicine._id });
                    }
                }

                await REMINDER_USER.deleteMany({ userId : { $in : userId } });
                const reminder = await REMINDER.find({ familyId : profileFind?.familyId });
                if(reminder.length > 0) {
                    for (const iterator of reminder) {
                        if(iterator?.voice){
                            const audioPath = path.join( 'public', 'audio', path.basename(iterator?.voice));
                            if(audioPath) {
                                if (fs.existsSync(audioPath)) {
                                    fs.unlink(audioPath, (err:any) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        } else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                } else {
                                    console.log(`Reminder voice path does not exist: ${audioPath}`);
                                }
                            }
                        }
                        await REMINDER.deleteOne({ _id : iterator._id })
                    }
                }

                const conversationFind = await CONVERSATION.findOne({ familyId : profileFind?.familyId });
                if(conversationFind) {
                    await CONVERSATION_USER.deleteMany({ conversationId : conversationFind._id });
                    let chatFind = await CHAT.find({ familyId : profileFind?.familyId });
                    for (const chatDelete of chatFind) {
                        if(chatDelete.attachmentId !== null) {
                            const attachmentFind:any = await ATTACHMENT.findOne({ _id : chatDelete.attachmentId });

                            const imagePath = path.join( 'public', 'images', path.basename(attachmentFind?.path));
                            let findAttachments = imagePath ? imagePath : path.join( 'public', 'audio', path.basename(attachmentFind?.path));
                            if(findAttachments) {
                                if (fs.existsSync(findAttachments)) {
                                    fs.unlink(findAttachments, (err:any) => {
                                        if (err) {
                                            console.log('Error deleting image:', err);
                                        } else {
                                            console.log('Image deleted successfully');
                                        }
                                    });
                                } else {
                                    console.log(`Attachment path does not exist: ${findAttachments}`);
                                }
                            }
                            await ATTACHMENT.deleteOne({ _id : chatDelete.attachmentId })
                        }
                        await CHAT.deleteOne({ _id : chatDelete._id })
                    }
                }

                const profile = await PROFILE.find({ familyId : profileFind?.familyId });
                for (const profiles of profile) {
                    if(profiles.image) {
                        const imagePath = path.join( 'public', 'images', path.basename(profiles?.image));
                        if(imagePath) {
                            if (fs.existsSync(imagePath)) {
                                fs.unlink(imagePath, (err:any) => {
                                    if (err) {
                                        console.log('Error deleting image:', err);
                                    } else {
                                        console.log('Image deleted successfully');
                                    }
                                });
                            } else {
                                console.log(`Profile image path does not exist: ${imagePath}`);
                            }
                        }
                    }
                    await PROFILE.deleteOne({ _id : profiles._id });
                }

                await USER.deleteMany({ _id : { $in : userId} });

                let responseKey = {
                    key : 'parentDelete',
                    grandParentAndSibling : await profileFindData?.populate({ path : 'userId' , select : '-password' })
                }
                
                main_socket.broadcastGrandParent(responseKey , req.familyId);

            } else {
                const event = await EVENT.find({ familyId : profileFindData?.familyId });
                if(event.length > 0) {
                    for (const events of event) {
                        const eventUser = await EVENT_USER.find({ eventId : events._id , isDeleted : false});
                        if(eventUser.length > 1) {
                            await EVENT_USER.deleteMany({ eventId : events._id , userId : userFind._id });
                        } else {
                            await EVENT_USER.deleteOne({ eventId : events._id });
                            await EVENT.deleteOne({ _id : events._id })
                        }
                    }
                }

                await CONTACT.deleteMany({ familyId : profileFindData?.familyId , createdBy : userFind._id });

                const keyInfos = await KEY_INFO.find({ familyId : profileFindData?.familyId });
                if(keyInfos.length > 0) {
                    for (const keyInfo of keyInfos) {
                        const keyInfoUser = await KEY_INFO_USER.find({ keyInfoId : keyInfo._id , isDeleted : false });
                        if(keyInfoUser.length > 1) {
                            await KEY_INFO_USER.deleteMany({ keyInfoId : keyInfo._id , userId : profileFindData?.userId });
                        } else {
                            await KEY_INFO_USER.deleteMany({ keyInfoId : keyInfo._id });
                            await KEY_INFO.deleteOne({ _id : keyInfo._id });
                        }
                    }
                }

                const medicines = await MEDICINES.find({ familyId : profileFindData?.familyId });
                if(medicines.length > 0) {
                    for (const medicine of medicines) {
                        const medicineUser = await MEDICINES_USER.find({ medicinesId : medicine._id , isDeleted : false });
                        if(medicineUser.length > 1) {
                            await MEDICINES_USER.deleteMany({ medicinesId : medicine._id , userId : profileFindData?.userId })
                        } else {
                            await MEDICINES_USER.deleteMany({ medicinesId : medicine._id });

                            if(medicine.photo) {
                                const imagePath = path.join( 'public', 'images', path.basename(medicine?.photo));
                                if(imagePath) {
                                    if (fs.existsSync(imagePath)) {
                                        fs.unlink(imagePath, (err:any) => {
                                            if (err) {
                                                console.log('Error deleting image:', err);
                                            } else {
                                                console.log('Image deleted successfully');
                                            }
                                        });
                                    } else {
                                        console.log(`Medicine photo path does not exist: ${imagePath}`);
                                    }
                                }
                            }
    
                            if(medicine.voice) {
                                const audioPath = path.join( 'public', 'audio', path.basename(medicine?.voice));
                                if(audioPath) {
                                    if (fs.existsSync(audioPath)) {
                                        fs.unlink(audioPath, (err:any) => {
                                            if (err) {
                                                console.log('Error deleting image:', err);
                                            } else {
                                                console.log('Image deleted successfully');
                                            }
                                        });
                                    } else {
                                        console.log(`Medicine voice path does not exist: ${audioPath}`);
                                    }
                                }
                            }

                            await MEDICINES.deleteOne({ _id : medicine._id })
                        }
                    }
                }

                const reminders = await REMINDER.find({ familyId : profileFindData?.familyId });
                if(reminders.length > 0) {
                    for (const reminder of reminders) {
                        const reminderUser = await REMINDER_USER.find({ reminderId : reminder._id , isDeleted : false });
                        if(reminderUser.length > 1) {
                            await REMINDER_USER.deleteMany({ reminderId : reminder._id , userId : profileFindData?.userId })
                        } else {
                            await REMINDER_USER.deleteMany({ reminderId : reminder._id });

                            if(reminder.voice){
                                const audioPath = path.join( 'public', 'audio', path.basename(reminder?.voice));
                                if(audioPath) {
                                    if (fs.existsSync(audioPath)) {
                                        fs.unlink(audioPath, (err:any) => {
                                            if (err) {
                                                console.log('Error deleting image:', err);
                                            } else {
                                                console.log('Image deleted successfully');
                                            }
                                        });
                                    } else {
                                        console.log(`Reminder voice path does not exist: ${audioPath}`);
                                    }
                                }
                            }
                            await REMINDER.deleteOne({ _id : reminder._id });
                        }
                    }
                }

                const profile = await PROFILE.findOne({ userId : profileFindData?.userId , familyId : profileFindData?.familyId });
                if(profile?.image) {
                    const imagePath = path.join( 'public', 'images', path.basename(profile?.image));
                    if(imagePath) {
                        if (fs.existsSync(imagePath)) {
                            fs.unlink(imagePath, (err:any) => {
                                if (err) {
                                    console.log('Error deleting image:', err);
                                } else {
                                    console.log('Image deleted successfully');
                                }
                            });
                        } else {
                            console.log(`Profile image path does not exist: ${imagePath}`);
                        }
                        
                    }
                }

                let responseKey = {
                    key: 'grandParentAndSiblingDelete',
                    grandParentAndSibling: await profileFindData?.populate({ path: 'userId', select: ['-password', '-socialMediaType'] })
                }

                await PROFILE.deleteOne({ _id : profile?._id });

                await USER.deleteOne({ _id : profile?.userId });

                main_socket.broadcastGrandParent(responseKey , req.familyId);
            }
            
            res.status(202).json({
                status : 202,
                message : 'Data deleted successfully.'
            })
        }
        
    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const getDataFromId = async (req: Request , res: Response , next: NextFunction) => {
    try {

        let profile = await PROFILE.findOne({ userId : req.userId }).populate({
            path : 'userId',
            select: ['-password', '-socialMediaType']
        });

        res.status(200).json({
            status : 200,
            message : 'Profile retrieved successfully.',
            data : profile
        })
    } catch (error:any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const login = async (req: Request , res: Response , next: NextFunction) => {
    try {

        let { userId , notificationToken , deviceName, platform } = req.body;

        if(!userId){
            throw new Error('userId is required.')
        } else if(!notificationToken){
            throw new Error('notificationToken is required.')
        } else if(!deviceName){
            throw new Error('deviceName is required.')
        } else if(!platform){
            throw new Error('platform is required.')
        }

        const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
        let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

        const decryptedBytes = crypto_js.AES.decrypt(userId, secretKey)
        const decryptedUserId = decryptedBytes.toString(crypto_js.enc.Utf8);
        if (!decryptedUserId) {
            throw new Error('Failed to decrypt userId');
        }
      

        let userFind = await USER.findOne({ _id : decryptedUserId , isDeleted : false });
        if(!userFind) throw new Error('User not found.');

        if (userFind.role === 'sibling') {
            if (!userFind.password) {
        
                return res.status(307).json({
                    status: 307,
                    message: 'Please set a new password.',
                });
        
            } else {
        
                return res.status(302).json({
                    status: 302,
                    message: 'you are already registered.',
                });
            }
        }

        let options: jwt.SignOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };

        let objectToCreateToken = {
            email: userFind.email,
            userId: userFind._id,
            role : userFind.role,
            createdAt: Date.now(),
        };

        let token = jwt.sign(objectToCreateToken, secretKey, options);

        const refreshTokenPayload = {
            userId: userFind._id,
        };
        

        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        let refreshOptions: jwt.SignOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        
        const refreshToken = jwt.sign(refreshTokenPayload, privateKey, refreshOptions);
        
        await TOKEN.create({
            accessToken : token,
            refreshToken : refreshToken,
            userId : userFind._id,
            createdAt : Date.now(),
            updatedAt : Date.now()
        })

        await SESSION.create({
            notificationToken : notificationToken,
            jwtToken: token,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            deviceName: deviceName,
            platform: platform,
            userId: userFind._id,
            isActive: true,
            generatedAt: Date.now(),
            createdAt : Date.now(),
            updatedAt: Date.now()
        });

        let familyIdFind = await PROFILE.findOne({ userId : userFind._id , isDeleted : false });

        res.status(200).json({
            status : 200,
            message : 'Login successfully.',
            token,
            refreshToken,
            userId : userFind._id,
            role : userFind.role,
            familyId : familyIdFind?.familyId
        })

    } catch (error:any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};
