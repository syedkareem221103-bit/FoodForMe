import express from 'express';
import FoodItem from '../models/FoodItem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all food items
// @route   GET /api/menu
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.isAvailable) {
      filter.isAvailable = req.query.isAvailable === 'true';
    }

    const items = await FoodItem.find(filter);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a food item
// @route   POST /api/menu
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const item = await FoodItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a food item
// @route   PUT /api/menu/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    let item = await FoodItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a food item
// @route   DELETE /api/menu/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const item = await FoodItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    await item.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
