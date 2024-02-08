const {User} = require('../models/user');
const {
    HttpError, 
    ctrlWrapper
} = require('../helpers');

// const getPartners = async (req, res) => {
//     const {_id} = req.user;
//     const {page = 1, limit = 10} = req.query;
//     const skip = (page - 1) * limit;
//     const result = await User.find({inviter: _id}, "_id name email", {skip, limit});
//     res.json(result);
// };

const getDonats = async (req, res) => {
    const {_id} = req.user;
    const result = await User.findById(_id, "donats")
    .populate('donats', 'data.amount data.end_date data.description data.info data.action -_id');
    
    if(!result) {
        throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const getSubscribes = async (req, res) => {
    const {_id} = req.user;
    const result = await User.findById(_id, "subscribes")
    .populate('subscribes', 
        'data.order_id data.status data.amount data.end_date data.description data.info dateLastSubscriptionPayment -_id');
    
    if(!result) {
        throw HttpError (404, 'Not found')
    }
    res.json(result);
};

module.exports = {
    getDonats: ctrlWrapper(getDonats),
    getSubscribes: ctrlWrapper(getSubscribes),
};