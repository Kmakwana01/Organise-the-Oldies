import multer from "multer";
import path from "path";

var imagePath = 'public/images';
var voicePath = 'public/audio';

var uploadPaths:any = {
    'photo': imagePath,
    'voice': voicePath,
    'audio': voicePath,
    'image': imagePath,
    'attachment': imagePath,
    'csv': imagePath
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        let uploadPath = uploadPaths[file.fieldname] || imagePath;

        if(file.fieldname === 'attachment'){

            const mimeType = file.mimetype;

            if (mimeType.startsWith('audio/')) {
                let extName = path.extname(file.originalname)
                file.mimetype = `audio/${extName.slice(1,extName.length)}`;
                uploadPath = 'public/audio';
            } else {
                uploadPath = 'public/images'; // Example for other file types
            }
            
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null,  uniqueSuffix + path.extname(file.originalname) )
    }
})

export const upload = multer({ storage: storage })