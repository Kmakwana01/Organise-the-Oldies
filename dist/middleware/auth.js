"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const sessionModel_1 = require("../models/sessionModel");
const activityModel_1 = require("../models/activityModel");
const profileModel_1 = require("../models/profileModel");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: __dirname + "/./../.env" });
let privateKey = fs_1.default.readFileSync(__dirname + "/./../jwtRS256.key", "utf8");
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.headers);
    const token = req.body.token || req.query.token || req.headers["authorization"];
    if (!token) {
        return res.status(401).send({
            error: "A token is required for authentication",
            header: req.headers,
        });
    }
    try {
        const tokenArray = token.split(" ");
        if (tokenArray.length > 1) {
            const token = tokenArray[1];
            let findToken = yield sessionModel_1.SESSION.findOne({ jwtToken: token, isActive: true });
            if (!findToken)
                throw new Error('Your session is expired.');
            let options = {
                algorithms: ["RS256"],
                audience: "https://kmsoft.in/",
                expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            };
            try {
                let user = jsonwebtoken_1.default.verify(token, privateKey, options);
                const iatInSeconds = Math.floor(user.iat);
                const currentInSeconds = Math.floor(Date.now() / 1000);
                let jwtExpire = process.env.JWT_EXPIRE_IN_SECONDS || 86400;
                if ((currentInSeconds - iatInSeconds) > parseInt(jwtExpire)) {
                    return res.status(419).send({
                        status: "Fail",
                        message: "Token expired",
                    });
                }
                ;
                let familyIdFind = yield profileModel_1.PROFILE.findOne({ userId: user.userId });
                if (!familyIdFind)
                    throw new Error('user not found');
                req.userId = user.userId;
                req.role = user.role;
                req.token = findToken.jwtToken;
                req.familyId = familyIdFind === null || familyIdFind === void 0 ? void 0 : familyIdFind.familyId;
                console.log('familyIdFind :>> ', familyIdFind);
                const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
                let protocol = isLocal ? 'http' : 'https';
                let fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;
                yield activityModel_1.ACTIVITY.create({
                    sessionId: findToken._id,
                    apiPath: fullUrl,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
                return next();
            }
            catch (error) {
                if (error instanceof jsonwebtoken_1.TokenExpiredError) {
                    return res.status(419).send({ error: "Token expired" });
                }
                else {
                    return res.status(401).send({
                        error: "Invalid Token",
                        header: req.headers,
                        err: error.message
                    });
                }
            }
        }
        else {
            return res.status(401).send({
                token: tokenArray,
                tokenLength: tokenArray.length,
                error: "Invalid Token 1",
                header: req.headers,
            });
        }
    }
    catch (err) {
        return res.status(401).send({
            error: "Invalid Token 2",
            header: req.headers,
            err: err.message
        });
    }
});
exports.verifyToken = verifyToken;
