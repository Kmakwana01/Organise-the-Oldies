import { Response, Request, NextFunction } from "express";
import { PROFILE } from '../models/profileModel';
import { USER } from '../models/userModel';
import { SESSION } from "../models/sessionModel";
import { TOKEN } from "../models/tokenModel";
import { FORGOT_PASSWORD } from "../models/forgotPasswordModel";
import { main } from "../util/email";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import fs from 'fs';
import path from 'path';
import crypto from "crypto";
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();
import { errorMail, extractLineNumber } from "../util/email";
import { OAuth2Client } from "google-auth-library";
import { web } from '../util/googleAuth.json'
import appleSignInAuth from 'apple-signin-auth' 

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { firstName, lastName, role, password, confirmPassword, email, notificationToken, deviceName, platform } = req.body;

        switch (true) {
            case !firstName:
                throw new Error('firstName is required.');
            case !lastName:
                throw new Error('lastName is required.');
            case !email:
                throw new Error('email is required.');
            case !role:
                throw new Error('role is required.');
            case !password:
                throw new Error('password is required.');
            case !confirmPassword:
                throw new Error('confirmPassword is required.');
            case !notificationToken:
                throw new Error('notificationToken is required.');
            case !deviceName:
                throw new Error('deviceName is required.');
            case !platform:
                throw new Error('platform is required.');
            case password !== confirmPassword:
                throw new Error('Password and confirmPassword do not match.');
            default:
                break;
        }

        let userFind = await USER.findOne({ email, isDeleted: false });
        if (userFind) throw new Error('Email already exist.')

        const saltRounds = 10;
        password = await bcrypt.hash(password, saltRounds);

        const user = await USER.create({
            email,
            password,
            role,
            isDeleted: false,
            deletedBy: null
        });

        let familyId = uuidv4();
        const familyIdData = await PROFILE.findOne({ familyId: familyId });
        if (familyIdData) {
            familyId = uuidv4();
        }

        const profile = await PROFILE.create({
            firstName,
            lastName,
            image: null,
            familyId,
            createdBy: user._id,
            userId: user._id,
            isDeleted: false,
            deletedBy: null
        })

        const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
        let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

        let options: jwt.SignOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };

        let objectToCreateToken = {
            email: user.email,
            userId: user._id,
            role: user.role,
            createdAt: Date.now(),
        };

        let token = jwt.sign(objectToCreateToken, secretKey, options);

        const refreshTokenPayload = {
            userId: user._id,
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

        const refreshToken = jwt.sign(refreshTokenPayload, privateKey,refreshOptions);

        await TOKEN.create({
            accessToken: token,
            refreshToken: refreshToken,
            userId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await SESSION.create({
            notificationToken: (!notificationToken) ? null : notificationToken,
            jwtToken: token,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            deviceName: deviceName,
            platform: platform,
            userId: user._id,
            isActive: true,
            generatedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        let profiles = await PROFILE.findOne({ _id: profile._id }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] })
        res.status(201).json({
            status: 201,
            message: 'Signup successfully.',
            data: { profile: profiles, token, refreshToken }
        })
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {

        let { email, password, notificationToken, deviceName, platform } = req.body;

        switch (true) {
            case !email: throw new Error('Email is required.')
            case !password: throw new Error('Password is required.')
            case !deviceName: throw new Error('deviceName is required.')
            case !platform: throw new Error('Platform is required.')
            default: break;
        }

        let userFind = await USER.findOne({ email, isDeleted: false });
        if (!userFind) throw new Error('User not found.');
        if (userFind.role === 'grandParent') throw new Error('This API access only parent and sibling user.');

        if(userFind.socialMediaType != null) {
            throw new Error(`This email is used for ${userFind.socialMediaType} login`)
        }

        if (userFind.password == null) {
            throw new Error('Password is not set for this user.')
        }

        let checkPassword = await bcrypt.compare(password, userFind.password);
        if (!checkPassword) throw new Error('Password incorrect.');

        const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
        let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

        let options: jwt.SignOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };

        let objectToCreateToken = {
            email: userFind.email,
            userId: userFind._id,
            role: userFind.role,
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
            accessToken: token,
            refreshToken: refreshToken,
            userId: userFind._id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await SESSION.create({
            notificationToken: (!notificationToken) ? null : notificationToken,
            jwtToken: token,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            deviceName: deviceName,
            platform: platform,
            userId: userFind._id,
            isActive: true,
            generatedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        let familyIdFind = await PROFILE.findOne({ userId: userFind._id, isDeleted: false });

        res.status(200).json({
            status: 200,
            message: 'Login successfully.',
            token,
            refreshToken,
            userId: userFind._id,
            role: userFind.role,
            familyId: familyIdFind?.familyId
        })
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
}

export const token = async (req: Request, res: Response, next: NextFunction) => {
    try {

        if (!req.body.refreshToken) throw new Error('Please provide a refresh token.');

        let tokenFind: any = await TOKEN.findOne({ refreshToken: req.body.refreshToken });
        if (!tokenFind) throw new Error('Refresh token not found. Please try logging in again.');

        let findAccess = await SESSION.findOne({ userId: tokenFind.userId }).sort({ createdAt: -1 })
        if (!findAccess) throw new Error('Session not found. Please log in again.');

        let userFind = await USER.findOne({ _id: findAccess.userId });
        if (!userFind) throw new Error('User not found. Please try logging in again.');

        const decodeRefresh: any = jwt.decode(req.body.refreshToken)
        let tokeExpiresAt = new Date(decodeRefresh.exp * 1000);
        const currentDate = new Date();
        if (tokeExpiresAt.getTime() < currentDate.getTime()) {
            throw new Error('Refresh token is expaire.')
        }

        let secretKey = fs.readFileSync(__dirname + '/../jwtRS256.key', 'utf8').trim();
        let objectToCreateToken = {
            email: userFind.email,
            userId: userFind._id,
            role: userFind.role,
            createdAt: Date.now()
        };

        let options: jwt.SignOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };

        let tokenGenerate = jwt.sign(objectToCreateToken, secretKey, options);

        await SESSION.findByIdAndUpdate(findAccess._id, {
            jwtToken: tokenGenerate
        }, { new: true });

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

        await TOKEN.findByIdAndUpdate(tokenFind._id, {
            accessToken: tokenGenerate,
            refreshToken: refreshToken,
        })

        res.status(202).json({
            status: 202,
            message: 'Token updated successfully.',
            token: tokenGenerate,
            refreshToken: refreshToken
        });
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message,
        })
    }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { email } = req.body;
        if (!email) throw new Error('Please provide email.');

        let user = await USER.findOne({ email })
        if (!user) throw new Error('User not found.');
        let profile = await PROFILE.findOne({ userId :user?._id  })

        console.log(profile)
        let otpCode = Math.floor(100000 + Math.random() * 900000);

        // let date_ob = new Date().getTime() + 15 * 60000;
        // let expiresAt = new Date(date_ob);

        let otpResponse = await FORGOT_PASSWORD.create({
            verificationCode: otpCode,
            email: user.email,
            //expiresAt: "10m",
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
        });

        main(email, otpCode , profile);

        res.status(200).json({
            status: 200,
            message: 'OTP has been sent on email,please check and verify.',
            //data : otpResponse
        })
        return;
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(404).json({
            status: 'Fail',
            message: error.message,
        });
    }
};

export const compareCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { verificationCode, email } = req.body;

        if (!verificationCode) throw new Error("Please provide a verification code.");
        if (!email) throw new Error("Please provide an email address.");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("'@' and '.' must be used in Email address like 'test@example.com'.");
        }

        const resetEmail = await FORGOT_PASSWORD.findOne({ email: email })
            .sort({ createdAt: -1 })
            .exec();

        if (resetEmail) {
            const resetCode = resetEmail.verificationCode;
            const createdAtDate = resetEmail.createdAt;
            const expirationTime: any = process.env.FORGOT_PASSWORD_EXPIRE_IN_SECONDS;

            if (resetCode == verificationCode) {
                if ((new Date().getTime() - createdAtDate.getTime()) > expirationTime) {
                    throw new Error("This email verification code has expired.");
                }
                res.status(200).json({
                    status: 200,
                    message: "Your verification code is accepted.",
                });
            } else {
                throw new Error("Please enter a valid verification code.");
            }
        } else {
            throw new Error("Please enter a valid email.");
        }
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { email, password, confirmPassword } = req.body;

        switch (true) {
            case !email: throw new Error("Email is required.");
            case !password: throw new Error("Password is required.");
            case !confirmPassword: throw new Error("ConfirmPassword is required.");
            default:
                break;
        }

        // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        // if (!passwordRegex.test(password)) {
        //     throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.');
        // }

        if (password !== confirmPassword) throw new Error('Password and confirm password do not match.');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await USER.findOne({ email });
        if (!user) throw new Error('User not found.');

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: 200,
            message: 'Your password has been reset.',
        });
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        });
    }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { userId } = req.body;

        if (!userId) {
            throw new Error("userId is required for logout");
        }

        var find = await SESSION.findOne({ userId: userId, isActive: true }).sort({ createdAt: -1 });
        if (find) {
            var tokenFind = await TOKEN.findOne({ userId: userId });
            if (tokenFind) {
                await TOKEN.findByIdAndDelete(tokenFind._id)
            }

            await SESSION.findByIdAndUpdate(find._id, {
                isActive: false,
                notificationToken: null
            });

            res.status(200).json({
                status: 200,
                message: 'You have been logged out.'
            });
            
        } else {
            res.status(404).json({
                status: 404,
                message: 'Session not found or already inactive.'
            });
        }
    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        })
    }
}

