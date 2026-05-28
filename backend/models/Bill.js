import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, 'Please add a table number'],
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
      },
    ],
    subTotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'pending'],
      default: 'pending',
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

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
