import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, 'Please add a restaurant name'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Please add an owner name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    address: {
      type: String,
      required: [true, 'Please add a restaurant address'],
    },
    restaurantType: {
      type: String,
      required: [true, 'Please select a restaurant type'],
      enum: ['Cafe', 'Restaurant', 'Hotel', 'Fast Food', 'Bakery', 'Other'],
      default: 'Restaurant',
    },
    logo: {
      type: String,
      default: '',
    },
    subscriptionPlan: {
      type: String,
      enum: ['Free Trial', 'Pro Premium', 'Enterprise'],
      default: 'Free Trial',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
restaurantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
restaurantSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
