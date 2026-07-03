import multer from "multer";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG, GIF images and MP4 videos are allowed."));
        }
    },  
});