export const tokenVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.token) {
            throw new Error('Please provide a token.')
        }
        var token = req.body.token;
        var tokenFind = await SESSION.findOne({ jwtToken: token });
        if (tokenFind) {

            let token = tokenFind.jwtToken;
            let tokenDecode: any = jwt.decode(token);
            let tokeExpiresAt = new Date(tokenDecode.exp * 1000);
            const currentDate = new Date();
            if (tokeExpiresAt.getTime() < currentDate.getTime()) {
                res.status(401).json({
                    status: 401,
                    message: 'Token has expired.'
                })
            } else {
                res.status(200).json({
                    status: 200,
                    message: 'This token is valid.'
                })
            }

        } else {
            res.status(401).json({
                status: 401,
                message: 'Token not found.'
            })
        }

    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        })
    }
};

export const updateFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { notificationToken } = req.body;

        if (!notificationToken) throw new Error('notificationToken is required.');

        let findSession = await SESSION.findOne({ jwtToken: req.token, isActive: true })
        if (!findSession) throw new Error('please provide valid jwtToken.');

        findSession.notificationToken = notificationToken;
        await findSession.save();

        res.status(202).json({
            status: 202,
            message: 'notificationToken update successfully.',
            data: findSession
        })

    } catch (error: any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        })
    }
}

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { idToken, notificationToken, deviceName, platform } = req.body;

        switch (true) {
            case !notificationToken:
                throw new Error('notificationToken is required.');
            case !deviceName:
                throw new Error('deviceName is required.');
            case !platform:
                throw new Error('platform is required.');
            case !idToken:
                throw new Error('token is required.');
            default:
                break;
        }

        const client: any = new OAuth2Client();

        var audiance = web.client_id;
        if (platform == 'iOS') {
            audiance = "494043634835-en7sc7uerphnt8r3ipj50emlelnji65l.apps.googleusercontent.com";
        }

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: audiance
        });
        const payload: any = ticket.getPayload();

        const firstName = payload.given_name;
        const lastName = payload.family_name;
        const role = "parent";
        const email = payload.email;
        const profileImage = payload.picture;


        let userFind = await USER.findOne({ email, isDeleted: false });
        if (userFind) {

            if (userFind.role === 'grandParent') throw new Error('This API access only parent and sibling user.');

            const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

            let options: jwt.SignOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };

            let objectToCreateToken = {
                email: userFind.email,
                userId: userFind._id,
                role: userFind.role,
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
                accessToken: token,
                refreshToken: refreshToken,
                userId: userFind._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            })

            await SESSION.create({
                notificationToken: (!notificationToken) ? null : notificationToken,
                jwtToken: token,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                deviceName: deviceName,
                platform: platform,
                userId: userFind._id,
                isActive: true,
                generatedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            let familyIdFind = await PROFILE.findOne({ userId: userFind._id, isDeleted: false }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });

            // res.status(200).json({
            //     status: 200,
            //     message: 'Login successfully.',
            //     token,
            //     refreshToken,
            //     userId: userFind._id,
            //     role: userFind.role,
            //     familyId: familyIdFind?.familyId
            // })

            res.status(200).json({
                status: 200,
                message: 'Login successfully.',
                data: { profile: familyIdFind, token, refreshToken }
            })

        } 
        else {

            const user = await USER.create({
                email,
                role,
                socialMediaType: "Google",
                isDeleted: false,
                deletedBy: null
            });

            let familyId = uuidv4();
            const familyIdData = await PROFILE.findOne({ familyId: familyId });
            if (familyIdData) {
                familyId = uuidv4();
            }

            const profile = await PROFILE.create({
                firstName,
                lastName,
                image: profileImage ? profileImage : null,
                familyId,
                createdBy: user._id,
                userId: user._id,
                isDeleted: false,
                deletedBy: null
            })

            const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

            let options: jwt.SignOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };

            let objectToCreateToken = {
                email: user.email,
                userId: user._id,
                role: user.role,
                createdAt: Date.now(),
            };

            let token = jwt.sign(objectToCreateToken, secretKey, options);

            const refreshTokenPayload = {
                userId: user._id,
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
                accessToken: token,
                refreshToken: refreshToken,
                userId: user._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            })

            await SESSION.create({
                notificationToken: (!notificationToken) ? null : notificationToken,
                jwtToken: token,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                deviceName: deviceName,
                platform: platform,
                userId: user._id,
                isActive: true,
                generatedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            let profiles = await PROFILE.findOne({ _id: profile._id }).populate({ path: 'userId', select: ['-password','-socialMediaType'] })
            res.status(200).json({
                status: 200,
                message: 'Signup successfully.',
                data: { profile: profiles, token, refreshToken }
            })
        }

    } catch (error: any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
}

