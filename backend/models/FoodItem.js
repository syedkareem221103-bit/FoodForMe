import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a food item name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Sides'],
    },
    image: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    spicyLevel: {
      type: Number,
      default: 0, // 0 = Not spicy, 1 = Mild, 2 = Medium, 3 = Hot
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

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
export default FoodItem;
