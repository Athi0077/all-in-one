import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import AuditLog from '../models/auditLogModel.js';
import Category from '../models/categoryModel.js';

// READ TOOLS

export const getInventory = async () => {
  try {
    const products = await Product.find({}).select('name stock price').lean();
    return {
      totalProducts: products.length,
      totalStock: products.reduce((acc, curr) => acc + curr.stock, 0),
      items: products.slice(0, 50).map((p, index) => ({ position: index + 1, ...p })) // limit for AI context
    };
  } catch (error) {
    console.error('Error in getInventory:', error);
    return { error: 'Failed to fetch inventory.' };
  }
};

export const getLowStockProducts = async ({ threshold = 5 }) => {
  try {
    const products = await Product.find({ stock: { $lte: threshold } }).select('name stock price').lean();
    return products.map((p, index) => ({ position: index + 1, ...p }));
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    return { error: 'Failed to fetch low stock products.' };
  }
};

export const searchAdminProducts = async ({ query = '', category = '' }) => {
  try {
    let dbQuery = {};
    if (query) {
      dbQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    if (category) {
      const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
      if (cat) {
        dbQuery.category = cat._id;
      }
    }

    const products = await Product.find(dbQuery).select('name stock price rating isActive discountPrice').limit(10).lean();
    return products.map((p, index) => ({ position: index + 1, ...p }));
  } catch (error) {
    console.error('Error in searchAdminProducts:', error);
    return { error: 'Failed to search products.' };
  }
};

export const getAdminOrders = async ({ status = '', limit = 10 }) => {
  try {
    let query = {};
    if (status) {
      query.orderStatus = status;
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit).populate('user', 'name').lean();
    return orders.map((order, index) => ({
      position: index + 1,
      _id: order._id,
      orderId: order.orderId,
      user: order.user ? order.user.name : 'Unknown',
      total: order.total,
      status: order.orderStatus,
      date: order.createdAt
    }));
  } catch (error) {
    console.error('Error in getAdminOrders:', error);
    return { error: 'Failed to fetch orders.' };
  }
};

export const getAdminOrderById = async ({ orderId }) => {
  try {
    const order = await Order.findById(orderId).populate('user', 'name email').lean();
    if (!order) return { error: 'Order not found.' };
    return {
      _id: order._id,
      orderId: order.orderId,
      user: order.user,
      total: order.total,
      status: order.orderStatus,
      items: order.items.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
      date: order.createdAt
    };
  } catch (error) {
    console.error('Error in getAdminOrderById:', error);
    return { error: 'Failed to fetch order.' };
  }
};

export const getSalesSummary = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({ createdAt: { $gte: today } });
    const todayRevenue = todayOrders.reduce((acc, order) => acc + order.total, 0);

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
    };
  } catch (error) {
    console.error('Error in getSalesSummary:', error);
    return { error: 'Failed to fetch sales summary.' };
  }
};

// WRITE TOOLS
// Note: These tools are called ONLY after confirmation. 
// For confirmation flow, the AI should use another tool or response structure to ask for confirmation first.
// If the AI calls these directly without confirmation, the OpenRouterService should intercept and ask for confirmation.
// The actual execution happens only when confirmed by user.

export const updateProductField = async ({ productId, field, value, adminId }) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return { error: 'Product not found.' };

    const oldValue = product[field];
    
    // Validate
    if (field === 'price' || field === 'stock') {
      value = Number(value);
      if (isNaN(value) || value < 0) return { error: `Invalid value for ${field}.` };
    }
    
    if (field === 'isActive') {
      value = Boolean(value);
    }

    product[field] = value;
    await product.save();

    await AuditLog.create({
      admin: adminId,
      action: `UPDATE_PRODUCT_${field.toUpperCase()}`,
      entity: 'Product',
      entityId: product._id,
      details: `Changed ${field} from ${oldValue} to ${value}`
    });

    return { success: true, message: `Product ${field} updated successfully to ${value}.` };
  } catch (error) {
    console.error('Error in updateProductField:', error);
    return { error: 'Failed to update product.' };
  }
};

export const updateOrderStatusTool = async ({ orderId, status, adminId }) => {
  try {
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) return { error: 'Invalid order status.' };

    let dbQuery = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      dbQuery = { $or: [{ _id: orderId }, { orderId: Number(orderId) || -1 }] };
    } else {
      dbQuery = { orderId: Number(orderId) };
    }

    const order = await Order.findOne(dbQuery);
    if (!order) return { error: 'Order not found.' };

    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    await order.save();

    await AuditLog.create({
      admin: adminId,
      action: `UPDATE_ORDER_STATUS`,
      entity: 'Order',
      entityId: order._id,
      details: `Changed status from ${oldStatus} to ${status}`
    });

    return { success: true, message: `Order status updated to ${status}.` };
  } catch (error) {
    console.error('Error in updateOrderStatusTool:', error);
    return { error: 'Failed to update order status.' };
  }
};
