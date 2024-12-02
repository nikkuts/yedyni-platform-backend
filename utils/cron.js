const cron = require('node-cron');
const {Course} = require('../models/course'); 

const updateCurrentWaveCourses = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const now = new Date();
            
            const result = await Course.updateMany(
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
                            "nextChat"
                        ]
                    }
                ]
            );
            
            if (result.matchedCount > 0) {
                console.log(`Crown task: ${result.modifiedCount} documents updated successfully`);
            } else {
                console.log('Crown task: No documents matched the criteria');
            }
        } catch (error) {
            console.error('Error executing crown task:', error);
        }
    });
};

module.exports = { updateCurrentWaveCourses };
