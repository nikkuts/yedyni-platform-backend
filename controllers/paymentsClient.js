const {User} = require('../models/user');
const {Payment} = require('../models/payment');
const {
    HttpError, 
    ctrlWrapper
} = require('../helpers');

const getDonats = async (req, res) => {
    const {_id} = req.user;
    const result = await User.findById(_id, "donats -_id")
    .populate('donats', '_id data.amount data.end_date data.description data.info data.action');
    
    if(!result) {
        throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const getSubscriptions = async (req, res) => {
    const {_id} = req.user;
    const result = await User.findById(_id, "subscriptions -_id")
    .populate('subscriptions', 
        '_id data.order_id data.amount data.end_date data.description data.info objSub.lastPaymentDate objSub.isUnsubscribe');
    
    if(!result) {
        throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const getByIdSubscription = async (req, res) => {
    // const {subscriptionId} = req.params;
    // const result = await Payment.findById(subscriptionId, 
    //     "data.order_id data.amount data.end_date data.description data.info dateLastPayment subscription.regular subscription.dateLastPayment subscription.status")
    // .populate('subscription.regular', 'data.amount data.end_date data.description data.info data.action -_id');

    // if(!result) {
    //   throw HttpError (404, 'Not found')
    // }
    // res.json(result);
};

module.exports = {
    getDonats: ctrlWrapper(getDonats),
    getSubscriptions: ctrlWrapper(getSubscriptions),
    getByIdSubscription: ctrlWrapper(getByIdSubscription),
};