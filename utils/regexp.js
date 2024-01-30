const emailRegexp = /^([a-z0-9_-]+\.)*[a-z0-9_-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$/;
const dateRegexp = /^\d{2}-\d{2}-\d{4}$/;
const locationRegexp = /^[A-Z][a-z]+$/;
const nameRegexp = /^[^\s]+[a-zA-Zа-яА-Я'\s]{2,30}[^\s]+$/;
const phoneRegexp = /^(\+38)?0\d{9}$/;
const workScheduleRegexp = /^([01]\d|2[0-3]):[0-5]\d$/;
const passwordRegex = /^[a-zA-Z0-9]{6,30}$/;
// const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;

module.exports = {
    emailRegexp,
  dateRegexp,
  locationRegexp,
  nameRegexp,
  phoneRegexp,
  workScheduleRegexp,
  passwordRegex,
};
