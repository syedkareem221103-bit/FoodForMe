import express from 'express';
import jwt from 'jsonwebtoken';
import FoodItem from '../models/FoodItem.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper to resolve restaurant ID for menu fetching
const resolveRestaurantId = async (req) => {
  let restaurantId = req.query.restaurantId;

  if (!restaurantId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_foodforme_key_12345');
      const user = await User.findById(decoded.id);
      if (user) {
        restaurantId = user.restaurantId;
      }
    } catch (err) {
      // ignore
    }
  }
  return restaurantId;
};

// @desc    Get all food items
// @route   GET /api/menu
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req);

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Restaurant scope identifier is required' });
    }

    const filter = { restaurantId };
    
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
    const itemData = {
      ...req.body,
      restaurantId: req.user.restaurantId,
    };

    const item = await FoodItem.create(itemData);
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
    let item = await FoodItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found in your restaurant' });
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
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const item = await FoodItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found in your restaurant' });
    }

    await item.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

// For backwards compatibility with standard DELETE methods
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const item = await FoodItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found in your restaurant' });
    }

    await item.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
