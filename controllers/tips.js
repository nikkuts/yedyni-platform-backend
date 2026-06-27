const { Tip } = require('../models/tip');
const {HttpError, ctrlWrapper} = require('../helpers');

const getTips = async (req, res) => {
  const result = await Tip.find(
    {}, 
    "_id title"
  );
  
  if (!result) {
    throw HttpError(404, 'Not found');
  }

  return res.status(200).json(result);
};

const getTipById = async (req, res) => {
  const {tipId} = req.params;

  const result = await Tip.findById(
    tipId, 
    "title content -_id"
  );
  
  if (!result) {
    throw HttpError(404, 'Not found');
  }

  return res.status(200).json(result);
};

module.exports = {
    getTips: ctrlWrapper(getTips),
    getTipById: ctrlWrapper(getTipById),
};
