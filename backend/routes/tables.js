import express from 'express';
import jwt from 'jsonwebtoken';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper to resolve restaurant ID for public routes (like customer checkout)
const resolveRestaurantId = async (req) => {
  let restaurantId = req.query.restaurantId || req.body.restaurantId;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_foodforme_key_12345');
      const user = await User.findById(decoded.id);
      if (user) {
        restaurantId = user.restaurantId;
      }
    } catch (err) {
      // Gracefully ignore token decryption failure, rely on query params
    }
  }
  return restaurantId;
};

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private (Staff only)
router.get('/', protect, async (req, res, next) => {
  try {
    const tables = await Table.find({ restaurantId: req.user.restaurantId }).sort({ number: 1 });
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a new table
// @route   POST /api/tables
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { number, capacity } = req.body;

    const tableExists = await Table.findOne({ number, restaurantId: req.user.restaurantId });
    if (tableExists) {
      return res.status(400).json({ success: false, message: `Table ${number} already exists` });
    }

    const table = await Table.create({
      number,
      capacity,
      restaurantId: req.user.restaurantId,
    });
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
});

// @desc    Update table status
// @route   PUT /api/tables/:number
// @access  Private (Admin, Waiter)
router.put('/:number', protect, authorize('admin', 'waiter'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['empty', 'occupied', 'reserved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid table status' });
    }

    const table = await Table.findOne({ number: req.params.number, restaurantId: req.user.restaurantId });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.status = status;
    await table.save();

    res.status(200).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
});

// @desc    Checkout a table (Aggregate all non-billed orders, create a bill, update table to occupied/empty)
// @route   POST /api/tables/:number/checkout
// @access  Public (Customers or waiters can initiate checkout)
router.post('/:number/checkout', async (req, res, next) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const restaurantId = await resolveRestaurantId(req);

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Restaurant scope identifier is required' });
    }

    // 1. Check if there's already an active unpaid bill for this table in this restaurant
    let existingBill = await Bill.findOne({
      tableNumber,
      restaurantId,
      paymentStatus: 'pending',
    }).populate({
      path: 'orders',
      populate: { path: 'items.foodItem' }
    });

    if (existingBill) {
      return res.status(200).json({ success: true, message: 'Active bill exists', data: existingBill });
    }

    // 2. Otherwise, find all orders for this table in this restaurant
    const allTableOrders = await Order.find({ tableNumber, restaurantId }).populate('items.foodItem');
    if (allTableOrders.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders found for this table' });
    }

    // Find all bills for this table in this restaurant to filter out billed orders
    const existingBills = await Bill.find({ tableNumber, restaurantId });
    const billedOrderIds = new Set();
    existingBills.forEach(b => {
      b.orders.forEach(oId => billedOrderIds.add(oId.toString()));
    });

    const unbilledOrders = allTableOrders.filter(o => !billedOrderIds.has(o._id.toString()));

    if (unbilledOrders.length === 0) {
      return res.status(400).json({ success: false, message: 'No unbilled orders found for this table' });
    }

    // Calculate subtotal
    const subTotal = unbilledOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const tax = Math.round(subTotal * 0.05 * 100) / 100; // 5% VAT/GST
    const serviceCharge = Math.round(subTotal * 0.10 * 100) / 100; // 10% Service Charge
    const totalAmount = subTotal + tax + serviceCharge;

    const newBill = await Bill.create({
      tableNumber,
      orders: unbilledOrders.map(o => o._id),
      subTotal,
      tax,
      serviceCharge,
      totalAmount,
      paymentStatus: 'pending',
      restaurantId,
    });

    // Update table status to occupied
    await Table.findOneAndUpdate({ number: tableNumber, restaurantId }, { status: 'occupied' });

    const populatedBill = await Bill.findById(newBill._id).populate({
      path: 'orders',
      populate: { path: 'items.foodItem' }
    });

    res.status(201).json({ success: true, data: populatedBill });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark a bill as paid (updates table to empty)
// @route   PUT /api/tables/:number/pay-bill
// @access  Private (Admin, Waiter)
router.put('/:number/pay-bill', protect, authorize('admin', 'waiter'), async (req, res, next) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const { paymentMethod } = req.body;
    const restaurantId = req.user.restaurantId;

    const bill = await Bill.findOne({ tableNumber, restaurantId, paymentStatus: 'pending' });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'No pending bill found for this table' });
    }

    bill.paymentStatus = 'paid';
    bill.paymentMethod = paymentMethod || 'cash';
    await bill.save();

    // Mark the table as empty
    await Table.findOneAndUpdate({ number: tableNumber, restaurantId }, { status: 'empty' });

    res.status(200).json({ success: true, message: 'Bill paid successfully, table is now empty', data: bill });
  } catch (error) {
    next(error);
  }
});

// @desc    Get dynamic QR code for a table
// @route   GET /api/tables/:number/qr
// @access  Public
router.get('/:number/qr', async (req, res, next) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const restaurantId = req.query.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Restaurant scope identifier is required' });
    }

    const table = await Table.findOne({ number: tableNumber, restaurantId });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const scanUrl = `${frontendUrl}/restaurant/${restaurantId}/table/${tableNumber}`;

    // Redirect to dynamic printable QR card compiler
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;
    
    res.redirect(qrCodeUrl);
  } catch (error) {
    next(error);
  }
});

export default router;
