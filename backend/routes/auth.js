import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import FoodItem from '../models/FoodItem.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_foodforme_key_12345', {
    expiresIn: '30d',
  });
};

const registerRestaurantHandler = async (req, res, next) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      password,
      confirmPassword,
      phone,
      address,
      restaurantType,
    } = req.body;

    // Basic Validation
    if (!restaurantName || !ownerName || !email || !password || !phone || !address || !restaurantType) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Duplicate Email Prevention (Across both User and Restaurant models)
    const userExists = await User.findOne({ email });
    const restaurantExists = await Restaurant.findOne({ email });

    if (userExists || restaurantExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 1. Create Restaurant Workspace
    const restaurant = await Restaurant.create({
      restaurantName,
      ownerName,
      email,
      password, // Hashed automatically by pre-save pre hook
      phone,
      address,
      restaurantType,
      subscriptionPlan: 'Free Trial',
    });

    // 2. Create corresponding owner User account
    const user = await User.create({
      name: ownerName,
      email,
      password, // Hashed automatically by pre-save pre hook
      role: 'admin',
      restaurantId: restaurant._id,
      permissions: ['all'],
    });

    // 3. Auto-seed Onboarding Tables (1 to 4)
    await Table.create([
      { number: 1, capacity: 2, status: 'empty', restaurantId: restaurant._id },
      { number: 2, capacity: 4, status: 'empty', restaurantId: restaurant._id },
      { number: 3, capacity: 4, status: 'empty', restaurantId: restaurant._id },
      { number: 4, capacity: 6, status: 'empty', restaurantId: restaurant._id },
    ]);

    // 4. Auto-seed Onboarding Menu Items
    await FoodItem.create([
      {
        name: 'Margherita Pizza',
        description: 'Classic sourdough pizza topped with aromatic tomato sauce, fresh mozzarella, and basil.',
        price: 399,
        category: 'Main Course',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=400',
        restaurantId: restaurant._id,
      },
      {
        name: 'Garlic Bread',
        description: 'Toasted baguette slices with fresh garlic butter, parsley, and melted mozzarella cheese.',
        price: 199,
        category: 'Starters',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=400',
        restaurantId: restaurant._id,
      },
      {
        name: 'Chocolate Brownie',
        description: 'Warm, gooey chocolate brownie served with hot chocolate fudge sauce.',
        price: 249,
        category: 'Desserts',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400',
        restaurantId: restaurant._id,
      },
      {
        name: 'Mint Mojito',
        description: 'Refreshing blend of fresh mint, lime slices, white sugar, and club soda.',
        price: 149,
        category: 'Beverages',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
        restaurantId: restaurant._id,
      },
    ]);

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a restaurant and its owner (SaaS Onboarding)
// @route   POST /api/auth/register-restaurant
// @route   POST /api/auth/signup
// @access  Public
router.post('/register-restaurant', registerRestaurantHandler);
router.post('/signup', registerRestaurantHandler);

// @desc    Register a basic user (staff member)
// @route   POST /api/auth/register
// @access  Private (Only Admin owners can onboard staff via dashboard!)
router.post('/register', protect, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can register staff accounts' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create staff user tagged with the current admin's restaurantId
    const user = await User.create({
      name,
      email,
      password,
      role,
      restaurantId: req.user.restaurantId,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user (must explicitly select password since schema has select: false)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const populatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate('restaurantId');

    res.status(200).json({
      success: true,
      user: populatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all staff members for the restaurant
// @route   GET /api/auth/staff
// @access  Private (Admin only)
router.get('/staff', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(453).json({ success: false, message: 'Only admins can view staff lists' });
    }
    
    const staff = await User.find({ restaurantId: req.user.restaurantId, role: { $ne: 'admin' } }).select('-password');
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a staff member
// @route   DELETE /api/auth/staff/:id
// @access  Private (Admin only)
router.delete('/staff/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(453).json({ success: false, message: 'Only admins can delete staff accounts' });
    }
    
    const staffMember = await User.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    await staffMember.deleteOne();
    res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
