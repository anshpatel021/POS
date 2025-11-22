import { Response } from 'express';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { createDateFilter } from '../utils/dateFilter.util';

/**
 * Get all expenses
 * GET /api/expenses
 */
export const getAllExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, status, startDate, endDate, locationId, limit = 50, offset = 0 } = req.query;

  const where: any = {};

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  }

  if (locationId) {
    where.locationId = locationId;
  }

  const dateFilter = createDateFilter(startDate as string, endDate as string);
  if (dateFilter) {
    where.expenseDate = dateFilter;
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    }),
    prisma.expense.count({ where }),
  ]);

  res.json({
    success: true,
    data: expenses,
    meta: {
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * Get expense by ID
 * GET /api/expenses/:id
 */
export const getExpenseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  res.json({
    success: true,
    data: expense,
  });
});

/**
 * Create new expense
 * POST /api/expenses
 */
export const createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    category,
    description,
    amount,
    vendor,
    receiptUrl,
    invoiceNumber,
    expenseDate,
    dueDate,
    locationId,
  } = req.body;

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // Generate expense number
  const count = await prisma.expense.count();
  const expenseNumber = `EXP-${String(count + 1).padStart(6, '0')}`;

  const expense = await prisma.expense.create({
    data: {
      expenseNumber,
      category,
      description,
      amount: parseFloat(amount),
      vendor,
      receiptUrl,
      invoiceNumber,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.user.id,
      locationId: locationId || req.user.locationId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  logger.info(`Expense created: ${expenseNumber} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    data: expense,
    message: 'Expense created successfully',
  });
});

/**
 * Update expense
 * PUT /api/expenses/:id
 */
export const updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    category,
    description,
    amount,
    vendor,
    receiptUrl,
    invoiceNumber,
    expenseDate,
    dueDate,
    status,
  } = req.body;

  const existingExpense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existingExpense) {
    throw new AppError('Expense not found', 404);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(category && { category }),
      ...(description && { description }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(vendor !== undefined && { vendor }),
      ...(receiptUrl !== undefined && { receiptUrl }),
      ...(invoiceNumber !== undefined && { invoiceNumber }),
      ...(expenseDate && { expenseDate: new Date(expenseDate) }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status && { status }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  logger.info(`Expense updated: ${expense.expenseNumber}`);

  res.json({
    success: true,
    data: expense,
    message: 'Expense updated successfully',
  });
});

/**
 * Delete expense
 * DELETE /api/expenses/:id
 */
export const deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  await prisma.expense.delete({
    where: { id },
  });

  logger.info(`Expense deleted: ${expense.expenseNumber}`);

  res.json({
    success: true,
    message: 'Expense deleted successfully',
  });
});

/**
 * Approve expense
 * POST /api/expenses/:id/approve
 */
export const approveExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const existingExpense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existingExpense) {
    throw new AppError('Expense not found', 404);
  }

  if (existingExpense.status !== 'PENDING') {
    throw new AppError('Only pending expenses can be approved', 400);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: req.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info(`Expense approved: ${expense.expenseNumber} by ${req.user.email}`);

  res.json({
    success: true,
    data: expense,
    message: 'Expense approved successfully',
  });
});

/**
 * Reject expense
 * POST /api/expenses/:id/reject
 */
export const rejectExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const existingExpense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existingExpense) {
    throw new AppError('Expense not found', 404);
  }

  if (existingExpense.status !== 'PENDING') {
    throw new AppError('Only pending expenses can be rejected', 400);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedBy: req.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info(`Expense rejected: ${expense.expenseNumber} by ${req.user.email}`);

  res.json({
    success: true,
    data: expense,
    message: 'Expense rejected successfully',
  });
});

/**
 * Upload receipt file
 * POST /api/expenses/upload-receipt
 */
export const uploadReceipt = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // Return the file URL
  const fileUrl = `/uploads/receipts/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
    message: 'Receipt uploaded successfully',
  });
});

/**
 * Bulk approve expenses
 * POST /api/expenses/bulk-approve
 */
export const bulkApproveExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { expenseIds } = req.body;

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
    throw new AppError('No expense IDs provided', 400);
  }

  // Update all pending expenses
  const result = await prisma.expense.updateMany({
    where: {
      id: { in: expenseIds },
      status: 'PENDING',
    },
    data: {
      status: 'APPROVED',
      approvedBy: req.user.id,
    },
  });

  logger.info(`Bulk approved ${result.count} expenses by ${req.user.email}`);

  res.json({
    success: true,
    data: { count: result.count },
    message: `${result.count} expense(s) approved successfully`,
  });
});

