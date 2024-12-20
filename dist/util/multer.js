"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
var imagePath = 'public/images';
var voicePath = 'public/audio';
var uploadPaths = {
    'photo': imagePath,
    'voice': voicePath,
    'audio': voicePath,
    'image': imagePath,
    'attachment': imagePath,
    'csv': imagePath
};
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = uploadPaths[file.fieldname] || imagePath;
        if (file.fieldname === 'attachment') {
            const mimeType = file.mimetype;
            if (mimeType.startsWith('audio/')) {
                let extName = path_1.default.extname(file.originalname);
                file.mimetype = `audio/${extName.slice(1, extName.length)}`;
                uploadPath = 'public/audio';
            }
            else {
                uploadPath = 'public/images'; // Example for other file types
            }
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({ storage: storage });
