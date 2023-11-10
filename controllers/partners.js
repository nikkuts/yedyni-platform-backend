const {User} = require('../models/user');

const {HttpError, ctrlWrapper} = require('../helpers');

const getFirstLinePartners = async (req, res) => {
    const {_id: inviter} = req.user;
    const {page = 1, limit = 10} = req.query;
    const skip = (page - 1) * limit;
    const result = await User.find({inviter}, "_id name email avatarURL verify", {skip, limit});
    res.json(result);
};

const getByIdPartner = async (req, res) => {
    const {partnerId} = req.params;
    const result = await User.findOne({_id: partnerId});

    if(!result) {
      throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const getPartnerStructure = async (req, res) => {
    const {partnerId} = req.params;
    const {page = 1, limit = 10} = req.query;
    const skip = (page - 1) * limit;
    const result = await User.find({inviter: partnerId}, "_id name email avatarURL verify", {skip, limit});
    res.json(result);
};

module.exports = {
    getFirstLinePartners: ctrlWrapper(getFirstLinePartners),
    getByIdPartner: ctrlWrapper(getByIdPartner),
    getPartnerStructure: ctrlWrapper(getPartnerStructure),
};