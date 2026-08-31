import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/orderModel.js';
import Counter from './models/counterModel.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const orders = await Order.find({ orderId: { $exists: false } }).sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders to migrate.`);

    for (let order of orders) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      let currentOrderId = counter.seq;
      if (currentOrderId < 100) {
        currentOrderId = 100;
        counter.seq = 100;
        await counter.save();
      }

      order.orderId = currentOrderId;
      await order.save();
      console.log(`Order ${order._id} migrated with orderId: ${currentOrderId}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
