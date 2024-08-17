import { Request , Response , NextFunction } from "express";
import { EVENT } from "../models/eventModel";
import { REMINDER } from "../models/reminderModel";
import moment from "moment";
import { MEDICINES } from "../models/medicinesModel";
import { REMINDER_USER } from "../models/reminderUserModel";
import { PROFILE } from "../models/profileModel";
import { ADVANCE_WARNING } from "../models/advanceWarningModel";
import { MEDICINES_USER } from "../models/medicinesUser";

// export const getHome = async (req:Request , res: Response , next: NextFunction) => {
//     try {

//         let selectedDate = moment();
//         let startOfToday = selectedDate.startOf('day').toISOString();
//         let endOfTomorrow = selectedDate.add(1, 'days').endOf('day').toISOString();

//         const reminders = await REMINDER.find({
//             familyId: req.familyId,
//             isDeleted: false,
//             date: {
//                 $gte: new Date(startOfToday),
//                 $lte: new Date(endOfTomorrow),
//             },
//         }).sort({ date : 1 })

//         const reminderFilter = await REMINDER.find({
//             familyId : req.familyId,
//             isDeleted : false,
//         });

//         const reminderWithCondition :any = reminderFilter.filter(a => 
//             (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
//         )

//         // const event = await EVENT.find({
//         //     // familyId : req.familyId,
//         //     isDeleted: false,
//         //     dateAndTime : { $gte : new Date() }
//         // }).sort({ dateAndTime : 1 })

