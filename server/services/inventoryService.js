import Product from '../models/productModel.js';

/**
 * Validates stock and calculates the subtotal for given order items.
 * Should be called inside a MongoDB session transaction to ensure consistency.
 */
export const validateAndCalculateStock = async (orderItems, session) => {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product).session(session);
 
    if (!product) {
      throw new Error(`Product not found: ${item.name}`);
    } 

    if (!product.isActive) {
      throw new Error(`Product is no longer active: ${item.name}`);
    }

    if (product.stock < item.qty) {
      throw new Error(`Insufficient stock for product: ${item.name}. Available: ${product.stock}`);
    }

    const priceToUse = product.discountPrice > 0 ? product.discountPrice : product.price;
    subtotal += priceToUse * item.qty;

    validatedItems.push({
      ...item,
      price: priceToUse,
    });
  }

  return { subtotal, validatedItems };
};

/**
 * Decrements stock for the given order items.
 * Should be called inside a MongoDB session transaction.
 */
export const decrementStock = async (orderItems, session) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.qty } },
      { session, new: true }
    );
  }
};

/**
 * Restores stock for the given order items (used on order cancellation).
 * Should be called inside a MongoDB session transaction.
 */
export const restoreStock = async (orderItems, session) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.qty } },
      { session, new: true }
    );
  }
};
