const {User} = require('../models/user');
const {Payment} = require('../models/payment');
const {
    HttpError, 
    ctrlWrapper
} = require('../helpers');

// const getDonats = async (req, res) => {
//     const {_id} = req.user;
//     const result = await User.findById(_id, "donats -_id")
//     .populate('donats', '_id data.amount data.end_date data.description data.info data.action');
    
//     if(!result) {
//         throw HttpError (404, 'Not found')
//     }
//     res.json(result);
// };

const getDonats = async (req, res) => {
    const {_id} = req.user;
    const { start = null, end = null } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const skip = (pageNum - 1) * limitNum;
    let result;
    let totalCount;

    if (start && end) {
        const user = await User.findById(_id, "donats -_id")
        .populate({
            path: 'donats',
            select: '_id data.amount data.end_date data.description data.info data.action',
            match: {
                $and: [
                    {'data.end_date': {$gte: startNum}}, 
                    {'data.end_date': {$lte: endNum}},
                ]
            } // Додаткова умова для фільтрації елементів у підмасиві
        })
        .lean();

        totalCount = user.donats.length;
        result = user.donats.slice(skip, skip + limitNum);
    } else {
        const user = await User.findById(_id, "donats -_id")
        .populate('donats', '_id data.amount data.end_date data.description data.info data.action')
        .lean();
        
        totalCount = user.donats.length;
        result = user.donats.slice(skip, skip + limitNum);
    }

    if (!result) {
        throw HttpError(404, "Not found");
    }
    
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
        donats: result,
        totalPages
    });
};

const getSubscriptions = async (req, res) => {
    const {_id} = req.user;
    const { start = null, end = null } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const skip = (pageNum - 1) * limitNum;
    let result;
    let totalCount;

    if (start && end) {
        result = await Payment.find(
            {
                "data.customer": _id.toString(),
                "data.action": "subscribe",
                "data.status": "subscribed",
                $and: [
                    {'data.end_date': {$gte: startNum}}, 
                    {'data.end_date': {$lte: endNum}},
                ]
            },
            "_id data.order_id data.amount data.end_date data.description data.info objSub.lastPaymentDate objSub.isUnsubscribe",
            { skip, limitNum }
        )

        totalCount = await Payment.countDocuments({
            "data.customer": _id.toString(),
            "data.action": "subscribe",
            "data.status": "subscribed",
            $and: [
                {'data.end_date': {$gte: startNum}}, 
                {'data.end_date': {$lte: endNum}},
            ]
        });
    } else {
        result = await Payment.find(
            {
                'data.customer': _id.toString(),
                'data.action': 'subscribe',
                'data.status': 'subscribed',
            },
            '_id data.order_id data.amount data.end_date data.description data.info objSub.lastPaymentDate objSub.isUnsubscribe',
            { skip, limitNum }
        )

        totalCount = await Payment.countDocuments({
            "data.customer": _id.toString(),
            "data.action": "subscribe",
            "data.status": "subscribed",
        });
    }

    if (!result) {
        throw HttpError(404, "Not found");
    }

    const totalPages = Math.ceil(totalCount / limitNum);
    
    res.json({
        subscriptions: result,
        totalPages
    });
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

