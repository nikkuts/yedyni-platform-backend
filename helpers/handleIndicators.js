require('dotenv').config();

const {BASE_AMOUNT_SUPPORT, BASE_COURSE_TIME} = process.env;

const handleIndicators = (user) => {
    const currentTime = new Date();
    const currentTimeUnix = Math.floor(currentTime.getTime() / 1000);

    const registerTime = new Date(user.createdAt);
    const registerTimeUnix = Math.floor(registerTime.getTime() / 1000);

    const totalTime = Math.max(currentTimeUnix - registerTimeUnix, BASE_COURSE_TIME);

    let pastDonat = 0;
    let currentDonat = 0;

    user.donats.forEach((donat) => {
      const {end_date, amount} = donat.data;

      if (currentTimeUnix - end_date / 1000 > BASE_COURSE_TIME) {
        pastDonat += amount;
      } else {
        currentDonat += amount;
      }
    });

    const totalDonat = pastDonat + currentDonat;

    const pastCount = pastDonat / BASE_AMOUNT_SUPPORT;
    const currentCount = currentDonat / BASE_AMOUNT_SUPPORT;
    const levelSupport = (totalDonat / BASE_AMOUNT_SUPPORT) * (BASE_COURSE_TIME / totalTime);

    return {
      pastCount,
      currentCount,
      levelSupport,
    }
  };

  module.exports = handleIndicators; 