import { Router } from 'express';
import * as layawayController from '../controllers/layaway.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get layaway summary/stats
 */
router.get(
  '/summary',
  authorize('ADMIN', 'MANAGER'),
  layawayController.getLayawaySummary
);

/**
 * Get all layaways
 */
router.get(
  '/',
  layawayController.getLayaways
);

/**
 * Get customer's layaways
 */
router.get(
  '/customer/:customerId',
  layawayController.getCustomerLayaways
);

/**
 * Get layaway by ID
 */
router.get(
  '/:id',
  layawayController.getLayawayById
);

/**
 * Create a layaway
 */
router.post(
  '/',
  layawayController.createLayaway
);

/**
 * Make a payment on a layaway
 */
router.post(
  '/:id/payment',
  layawayController.makePayment
);

/**
 * Cancel a layaway
 */
router.post(
  '/:id/cancel',
  authorize('ADMIN', 'MANAGER'),
  layawayController.cancelLayaway
);

export default router;
