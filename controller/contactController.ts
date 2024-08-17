import { CONTACT } from '../models/contactModel';
import { Response , Request , NextFunction } from "express";
import fs from 'fs';
import csv from 'csv-parser';
const main_socket = require("../socket");
import { errorMail , extractLineNumber } from '../util/email';

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firstName , lastName , email , phoneNumber , address } = req.body;
        switch (true) {
            case !firstName: throw new Error('firstName is required.');
            case !lastName: throw new Error('lastName is required.');
            case !email: throw new Error('email is required.');
            case !phoneNumber: throw new Error('phoneNumber is required.');
            case !address: throw new Error('address is required.');
            default:
                break;
        }

        const contactFind = await CONTACT.findOne({ phoneNumber : phoneNumber , isDeleted : false , familyId : req.familyId});
        if(contactFind) throw new Error('Phone number already in use.');
        const emailFind = await CONTACT.findOne({ email : email , isDeleted : false , familyId : req.familyId});
        if(emailFind) throw new Error('Email already in use.');

        const data = await CONTACT.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            familyId : req.familyId,
            createdBy : req.userId,
            isDeleted :false,
            deletedBy : null,
        })

        let response = {
            key : 'contactCreate',
            contact : [data]
        }

        main_socket.broadcastContact(response,req.familyId)

        res.status(201).json({
            status : 201,
            message : 'Your contact created successfully.',
            data
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

export const get = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const data = await CONTACT.find({ familyId : req.familyId , isDeleted : false }).lean()

        res.status(200).json({
            status : 200,
            message : 'Your family contact list retrieved successfully.',
            data
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
        const {id , firstName , lastName , email , phoneNumber , address } = req.body;

        switch (true) {
            case !id: throw new Error('contact id is required.')
            case !firstName: throw new Error('firstName is required.');
            case !lastName: throw new Error('lastName is required.');
            case !email: throw new Error('email is required.');
            case !phoneNumber: throw new Error('phoneNumber is required.');
            case !address: throw new Error('address is required.');
            default:
                break;
        }

        const contactDataFind = await CONTACT.findOne({ _id : id , isDeleted : false });
        if(!contactDataFind) throw new Error('This id data does not exist.');

        const contactFind:any = await CONTACT.findOne({ phoneNumber : phoneNumber , familyId : req.familyId, isDeleted : false });
        if(contactFind && contactFind._id.toString() !== req.body.id ) throw new Error('This phone Number already used.');
        const emailFind:any = await CONTACT.findOne({ email : email , familyId : req.familyId, isDeleted : false });
        if(emailFind && emailFind._id.toString() !== req.body.id ) throw new Error('This email already used.');

        if ((contactDataFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to update this contact.');
        }

        if (req.role == 'grandParent') {
            if (contactDataFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to update this contact.')
            }
        }

        const data = await CONTACT.findByIdAndUpdate(contactDataFind._id, {
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
        }, { new: true });

        let response = {
            key: 'contactUpdate',
            contact: [data]
        }

        main_socket.broadcastContact(response, req.familyId)

        res.status(202).json({
            status: 202,
            message: 'Contact updated successfully.',
            data
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

export const deleteContact = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { id } = req.query;
        if(!id) throw new Error('id is required.');
        let contactFind = await CONTACT.findOne({ _id : id , isDeleted : false });
        if(!contactFind) throw new Error('This contact id does not exist.');

        if ((contactFind.familyId !== req.familyId)) {
            throw new Error('You are not authorized to delete this contact.');
        }

        if (req.role == 'grandParent') {
            if (contactFind.createdBy.toString() !== req.userId) {
                throw new Error('You are not authorized to delete this contact.')
            }
        }

        await CONTACT.findByIdAndUpdate(contactFind._id, {
            isDeleted: true,
            deletedBy: req.userId
        }, { new: true });

        let response = {
            key: 'contactDelete',
            contact: [contactFind]
        }

        main_socket.broadcastContact(response, req.familyId)

        res.status(202).json({
            status: 202,
            message: 'Contact deleted successfully.',
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

export const csvFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const filePath = req.file?.path;
        if (!filePath) {
            return res.status(400).json({
                status: 'Fail',
                message: 'No file uploaded.'
            });
        }

        const contacts: Array<{ firstName: string, lastName: string, email: string, phoneNumber: string, address: string,isDeleted : boolean, deletedBy : any , createdBy : any , familyId : any }> = [];

        let newContactData;
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                contacts.push({
                    firstName: row.firstName,
                    lastName: row.lastName,
                    email: row.email,
                    phoneNumber: row.phoneNumber,
                    address: row.address,
                    isDeleted : false,
                    deletedBy : null,
                    createdBy : req.userId,
                    familyId : req.familyId
                });
            })
            .on('end', async () => {
                try {
                    newContactData = await CONTACT.insertMany(contacts);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json({
                                status: 500,
                                message: 'An error occurred while deleting the file.'
                            });
                            return;
                        }
                    });

                    let response = {
                        key : 'contactCSV',
                        contact : newContactData
                    }

                    main_socket.broadcastContact(response,req.familyId)

                    res.status(201).json({
                        status: 201,
                        message: 'CSV file data uploaded successfully.'
                    });
                } catch (error: any) {
                    res.status(400).json({
                        status: 'Fail',
                        message: error.message
                    });
                }
            })
            .on('error', (error:any) => {
                res.status(400).json({
                    status: 'Fail',
                    message: error.message
                });
            });
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