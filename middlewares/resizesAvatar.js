const jimp = require("jimp");

const resizesAvatar = async (req, res, next) => {
    const {path: tempUpload} = req.file;
    const image = await jimp.read(tempUpload);
    image.resize(250, 250);
    await image.writeAsync(tempUpload);
    next();
};

module.exports = resizesAvatar;