import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, 'Please add a table number'],
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    status: {
      type: String,
      enum: ['empty', 'occupied', 'reserved'],
      default: 'empty',
    },
    capacity: {
      type: Number,
      default: 4,
    },
    activeOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.index({ restaurantId: 1, number: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;
