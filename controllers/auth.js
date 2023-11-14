const {isValidObjectId} = require('mongoose');
const bcrypt = require('bcrypt');
const {User} = require('../models/user');
const jwt = require('jsonwebtoken');
const gravavatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const {nanoid} = require('nanoid');
require('dotenv').config();

const {HttpError, ctrlWrapper, sendEmail} = require('../helpers');

const {SECRET_KEY, BASE_URL} = process.env;

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const register = async (req, res) => {
    const {name, email, password, inviterId = '65490a0ad1e6aba532545823'} = req.body;
    
    if (!isValidObjectId(inviterId)) {
        throw HttpError(400, "Помилка у запрошувальному покликанні");
    }

    const inviter = await User.findById(inviterId);
    
    if (!inviter) {
        throw HttpError(400, "Помилка у запрошувальному покликанні");
    }

    // const {email, password} = req.body;
    const user = await User.findOne({email});

    if (user) {
       throw HttpError(409, "Вказана електронна адреса вже використовується");
    }

    const hasPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravavatar.url(email);
    const verificationToken = nanoid();
    

    const newUser = await User.create({
        // ...req.body,
        name,
        email, 
        password: hasPassword, 
        avatarURL, 
        verificationToken, 
        inviter: inviterId
    });
    const verifyEmail = {
        to: email,
        subject: 'Підтвердження адреси електронної пошти',
        html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationToken}">Натисніть тут для підтвердження адреси вашої електронної пошти</a>`
    };

    // await sendEmail(verifyEmail);

    const payload = {id: newUser._id,};
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});
    await User.findByIdAndUpdate(newUser._id, {token});

    res.status(201).json({
        token: token,
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            inviter: newUser.inviter,
          }
    })
};

const verifyEmail = async (req, res) => {
    const {verificationToken} = req.params;
    const user = await User.findOne({verificationToken});

    if (!user) {
        throw HttpError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: null});

    res.status(200).json({
        message: 'Verification successful',
    })
};

const resendVerifyEmail = async (req, res) => {
    const {email} = req.body;

    if (!email) {
        throw HttpError(400, "missing required field email");
    }

    const user = await User.findOne({email});

    if (!user) {
        throw HttpError(401, "Email not found");
    }

    if (user.verify) {
        throw HttpError(400, "Verification has already been passed");
    }

    const verifyEmail = {
        to: email,
        subject: 'Verify email',
        html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationToken}">Click verify email</a>`
    };

    await sendEmail(verifyEmail);

    res.json({
        message: 'Verify email send success'
    });
};

const login = async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email}).populate("inviter", "name email");
   
    if (!user) {
       throw HttpError(401, "Email or password is wrong");
    }

    // if (!user.verify) {
    //     throw HttpError(401, "Email not verified");
    // }
    
    const passwordCompare = await bcrypt.compare(password, user.password);
   
    if (!passwordCompare) {
        throw HttpError(401, "Email or password is wrong");
    }

    const payload = {id: user._id,};
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});
    await User.findByIdAndUpdate(user._id, {token});

    return res.json({
        token: token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            inviter: user.inviter,
          }
    })
};

const getCurrent = async (req, res) => {
    const {email, status} = req.user;

    res.json({
        email,
        status,
    })
};

const logout = async (req, res) => {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ''});

    res.status(204).json();
};

const updateStatus = async (req, res) => {
    const {_id} = req.user;
    const result = await User.findByIdAndUpdate(_id, req.body, {new: true});

    res.json(result);
};

const updateAvatar = async (req, res) => {
    const {_id} = req.user;
    const {path: tempUpload, originalname} = req.file;
    const filename = `${_id}_${originalname}`
    const resultUpload = path.join(avatarsDir, filename);
    await fs.rename(tempUpload, resultUpload);
    const avatarURL = path.join("avatars", filename);
    await User.findByIdAndUpdate(_id, {avatarURL});

    res.json({
        avatarURL,
    })
};

module.exports = {
    register: ctrlWrapper(register),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateStatus: ctrlWrapper(updateStatus),
    updateAvatar: ctrlWrapper(updateAvatar),
    verifyEmail: ctrlWrapper(verifyEmail),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
}