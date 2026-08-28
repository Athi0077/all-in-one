import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Coupon from '../models/couponModel.js';
import Review from '../models/reviewModel.js';
import Setting from '../models/settingModel.js';

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);

    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    
    // Low stock products
    const settings = await Setting.findOne() || { lowStockThreshold: 5 };
    const lowStockCount = await Product.countDocuments({ stock: { $lte: settings.lowStockThreshold } });

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Sales over time (simple implementation for charts)
    const salesData = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 } // last 30 days
    ]);

    // Top Products
    const topProducts = await Product.find().sort({ numReviews: -1 }).limit(5); // Approximation using reviews for now

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      lowStockCount,
      recentOrders,
      salesData,
      topProducts
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAdminProducts = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: 'i' } }
      : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    let { name, slug, description, price, discountPrice, shippingCharge, category, brand, stock, sku, images, isFeatured, isActive } = req.body;

    if (!slug && name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (Number(price) < 0 || Number(discountPrice) < 0 || Number(stock) < 0) {
      res.status(400);
      throw new Error('Price and stock cannot be negative');
    }
    
    if (Number(discountPrice) > Number(price)) {
      res.status(400);
      throw new Error('Discount price cannot exceed original price');
    }

    let categoryId = category;
    if (category && !/^[0-9a-fA-F]{24}$/.test(category)) {
      let existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
      if (!existingCategory) {
        const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        existingCategory = await Category.create({ name: category, slug: catSlug, description: category });
      }
      categoryId = existingCategory._id;
    }

    const product = new Product({
      name, slug, description, price, discountPrice, shippingCharge: shippingCharge || 0, category: categoryId, brand, stock, sku, images, isFeatured, isActive
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    let { name, slug, description, price, discountPrice, shippingCharge, category, brand, stock, sku, images, isFeatured, isActive } = req.body;

    if (!slug && name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (Number(price) < 0 || Number(discountPrice) < 0 || Number(stock) < 0) {
      res.status(400);
      throw new Error('Price and stock cannot be negative');
    }

    if (Number(discountPrice) > Number(price)) {
      res.status(400);
      throw new Error('Discount price cannot exceed original price');
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      let categoryId = category;
      if (category && !/^[0-9a-fA-F]{24}$/.test(category)) {
        let existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        if (!existingCategory) {
          const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          existingCategory = await Category.create({ name: category, slug: catSlug, description: category });
        }
        categoryId = existingCategory._id;
      }

      product.name = name;
      product.slug = slug;
      product.description = description;
      product.price = price;
      product.discountPrice = discountPrice;
      product.shippingCharge = shippingCharge || 0;
      product.category = categoryId;
      product.brand = brand;
      product.stock = stock;
      product.sku = sku;
      if (images && images.length > 0) {
        product.images = images;
      }
      product.isFeatured = isFeatured;
      product.isActive = isActive;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const category = new Category(req.body);
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      category.name = req.body.name || category.name;
      category.slug = req.body.slug || category.slug;
      category.description = req.body.description || category.description;
      category.image = req.body.image || category.image;
      category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive;

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404);
      throw new Error('Category not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      res.status(400);
      throw new Error(`Cannot delete category. ${productsCount} products are associated with it.`);
    }

    const category = await Category.findById(req.params.id);
    if (category) {
      await Category.deleteOne({ _id: category._id });
      res.json({ message: 'Category removed' });
    } else {
      res.status(404);
      throw new Error('Category not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ORDER MANAGEMENT
// ==========================================

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAdminOrders = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    
    let query = {};
    if (req.query.status && req.query.status !== 'All') {
      query.orderStatus = req.query.status;
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ orders, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(req.body.status)) {
        res.status(400);
        throw new Error('Invalid status');
      }

      order.orderStatus = req.body.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAdminUsers = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
      ? {
          $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { email: { $regex: req.query.keyword, $options: 'i' } }
          ]
        }
      : {};

    const count = await User.countDocuments({ ...keyword });
    const users = await User.find({ ...keyword })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getAdminUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      const orders = await Order.find({ user: user._id });
      res.json({ user, orders });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COUPON MANAGEMENT
// ==========================================

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = new Coupon(req.body);
    const created = await coupon.save();
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (coupon) {
      res.json(coupon);
    } else {
      res.status(404);
      throw new Error('Coupon not found');
    }
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (coupon) {
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404);
      throw new Error('Coupon not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REVIEW MANAGEMENT
// ==========================================

export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().populate('user', 'name').populate('product', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatus = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (review) {
      review.status = req.body.status;
      await review.save();
      res.json(review);
    } else {
      res.status(404);
      throw new Error('Review not found');
    }
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) {
      res.json({ message: 'Review removed' });
    } else {
      res.status(404);
      throw new Error('Review not found');
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SETTINGS MANAGEMENT
// ==========================================

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (settings) {
      settings.storeName = req.body.storeName || settings.storeName;
      settings.storeDescription = req.body.storeDescription || settings.storeDescription;
      settings.contactEmail = req.body.contactEmail || settings.contactEmail;
      settings.phone = req.body.phone || settings.phone;
      settings.address = req.body.address || settings.address;
      settings.defaultShippingCharge = req.body.defaultShippingCharge !== undefined ? req.body.defaultShippingCharge : settings.defaultShippingCharge;
      settings.freeShippingThreshold = req.body.freeShippingThreshold !== undefined ? req.body.freeShippingThreshold : settings.freeShippingThreshold;
      settings.lowStockThreshold = req.body.lowStockThreshold !== undefined ? req.body.lowStockThreshold : settings.lowStockThreshold;
      
      const updated = await settings.save();
      res.json(updated);
    } else {
      res.status(404);
      throw new Error('Settings not found');
    }
  } catch (error) {
    next(error);
  }
};
