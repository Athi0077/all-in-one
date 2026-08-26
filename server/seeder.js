import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Category from './models/categoryModel.js';
import Order from './models/orderModel.js';
import categories from './data/categories.js';
import products from './data/products.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    // Create an admin user
    const createdUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    const adminUserId = createdUser._id;

    // Create categories
    const createdCategories = await Category.insertMany(categories);

    // Map category name to its ID
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Create products with mapped category IDs
    const sampleProducts = products.map((product) => {
      const categoryId = categoryMap[product.categoryName];
      const { categoryName, ...rest } = product; // remove categoryName from db insert
      return {
        ...rest,
        category: categoryId,
      };
    });

    await Product.insertMany(sampleProducts);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