/**
 * Bulk reject expenses
 * POST /api/expenses/bulk-reject
 */
export const bulkRejectExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { expenseIds } = req.body;

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
    throw new AppError('No expense IDs provided', 400);
  }

  // Update all pending expenses
  const result = await prisma.expense.updateMany({
    where: {
      id: { in: expenseIds },
      status: 'PENDING',
    },
    data: {
      status: 'REJECTED',
      approvedBy: req.user.id,
    },
  });

  logger.info(`Bulk rejected ${result.count} expenses by ${req.user.email}`);

  res.json({
    success: true,
    data: { count: result.count },
    message: `${result.count} expense(s) rejected successfully`,
  });
});

/**
 * Export expenses to CSV
 * GET /api/expenses/export/csv
 */
export const exportExpensesCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { Parser } = require('json2csv');
  const { category, status, startDate, endDate, locationId } = req.query;

  const where: any = {};

  if (category) where.category = category;
  if (status) where.status = status;
  if (locationId) where.locationId = locationId;

  const dateFilter = createDateFilter(startDate as string, endDate as string);
  if (dateFilter) {
    where.expenseDate = dateFilter;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true } },
      location: { select: { name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  });

  // Transform data for CSV
  const csvData = expenses.map((exp) => ({
    'Expense Number': exp.expenseNumber,
    'Date': exp.expenseDate.toISOString().split('T')[0],
    'Category': exp.category,
    'Description': exp.description,
    'Vendor': exp.vendor || '',
    'Invoice Number': exp.invoiceNumber || '',
    'Amount': exp.amount,
    'Status': exp.status,
    'Location': exp.location?.name || '',
    'Created By': `${exp.user.firstName} ${exp.user.lastName}`,
    'Due Date': exp.dueDate ? exp.dueDate.toISOString().split('T')[0] : '',
    'Paid Date': exp.paidDate ? exp.paidDate.toISOString().split('T')[0] : '',
  }));

  const parser = new Parser();
  const csv = parser.parse(csvData);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=expenses-export.csv');
  res.send(csv);
});

/**
 * Export expenses to PDF
 * GET /api/expenses/export/pdf
 */
export const exportExpensesPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const PDFDocument = require('pdfkit');
  const { category, status, startDate, endDate, locationId } = req.query;

  const where: any = {};

  if (category) where.category = category;
  if (status) where.status = status;
  if (locationId) where.locationId = locationId;

  const dateFilter = createDateFilter(startDate as string, endDate as string);
  if (dateFilter) {
    where.expenseDate = dateFilter;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true } },
      location: { select: { name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  });

  // Calculate summary
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const byStatus = expenses.reduce((acc: any, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + exp.amount;
    return acc;
  }, {});

  // Create PDF
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=expense-report.pdf');

  doc.pipe(res);

  // Header
  doc.fontSize(20).text('Expense Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  if (startDate || endDate) {
    const dateRange = `${startDate || 'All'} to ${endDate || 'All'}`;
    doc.text(`Period: ${dateRange}`, { align: 'center' });
  }
  doc.moveDown(2);

  // Summary
  doc.fontSize(14).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
  doc.text(`Number of Expenses: ${expenses.length}`);
  Object.keys(byStatus).forEach((status) => {
    doc.text(`${status}: $${byStatus[status].toFixed(2)}`);
  });
  doc.moveDown(2);

  // Expense Details
  doc.fontSize(14).text('Expense Details', { underline: true });
  doc.moveDown(0.5);

  expenses.forEach((exp, index) => {
    if (index > 0) doc.moveDown(1);

    doc.fontSize(10);
    doc.text(`${exp.expenseNumber} - ${exp.expenseDate.toLocaleDateString()}`, { continued: true });
    doc.text(` - $${exp.amount.toFixed(2)}`, { align: 'right' });
    doc.fontSize(9);
    doc.text(`Category: ${exp.category} | Status: ${exp.status}`);
    doc.text(`Description: ${exp.description}`);
    if (exp.vendor) doc.text(`Vendor: ${exp.vendor}`);
  });

  doc.end();
});
