const {isValidObjectId} = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../models/user');
const { Course } = require('../models/course');
const jwt = require('jsonwebtoken');
const gravavatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const {nanoid} = require('nanoid');
const { HttpError, ctrlWrapper, sendEmail } = require('../helpers');
const handleContactDB = require('../helpers/handleContactDB');
const handleContactUspacy = require('../helpers/handleContactUspacy');
require('dotenv').config();

const {SECRET_KEY, BASE_SERVER_URL, BASE_CLIENT_URL, MAIN_ID} = process.env;
const BASE_UKRAINIAN_MARK = Number(process.env.BASE_UKRAINIAN_MARK);

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const register = async (req, res) => {
    const { first_name, last_name, email, password, inviterId = MAIN_ID, titleCourse = 'Курс переходу' } = req.body;
    const contact = { first_name, last_name, email };
    
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

    const courseTransition = await Course.findOne({ title: 'Курс переходу' });
    const courseGrammatical = await Course.findOne({ title: 'Граматичний курс' });
    const courseNewId = await Course.findOne({ title: 'Новий курс' }, '_id');

    /* const courses = {
        'Курс переходу': courseTransition,
        'Граматичний курс': courseGrammatical
    };

    if (courses[titleCourse]) {
        const params = await handleContactDB({
            user: contact,
            course: courses[titleCourse]
        });

        await handleContactUspacy({
            user: contact,
            course: courses[titleCourse],
            ...params
        });
    } */

    const arrayCoursesId = inviterId === '666ad6fd5d3cb232f39728fb' ? 
        [courseNewId] 
        : [courseTransition._id, courseGrammatical._id];
    
    const newUser = await User.create({
        first_name,
        last_name,
        email, 
        password: hasPassword, 
        avatarURL, 
        verificationToken, 
        inviter: inviterId,
        courses: arrayCoursesId,
        ukrainianMark: BASE_UKRAINIAN_MARK,
        historyUkrainianMark: [{
            points: BASE_UKRAINIAN_MARK,
            comment: "реєстрація на платформі",
            finalValue: BASE_UKRAINIAN_MARK,
        }]
    });
    
    const verifyEmail = {
        to: [{email}],
        subject: "Підтвердження адреси електронної пошти на платформі «Єдині»",
        html: `
            <p>
                <a target="_blank" href="${BASE_SERVER_URL}/api/auth/verify/${verificationToken}">Натисніть тут</a> для підтвердження адреси вашої електронної пошти
            </p>
            `
    };

    await sendEmail(verifyEmail);

    const payload = {id: newUser._id,};
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});
    
    const registeredUser = await User.findByIdAndUpdate(
        newUser._id, 
        { token },
        { new: true }  
    )
    .select('_id first_name last_name email status courses createdAt inviter')
    .populate('courses', '_id title')
    .populate('inviter', '-_id first_name last_name');

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

    res.status(201).json({
        token: token,
        user: registeredUser,
    })
};

const resendVerifyEmail = async (req, res) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if (!user) {
        throw HttpError(404, "User not found");
    }

    if (user.verify) {
        throw HttpError(409, "Verification has already been passed");
    }

    const verifyEmail = {
        to: [{email}],
        subject: "Підтвердження адреси електронної пошти на платформі «Єдині»",
        html: `
            <p>
                <a target="_blank" href="${BASE_SERVER_URL}/api/auth/verify/${user.verificationToken}">Натисніть тут</a> для підтвердження адреси вашої електронної пошти
            </p>
            `
    };

    await sendEmail(verifyEmail);

    res.status(200).json({
        message: 'Verify email send success'
    });
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

const recoveryPassword = async (req, res) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if (!user) {
        throw HttpError(404, "User not found");
    }

    const token = jwt.sign({userId: user._id}, SECRET_KEY, {expiresIn: '1h'});

    const recoveryPassword = {
        to: [{email}],
        subject: "Відновлення паролю на платформі «Єдині»",
        html: `
            <p>
                <a target="_blank" href="${BASE_CLIENT_URL}/reset/${token}">Натисніть тут</a> для відновлення паролю
            </p>
            `
    };

    await sendEmail(recoveryPassword);

    res.json({
        message: 'Recovery email send success', token
    });
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    
    let userId;
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        userId = decoded.userId;
    } catch (error) {
        throw HttpError(400, "Закінчився час. Будь ласка, повторіть спробу.");
    }

    const user = await User.findById(userId);
   
    if (!user) {
       throw HttpError(404, "User not found");
    }

    const hasPassword = await bcrypt.hash(password, 10);

    const payload = {id: user._id,};
    const newToken = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});

    const updatedUser = await User.findByIdAndUpdate(
        user._id, 
        { password: hasPassword, token: newToken },
        { new: true } 
    )
    .select('_id first_name last_name email status courses createdAt inviter')
    .populate('courses', '_id title')
    .populate('inviter', '-_id first_name last_name');

    res.status(200).json({
        token: newToken,
        user: updatedUser,
    })
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

    const payload = {id: user._id,};
    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '30d'});

    const authenticatedUser = await User.findByIdAndUpdate(
        user._id, 
        { token },
        { new: true } 
    )
    .select('_id first_name last_name email status courses createdAt inviter')
    .populate('courses', '_id title')
    .populate('inviter', '-_id first_name last_name');

    res.status(200).json({
        token: token,
        user: authenticatedUser,
    })
};

const getCurrent = async (req, res) => {
    const {_id} = req.user;
    
    const currentUser = await User.findById(
        _id, 
        '_id first_name last_name email status courses createdAt inviter'
    )
    .populate('courses', '_id title')
    .populate('inviter', '-_id first_name last_name');

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
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
    verifyEmail: ctrlWrapper(verifyEmail),
    recoveryPassword: ctrlWrapper(recoveryPassword),
    resetPassword: ctrlWrapper(resetPassword),
}