import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Supplier name is required'),
    contactName: z.string().optional(),
    email: z.string().email('Invalid email').optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
    leadTimeDays: z.number().int().min(0).optional().nullable(),
    minimumOrder: z.number().min(0).optional().nullable(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    contactName: z.string().optional().nullable(),
    email: z.string().email('Invalid email').optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    paymentTerms: z.string().optional().nullable(),
    leadTimeDays: z.number().int().min(0).optional().nullable(),
    minimumOrder: z.number().min(0).optional().nullable(),
  }),
});

export const linkProductSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    supplierSku: z.string().optional().nullable(),
    cost: z.number().min(0, 'Cost must be non-negative').optional().nullable(),
    leadTime: z.number().int().min(0).optional().nullable(),
    minOrder: z.number().int().min(1).optional().nullable(),
  }),
});

export const updateProductLinkSchema = z.object({
  body: z.object({
    supplierSku: z.string().optional().nullable(),
    cost: z.number().min(0, 'Cost must be non-negative').optional().nullable(),
    leadTime: z.number().int().min(0).optional().nullable(),
    minOrder: z.number().int().min(1).optional().nullable(),
  }),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid('Invalid supplier ID'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      cost: z.number().min(0, 'Cost must be non-negative'),
    })).min(1, 'At least one item is required'),
    notes: z.string().optional().nullable(),
    expectedAt: z.string().optional().nullable(),
  }),
});

export const updatePurchaseOrderSchema = z.object({
  body: z.object({
    notes: z.string().optional().nullable(),
    expectedAt: z.string().optional().nullable(),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      cost: z.number().min(0, 'Cost must be non-negative'),
    })).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']),
  }),
});

export const receivePurchaseOrderSchema = z.object({
  body: z.object({
    receivedItems: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().min(0, 'Quantity must be non-negative'),
    })).optional(),
  }),
});