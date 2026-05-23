import express from 'express';
import Order from '../models/Order.js';
import FoodItem from '../models/FoodItem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Submit a new order
// @route   POST /api/orders
// @access  Public (Customers scan QR and place orders)
router.post('/', async (req, res, next) => {
  try {
    const { tableNumber, items, notes } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a table number' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    let totalAmount = 0;
    const itemsToSave = [];

    // Fetch database pricing for items to prevent client tampering
    for (const item of items) {
      const foodItem = await FoodItem.findById(item.foodItem);
      if (!foodItem) {
        return res.status(404).json({
          success: false,
          message: `Food item with ID ${item.foodItem} not found`,
        });
      }
      if (!foodItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${foodItem.name} is currently out of stock`,
        });
      }

      const itemTotal = foodItem.price * item.quantity;
      totalAmount += itemTotal;

      itemsToSave.push({
        foodItem: foodItem._id,
        quantity: item.quantity,
        price: foodItem.price,
      });
    }

    const order = await Order.create({
      tableNumber,
      items: itemsToSave,
      totalAmount,
      notes: notes || '',
      status: 'pending',
    });

    // Populate foodItem info for response
    const populatedOrder = await Order.findById(order._id).populate('items.foodItem');

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all orders (with filters)
// @route   GET /api/orders
// @access  Private (Admin, Waiter, Kitchen)
router.get('/', protect, authorize('admin', 'waiter', 'kitchen'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.tableNumber) {
      filter.tableNumber = req.query.tableNumber;
    }

    // Sort: newest first
    const orders = await Order.find(filter)
      .populate('items.foodItem')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin, Waiter, Kitchen)
router.put('/:id/status', protect, authorize('admin', 'waiter', 'kitchen'), async (req, res, next) => {
  try {
    const { status, estimatedPrepTime } = req.body;
    const validStatuses = ['pending', 'cooking', 'ready', 'served'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Hardened Concurrency & Duplicate Prevention Checks
    if (status === 'cooking' && order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Order status is already "${order.status}". Duplicate cooking action blocked.`
      });
    }

    if (status === 'ready' && order.status === 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Order is already marked as Prepared (Ready).'
      });
    }

    if (status === 'served' && order.status === 'served') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been Served (Delivered).'
      });
    }

    // Set status
    order.status = status;

    // Track Prep Timing details when entering cooking status
    if (status === 'cooking') {
      order.estimatedPrepTime = parseInt(estimatedPrepTime) || 15; // default to 15 minutes if not specified
      order.prepStartedAt = new Date();
    }

    await order.save();

    // Re-populate and return
    order = await Order.findById(order._id).populate('items.foodItem');

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
