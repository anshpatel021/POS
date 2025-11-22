import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as twoFactorController from '../controllers/twoFactor.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFactorVerifySchema,
  twoFactorDisableSchema
} from '../validators/auth.validator';

const router = Router();

/**
 * Public routes
 */
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshAccessToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * Protected routes
 */
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// Session management
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

// Two-factor authentication
router.get('/2fa/status', authenticate, twoFactorController.get2FAStatus);
router.post('/2fa/setup', authenticate, twoFactorController.setup2FA);
router.post('/2fa/verify', authenticate, validate(twoFactorVerifySchema), twoFactorController.verify2FA);
router.post('/2fa/disable', authenticate, validate(twoFactorDisableSchema), twoFactorController.disable2FA);
router.post('/2fa/backup-codes', authenticate, twoFactorController.regenerateBackupCodes);

/**
 * Admin only routes
 */
router.post(
  '/register',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  validate(registerSchema),
  authController.register
);

export default router;
