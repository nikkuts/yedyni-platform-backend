const express = require('express');
const ctrl = require('../../controllers/tips');
const {
    authenticate
} = require('../../middlewares');

const router = express.Router();

router.get('/', authenticate, ctrl.getTips);

router.get('/:tipId', authenticate, ctrl.getTipById);

module.exports = router;