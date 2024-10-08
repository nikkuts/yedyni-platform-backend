const express = require('express');

const ctrl = require('../../controllers/auth');

const {validateBody, authenticate, upload, resizesAvatar} = require('../../middlewares');

const {schemas} = require('../../models/user');

const router = express.Router();

router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

router.get("/verify/:verificationToken", ctrl.verifyEmail);

router.post("/verify", validateBody(schemas.emailSchema), ctrl.resendVerifyEmail);

router.post("/login", validateBody(schemas.loginSchema), ctrl.login);

router.get("/resume", ctrl.getResumeUser);

router.get("/current", authenticate, ctrl.getCurrent);

router.post("/logout", authenticate, ctrl.logout);

router.patch("/status", authenticate, validateBody(schemas.updateStatusSchema), ctrl.updateStatus);

router.patch("/avatar", authenticate, upload.single("avatar"), resizesAvatar, ctrl.updateAvatar);

module.exports = router;