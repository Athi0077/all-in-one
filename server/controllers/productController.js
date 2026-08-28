import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Review from '../models/reviewModel.js';
import Order from '../models/orderModel.js';

// @desc    Fetch all products with pagination, search, filter
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    // Filters
    let query = { ...keyword, isActive: true };

    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        query.category = category._id;
      }
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.rating) {
      query.rating = { $gte: Number(req.query.rating) };
    }

    if (req.query.color) {
      query.color = req.query.color;
    }

    // Sort
    let sortObj = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sortObj = { price: 1 };
          break;
        case 'price_desc':
          sortObj = { price: -1 };
          break;
        case 'top_rated':
          sortObj = { rating: -1 };
          break;
        case 'newest':
        default:
          sortObj = { createdAt: -1 };
          break;
      }
    }

    const count = await Product.countDocuments({ ...query });
    const products = await Product.find({ ...query })
      .populate('category', 'name slug')
      .sort(sortObj)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch featured/trending products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(8);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch products by category slug
// @route   GET /api/products/category/:slug
// @access  Public
export const getProductsByCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    const products = await Product.find({ category: category._id, isActive: true }).populate('category', 'name slug');
    res.json({ category, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    // Check if user has actually purchased the product (Disabled for testing)
    // const orders = await Order.find({ user: req.user._id, 'items.product': productId });
    
    // if (!orders || orders.length === 0) {
    //   res.status(400);
    //   throw new Error('You can only review products you have purchased');
    // }

    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
      status: 'Approved' // auto-approve for now, admin can hide it later
    });

    res.status(201).json({ success: true, message: 'Review added', data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id, status: 'Approved' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI summary for a product
// @route   GET /api/products/:id/ai-summary
// @access  Public
export const getProductAiSummary = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      res.status(500);
      throw new Error('AI service is not configured');
    }

    const prompt = `Write a very brief, compelling, and engaging 2 to 3 line summary about the following product. Only return the summary text without any quotes or extra formatting.
Product Name: ${product.name}
Brand: ${product.brand || 'Generic'}
Description: ${product.description}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      throw new Error(`Failed to communicate with AI provider: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected OpenRouter response:', data);
      throw new Error('AI provider returned an unexpected response format');
    }
    
    const summary = data.choices[0].message.content;

    res.json({ summary });
  } catch (error) {
    console.error('getProductAiSummary error:', error);
    next(error);
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(4);

    res.json(relatedProducts);
  } catch (error) {
    next(error);
  }
};
