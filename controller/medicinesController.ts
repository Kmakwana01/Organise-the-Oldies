import { MEDICINES } from "../models/medicinesModel";
import { MEDICINES_USER } from "../models/medicinesUser";
import { Request , Response , NextFunction } from "express";
import { NOTIFICATION } from "../models/notificationModel";
const main_socket = require("../socket");
import { notificationFunction } from "../util/pushNotification";
import { errorMail , extractLineNumber } from "../util/email";
import { PROFILE } from "../models/profileModel";

interface MulterFiles {
    [fieldname: string]: Express.Multer.File[];
}

export const create = async (req: Request, res: Response , next: NextFunction) => {
    try {
        let { name , notes , notificationSound , medicinesTime, date , repeat , selectTime1 , selectTime2 , selectTime3 , user, weekDays , isAfterfood} = req.body;

        switch (true) {
            case !name: throw new Error('name is required.');
            // case !notes: throw new Error('notes is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            case !date: throw new Error('date is required.');
            case !repeat: throw new Error('repeat is required.');
            case !medicinesTime: throw new Error('medicinesTime is required.');
            case isAfterfood != 'true' && isAfterfood != 'false' : throw new Error('provide valid isAfterfood.');
            // case !selectTime1: throw new Error('selectTime1 is required.');
            // case !selectTime2: throw new Error('selectTime2 is required.');
            // case !selectTime3: throw new Error('selectTime3 is required.');
            default:
                break;
        }

        if(typeof user === 'string') {
            user = JSON.parse(user);
        }

        if(typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }
        let repeatEnum = ["weekly","monthly","forNightly","Daily"]
        if(!repeatEnum.includes(repeat)) throw new Error('please provide valid repeat.')
        
        if(repeat === 'weekly'){
            if(!weekDays?.length) throw new Error('weekDays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if(!weekEnum.includes(iterator)){
                    throw new Error('please provide valid weekDays.')
                }
            }
            
        }

        let medicineEnum = ["oneTime","twoTimes","threeTimes"]
        if(!medicineEnum.includes(medicinesTime)) throw new Error('please provide valid medicinesTime.')

        if(medicinesTime === 'oneTime'){

            if(!selectTime1) throw new Error('selectTime1 is required.');

        } else if(medicinesTime === 'twoTimes'){

            if(!selectTime1) throw new Error('selectTime1 is required.');
            if(!selectTime2) throw new Error('selectTime2 is required.');

        } else if(medicinesTime === 'threeTimes'){

            if(!selectTime1) throw new Error('selectTime1 is required.');
            if(!selectTime2) throw new Error('selectTime2 is required.');
            if(!selectTime3) throw new Error('selectTime3 is required.');

        }

        // let notificationSoundFind = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationSoundFind) throw new Error('notificationSound not found.');

        const files = req.files as MulterFiles;
        const photo = files?.photo ? files.photo[0].filename : null;
        const voice = files?.voice ? files.voice[0].filename : null;

        let medicines = await MEDICINES.create({
            familyId : req.familyId,
            name,
            photo,
            notes,
            voice,
            notificationSound,
            date,
            repeat,
            medicinesTime,
            selectTime1,
            selectTime2,
            selectTime3,
            weekDays : weekDays?.length > 0 ? weekDays : [],
            isAfterfood : isAfterfood,
            createdBy : req.userId,
            isDeleted : false,
            deletedBy : null,
        })

        let medicinesUser = [];
        for (const userId of user) {
            let userMedicines = await MEDICINES_USER.create({
                medicinesId : medicines._id,
                userId : userId,
                createdBy : req.userId,
                isDeleted : false,
                deletedBy : null,
            })
            medicinesUser.push(userMedicines)
        }

        const data = await MEDICINES.aggregate([
            {
                $match : { _id : medicines._id , isDeleted : false },
            },
            // {
            //     $lookup : {
            //         from: 'notifications',
            //         localField: 'notificationSound',
            //         foreignField: '_id',
            //         as: 'notification',
            //     }
            // },
            // {
            //     $addFields: {
            //         notificationSound: {
            //             $cond: {
            //                 if: { $gt: [{ $size: "$notification" }, 0] },
            //                 then: { $arrayElemAt: ['$notification', 0] },
            //                 else: null
            //             }
            //         }
            //     }
            // },
            // {
            //     $unset: 'notification'
            // },
            {
                $lookup : {
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                        {
                            $lookup: {
                                from: 'profiles',
                                localField: 'userId',
                                foreignField: 'userId',
                                as: 'profile'
                            }
                        },
                        {
                            $match: {
                                'profile.userId': { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $unwind: '$profile'
                        },
                        {
                            $lookup : {
                                from : 'users',
                                localField : 'userId',
                                foreignField : '_id',
                                as : 'user'
                            }
                        },
                        {
                            $unwind : '$user'
                        },
                        {
                            $addFields : { 
                                'profile.userId' : '$user'
                            }
                        },
                        {
                            $project: {
                                'profile.userId.password': 0,
                                user: 0
                            }
                        }
                    ]
                }
            }
        ])

        const result = data.length > 0 ? data[0] : null;
        let response = {
            key : 'medicinesCreate',
            medicines : result
        }

        main_socket.broadcastMedicines(response , req.familyId);

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.name,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} created new Medicine.`
        }

        notificationFunction(req, res , 'Medicines' , object);

        res.status(201).json({
            status : 201,
            message : 'Medicines data was created successfully.',
            data : result
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

export const get = async (req: Request , res : Response , next : NextFunction) => {
    try {

        const newData = await MEDICINES.find({
            familyId : req.familyId,
            isDeleted : false,
        });

        console.log(newData.length);
        

        const medicinesIds: any = newData.map(a => a._id);

        // const medicinesIds :any = newData.filter(a => 
        //     (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
        // ).map(a => a._id)
        const data = await MEDICINES.aggregate([
            {
                $match : { _id : { $in : medicinesIds } },
            },
            // {
            //     $lookup : {
            //         from: 'notifications',
            //         localField: 'notificationSound',
            //         foreignField: '_id',
            //         as: 'notification',
            //     }
            // },
            // {
            //     $addFields: {
            //         notificationSound: {
            //             $cond: {
            //                 if: { $gt: [{ $size: "$notification" }, 0] },
            //                 then: { $arrayElemAt: ['$notification', 0] },
            //                 else: null
            //             }
            //         }
            //     }
            // },
            // {
            //     $unset: 'notification'
            // },
            {
                $lookup : {
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                        {
                            $lookup: {
                                from: 'profiles',
                                localField: 'userId',
                                foreignField: 'userId',
                                as: 'profile'
                            }
                        },
                        {
                            $match: {
                                'profile.userId': { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $unwind: '$profile'
                        },
                        {
                            $lookup : {
                                from : 'users',
                                localField : 'userId',
                                foreignField : '_id',
                                as : 'user'
                            }
                        },
                        {
                            $unwind : '$user'
                        },
                        {
                            $addFields : { 
                                'profile.userId' : '$user'
                            }
                        },
                        {
                            $project: {
                                'profile.userId.password': 0,
                                user: 0
                            }
                        }
                    ]
                }
            }
        ])

        res.status(200).json({ 
            status : 200 , 
            message : 'Medicines data was retrieved successfully.',
            data
        });
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { id , name , notes , notificationSound , medicinesTime, date , repeat , selectTime1 , selectTime2 , selectTime3 , user , weekDays , isAfterfood} = req.body;

        switch (true) {
            case !id: throw new Error('id is required.');
            case !name: throw new Error('name is required.');
            // case !notes: throw new Error('notes is required.');
            case !notificationSound: throw new Error('notificationSound is required.');
            case !date: throw new Error('date is required.');
            case !repeat: throw new Error('repeat is required.');
            case !medicinesTime: throw new Error('medicineTime is required.');
            case isAfterfood != 'true' && isAfterfood != 'false' : throw new Error('provide valid isAfterfood.');
            // case !selectTime1: throw new Error('selectTime1 is required.');
            // case !selectTime2: throw new Error('selectTime2 is required.');
            // case !selectTime3: throw new Error('selectTime3 is required.');
            default:
                break;
        }

        if(typeof user === 'string') {
            user = JSON.parse(user);
        }

        if(typeof weekDays === 'string') {
            weekDays = JSON.parse(weekDays);
        }

        let repeatEnum = ["weekly","monthly","forNightly","Daily",]
        console.log(repeat)
        if(!repeatEnum.includes(repeat)) throw new Error('please provide valid repeat.')

        if(repeat === 'weekly'){
            if(!weekDays?.length) throw new Error('weekDays is required.');
            let weekEnum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (const iterator of weekDays) {
                if(!weekEnum.includes(iterator)){
                    throw new Error('please provide valid weekDays.')
                }
            }
        }

        let medicineEnum = ["oneTime" , "twoTimes" , "threeTimes"]
        if(!medicineEnum.includes(medicinesTime)) throw new Error('please provide valid repeat.')
        
        if(medicinesTime === 'oneTime'){

            if(!selectTime1) throw new Error('selectTime1 is required.');

        } else if(medicinesTime === 'twoTimes'){

            if(!selectTime1) throw new Error('selectTime1 is required.');
            if(!selectTime2) throw new Error('selectTime2 is required.');

        } else if(medicinesTime === 'threeTimes'){

            if(!selectTime1) throw new Error('selectTime1 is required.');
            if(!selectTime2) throw new Error('selectTime2 is required.');
            if(!selectTime3) throw new Error('selectTime3 is required.');

        }

        let medicinesFind = await MEDICINES.findOne({ _id : id , isDeleted : false });
        if(!medicinesFind) throw new Error('this medicines id does not exist.');

        if ((medicinesFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this Medicine.');
        }

        if (req.role == 'grandParent') {
                throw new Error('You are not authorized to update this Medicine.')
        }

        // let notificationSoundFind = await NOTIFICATION.findOne({ _id : notificationSound , isDeleted : false });
        // if(!notificationSoundFind) throw new Error('notificationSound not found.');

        const files = req.files as MulterFiles;
        const photo = files?.photo ? files.photo[0].filename : medicinesFind.photo;
        const voice = files?.voice ? files.voice[0].filename : medicinesFind.voice;

        let medicines = await MEDICINES.findByIdAndUpdate(medicinesFind._id,{
            name,
            photo,
            notes,
            voice,
            notificationSound,
            date,
            repeat,
            isAfterfood,
            medicinesTime,
            selectTime1,
            selectTime2,
            selectTime3,
            weekDays : weekDays?.length > 0 ? weekDays : [],
        },{new : true})

        await MEDICINES_USER.deleteMany({ medicinesId : medicinesFind._id })

        let medicinesUser = [];
        if(user) {
            for (const userIds of user) {
                let userMedicines = await MEDICINES_USER.create({
                    medicinesId : medicinesFind._id,
                    userId : userIds,
                    createdBy : req.userId,
                    isDeleted : false,
                    deletedBy : null,
                })
                medicinesUser.push(userMedicines)
            }
        }

        let medicinesFindDatas = await MEDICINES.findOne({ _id : id , isDeleted : false });

        const data = await MEDICINES.aggregate([
            {
                $match : { _id : medicinesFindDatas?._id , isDeleted : false },
            },
            // {
            //     $lookup : {
            //         from: 'notifications',
            //         localField: 'notificationSound',
            //         foreignField: '_id',
            //         as: 'notification',
            //     }
            // },
            // {
            //     $addFields: {
            //         notificationSound: {
            //             $cond: {
            //                 if: { $gt: [{ $size: "$notification" }, 0] },
            //                 then: { $arrayElemAt: ['$notification', 0] },
            //                 else: null
            //             }
            //         }
            //     }
            // },
            // {
            //     $unset: 'notification'
            // },
            {
                $lookup : {
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                        {
                            $lookup: {
                                from: 'profiles',
                                localField: 'userId',
                                foreignField: 'userId',
                                as: 'profile'
                            }
                        },
                        {
                            $match: {
                                'profile.userId': { $exists: true, $ne: [] }
                            }
                        },
                        {
                            $unwind: '$profile'
                        },
                        {
                            $lookup : {
                                from : 'users',
                                localField : 'userId',
                                foreignField : '_id',
                                as : 'user'
                            }
                        },
                        {
                            $unwind : '$user'
                        },
                        {
                            $addFields : { 
                                'profile.userId' : '$user'
                            }
                        },
                        {
                            $project: {
                                'profile.userId.password': 0,
                                user: 0
                            }
                        }
                    ]
                }
            }
        ])
        const result = data.length > 0 ? data[0] : null;

        let response = {
            key : 'medicinesUpdate',
            medicines: result
        }

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })

        let object = {
            data : result,
            title : result?.name,
            body : `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} updated Medicine.`
        }

        main_socket.broadcastMedicines(response , req.familyId);

        notificationFunction(req, res , 'Medicines' , object);

        res.status(202).json({
            status : 202,
            message : 'Medicines data was updated successfully.',
            data : result
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

export const deleteData = async (req: Request, res: Response , next : NextFunction) => {
    try {
        
        const { id } = req.query;
        if(!id) throw new Error('id is required.');

        let medicinesFind = await MEDICINES.findOne({ _id : id , isDeleted : false });
        if(!medicinesFind) throw new Error('medicines id not found.');

        if ((medicinesFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this medicine.');
        }

        if (req.role == 'grandParent') {
            throw new Error('You are not authorized to delete this medicine.')
        }

        await MEDICINES_USER.updateMany({ medicinesId : id }, { isDeleted : true , deletedBy : req.userId })
        await MEDICINES.findByIdAndUpdate(id,{
            isDeleted : true,
            deletedBy : req.userId
        },{new : true});

        let response = {
            key : 'medicinesDelete',
            medicines : medicinesFind
        }

        main_socket.broadcastMedicines(response , req.familyId)

        let findCurrentUser = await PROFILE.findOne({ userId: req.userId })

        let object = {
            data: medicinesFind,
            title: medicinesFind?.name,
            body: `${findCurrentUser?.firstName} ${findCurrentUser?.lastName} delete Medicine.`
        }

        notificationFunction(req, res, 'Delete', object)

        res.status(202).json({
            status : 202,
            message : 'Medicines data was deleted successfully.',
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