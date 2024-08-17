import { Request, Response, NextFunction } from 'express';
import jwt , {TokenExpiredError , VerifyOptions} from 'jsonwebtoken';
import  { SESSION } from'../models/sessionModel';
import { ACTIVITY } from '../models/activityModel';
import { PROFILE } from '../models/profileModel';
import fs from 'fs';
import dotenv from 'dotenv';

interface User {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            familyId?: string;
            userId?: string;
            token?: string;
            role?: string;
        }
    }
}

dotenv.config({ path: __dirname + "/./../.env" });
let privateKey = fs.readFileSync(__dirname + "/./../jwtRS256.key", "utf8");

interface ExtendedVerifyOptions extends VerifyOptions {
    expiresIn?: string | number;
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.headers)
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
            let findToken = await SESSION.findOne({ jwtToken: token, isActive: true });
            if (!findToken) throw new Error('Your session is expired.');

            let options: ExtendedVerifyOptions = {
                algorithms: ["RS256"],
                audience: "https://kmsoft.in/",
                expiresIn: process.env.JWT_EXPIRE_IN_DAYS,
            };
                
            try {     
                let user: any = jwt.verify(token, privateKey, options);
                const iatInSeconds = Math.floor(user.iat);
                const currentInSeconds = Math.floor(Date.now() / 1000);

                let jwtExpire : any = process.env.JWT_EXPIRE_IN_SECONDS || 86400
                if ((currentInSeconds - iatInSeconds) > parseInt(jwtExpire)) {
                    return res.status(419).send({
                        status: "Fail",
                        message: "Token expired",
                    });
                };

                let familyIdFind:any = await PROFILE.findOne({ userId : user.userId });

                if(!familyIdFind) throw new Error('user not found');

                req.userId = user.userId;
                req.role = user.role;
                req.token = findToken.jwtToken;
                req.familyId = familyIdFind?.familyId;

                console.log('familyIdFind :>> ', familyIdFind);
                const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
                let protocol = isLocal ? 'http' : 'https';

                let fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;
                await ACTIVITY.create({
                    sessionId: findToken._id,
                    apiPath: fullUrl,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                })
                return next();
            } catch (error : any) {

                if (error instanceof TokenExpiredError) {
                    return res.status(419).send({ error: "Token expired" });
                } else {
                    return res.status(401).send({
                        error: "Invalid Token",
                        header: req.headers,
                        err: error.message
                    });
                }
            }
        } else {
            return res.status(401).send({
                token: tokenArray,
                tokenLength: tokenArray.length,
                error: "Invalid Token 1",
                header: req.headers,
            });
        }
    } catch (err : any) {
        return res.status(401).send({
            error: "Invalid Token 2",
            header: req.headers,
            err: err.message
        });
    }
};
