import { Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../types';
import prisma from '../config/database';

/**
 * Get all layaways
 * GET /api/layaways
 */
export const getLayaways = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, customerId, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [layaways, total] = await Promise.all([
    prisma.layaway.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        user: { select: { firstName: true, lastName: true } },
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.layaway.count({ where }),
  ]);

  res.json({
    success: true,
    data: layaways,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

/**
 * Get layaway by ID
 * GET /api/layaways/:id
 */
export const getLayawayById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const layaway = await prisma.layaway.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { firstName: true, lastName: true } },
      location: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, image: true } },
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!layaway) {
    res.status(404).json({
      success: false,
      error: 'Layaway not found',
    });
    return;
  }

  res.json({
    success: true,
    data: layaway,
  });
});

/**
 * Create a layaway
 * POST /api/layaways
 */
export const createLayaway = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { customerId, locationId, items, initialPayment, expiresAt, notes } = req.body;

  // Generate layaway number
  const count = await prisma.layaway.count();
  const layawayNumber = `LAY-${String(count + 1).padStart(6, '0')}`;

  // Calculate totals
  let subtotal = 0;
  const layawayItems = items.map((item: any) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return {
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: itemTotal,
    };
  });

  // Get location tax rate
  const location = locationId
    ? await prisma.location.findUnique({ where: { id: locationId } })
    : null;
  const taxRate = location?.taxRate || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const amountPaid = initialPayment || 0;
  const balance = total - amountPaid;

  // Create layaway with items
  const layaway = await prisma.layaway.create({
    data: {
      layawayNumber,
      customerId,
      userId,
      locationId,
      subtotal,
      tax,
      total,
      amountPaid,
      balance,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
      items: {
        create: layawayItems,
      },
      ...(initialPayment && {
        payments: {
          create: {
            amount: initialPayment,
            paymentMethod: 'CASH',
            userId,
            notes: 'Initial deposit',
          },
        },
      }),
    },
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      items: true,
      payments: true,
    },
  });

  res.status(201).json({
    success: true,
    data: layaway,
  });
});

/**
 * Make a payment on a layaway
 * POST /api/layaways/:id/payment
 */
export const makePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { amount, paymentMethod, notes } = req.body;

  const layaway = await prisma.layaway.findUnique({
    where: { id },
  });

  if (!layaway) {
    res.status(404).json({
      success: false,
      error: 'Layaway not found',
    });
    return;
  }

  if (layaway.status !== 'ACTIVE') {
    res.status(400).json({
      success: false,
      error: 'Cannot make payment on inactive layaway',
    });
    return;
  }

  if (amount > layaway.balance) {
    res.status(400).json({
      success: false,
      error: `Payment amount exceeds balance of $${layaway.balance.toFixed(2)}`,
    });
    return;
  }

  const newAmountPaid = layaway.amountPaid + amount;
  const newBalance = layaway.total - newAmountPaid;
  const isComplete = newBalance <= 0;

  // Update layaway and create payment
  const updated = await prisma.layaway.update({
    where: { id },
    data: {
      amountPaid: newAmountPaid,
      balance: newBalance,
      ...(isComplete && {
        status: 'COMPLETED',
        completedAt: new Date(),
      }),
      payments: {
        create: {
          amount,
          paymentMethod,
          notes,
          userId,
        },
      },
    },
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      items: true,
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  // If completed, update customer stats and create sale
  if (isComplete) {
    await prisma.customer.update({
      where: { id: layaway.customerId },
      data: {
        totalSpent: { increment: layaway.total },
        visitCount: { increment: 1 },
        lastVisitAt: new Date(),
      },
    });
  }

  res.json({
    success: true,
    data: updated,
    message: isComplete ? 'Layaway completed!' : `Payment of $${amount.toFixed(2)} recorded`,
  });
});

/**
 * Cancel a layaway
 * POST /api/layaways/:id/cancel
 */
export const cancelLayaway = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const layaway = await prisma.layaway.findUnique({
    where: { id },
  });

  if (!layaway) {
    res.status(404).json({
      success: false,
      error: 'Layaway not found',
    });
    return;
  }

  if (layaway.status !== 'ACTIVE') {
    res.status(400).json({
      success: false,
      error: 'Cannot cancel inactive layaway',
    });
    return;
  }

  const updated = await prisma.layaway.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      notes: reason ? `${layaway.notes || ''}\nCancelled: ${reason}`.trim() : layaway.notes,
    },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      payments: true,
    },
  });

  res.json({
    success: true,
    data: updated,
    message: `Layaway cancelled. $${updated.amountPaid.toFixed(2)} was paid.`,
  });
});

/**
 * Get layaway summary/stats
 * GET /api/layaways/summary
 */
export const getLayawaySummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [active, completed, cancelled, totals] = await Promise.all([
    prisma.layaway.count({ where: { status: 'ACTIVE' } }),
    prisma.layaway.count({ where: { status: 'COMPLETED' } }),
    prisma.layaway.count({ where: { status: 'CANCELLED' } }),
    prisma.layaway.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { total: true, amountPaid: true, balance: true },
    }),
  ]);

  // Get expiring soon (within 7 days)
  const expiringSoon = await prisma.layaway.count({
    where: {
      status: 'ACTIVE',
      expiresAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
  });

  res.json({
    success: true,
    data: {
      counts: {
        active,
        completed,
        cancelled,
        expiringSoon,
      },
      activeTotals: {
        totalValue: totals._sum.total || 0,
        totalPaid: totals._sum.amountPaid || 0,
        totalBalance: totals._sum.balance || 0,
      },
    },
  });
});

/**
 * Get customer's layaways
 * GET /api/layaways/customer/:customerId
 */
export const getCustomerLayaways = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId } = req.params;

  const layaways = await prisma.layaway.findMany({
    where: { customerId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: layaways,
  });
});
