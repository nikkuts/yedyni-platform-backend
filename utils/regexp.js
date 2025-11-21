const emailRegexp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const dateRegexp = /^\d{2}-\d{2}-\d{4}$/;
const locationRegexp = /^[A-Z][a-z]+$/;
const nameRegexp = /^[a-zA-Zа-яА-ЯїЇіІєЄґҐ\s]{2,30}$/u;
const phoneRegexp = /^(\+38)?0\d{9}$/;
const workScheduleRegexp = /^([01]\d|2[0-3]):[0-5]\d$/;
const passwordRegex = /^[\w!@#$%^&*()+=\-[\]{};':"\\|,.<>/?]{8,24}$/;

module.exports = {
    emailRegexp,
  dateRegexp,
  locationRegexp,
  nameRegexp,
  phoneRegexp,
  workScheduleRegexp,
  passwordRegex,
};
