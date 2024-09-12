const {isValidObjectId} = require('mongoose');
const bcrypt = require('bcrypt');
const {User} = require('../models/user');
const jwt = require('jsonwebtoken');
const gravavatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const {nanoid} = require('nanoid');
const {HttpError, ctrlWrapper, sendEmail} = require('../helpers');
require('dotenv').config();

const {SECRET_KEY, BASE_URL, MAIN_ID} = process.env;
const BASE_UKRAINIAN_MARK = Number(process.env.BASE_UKRAINIAN_MARK);

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const register = async (req, res) => {
    const {name, email, password, inviterId = MAIN_ID} = req.body;
    
    if (!isValidObjectId(inviterId)) {
        throw HttpError(404, "Помилка у запрошувальному покликанні");
    }

    const inviter = await User.findById(inviterId);
    
    if (!inviter) {
        throw HttpError(404, "Помилка у запрошувальному покликанні");
    }

    const user = await User.findOne({email});

    if (user) {
       throw HttpError(409, "Вказана електронна адреса вже використовується");
    }

    const hasPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravavatar.url(email);
    const verificationToken = nanoid();
    const courses = inviterId === '666ad6fd5d3cb232f39728fb' ? 
        ['66e057f98475aec7b81e613c'] 
        : ['66e2c70e5122f6140e1ad568', '66e2c7885122f6140e1ad56a'];
    
    const newUser = await User.create({
        name,
        email, 
        password: hasPassword, 
        avatarURL, 
        verificationToken, 
        inviter: inviterId,
        courses,
        ukrainianMark: BASE_UKRAINIAN_MARK,
        historyUkrainianMark: [{
            points: BASE_UKRAINIAN_MARK,
            comment: "реєстрація на платформі",
            finalValue: BASE_UKRAINIAN_MARK,
        }]
    });
    const verifyEmail = {
        to: email,
        subject: 'Підтвердження адреси електронної пошти',
        html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationToken}">Натисніть тут для підтвердження адреси вашої електронної пошти</a>`
    };

    // await sendEmail(verifyEmail);

    const payload = {id: newUser._id,};
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});
    
    const registeredUser = await User.findByIdAndUpdate(
        newUser._id, 
        { token },
        { new: true }  
    )
    .select('_id name email status courses createdAt inviter')
    .populate('courses', '_id title')
    .populate('inviter', 'name');

    const ukrainianMarkInviter = inviter.ukrainianMark += BASE_UKRAINIAN_MARK;

    await User.findByIdAndUpdate(inviterId, {
        $set: { ukrainianMark: ukrainianMarkInviter },  
          $push: {
            team: newUser._id,
            historyUkrainianMark: {
              points: BASE_UKRAINIAN_MARK,
              comment: `реєстрація нового учасника команди ${email}`,
              finalValue: ukrainianMarkInviter,
            }
          }
      });

    // res.status(201).json({
    //     token: token,
    //     user: {
    //         id: newUser._id,
    //         name: newUser.name,
    //         email: newUser.email,
    //         courses: newUser.courses,
    //         registerDate: newUser.createdAt,
    //         inviter: inviter.name,
    //       }
    // })
    res.status(201).json({
        token: token,
        user: registeredUser,
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
    const user = await User.findOne({email});
   
    if (!user) {
       throw HttpError(401, "Недійсний Email");
    }

    // if (!user.verify) {
    //     throw HttpError(401, "Email not verified");
    // }

    const passwordCompare = await bcrypt.compare(password, user.password);
   
    if (!passwordCompare) {
        throw HttpError(401, 'Недійсний пароль');
    }

    // const {_id, name, status, courses, inviter, createdAt} = user;

    const payload = {id: user._id,};
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});
    
    // await User.findByIdAndUpdate(_id, {token});

    // const inviterUser = await User.findById(inviter.toString());

    // return res.json({
    //     token: token,
    //     user: {
    //         id: _id,
    //         name,
    //         email,
    //         status,
    //         courses,
    //         registerDate: createdAt,
    //         inviter: inviterUser.name,
    //       }
    // })

    const authenticatedUser = await User.findByIdAndUpdate(
        user._id, 
        { token },
        { new: true } 
    )
    .select('_id name email status courses createdAt inviter')
    .populate('courses', '_id title')
    .populate('inviter', 'name');

    res.status(200).json({
        token: token,
        user: authenticatedUser,
    })
};

// const getCurrent = async (req, res) => {
//     const {_id, name, status, email, courses, inviter, createdAt} = req.user;
//     const inviterUser = await User.findById(inviter.toString());

//     res.json({
//         id: _id,
//         name,
//         email,
//         status,
//         courses,
//         registerDate: createdAt,
//         inviter: inviterUser.name,
//     });
// };

const getCurrent = async (req, res) => {
    const {_id} = req.user;
    
    const currentUser = await User.findById(
        _id, 
        '_id name email status courses createdAt inviter'
    )
    .populate('courses', '_id title')
    .populate('inviter', 'name');

    res.status(200).json(currentUser);
};

const logout = async (req, res) => {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ''});

    res.status(204).json()
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