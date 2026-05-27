require("dotenv").config();

module.exports = {

    PORT: process.env.PORT || 5000,

    NODE_ENV: process.env.NODE_ENV || "development",

    JWT_SECRET: process.env.JWT_SECRET,

    MONGO_URI: process.env.MONGO_URI,

    REDIS_URL: process.env.REDIS_URL,

    CLOUDINARY_CLOUD_NAME:
        process.env.CLOUDINARY_CLOUD_NAME,

    CLOUDINARY_API_KEY:
        process.env.CLOUDINARY_API_KEY,

    CLOUDINARY_API_SECRET:
        process.env.CLOUDINARY_API_SECRET
};