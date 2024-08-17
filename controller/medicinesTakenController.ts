import { MEDICINES_TAKEN } from "../models/medicinesTakenModel";
import { USER } from "../models/userModel";
import { MEDICINES } from "../models/medicinesModel";
import { Request , Response , NextFunction } from "express";
import { PROFILE } from "../models/profileModel";
import mongoose from "mongoose";

export const create = async (req:Request, res:Response , next:NextFunction) => {
    try {

        const { medicinesId , isTaken , userId , time } = req.body;

        switch (true) {
            case !medicinesId: throw new Error('medicinesId is required.');
            case typeof isTaken !== "boolean": throw new Error('isTaken is required.');
            case !userId: throw new Error('userId is required.');
            case !time: throw new Error('time is required.');
            default:
                break;
        }

        const userFind = await PROFILE.findOne({ userId , familyId : req.familyId });
        if(!userFind) throw new Error('user not found.');

        const medicinesFind = await MEDICINES.findOne({ _id : medicinesId , familyId : req.familyId });
        if(!medicinesFind) throw new Error('medicines not found in your family.');
        
        let data;

        if(isTaken === false){

            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            let findIsMedicineTaken = await MEDICINES_TAKEN.findOne({ 
                medicinesId , 
                userId , 
                time ,
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })

            if(findIsMedicineTaken){
                await findIsMedicineTaken.deleteOne();
            } else {
                throw new Error('data not found.');
            }

        } else if(isTaken === true) {

            data = await MEDICINES_TAKEN.create({
                medicinesId,
                isTaken,
                userId,
                time
            })
        }

        res.status(201).json({
            status : 201,
            message : 'Medicines taken update successfully.',
            data
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const getMedicineDetails = async (req:Request, res:Response , next:NextFunction) => {
    try {
        const { medicinesId , userId } = req.body;

        switch (true) {
            case !medicinesId: throw new Error('medicinesId is required.');
            case !userId: throw new Error('userId is required.');
            default:
                break;
        }

        const userFind = await PROFILE.findOne({ userId });
        if(!userFind) throw new Error('user not found.');

        const medicinesFind = await MEDICINES.findOne({ _id : medicinesId });
        if(!medicinesFind) throw new Error('medicines not found.');

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const isTakenData = await MEDICINES_TAKEN.aggregate([
            {
                $match : {
                    userId : new mongoose.Types.ObjectId(userId),
                    medicinesId : new mongoose.Types.ObjectId(medicinesId),
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            }
        ])

        res.status(201).json({
            status : 201,
            message : 'getMedicineDetails get successfully.',
            data : isTakenData
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

