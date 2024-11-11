const cron = require('node-cron');
const Course = require('../models/course'); 

const updateCurrentWaveCourses = () => {
    cron.schedule('0 15 * * *', async () => {
        try {
            const now = new Date();
            
            await Course.updateMany(
                { nextStart: { $lte: now } },
                [
                    {
                        $set: {
                            start: "$nextStart",
                            wave: "$nextWave",
                            canal: "$nextCanal",
                            chat: "$nextChat",
                        }
                    },
                    { $unset: ["nextStart", "nextWave", "nextCanal", "nextChat"] }
                ]
            );
            
            console.log('Courses updated successfully');
        } catch (error) {
            console.error('Error updating courses:', error);
        }
    });
};

module.exports = { updateCurrentWaveCourses };
