const levelSupport = (user) => {
    const currentTime = new Date();
    const currentTimeUnix = Math.floor(currentTime.getTime() / 1000);

    const registerTime = new Date(user.registerDate);
    const registerTimeUnix = Math.floor(registerTime.getTime() / 1000);

    const totalTime = Math.max(currentTimeUnix - registerTimeUnix, 2419200);

    const totalDonat = user.donats.reduce(
      (total, donat) => {
      return total = total + donat.data.amount;
      }, 0);

    return ((totalDonat / 40) * (2419200 / totalTime));
  };

  module.exports = levelSupport; 