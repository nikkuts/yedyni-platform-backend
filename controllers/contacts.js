const {Contact} = require('../models/contact');

const {HttpError, ctrlWrapper} = require('../helpers');

const getAll = async (req, res) => {
    const {_id: owner} = req.user;
    const {page = 1, limit = 10, favorite} = req.query;
    const skip = (page - 1) * limit;
    const result = await Contact.find({owner, favorite: favorite}, "-createdAt -updatedAt", {skip, limit});
    res.json(result);
};

const getById = async (req, res) => {
    const {contactId} = req.params;
    const result = await Contact.findOne({_id: contactId});

    if(!result) {
      throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const add = async (req, res) => {
    const {_id: owner} = req.user;
    const result = await Contact.create({...req.body, owner});
    res.status(201).json(result);
};

const removeById = async (req, res) => {
    const {contactId} = req.params;
    const result = await Contact.findByIdAndRemove(contactId);

    if(!result) {
      throw HttpError (404, 'Not found')
    }
    res.json({ message: 'contact deleted' })
};

const updateById = async (req, res) => {
    const {contactId} = req.params;
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
    
    if(!result) {
      throw HttpError (404, 'Not found')
    }
    res.json(result);
};

const updateStatusContact = async (req, res) => {
    const {contactId} = req.params;
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
    
    if(!result) {
      throw HttpError (404, 'Not found')
    }
    res.json(result);
};

module.exports = {
    getAll: ctrlWrapper(getAll),
    getById: ctrlWrapper(getById),
    add: ctrlWrapper(add),
    updateById: ctrlWrapper(updateById),
    updateStatusContact: ctrlWrapper(updateStatusContact),
    removeById: ctrlWrapper(removeById),
};