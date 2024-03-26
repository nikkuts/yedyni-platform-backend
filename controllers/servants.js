const { Servants } = require('../models/servant');
const {ctrlWrapper} = require('../helpers');

const getServants = async (req, res) => {
  
};

const addServant = async (req, res) => {
  const {firstname, lastname, email, phone, exam} = req.body;

  await Servants.create({
    firstname, lastname, email, phone, exam
  });

  res.status(201).json({
    message: 'Дані збережено',
  });
};

module.exports = {
    getServants: ctrlWrapper(getServants),
    addServant: ctrlWrapper(addServant),
};