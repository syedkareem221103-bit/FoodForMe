import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';

dotenv.config();

const seedData = async () => {
  // Safety check: Prevent seeding in production unless explicit override is passed
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL WARNING: Attempted to run database seed in a production environment!');
    console.error('Seeding in production clears all active databases. To force seeding, set FORCE_SEED=true in environment variables.');
    process.exit(1);
  }

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodforme');
    console.log('Connected to database for seeding...');

    // Clear existing data
    await Restaurant.deleteMany();
    await User.deleteMany();
    await Table.deleteMany();
    await FoodItem.deleteMany();
    await Order.deleteMany();
    await Bill.deleteMany();
    console.log('Existing collections cleared.');

    // Seed Default Restaurant
    const defaultRestaurant = await Restaurant.create({
      restaurantName: 'FoodForMe Bistro',
      ownerName: 'Admin Owner',
      email: 'admin@foodforme.com',
      password: 'password123',
      phone: '+91 98765 43210',
      address: '128 Gourmet Street, Bangalore',
      restaurantType: 'Restaurant',
      subscriptionPlan: 'Pro Premium',
    });
    console.log('Default Demo Restaurant created.');

    // Seed Users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@foodforme.com',
        password: 'password123',
        role: 'admin',
        restaurantId: defaultRestaurant._id,
        permissions: ['all'],
      },
      {
        name: 'John Waiter',
        email: 'waiter@foodforme.com',
        password: 'password123',
        role: 'waiter',
        restaurantId: defaultRestaurant._id,
        permissions: [],
      },
      {
        name: 'Chef Mario',
        email: 'kitchen@foodforme.com',
        password: 'password123',
        role: 'kitchen',
        restaurantId: defaultRestaurant._id,
        permissions: [],
      },
    ]);
    console.log(`Seeded ${users.length} users successfully.`);

    // Seed Tables
    const tables = await Table.create([
      { number: 1, capacity: 2, status: 'empty', restaurantId: defaultRestaurant._id },
      { number: 2, capacity: 4, status: 'empty', restaurantId: defaultRestaurant._id },
      { number: 3, capacity: 4, status: 'empty', restaurantId: defaultRestaurant._id },
      { number: 4, capacity: 6, status: 'empty', restaurantId: defaultRestaurant._id },
      { number: 5, capacity: 2, status: 'empty', restaurantId: defaultRestaurant._id },
      { number: 6, capacity: 8, status: 'empty', restaurantId: defaultRestaurant._id },
    ]);
    console.log(`Seeded ${tables.length} tables successfully.`);

    // Seed Food Items
    const foodItemsRaw = [
      {
        name: 'Crispy Garlic Bread',
        description: 'Toasted baguette slices with fresh garlic butter, parsley, and melted mozzarella cheese.',
        price: 199,
        category: 'Starters',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Veg Spring Rolls',
        description: 'Golden fried rolls filled with julienned vegetables and served with sweet chili dipping sauce.',
        price: 249,
        category: 'Starters',
        isVeg: true,
        spicyLevel: 1,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Margherita Pizza',
        description: 'Classic sourdough pizza topped with aromatic tomato sauce, fresh mozzarella, and basil leaves.',
        price: 399,
        category: 'Main Course',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Paneer Butter Masala',
        description: 'Cottage cheese cubes cooked in a rich, creamy, and mildly sweet tomato-onion gravy.',
        price: 349,
        category: 'Main Course',
        isVeg: true,
        spicyLevel: 1,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Spicy Grilled Chicken',
        description: 'Tender chicken breast marinated in fiery spices and grilled to perfection, served with mint chutney.',
        price: 449,
        category: 'Main Course',
        isVeg: false,
        spicyLevel: 3,
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Sizzling Choco Brownie',
        description: 'Warm, gooey chocolate brownie served on a hot iron plate, topped with vanilla ice cream and chocolate sauce.',
        price: 299,
        category: 'Desserts',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'New York Cheesecake',
        description: 'Rich and creamy classic cheesecake baked on a graham cracker crust, topped with strawberry compote.',
        price: 329,
        category: 'Desserts',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Mint Mojito',
        description: 'Refreshing blend of fresh mint leaves, lime slices, white sugar, and club soda over crushed ice.',
        price: 149,
        category: 'Beverages',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Cold Coffee with Ice Cream',
        description: 'Creamy blended coffee topped with a generous scoop of chocolate ice cream.',
        price: 179,
        category: 'Beverages',
        isVeg: true,
        spicyLevel: 0,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400',
      },
    ].map(item => ({ ...item, restaurantId: defaultRestaurant._id }));

    const foodItems = await FoodItem.create(foodItemsRaw);
    console.log(`Seeded ${foodItems.length} food items successfully.`);

    console.log('Seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
