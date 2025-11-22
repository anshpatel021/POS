import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import bcrypt from 'bcryptjs';

// Get all users (super-admin sees all, admin sees their location)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, role, isActive, search } = req.query;

    const where: any = {};

    // Filter by location
    if (locationId) {
      where.locationId = locationId;
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      // Non-super-admins can only see users from their location
      where.locationId = req.user?.locationId;
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Search
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        locationId: true,
        createdAt: true,
        lastLoginAt: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sales: true,
            shifts: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }],
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// Create new user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, locationId } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, password',
      });
      return;
    }

    // Check password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }

    // Only super-admin can create users for any location
    // Admin can only create users for their own location
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (locationId && locationId !== req.user?.locationId) {
        res.status(403).json({
          success: false,
          error: 'You can only create users for your own location',
        });
        return;
      }
    }

    // Only super-admin can create super-admin or admin users
    if ((role === 'SUPER_ADMIN' || role === 'ADMIN') && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only super-admin can create admin users',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'CASHIER',
        locationId: locationId || req.user?.locationId || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        locationId: true,
        location: {
          select: { name: true },
        },
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        locationId: true,
        createdAt: true,
        lastLoginAt: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sales: true,
            shifts: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Non-super-admins can only view users from their location
    if (req.user?.role !== 'SUPER_ADMIN' && user.locationId !== req.user?.locationId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Get additional stats
    const [salesStats, recentSales, recentShifts] = await Promise.all([
      prisma.sale.aggregate({
        where: { userId: id },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.findMany({
        where: { userId: id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          saleNumber: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.shift.findMany({
        where: { userId: id },
        take: 5,
        orderBy: { clockInAt: 'desc' },
        select: {
          id: true,
          clockInAt: true,
          clockOutAt: true,
          totalSales: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...user,
        totalSales: salesStats._sum.total || 0,
        transactionCount: salesStats._count,
        recentSales,
        recentShifts,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, locationId, isActive } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Non-super-admins can only update users from their location
    if (req.user?.role !== 'SUPER_ADMIN' && existingUser.locationId !== req.user?.locationId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Prevent changing super-admin role unless you're a super-admin
    if (existingUser.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Cannot modify super-admin' });
      return;
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        res.status(400).json({ success: false, error: 'Email already in use' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        role,
        locationId,
        isActive,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        locationId: true,
        location: {
          select: { name: true },
        },
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

// Reset user password
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Non-super-admins can only reset passwords for their location
    if (req.user?.role !== 'SUPER_ADMIN' && existingUser.locationId !== req.user?.locationId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Prevent resetting super-admin password unless you're a super-admin
    if (existingUser.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Cannot modify super-admin' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};

// Delete (deactivate) user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Cannot delete yourself
    if (id === req.user?.id) {
      res.status(400).json({ success: false, error: 'Cannot delete yourself' });
      return;
    }

    // Non-super-admins can only delete users from their location
    if (req.user?.role !== 'SUPER_ADMIN' && existingUser.locationId !== req.user?.locationId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Prevent deleting super-admin unless you're a super-admin
    if (existingUser.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Cannot delete super-admin' });
      return;
    }

    // Check for active shift
    const activeShift = await prisma.shift.findFirst({
      where: { userId: id, clockOutAt: null },
    });

    if (activeShift) {
      res.status(400).json({
        success: false,
        error: 'User has an active shift. Clock out first.',
      });
      return;
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

// Get user performance stats
export const getUserPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const [salesByDay, shiftsStats] = await Promise.all([
      // Sales by day
      prisma.sale.groupBy({
        by: ['createdAt'],
        where: {
          userId: id,
          createdAt: { gte: daysAgo },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Shift stats
      prisma.shift.aggregate({
        where: {
          userId: id,
          clockInAt: { gte: daysAgo },
        },
        _sum: { totalSales: true },
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        salesByDay,
        totalShifts: shiftsStats._count,
        totalSalesInShifts: shiftsStats._sum.totalSales || 0,
      },
    });
  } catch (error) {
    console.error('Get user performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance' });
  }
};
