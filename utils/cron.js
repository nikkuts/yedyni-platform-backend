const cron = require('node-cron');
const {Course} = require('../models/course'); 

const updateCurrentWaveCourses = () => {
    cron.schedule('20 17 * * *', async () => {
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
                            viber: "$nextViber",
                            chat: "$nextChat",
                        }
                    },
                    {
                        $unset: [
                            "nextStart",
                            "nextWave",
                            "nextCanal",
                            "nextViber",
                            "nextChat",
                            "addedNextWave"
                        ]
                    }
                ]
            );
            
            console.log('Cron task completed successfully');
        } catch (error) {
            console.error('Error executing crown task:', error);
        }
    });
};

module.exports = { updateCurrentWaveCourses };
