const getLevelSupport = (user) => {
    const currentTime = new Date();
    const currentTimeUnix = Math.floor(currentTime.getTime() / 1000);

    const registerTime = new Date(user.createdAt);
    const registerTimeUnix = Math.floor(registerTime.getTime() / 1000);

    const totalTime = Math.max(currentTimeUnix - registerTimeUnix, 2419200);
   
    const totalDonat = user.donats.reduce(
      (total, donat) => {
        const {amount} = donat.data;
        return total = total + amount;
      }, 0);

    return (totalDonat / 40) * (2419200 / totalTime);
  };

  module.exports = getLevelSupport; 