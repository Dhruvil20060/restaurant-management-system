import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { protectRoute, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Create order
router.post('/', protectRoute, async (req, res) => {
  const { items, orderType, tableNumber, deliveryAddress, paymentMethod, notes, discount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  try {
    const normalizedItems = items.map((item) => ({
      menuItemId: item.menuItemId || item._id || item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      specialInstructions: item.specialInstructions || ''
    }));

    const hasInvalidMenuItemId = normalizedItems.some(
      (item) => !mongoose.Types.ObjectId.isValid(item.menuItemId)
    );

    if (hasInvalidMenuItemId) {
      return res.status(400).json({ message: 'Each order item must contain a valid menu item ID' });
    }

    // Calculate total amount
    const totalAmount = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (discount || 0);

    const order = new Order({
      customerId: req.userId,
      items: normalizedItems,
      totalAmount,
      orderType: orderType || 'Dine-In',
      tableNumber,
      deliveryAddress,
      paymentMethod: paymentMethod || 'Cash',
      notes,
      discount: discount || 0
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

// Get customer's orders
router.get('/my-orders', protectRoute, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.userId })
      .sort({ createdAt: -1 })
      .populate('customerId', 'username email')
      .populate('staffAssigned', 'username firstName lastName');

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (Staff/Admin)
router.get('/', protectRoute, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const { status, orderType, dateFrom, dateTo } = req.query;
    let filter = {};

    if (req.role === 'staff') {
      filter.staffAssigned = req.userId;
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'username email phone')
      .populate('staffAssigned', 'username firstName lastName staffStatus isLoggedIn');

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order statistics (Admin/Staff)
router.get('/stats/daily', protectRoute, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', protectRoute, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'username email phone address')
      .populate('staffAssigned', 'username firstName lastName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permission
    if (String(order.customerId._id) !== req.userId && !['admin', 'staff'].includes(req.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (Staff/Admin)
router.patch('/:id/status', protectRoute, authorizeRole('admin', 'staff'), async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.role === 'admin') {
      if (status === 'Confirmed' && !order.staffAssigned) {
        return res.status(400).json({ message: 'Assign staff before accepting the order' });
      }

      if (status === 'Delivered' && !order.staffNotifiedAdmin) {
        return res.status(400).json({ message: 'Staff must notify admin before completing the order' });
      }
    }

    if (req.role === 'staff') {
      if (!order.staffAssigned || String(order.staffAssigned) !== req.userId) {
        return res.status(403).json({ message: 'Only assigned staff can update this order' });
      }

      if (status === 'Confirmed' || status === 'Delivered') {
        return res.status(403).json({ message: 'Staff cannot set this status' });
      }
    }

    order.status = status;

    // Once admin completes order, reset notify flag.
    if (status === 'Delivered') {
      order.staffNotifiedAdmin = false;
      order.staffNotifiedAt = null;
    }

    await order.save();

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Staff notify admin that assigned order is ready
router.patch('/:id/notify-admin', protectRoute, authorizeRole('staff'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.staffAssigned || String(order.staffAssigned) !== req.userId) {
      return res.status(403).json({ message: 'Only assigned staff can notify admin' });
    }

    if (!['Preparing', 'Ready'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be preparing or ready before notifying admin' });
    }

    order.status = 'Ready';
    order.staffNotifiedAdmin = true;
    order.staffNotifiedAt = new Date();
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'username email phone')
      .populate('staffAssigned', 'username firstName lastName staffStatus isLoggedIn');

    res.status(200).json({ message: 'Admin has been notified by staff', order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order payment status (Admin)
router.patch('/:id/payment-status', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { paymentStatus } = req.body;

  const validStatuses = ['Pending', 'Paid', 'Failed'];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Invalid payment status' });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Payment status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer online payment (Delivered orders only)
router.patch('/:id/pay-online', protectRoute, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.customerId) !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Online payment is available only after delivery' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    order.paymentMethod = 'UPI';
    order.paymentStatus = 'Paid';
    await order.save();

    res.status(200).json({ message: 'Payment completed successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign staff to order (Admin)
router.patch('/:id/assign-staff', protectRoute, authorizeRole('admin'), async (req, res) => {
  const { staffId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }

    const staffMember = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
    if (!staffMember) {
      return res.status(404).json({ message: 'Active staff member not found' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { staffAssigned: staffId, staffNotifiedAdmin: false, staffNotifiedAt: null },
      { new: true }
    )
      .populate('customerId', 'username email phone')
      .populate('staffAssigned', 'username firstName lastName staffStatus isLoggedIn');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Staff assigned to order', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', protectRoute, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permission
    if (String(order.customerId) !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can't cancel if order is already delivered
    if (['Ready', 'Delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'Cancelled';
    await order.save();

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
