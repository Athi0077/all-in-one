import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Hidden'],
      default: 'Approved',
    },
  },
  {
    timestamps: true,
  }
);
// Static method to get avg rating and save
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId, status: 'Approved' },
    },
    {
      $group: {
        _id: '$product',
        rating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    const Product = mongoose.model('Product');
    if (obj.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(obj[0].rating * 10) / 10,
        numReviews: obj[0].numReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

// Call calculateAverageRating after remove
reviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
