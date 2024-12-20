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
exports.appleAuth = exports.googleAuth = exports.updateFcmToken = exports.tokenVerify = exports.logout = exports.resetPassword = exports.compareCode = exports.forgotPassword = exports.token = exports.login = exports.signup = void 0;
const profileModel_1 = require("../models/profileModel");
const userModel_1 = require("../models/userModel");
const sessionModel_1 = require("../models/sessionModel");
const tokenModel_1 = require("../models/tokenModel");
const forgotPasswordModel_1 = require("../models/forgotPasswordModel");
const email_1 = require("../util/email");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
require('dotenv').config();
const email_2 = require("../util/email");
const google_auth_library_1 = require("google-auth-library");
const googleAuth_json_1 = require("../util/googleAuth.json");
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
const signup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        let userFind = yield userModel_1.USER.findOne({ email, isDeleted: false });
        if (userFind)
            throw new Error('Email already exist.');
        const saltRounds = 10;
        password = yield bcrypt_1.default.hash(password, saltRounds);
        const user = yield userModel_1.USER.create({
            email,
            password,
            role,
            isDeleted: false,
            deletedBy: null
        });
        let familyId = (0, uuid_1.v4)();
        const familyIdData = yield profileModel_1.PROFILE.findOne({ familyId: familyId });
        if (familyIdData) {
            familyId = (0, uuid_1.v4)();
        }
        const profile = yield profileModel_1.PROFILE.create({
            firstName,
            lastName,
            image: null,
            familyId,
            createdBy: user._id,
            userId: user._id,
            isDeleted: false,
            deletedBy: null
        });
        const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
        let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
        let options = {
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
        let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
        const refreshTokenPayload = {
            userId: user._id,
        };
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        let refreshOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
        yield tokenModel_1.TOKEN.create({
            accessToken: token,
            refreshToken: refreshToken,
            userId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        yield sessionModel_1.SESSION.create({
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
        let profiles = yield profileModel_1.PROFILE.findOne({ _id: profile._id }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });
        res.status(201).json({
            status: 201,
            message: 'Signup successfully.',
            data: { profile: profiles, token, refreshToken }
        });
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.signup = signup;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { email, password, notificationToken, deviceName, platform } = req.body;
        switch (true) {
            case !email: throw new Error('Email is required.');
            case !password: throw new Error('Password is required.');
            case !deviceName: throw new Error('deviceName is required.');
            case !platform: throw new Error('Platform is required.');
            default: break;
        }
        let userFind = yield userModel_1.USER.findOne({ email, isDeleted: false });
        if (!userFind)
            throw new Error('User not found.');
        if (userFind.role === 'grandParent')
            throw new Error('This API access only parent and sibling user.');
        if (userFind.socialMediaType != null) {
            throw new Error(`This email is used for ${userFind.socialMediaType} login`);
        }
        if (userFind.password == null) {
            throw new Error('Password is not set for this user.');
        }
        let checkPassword = yield bcrypt_1.default.compare(password, userFind.password);
        if (!checkPassword)
            throw new Error('Password incorrect.');
        const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
        let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
        let options = {
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
        let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
        const refreshTokenPayload = {
            userId: userFind._id,
        };
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        let refreshOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
        yield tokenModel_1.TOKEN.create({
            accessToken: token,
            refreshToken: refreshToken,
            userId: userFind._id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        yield sessionModel_1.SESSION.create({
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
        let familyIdFind = yield profileModel_1.PROFILE.findOne({ userId: userFind._id, isDeleted: false });
        res.status(200).json({
            status: 200,
            message: 'Login successfully.',
            token,
            refreshToken,
            userId: userFind._id,
            role: userFind.role,
            familyId: familyIdFind === null || familyIdFind === void 0 ? void 0 : familyIdFind.familyId
        });
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.login = login;
const token = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body.refreshToken)
            throw new Error('Please provide a refresh token.');
        let tokenFind = yield tokenModel_1.TOKEN.findOne({ refreshToken: req.body.refreshToken });
        if (!tokenFind)
            throw new Error('Refresh token not found. Please try logging in again.');
        let findAccess = yield sessionModel_1.SESSION.findOne({ userId: tokenFind.userId }).sort({ createdAt: -1 });
        if (!findAccess)
            throw new Error('Session not found. Please log in again.');
        let userFind = yield userModel_1.USER.findOne({ _id: findAccess.userId });
        if (!userFind)
            throw new Error('User not found. Please try logging in again.');
        const decodeRefresh = jsonwebtoken_1.default.decode(req.body.refreshToken);
        let tokeExpiresAt = new Date(decodeRefresh.exp * 1000);
        const currentDate = new Date();
        if (tokeExpiresAt.getTime() < currentDate.getTime()) {
            throw new Error('Refresh token is expaire.');
        }
        let secretKey = fs_1.default.readFileSync(__dirname + '/../jwtRS256.key', 'utf8').trim();
        let objectToCreateToken = {
            email: userFind.email,
            userId: userFind._id,
            role: userFind.role,
            createdAt: Date.now()
        };
        let options = {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        let tokenGenerate = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
        yield sessionModel_1.SESSION.findByIdAndUpdate(findAccess._id, {
            jwtToken: tokenGenerate
        }, { new: true });
        const refreshTokenPayload = {
            userId: userFind._id,
        };
        const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        let refreshOptions = {
            algorithm: 'RS256',
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
            audience: 'https://kmsoft.in/',
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
        yield tokenModel_1.TOKEN.findByIdAndUpdate(tokenFind._id, {
            accessToken: tokenGenerate,
            refreshToken: refreshToken,
        });
        res.status(202).json({
            status: 202,
            message: 'Token updated successfully.',
            token: tokenGenerate,
            refreshToken: refreshToken
        });
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message,
        });
    }
});
exports.token = token;
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            throw new Error('Please provide email.');
        let user = yield userModel_1.USER.findOne({ email });
        if (!user)
            throw new Error('User not found.');
        let profile = yield profileModel_1.PROFILE.findOne({ userId: user === null || user === void 0 ? void 0 : user._id });
        console.log(profile);
        let otpCode = Math.floor(100000 + Math.random() * 900000);
        // let date_ob = new Date().getTime() + 15 * 60000;
        // let expiresAt = new Date(date_ob);
        let otpResponse = yield forgotPasswordModel_1.FORGOT_PASSWORD.create({
            verificationCode: otpCode,
            email: user.email,
            //expiresAt: "10m",
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
        });
        (0, email_1.main)(email, otpCode, profile);
        res.status(200).json({
            status: 200,
            message: 'OTP has been sent on email,please check and verify.',
            //data : otpResponse
        });
        return;
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(404).json({
            status: 'Fail',
            message: error.message,
        });
    }
});
exports.forgotPassword = forgotPassword;
const compareCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { verificationCode, email } = req.body;
        if (!verificationCode)
            throw new Error("Please provide a verification code.");
        if (!email)
            throw new Error("Please provide an email address.");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("'@' and '.' must be used in Email address like 'test@example.com'.");
        }
        const resetEmail = yield forgotPasswordModel_1.FORGOT_PASSWORD.findOne({ email: email })
            .sort({ createdAt: -1 })
            .exec();
        if (resetEmail) {
            const resetCode = resetEmail.verificationCode;
            const createdAtDate = resetEmail.createdAt;
            const expirationTime = process.env.FORGOT_PASSWORD_EXPIRE_IN_SECONDS;
            if (resetCode == verificationCode) {
                if ((new Date().getTime() - createdAtDate.getTime()) > expirationTime) {
                    throw new Error("This email verification code has expired.");
                }
                res.status(200).json({
                    status: 200,
                    message: "Your verification code is accepted.",
                });
            }
            else {
                throw new Error("Please enter a valid verification code.");
            }
        }
        else {
            throw new Error("Please enter a valid email.");
        }
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.compareCode = compareCode;
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (password !== confirmPassword)
            throw new Error('Password and confirm password do not match.');
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield userModel_1.USER.findOne({ email });
        if (!user)
            throw new Error('User not found.');
        user.password = hashedPassword;
        yield user.save();
        res.status(200).json({
            status: 200,
            message: 'Your password has been reset.',
        });
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        });
    }
});
exports.resetPassword = resetPassword;
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { userId } = req.body;
        if (!userId) {
            throw new Error("userId is required for logout");
        }
        var find = yield sessionModel_1.SESSION.findOne({ userId: userId, isActive: true }).sort({ createdAt: -1 });
        if (find) {
            var tokenFind = yield tokenModel_1.TOKEN.findOne({ userId: userId });
            if (tokenFind) {
                yield tokenModel_1.TOKEN.findByIdAndDelete(tokenFind._id);
            }
            yield sessionModel_1.SESSION.findByIdAndUpdate(find._id, {
                isActive: false,
                notificationToken: null
            });
            res.status(200).json({
                status: 200,
                message: 'You have been logged out.'
            });
        }
        else {
            res.status(404).json({
                status: 404,
                message: 'Session not found or already inactive.'
            });
        }
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        });
    }
});
exports.logout = logout;
const tokenVerify = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body.token) {
            throw new Error('Please provide a token.');
        }
        var token = req.body.token;
        var tokenFind = yield sessionModel_1.SESSION.findOne({ jwtToken: token });
        if (tokenFind) {
            let token = tokenFind.jwtToken;
            let tokenDecode = jsonwebtoken_1.default.decode(token);
            let tokeExpiresAt = new Date(tokenDecode.exp * 1000);
            const currentDate = new Date();
            if (tokeExpiresAt.getTime() < currentDate.getTime()) {
                res.status(401).json({
                    status: 401,
                    message: 'Token has expired.'
                });
            }
            else {
                res.status(200).json({
                    status: 200,
                    message: 'This token is valid.'
                });
            }
        }
        else {
            res.status(401).json({
                status: 401,
                message: 'Token not found.'
            });
        }
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        });
    }
});
exports.tokenVerify = tokenVerify;
const updateFcmToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationToken } = req.body;
        if (!notificationToken)
            throw new Error('notificationToken is required.');
        let findSession = yield sessionModel_1.SESSION.findOne({ jwtToken: req.token, isActive: true });
        if (!findSession)
            throw new Error('please provide valid jwtToken.');
        findSession.notificationToken = notificationToken;
        yield findSession.save();
        res.status(202).json({
            status: 202,
            message: 'notificationToken update successfully.',
            data: findSession
        });
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: "Fail",
            message: error.message
        });
    }
});
exports.updateFcmToken = updateFcmToken;
const googleAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const client = new google_auth_library_1.OAuth2Client();
        var audiance = googleAuth_json_1.web.client_id;
        if (platform == 'iOS') {
            audiance = "494043634835-en7sc7uerphnt8r3ipj50emlelnji65l.apps.googleusercontent.com";
        }
        const ticket = yield client.verifyIdToken({
            idToken: idToken,
            audience: audiance
        });
        const payload = ticket.getPayload();
        const firstName = payload.given_name;
        const lastName = payload.family_name;
        const role = "parent";
        const email = payload.email;
        const profileImage = payload.picture;
        let userFind = yield userModel_1.USER.findOne({ email, isDeleted: false });
        if (userFind) {
            if (userFind.role === 'grandParent')
                throw new Error('This API access only parent and sibling user.');
            const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
            let options = {
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
            let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
            const refreshTokenPayload = {
                userId: userFind._id,
            };
            const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });
            let refreshOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };
            const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
            yield tokenModel_1.TOKEN.create({
                accessToken: token,
                refreshToken: refreshToken,
                userId: userFind._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            yield sessionModel_1.SESSION.create({
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
            let familyIdFind = yield profileModel_1.PROFILE.findOne({ userId: userFind._id, isDeleted: false }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });
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
            });
        }
        else {
            const user = yield userModel_1.USER.create({
                email,
                role,
                socialMediaType: "Google",
                isDeleted: false,
                deletedBy: null
            });
            let familyId = (0, uuid_1.v4)();
            const familyIdData = yield profileModel_1.PROFILE.findOne({ familyId: familyId });
            if (familyIdData) {
                familyId = (0, uuid_1.v4)();
            }
            const profile = yield profileModel_1.PROFILE.create({
                firstName,
                lastName,
                image: profileImage ? profileImage : null,
                familyId,
                createdBy: user._id,
                userId: user._id,
                isDeleted: false,
                deletedBy: null
            });
            const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
            let options = {
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
            let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
            const refreshTokenPayload = {
                userId: user._id,
            };
            const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });
            let refreshOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };
            const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
            yield tokenModel_1.TOKEN.create({
                accessToken: token,
                refreshToken: refreshToken,
                userId: user._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            yield sessionModel_1.SESSION.create({
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
            let profiles = yield profileModel_1.PROFILE.findOne({ _id: profile._id }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });
            res.status(200).json({
                status: 200,
                message: 'Signup successfully.',
                data: { profile: profiles, token, refreshToken }
            });
        }
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.googleAuth = googleAuth;
const appleAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        let payload = yield apple_signin_auth_1.default.verifyIdToken(idToken, {
            audience: process.env.APPLE_CLIENT_ID, //  com.example.yourapp
            ignoreExpiration: true,
        });
        console.log('payload :>> ', payload);
        if (!payload)
            throw new Error('Failed to verify idToken.');
        const firstName = payload.lastName;
        const lastName = payload.lastName;
        const role = "parent";
        const email = payload.email;
        // const profileImage = payload.picture;
        let userFind = yield userModel_1.USER.findOne({ email, isDeleted: false });
        if (userFind) {
            if (userFind.role === 'grandParent')
                throw new Error('This API access only parent and sibling user.');
            const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
            let options = {
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
            let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
            const refreshTokenPayload = {
                userId: userFind._id,
            };
            const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });
            let refreshOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };
            const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
            yield tokenModel_1.TOKEN.create({
                accessToken: token,
                refreshToken: refreshToken,
                userId: userFind._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            yield sessionModel_1.SESSION.create({
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
            let familyIdFind = yield profileModel_1.PROFILE.findOne({ userId: userFind._id, isDeleted: false }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });
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
            });
        }
        else {
            const user = yield userModel_1.USER.create({
                email,
                role,
                socialMediaType: "Google",
                isDeleted: false,
                deletedBy: null
            });
            let familyId = (0, uuid_1.v4)();
            const familyIdData = yield profileModel_1.PROFILE.findOne({ familyId: familyId });
            if (familyIdData) {
                familyId = (0, uuid_1.v4)();
            }
            const profile = yield profileModel_1.PROFILE.create({
                firstName,
                lastName,
                image: null,
                familyId,
                createdBy: user._id,
                userId: user._id,
                isDeleted: false,
                deletedBy: null
            });
            const secretKeyPath = path_1.default.join(__dirname, '..', 'jwtRS256.key');
            let secretKey = fs_1.default.readFileSync(secretKeyPath, 'utf8').trim();
            let options = {
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
            let token = jsonwebtoken_1.default.sign(objectToCreateToken, secretKey, options);
            const refreshTokenPayload = {
                userId: user._id,
            };
            const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });
            let refreshOptions = {
                algorithm: 'RS256',
                expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN_DAYS,
                audience: 'https://kmsoft.in/',
            };
            const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, privateKey, refreshOptions);
            yield tokenModel_1.TOKEN.create({
                accessToken: token,
                refreshToken: refreshToken,
                userId: user._id,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            yield sessionModel_1.SESSION.create({
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
            let profiles = yield profileModel_1.PROFILE.findOne({ _id: profile._id }).populate({ path: 'userId', select: ['-password', '-socialMediaType'] });
            res.status(200).json({
                status: 200,
                message: 'Signup successfully.',
                data: { profile: profiles, token, refreshToken }
            });
        }
    }
    catch (error) {
        if (error && error.constructor !== Error) {
            let line = (0, email_2.extractLineNumber)(error);
            (0, email_2.errorMail)(error, req, line);
        }
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
});
exports.appleAuth = appleAuth;