//         const event = await EVENT.aggregate([
//             {
//                 $match : { familyId : req.familyId , isDeleted : false , dateAndTime : { $gte : new Date() } }
//             },
//             {
//                 $lookup : {
//                     from : 'eventusers',
//                     localField : '_id',
//                     foreignField : 'eventId',
//                     as : 'eventuser',
//                     pipeline : [
//                         {
//                             $match: { isDeleted: false }
//                         },
//                         {
//                             $lookup: {
//                                 from: 'profiles',
//                                 localField: 'userId',
//                                 foreignField: 'userId',
//                                 as: 'profile'
//                             }
//                         },
//                         {
//                             $match: {
//                                 'profile.userId': { $exists: true, $ne: [] }
//                             }
//                         },
//                         {
//                             $unwind: '$profile'
//                         },
//                         {
//                             $lookup : {
//                                 from : 'users',
//                                 localField : 'userId',
//                                 foreignField : '_id',
//                                 as : 'user'
//                             }
//                         },
//                         {
//                             $unwind : '$user'
//                         },
//                         {
//                             $addFields : { 
//                                 'profile.userId' : '$user'
//                             }
//                         },
//                         {
//                             $project: {
//                                 'profile.userId.password': 0,
//                                 user: 0
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 $lookup : {
//                     from : 'advancewarnings',
//                     localField : '_id',
//                     foreignField : 'eventId',
//                     as : 'advancewarning',
//                     pipeline : [
//                         {
//                             $match: { isDeleted: false }
//                         },
//                     ]
//                 }
//             }
//         ])

//         const medicines = await MEDICINES.find({
//             familyId : req.familyId,
//             isDeleted : false
//         }).sort({ date : 1 });
//         const medicinesIds :any = medicines.filter(a => 
//             (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
//         )

//         let response = { 
//             event,
//             reminders,
//             filterReminder : reminderWithCondition,
//             medicines : medicinesIds
//         }

//         res.status(200).json({
//             status : 200,
//             message : 'Event and reminder data retrieved successfully.',
//             data : response
//         })
//     } catch (error:any) {
//         res.status(400).json({
//             status : 'Fail',
//             message : error.message
//         })
//     }
// }

// export const getHome = async (req:Request , res: Response , next: NextFunction) => {
//     try {

//         let selectedDate = moment();
//         let startOfToday = selectedDate.startOf('day').toISOString();
//         let endOfTomorrow = selectedDate.add(1, 'days').endOf('day').toISOString();

//         const reminders = await REMINDER.find({
//             familyId: req.familyId,
//             isDeleted: false,
//             date: {
//                 $gte: new Date(startOfToday),
//                 $lte: new Date(endOfTomorrow),
//             },
//         }).sort({ date : 1 });

//         const startOfTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0);
//         const endOfTomorrowData = new Date(new Date().setDate(new Date().getDate() + 2)).setHours(0, 0, 0, 0);

//         const todayReminders = reminders.filter((reminder:any) => reminder.date >= new Date(startOfToday) && reminder.date < startOfTomorrow);
//         const tomorrowReminders = reminders.filter((reminder:any) => reminder.date >= startOfTomorrow && reminder.date < endOfTomorrowData);

//         const reminderFilter = await REMINDER.find({
//             familyId : req.familyId,
//             isDeleted : false,
//         });

//         const reminderWithCondition :any = reminderFilter.filter(a => 
//             (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
//         )

//         const eventData = await EVENT.aggregate([
//             {
//                 $match : { familyId : req.familyId , isDeleted : false , dateAndTime : { $gte : new Date() } }
//             },
//             {
//                 $lookup : {
//                     from : 'eventusers',
//                     localField : '_id',
//                     foreignField : 'eventId',
//                     as : 'eventuser',
//                     pipeline : [
//                         {
//                             $match: { isDeleted: false }
//                         },
//                         {
//                             $lookup: {
//                                 from: 'profiles',
//                                 localField: 'userId',
//                                 foreignField: 'userId',
//                                 as: 'profile'
//                             }
//                         },
//                         {
//                             $match: {
//                                 'profile.userId': { $exists: true, $ne: [] }
//                             }
//                         },
//                         {
//                             $unwind: '$profile'
//                         },
//                         {
//                             $lookup : {
//                                 from : 'users',
//                                 localField : 'userId',
//                                 foreignField : '_id',
//                                 as : 'user'
//                             }
//                         },
//                         {
//                             $unwind : '$user'
//                         },
//                         {
//                             $addFields : { 
//                                 'profile.userId' : '$user'
//                             }
//                         },
//                         {
//                             $project: {
//                                 'profile.userId.password': 0,
//                                 user: 0
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 $lookup : {
//                     from : 'advancewarnings',
//                     localField : '_id',
//                     foreignField : 'eventId',
//                     as : 'advancewarning',
//                     pipeline : [
//                         {
//                             $match: { isDeleted: false }
//                         },
//                     ]
//                 }
//             }
//         ])
//         console.log(eventData);
//         const todayEvents = eventData.filter((event:any) => event.dateAndTime >= new Date(startOfToday) && event.dateAndTime < startOfTomorrow);
//         const tomorrowEvents = eventData.filter((event:any) => event.dateAndTime >= startOfTomorrow && event.dateAndTime < endOfTomorrowData);

//         const medicines = await MEDICINES.find({
//             familyId : req.familyId,
//             isDeleted : false
//         }).sort({ date : 1 });
//         const medicinesIds :any = medicines.filter(a => 
//             (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
//         )

//         let response = { 
//             today : {
//                 reminder : todayReminders,
//                 event : todayEvents
//             },
//             tomorrow : {
//                 reminder : tomorrowReminders,
//                 event : tomorrowEvents
//             },
//             medicines : medicinesIds,
//             filterReminder : reminderWithCondition,
//         }

//         res.status(200).json({
//             status : 200,
//             message : 'Event and reminder data retrieved successfully.',
//             data : response
//         })
//     } catch (error:any) {
//         res.status(400).json({
//             status : 'Fail',
//             message : error.message
//         })
//     }
// }

export const getHome = async (req:Request , res: Response , next: NextFunction) => {
    try {
        
        const todayStart = moment().startOf('day').toISOString();
        const todayEnd = moment().endOf('day').toISOString();
        
        const tomorrowStart = moment().add(1, 'days').startOf('day').toISOString();
        const tomorrowEnd = moment().add(1, 'days').endOf('day').toISOString();
        
        const todayDays = moment().format('dddd');        
        const tomorrowDays = moment().add(1, 'days').format('dddd');
        
        const reminders = await REMINDER.find({
            familyId: req.familyId,
            isDeleted: false,
        }).sort({ date : 1 });

        let todayReminders = [];
        let tomorrowReminders = [];
        for (let reminder of reminders) {
            let reminderDate = moment(reminder.date).toISOString();
            
            let reminderUser = await REMINDER_USER.aggregate([
                {
                    $match : { reminderId : reminder._id , isDeleted : false }
                },
                {
                    $lookup : {
                        from : 'profiles',
                        localField : 'userId',
                        foreignField : 'userId',
                        as : 'profile'
                    },
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
            ]);

            let advanceWarning = await ADVANCE_WARNING.find({ reminderId : reminder._id , isDeleted : false });

            let reminderSet:any = reminder;
            reminderSet._doc.reminderuser = reminderUser;
            reminderSet._doc.advancewarning = advanceWarning;

            if(reminder.repeat === 'Daily') {      

                const reminderDateFormate = moment(moment(reminder.date).format('YYYY-MM-DD'));
                const todayDateFormate = moment(moment().format('YYYY-MM-DD'));
                const tomorrowDateFormate = moment(todayDateFormate, "YYYY-MM-DD").add(1, 'days');

                // console.log("reminder ", reminderDateFormate);
                // console.log("today ", todayDateFormate);
                // console.log("tomorrow ", tomorrowDateFormate);
                // console.log("before ======= > ",reminderDateFormate.isBefore(todayDateFormate));
                // console.log("after =========> ",reminderDateFormate.isAfter(todayDateFormate));

                if (reminderDateFormate.isBefore(todayDateFormate)) {
                    todayReminders.push(reminder);
                    tomorrowReminders.push(reminder);
                } else if (reminderDateFormate.isSame(todayDateFormate)) {
                    todayReminders.push(reminder);
                    tomorrowReminders.push(reminder);
                } else {
                    if (reminderDateFormate.isSame(tomorrowDateFormate)) {
                        tomorrowReminders.push(reminder);
                    }
                }

            } else if (reminder.repeat === 'weekly') {
                for (const week of reminder.weekDays) {
                    if(week === todayDays) {
                        todayReminders.push(reminderSet);
                    } else if (week === tomorrowDays) {
                        tomorrowReminders.push(reminderSet);
                    }
                }
            } else if (reminder.repeat === 'monthly') {
                const whatIsDay = moment(reminderDate , 'YYYY-MM-DDTHH:mm:ss.SSSZ').date();
                if((moment().date() === whatIsDay)) {
                    todayReminders.push(reminderSet);
                } else if (moment().add(1,'day').date() === whatIsDay) {
                    tomorrowReminders.push(reminderSet);
                }
            } else if (reminder.repeat === 'forNightly') {
                const intervalDays = 15;
                let nextOccurrence = moment(reminderDate , 'YYYY-MM-DDTHH:mm:ss.SSSZ').clone();
                
                while (nextOccurrence.isBefore(moment().add(2, 'days'))) {
                    if (nextOccurrence.isBetween(todayStart, todayEnd, null, '[]')) {
                        todayReminders.push(reminderSet);
                        break;
                    } else if (nextOccurrence.isBetween(tomorrowStart, tomorrowEnd, null, '[]')) {
                        tomorrowReminders.push(reminderSet);
                        break;
                    }
                    nextOccurrence.add(intervalDays, 'days');
                }
            }
        }

        const medicines = await MEDICINES.find({
            familyId : req.familyId,
            isDeleted : false
        }).sort({ date : 1 });

        let todayMedicines = [];
        let tomorrowMedicines = [];
        for (const medicine of medicines) {
            const reminderDate = moment(medicine.date).toISOString();

            let medicineUser = await MEDICINES_USER.aggregate([
                {
                    $match : { medicinesId : medicine._id , isDeleted : false }
                },
                {
                    $lookup : {
                        from : 'profiles',
                        localField : 'userId',
                        foreignField : 'userId',
                        as : 'profile'
                    },
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
            ]);

            let medicinesSet:any = medicine;
            medicinesSet._doc.medicinesuser = medicineUser;

            if(medicine.repeat === 'Daily') {       

                const reminderDateFormate = moment(moment(medicine.date).format('YYYY-MM-DD'));
                const todayDateFormate = moment(moment().format('YYYY-MM-DD'));
                const tomorrowDateFormate = moment(todayDateFormate, "YYYY-MM-DD").add(1, 'days');

                if (reminderDateFormate.isBefore(todayDateFormate)) {
                    todayMedicines.push(medicine);
                    tomorrowMedicines.push(medicine);
                } else if (reminderDateFormate.isSame(todayDateFormate)) {
                    todayMedicines.push(medicine);
                    tomorrowMedicines.push(medicine);
                } else {
                    if (reminderDateFormate.isSame(tomorrowDateFormate)) {
                        tomorrowMedicines.push(medicine);
                    }
                }
                
            } else if (medicine.repeat === 'weekly') {
                for (const week of medicine.weekDays) {
                    if(week === todayDays) {
                        todayMedicines.push(medicinesSet);
                    } else if (week === tomorrowDays) {
                        tomorrowMedicines.push(medicinesSet);
                    }
                }
            } else if (medicine.repeat === 'monthly') {
                const whatIsDay = moment(reminderDate , 'YYYY-MM-DDTHH:mm:ss.SSSZ').date();
                if((moment().date() === whatIsDay)) {
                    todayMedicines.push(medicinesSet);
                } else if (moment().add(1,'day').date() === whatIsDay) {
                    tomorrowMedicines.push(medicinesSet);
                }
            } else if (medicine.repeat === 'forNightly') {
                const intervalDays = 15;
                let nextOccurrence = moment(reminderDate , 'YYYY-MM-DDTHH:mm:ss.SSSZ').clone();
                
                while (nextOccurrence.isBefore(moment().add(2, 'days'))) {
                    if (nextOccurrence.isBetween(todayStart, todayEnd, null, '[]')) {
                        todayMedicines.push(medicinesSet);
                        break;
                    } else if (nextOccurrence.isBetween(tomorrowStart, tomorrowEnd, null, '[]')) {
                        tomorrowMedicines.push(medicinesSet);
                        break;
                    }
                    nextOccurrence.add(intervalDays, 'days');
                }
            }
        }

        const eventData = await EVENT.aggregate([
            {
                $match : { familyId : req.familyId , isDeleted : false /*, dateAndTime : { $gte : new Date() }*/ }
            },
            {
                $lookup : {
                    from : 'eventusers',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'eventuser',
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
            },
            {
                $lookup : {
                    from : 'advancewarnings',
                    localField : '_id',
                    foreignField : 'eventId',
                    as : 'advancewarning',
                    pipeline : [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ]);

        // const reminderIds: any = reminders.filter(a =>
        //     (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
        // ).map(a => a._id)

        const reminderIds: any = reminders.map(a => a._id);

        const reminderData = await REMINDER.aggregate([
            {
                $match: { _id: { $in: reminderIds } }
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
                $lookup: {
                    from: 'reminderusers',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'reminderuser',
                    pipeline: [
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
                            $addFields: {
                                'profile.userId': '$user'
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
            },
            {
                $lookup: {
                    from: 'advancewarnings',
                    localField: '_id',
                    foreignField: 'reminderId',
                    as: 'advancewarning',
                    pipeline: [
                        {
                            $match: { isDeleted: false }
                        },
                    ]
                }
            }
        ])

        // const medicinesIds: any = medicines.filter(a =>
        //     (a.repeat === 'none' && a.date >= new Date()) || a.repeat !== 'none'
        // ).map(a => a._id)

        const medicinesIds: any = medicines.map(a => a._id);

        const medicineData = await MEDICINES.aggregate([
            {
                $match: { _id: { $in: medicinesIds } },
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
                $lookup: {
                    from: 'medicinesusers',
                    localField: '_id',
                    foreignField: 'medicinesId',
                    as: 'medicinesuser',
                    pipeline: [
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
                            $addFields: {
                                'profile.userId': '$user'
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

        let response = {
            today : {
                reminder : todayReminders,
                medicine : todayMedicines
            },
            tomorrow : {
                reminder : tomorrowReminders,
                medicine : tomorrowMedicines
            },
            event : eventData,
            reminder: reminderData,
            medicine: medicineData
        }

        res.status(200).json({
            status : 200,
            message : 'Event and reminder data retrieved successfully.',
            data : response
        })
    } catch (error:any) {
        res.status(400).json({
            status : 'Fail',
            message : error.message
        })
    }
}