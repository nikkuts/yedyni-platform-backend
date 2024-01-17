const {User} = require('../models/user');
const {
    HttpError, 
    ctrlWrapper, 
    handleIndicators
} = require('../helpers');

const getIndicators = async (req, res) => {
    const user = req.user;
    const bonusAccount = user.bonusAccount;
    const {currentCount, pastCount, levelSupport} = handleIndicators(user);

    res.json({
        bonusAccount,
        currentCount,
        pastCount,
        levelSupport,
    });
};

// const getPartners = async (req, res) => {
//     const {_id} = req.user;
//     const {page = 1, limit = 10} = req.query;
//     const skip = (page - 1) * limit;
//     const result = await User.find({inviter: _id}, "_id name email", {skip, limit});
//     res.json(result);
// };

const getTeam = async (req, res) => {
    const {_id} = req.user;
    const result = await User.findById(_id, "_id name email team")
    .populate('team', '_id createdAt name email team');
    
    if(!result) {
        throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const getByIdPartnerTeam = async (req, res) => {
    const {partnerId} = req.params;
    const result = await User.findById(partnerId, "_id name email team")
    .populate('team', '_id createdAt name email team');

    if(!result) {
      throw HttpError (404, 'Not found')
    }
    res.json(result);
};

module.exports = {
    getIndicators: ctrlWrapper(getIndicators),
    getTeam: ctrlWrapper(getTeam),
    getByIdPartnerTeam: ctrlWrapper(getByIdPartnerTeam),
};