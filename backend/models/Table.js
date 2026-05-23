import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, 'Please add a table number'],
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

const Table = mongoose.model('Table', tableSchema);
export default Table;
