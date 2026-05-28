import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, 'Please add a table number'],
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'cooking', 'ready', 'served'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    estimatedPrepTime: {
      type: Number,
      default: 0, // in minutes
    },
    prepStartedAt: {
      type: Date,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