export const appleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { idToken, notificationToken, deviceName, platform } = req.body;

        switch (true) {
            case !notificationToken:
                throw new Error('notificationToken is required.');
            case !deviceName:
                throw new Error('deviceName is required.');
            case !platform:
                throw new Error('platform is required.');
            case !idToken:
                throw new Error('token is required.');
            default:
                break;
        }

        let payload : any = await appleSignInAuth.verifyIdToken(idToken, {
            audience: process.env.APPLE_CLIENT_ID, //  com.example.yourapp
            ignoreExpiration: true,
        });

        console.log('payload :>> ', payload);

        if (!payload) throw new Error('Failed to verify idToken.');

        const firstName = payload.lastName;
        const lastName = payload.lastName;
        const role = "parent";
        const email = payload.email;
        // const profileImage = payload.picture;

        let userFind = await USER.findOne({ email, isDeleted: false });
        if (userFind) {

            if (userFind.role === 'grandParent') throw new Error('This API access only parent and sibling user.');

            const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

            let options: jwt.SignOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };

            let objectToCreateToken = {
                email: userFind.email,
                userId: userFind._id,
                role: userFind.role,
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
                accessToken: token,
                refreshToken: refreshToken,
                userId: userFind._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            })

            await SESSION.create({
                notificationToken: (!notificationToken) ? null : notificationToken,
                jwtToken: token,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                deviceName: deviceName,
                platform: platform,
                userId: userFind._id,
                isActive: true,
                generatedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            let familyIdFind = await PROFILE.findOne({ userId: userFind._id, isDeleted: false }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });

            // res.status(200).json({
            //     status: 200,
            //     message: 'Login successfully.',
            //     token,
            //     refreshToken,
            //     userId: userFind._id,
            //     role: userFind.role,
            //     familyId: familyIdFind?.familyId
            // })

            res.status(200).json({
                status: 200,
                message: 'Login successfully.',
                data: { profile: familyIdFind, token, refreshToken }
            })

        } 
        else {

            const user = await USER.create({
                email,
                role,
                socialMediaType: "Google",
                isDeleted: false,
                deletedBy: null
            });

            let familyId = uuidv4();
            const familyIdData = await PROFILE.findOne({ familyId: familyId });
            if (familyIdData) {
                familyId = uuidv4();
            }

            const profile = await PROFILE.create({
                firstName,
                lastName,
                image:  null,
                familyId,
                createdBy: user._id,
                userId: user._id,
                isDeleted: false,
                deletedBy: null
            })

            const secretKeyPath = path.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs.readFileSync(secretKeyPath, 'utf8').trim();

            let options: jwt.SignOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };

            let objectToCreateToken = {
                email: user.email,
                userId: user._id,
                role: user.role,
                createdAt: Date.now(),
            };

            let token = jwt.sign(objectToCreateToken, secretKey, options);

            const refreshTokenPayload = {
                userId: user._id,
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
                accessToken: token,
                refreshToken: refreshToken,
                userId: user._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            })

            await SESSION.create({
                notificationToken: (!notificationToken) ? null : notificationToken,
                jwtToken: token,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                deviceName: deviceName,
                platform: platform,
                userId: user._id,
                isActive: true,
                generatedAt: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            let profiles = await PROFILE.findOne({ _id: profile._id }).populate({ path: 'userId', select: ['-password','-socialMediaType'] })
            res.status(200).json({
                status: 200,
                message: 'Signup successfully.',
                data: { profile: profiles, token, refreshToken }
            })
        }

    } catch (error: any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            errorMail(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
}


