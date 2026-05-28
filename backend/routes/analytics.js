import express from 'express';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Table from '../models/Table.js';
import FoodItem from '../models/FoodItem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware - Admin only has access to analytics reports
router.use(protect);
router.use(authorize('admin'));

// @desc    Get key analytics statistics
// @route   GET /api/analytics/stats
// @access  Private (Admin only)
router.get('/stats', async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const restaurantId = req.user.restaurantId;

    // 1. Total Daily Sales (unpaid + paid today)
    const dailySalesPaid = await Bill.aggregate([
      {
        $match: {
          restaurantId,
          paymentStatus: 'paid',
          updatedAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const paidSales = dailySalesPaid[0]?.total || 0;

    // Unpaid active bills today
    const dailySalesUnpaid = await Bill.aggregate([
      {
        $match: {
          restaurantId,
          paymentStatus: 'pending',
          createdAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const unpaidSales = dailySalesUnpaid[0]?.total || 0;

    const totalDailySales = paidSales + unpaidSales;

    // 2. Total Orders today
    const totalOrdersToday = await Order.countDocuments({
      restaurantId,
      createdAt: { $gte: startOfToday }
    });

    // 3. Active Tables count
    const activeTables = await Table.countDocuments({
      restaurantId,
      status: { $ne: 'empty' }
    });

    // 4. Pending Kitchen Orders count
    const pendingKitchenOrders = await Order.countDocuments({
      restaurantId,
      status: { $in: ['pending', 'cooking'] }
    });

    // 5. Delivered/Served Orders count today
    const deliveredOrdersToday = await Order.countDocuments({
      restaurantId,
      status: 'served',
      updatedAt: { $gte: startOfToday }
    });

    res.status(200).json({
      success: true,
      data: {
        totalDailySales,
        paidSales,
        unpaidSales,
        totalOrdersToday,
        activeTables,
        pendingKitchenOrders,
        deliveredOrdersToday
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get chart aggregation data (7-day revenue & 24hr order volume)
// @route   GET /api/analytics/charts
// @access  Private (Admin only)
router.get('/charts', async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const restaurantId = req.user.restaurantId;

    // 1. Revenue Trends (Past 7 Days)
    const revenueLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      // Sum total billing checkout amounts finalized/billed on that day
      const daySales = await Bill.aggregate([
        {
          $match: {
            restaurantId,
            paymentStatus: 'paid',
            updatedAt: { $gte: day, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      revenueLast7Days.push({
        date: day.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        sales: daySales[0]?.total || 0
      });
    }

    // 2. Order volume trend per hour (Today)
    const ordersToday = await Order.find({
      restaurantId,
      createdAt: { $gte: startOfToday }
    });

    const hourlyBuckets = Array(24).fill(0);
    ordersToday.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyBuckets[hour]++;
    });

    const hourlyTrends = [];
    for (let h = 0; h < 24; h++) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHour = `${h % 12 === 0 ? 12 : h % 12} ${ampm}`;
      hourlyTrends.push({
        hour: formattedHour,
        ordersCount: hourlyBuckets[h]
      });
    }

    res.status(200).json({
      success: true,
      data: {
        revenueLast7Days,
        hourlyTrends
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get top 5 selling food items
// @route   GET /api/analytics/top-items
// @access  Private (Admin only)
router.get('/top-items', async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurantId;

    const mostOrdered = await Order.aggregate([
      { $match: { restaurantId } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodItem',
          count: { $sum: '$items.quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const populatedItems = await Promise.all(
      mostOrdered.map(async (item) => {
        if (!item._id) return null;
        const food = await FoodItem.findOne({ _id: item._id, restaurantId });
        return {
          foodItem: food || { name: 'Unknown Dish', price: 0 },
          count: item.count
        };
      })
    );

    res.status(200).json({
      success: true,
      data: populatedItems.filter(i => i !== null)
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get full billing history and logs
// @route   GET /api/analytics/history
// @access  Private (Admin only)
router.get('/history', async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurantId;

    // Return all completed bills, newest first
    const bills = await Bill.find({ restaurantId })
      .populate({
        path: 'orders',
        populate: { path: 'items.foodItem' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    next(error);
  }
});

export default router;
