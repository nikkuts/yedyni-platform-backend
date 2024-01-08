const currentCount = (user) => {
    const currentTime = new Date();
    const currentTimeUnix = Math.floor(currentTime.getTime() / 1000);

    const currentDonat = user.donats.reduce(
      (current, donat) => {
        const {end_date, amount} = donat.data;
        return currentTimeUnix - end_date <= 2419200 
          ? current = current + amount
          : current;
      }, 0);

    return currentDonat / 40;
  };

  module.exports = currentCount;