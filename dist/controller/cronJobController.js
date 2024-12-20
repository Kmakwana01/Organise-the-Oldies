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
exports.trashFileRemove = trashFileRemove;
const attachmentModel_1 = require("../models/attachmentModel");
const chatModel_1 = require("../models/chatModel");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
moment_timezone_1.default.tz.setDefault('Asia/Kolkata');
function trashFileRemove() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const imageFind = yield attachmentModel_1.ATTACHMENT.find({ isInTrash: true });
            if (imageFind.length > 0) {
                const deleteFilePromises = imageFind.map((image) => __awaiter(this, void 0, void 0, function* () {
                    const currentTime = new Date();
                    const updatedTime = new Date(image.updatedAt);
                    const timeDifferenceInDays = (0, moment_timezone_1.default)(currentTime).diff(updatedTime, 'days');
                    if (timeDifferenceInDays > 30) {
                        const url = image.path;
                        const filePath = url.substring(url.lastIndexOf("/") + 1);
                        const directoryPath = path_1.default.join("public", "images");
                        const completeFilePath = path_1.default.join(directoryPath, filePath);
                        fs_1.default.unlink(completeFilePath, (err) => {
                            if (err) {
                                console.error("Error deleting file:", err);
                            }
                            else {
                                console.log("File deleted successfully:", completeFilePath);
                            }
                        });
                        yield chatModel_1.CHAT.deleteOne({ attachmentId: image._id });
                        yield attachmentModel_1.ATTACHMENT.findByIdAndDelete(image._id);
                    }
                }));
                yield Promise.all(deleteFilePromises);
            }
        }
        catch (error) {
            console.error('Error in trashFileRemove cron job:', error);
        }
    });
}
;
