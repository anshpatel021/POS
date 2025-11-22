import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import saleRoutes from './sale.routes';
import customerRoutes from './customer.routes';
import shiftRoutes from './shift.routes';
import reportRoutes from './report.routes';
import expenseRoutes from './expense.routes';
import supplierRoutes from './supplier.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import analyticsRoutes from './analytics.routes';
import financialRoutes from './financial.routes';
import layawayRoutes from './layaway.routes';
import locationRoutes from './location.routes';
import userRoutes from './user.routes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'POS API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API routes
 */
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/sales', saleRoutes);
router.use('/customers', customerRoutes);
router.use('/shifts', shiftRoutes);
router.use('/reports', reportRoutes);
router.use('/expenses', expenseRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/financial', financialRoutes);
router.use('/layaways', layawayRoutes);
router.use('/locations', locationRoutes);
router.use('/users', userRoutes);

export default router;
