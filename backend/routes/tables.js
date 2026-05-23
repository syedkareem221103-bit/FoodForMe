import express from 'express';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public (so frontend can check table layout / scan page)
router.get('/', async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
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

    const tableExists = await Table.findOne({ number });
    if (tableExists) {
      return res.status(400).json({ success: false, message: `Table ${number} already exists` });
    }

    const table = await Table.create({ number, capacity });
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

    const table = await Table.findOne({ number: req.params.number });
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

    // Find all orders for this table that are NOT already in any paid bill
    // To do this, find orders for this table that aren't attached to a paid bill
    // Simply, find all orders for the table. When a bill is paid, we can mark table as empty.
    // For safety, let's find all active orders (status: pending, cooking, ready, served) that aren't part of a paid bill.
    // Actually, we can find orders for this table. Let's find orders created in the last 12 hours that don't belong to a paid bill.
    // Let's filter orders for tableNumber.
    // To simplify: find all orders for this table that are NOT paid.
    // Let's find bills that are pending for this table, or if none, find orders that have no bills yet.
    
    // First, let's check if there's already an active unpaid bill for this table
    let existingBill = await Bill.findOne({ tableNumber, paymentStatus: 'pending' }).populate({
      path: 'orders',
      populate: { path: 'items.foodItem' }
    });

    if (existingBill) {
      return res.status(200).json({ success: true, message: 'Active bill exists', data: existingBill });
    }

    // Otherwise, find all orders that are active (not empty/billed)
    // To identify unbilled orders, we find all orders for this table.
    // Let's look up orders that have status !== 'served' or even 'served' (all of them).
    // Let's find all orders for this table created recently (e.g. today) that are not linked to a paid bill.
    // We can query all orders for this table, and then find bills referencing them.
    const allTableOrders = await Order.find({ tableNumber }).populate('items.foodItem');
    if (allTableOrders.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders found for this table' });
    }

    // Find all bills for this table to see which orders are already billed
    const existingBills = await Bill.find({ tableNumber });
    const billedOrderIds = new Set();
    existingBills.forEach(b => {
      b.orders.forEach(oId => billedOrderIds.add(oId.toString()));
    });

    // Filter out orders that are already billed
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
    });

    // Update table status to occupied if checkout is in progress
    await Table.findOneAndUpdate({ number: tableNumber }, { status: 'occupied' });

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

    const bill = await Bill.findOne({ tableNumber, paymentStatus: 'pending' });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'No pending bill found for this table' });
    }

    bill.paymentStatus = 'paid';
    bill.paymentMethod = paymentMethod || 'cash';
    await bill.save();

    // Mark the table as empty
    await Table.findOneAndUpdate({ number: tableNumber }, { status: 'empty' });

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
    const table = await Table.findOne({ number: tableNumber });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const scanUrl = `${frontendUrl}/menu?table=${tableNumber}`;

    // Redirect to a high-speed public QR code generator API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;
    
    res.redirect(qrCodeUrl);
  } catch (error) {
    next(error);
  }
});

export default router;
