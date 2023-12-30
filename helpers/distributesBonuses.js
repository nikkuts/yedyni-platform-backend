// const {User} = require('../models/user');
const levelSupport = require('./levelSupport');
require('dotenv').config();

const distributesBonuses = async (id, amount) => {
    const MAIN_ID = process.env.MAIN_ID; 
    let bonus = amount * 0.45;
    let inviterId = id;
    let userId;
    let bonusAccount;
    let level;

    for (let i = 1; i <= 8; i += 1) {       
        do {
            const user = await User.findById(inviterId);
            userId = user._id.toString();

            if (userId === MAIN_ID) {
                bonusAccount = user.bonusAccount + bonus;
                await User.findByIdAndUpdate(userId, {bonusAccount});
                break;
            }

            inviterId = user.inviter;
            bonusAccount = user.bonusAccount;
            level = levelSupport(user);
        } while (level < i);

        if (userId === MAIN_ID) {
            return { success: true, message: 'Main user reached' };
        }

        bonusAccount = i === 1 
            ? bonusAccount + amount * 0.1
            : bonusAccount + amount * 0.05;
            
        await User.findByIdAndUpdate(userId, {bonusAccount});
        bonus = bonus - bonusAccount;

        if (bonus <= 0) {
            return { success: true, message: 'Bonus distribution completed' };
        }
    };
    return { success: false, message: 'Bonus distribution not completed' };
};

module.exports = distributesBonuses;