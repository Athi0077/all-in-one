import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';


export const searchProducts = async ({
  query = '',
  category = '',
  minPrice,
  maxPrice,
  gender = '',
  color = '',
  brand = '',
  rating,
  limit = 5
}) => {
  try {
    let searchQuery = query;
    if (gender) searchQuery += ` ${gender}`;
    if (color) searchQuery += ` ${color}`;

    const keywordFilter = searchQuery.trim()
      ? {
          $or: [
            { name: { $regex: searchQuery.trim(), $options: 'i' } },
            { description: { $regex: searchQuery.trim(), $options: 'i' } }
          ]
        }
      : {};

    const dbQuery = { ...keywordFilter, isActive: true };

    if (brand) {
       dbQuery.brand = { $regex: brand, $options: 'i' };
    }

    if (rating) {
       dbQuery.rating = { $gte: Number(rating) };
    }

    if (category) {
      const cat = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${category}$`, 'i') } },
          { slug: category.toLowerCase().replace(/ /g, '-') }
        ]
      });
      if (cat) {
        dbQuery.category = cat._id;
      }
    }

    if (minPrice || maxPrice) {
      dbQuery.price = {};
      if (minPrice) dbQuery.price.$gte = Number(minPrice);
      if (maxPrice) dbQuery.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(dbQuery)
      .populate('category', 'name slug')
      .sort({ rating: -1 })
      .limit(Math.min(limit, 10))
      .lean();

    return products;
  } catch (error) {
    console.error('Error in searchProducts tool:', error);
    return { error: 'Failed to search products.' };
  }
};

export const getProductDetails = async ({ productId }) => {
  try {
    const product = await Product.findById(productId).populate('category', 'name slug').lean();
    if (!product) return { error: 'Product not found.' };
    return product;
  } catch (error) {
    console.error('Error in getProductDetails tool:', error);
    return { error: 'Invalid product ID or not found.' };
  }
};

export const checkProductStock = async ({ productId }) => {
  try {
    const product = await Product.findById(productId).select('name stock').lean();
    if (!product) return { error: 'Product not found.' };
    return {
      productId: product._id,
      name: product.name,
      stock: product.stock,
      isAvailable: product.stock > 0
    };
  } catch (error) {
    console.error('Error in checkProductStock tool:', error);
    return { error: 'Invalid product ID or not found.' };
  }
};


