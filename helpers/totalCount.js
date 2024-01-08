const totalCount = (user) => {
    const currentTime = new Date();
    const currentTimeUnix = Math.floor(currentTime.getTime() / 1000);

    const totalDonat = user.donats.reduce(
      (total, donat) => {
        const {end_date, amount} = donat.data;
        return currentTimeUnix - end_date > 2419200 
          ? total = total + amount
          : total;
      }, 0);

    return totalDonat / 40;
  };

  module.exports = totalCount;