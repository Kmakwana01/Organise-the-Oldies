import { ATTACHMENT } from '../models/attachmentModel';
import { CHAT } from '../models/chatModel';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
moment.tz.setDefault('Asia/Kolkata');

async function trashFileRemove(){
    try {
        const imageFind = await ATTACHMENT.find({ isInTrash: true });
            if(imageFind.length > 0) {
                const deleteFilePromises = imageFind.map(async (image) => {
                    const currentTime = new Date();
                    const updatedTime = new Date(image.updatedAt);
                    const timeDifferenceInDays = moment(currentTime).diff(updatedTime, 'days');
                    
                    if (timeDifferenceInDays > 30) {
                        const url = image.path;
                        const filePath = url.substring(url.lastIndexOf("/") + 1);
                        const directoryPath = path.join("public", "images");
                        const completeFilePath = path.join(directoryPath, filePath);
    
                        fs.unlink(completeFilePath, (err) => {
                        if (err) {
                            console.error("Error deleting file:", err);
                        } else {
                            console.log("File deleted successfully:", completeFilePath);
                        }
                        });
                        await CHAT.deleteOne({ attachmentId : image._id });
                        await ATTACHMENT.findByIdAndDelete(image._id);
                    }
                });
                await Promise.all(deleteFilePromises);    
            }

        } catch (error) {
            console.error('Error in trashFileRemove cron job:', error);
        }
};

export { trashFileRemove };