const currentCount = (user) => {
    const currentTime = new Date();
    const currentTimeUnix = Math.floor(currentTime.getTime() / 1000);

    const currentDonat = user.donats.reduce(
      (current, donat) => {
        return currentTimeUnix - donat.end_date <= 2419200 
          ? current = current + donat.amount
          : current;
      }, 0);

    return currentDonat / 40;
  };

  module.exports = currentCount;