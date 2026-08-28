import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { createOrder, validateCoupon, verifyPayment } from '../services/orderService';
import { getProfile, updateProfile } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { CheckCircle2, Tag } from 'lucide-react';
import { getImageUrl } from '../utils/getImageUrl';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart, cartShipping } = useContext(CartContext);
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
    state: '',
    landmark: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Online Payment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');
  
  // Coupon states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile.data && profile.data.addresses) {
           setSavedAddresses(profile.data.addresses);
           if (profile.data.addresses.length > 0) {
             const defaultIdx = profile.data.addresses.findIndex(a => a.isDefault);
             handleSelectAddress(defaultIdx !== -1 ? defaultIdx : 0, profile.data.addresses);
           }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSelectAddress = (index, addressesToUse = savedAddresses) => {
    setSelectedAddressIndex(index);
    if (index >= 0 && addressesToUse[index]) {
      const addr = addressesToUse[index];
      setShippingAddress({
        address: addr.street,
        city: addr.city,
        postalCode: addr.zipCode,
        country: addr.country,
        state: addr.state,
        landmark: addr.landmark || '',
      });
    } else {
      setShippingAddress({ address: '', city: '', postalCode: '', country: '', state: '', landmark: '' });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return;
    setIsValidatingCoupon(true);
    try {
      const res = await validateCoupon(couponCodeInput, cartTotal);
      setCouponApplied(res.data);
      toast.success(res.message || 'Coupon applied!');
    } catch (error) {
      setCouponApplied(null);
      toast.error(error.response?.data?.message || 'Invalid coupon');
    }
    setIsValidatingCoupon(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?redirect=/checkout');
    }
    if (cartItems.length === 0 && !orderComplete) {
      navigate('/cart');
    }
  }, [user, navigate, cartItems, orderComplete, authLoading]);

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const placeOrderHandler = async (e) => {
    e.preventDefault();
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        orderItems: cartItems,
        shippingAddress: {
          street: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state || 'N/A',
          zipCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          landmark: shippingAddress.landmark,
        },
        paymentMethod,
        couponCode: couponApplied ? couponApplied.code : null,
      };

      const orderRes = await createOrder(orderData);
      
      // Auto-save new address to profile if it was manually entered
      if (selectedAddressIndex === -1 && user) {
        try {
          const newAddress = {
            street: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state || 'N/A',
            zipCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            landmark: shippingAddress.landmark,
            isDefault: savedAddresses.length === 0
          };
          await updateProfile({ addresses: [...savedAddresses, newAddress] });
        } catch (err) {
          console.error('Failed to auto-save address', err);
        }
      }
      
      if (paymentMethod === 'Online Payment' && orderRes.data.paymentResult) {
        const loadRazorpayScript = () => {
          return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
           toast.error('Razorpay SDK failed to load. Are you online?');
           setIsSubmitting(false);
           return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TV7hXMB718NUCg',
          amount: Math.round((cartTotal - (couponApplied?.discountAmount || 0)) * 100),
          currency: 'INR',
          name: 'All in One Store',
          description: 'Order Payment',
          order_id: orderRes.data.paymentResult.id,
          handler: async function (response) {
            try {
              setIsSubmitting(true);
              const verifyRes = await verifyPayment(orderRes.data._id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes.success) {
                setNewOrderId(orderRes.data._id);
                setOrderComplete(true);
                clearCart();
                toast.success('Payment successful! Order placed.');
              }
            } catch (err) {
              toast.error('Payment verification failed.');
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || ''
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function () {
           toast.error('Payment failed. Please try again.');
        });
        paymentObject.open();
        
      } else if (paymentMethod === 'Cash on Delivery') {
        const finalTotal = (cartTotal + cartShipping - (couponApplied?.discountAmount || 0)).toFixed(2);
        let message = `Hello! I would like to place a Cash on Delivery order.\n\n*Order Details:*\n`;
        const getOrdinalSuffix = (i) => {
          const j = i % 10, k = i % 100;
          if (j === 1 && k !== 11) return i + "st";
          if (j === 2 && k !== 12) return i + "nd";
          if (j === 3 && k !== 13) return i + "rd";
          return i + "th";
        };

        cartItems.forEach(item => {
           const sizeStr = item.size ? ` (Size: ${item.size})` : '';
           const imageStr = typeof item.imageIndex === 'number' ? ` [${getOrdinalSuffix(item.imageIndex + 1)} Image]` : '';
           message += `- ${item.name}${sizeStr}${imageStr} x ${item.qty} ($${((item.discountPrice || item.price) * item.qty).toFixed(2)})\n`;
        });
        message += `\n*Total:* $${finalTotal}\n\n*Shipping Address:*\n${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country}`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/916379981170?text=${encodedMessage}`, '_blank');
        
        setNewOrderId(orderRes.data._id);
        setOrderComplete(true);
        clearCart();
        toast.success('Order placed successfully! Redirected to WhatsApp.');
        setIsSubmitting(false);
      } else {
        // Fallback for any other methods
        setNewOrderId(orderRes.data._id);
        setOrderComplete(true);
        clearCart();
        toast.success('Order placed successfully!');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Place order error:", error);
      toast.error(error.response?.data?.message || 'Error placing order');
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Order Confirmed!</h1>
        <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
          Thank you for your purchase. Your order <span className="font-bold text-gray-900">#{newOrderId.substring(0, 8)}</span> has been received and is being processed.
        </p>
        <div className="flex justify-center gap-4">
          <Link to={`/orders/${newOrderId}`}>
            <Button variant="outline" className="rounded-xl px-8">View Order Details</Button>
          </Link>
          <Link to="/products">
            <Button className="rounded-xl px-8">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-2/3 space-y-8">
          {/* Shipping Address */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
            
            {savedAddresses.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-sm font-semibold text-gray-600">Saved Addresses</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddresses.map((addr, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleSelectAddress(idx)}
                      className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedAddressIndex === idx ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="font-bold text-gray-900">{addr.fullName} <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">{addr.addressType}</span></p>
                      <p className="text-sm text-gray-600 mt-1">{addr.street}, {addr.city}</p>
                      <p className="text-sm text-gray-600">{addr.state} {addr.zipCode}</p>
                    </div>
                  ))}
                  <div 
                      onClick={() => handleSelectAddress(-1)}
                      className={`p-4 border border-dashed flex items-center justify-center rounded-xl cursor-pointer transition-colors ${selectedAddressIndex === -1 ? 'border-primary bg-primary/5 text-primary' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}
                    >
                      <span className="font-medium">+ Use a different address</span>
                  </div>
                </div>
              </div>
            )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="col-span-2">
                  <Input
                    label="Address"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleAddressChange}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <Input
                  label="City"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleAddressChange}
                  placeholder="Chennai"
                  required
                />
                <Input
                  label="Postal Code"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleAddressChange}
                  placeholder="60001"
                  required
                />
                <Input
                  label="Landmark (Optional)"
                  name="landmark"
                  value={shippingAddress.landmark}
                  onChange={handleAddressChange}
                  placeholder="Near Apollo Hospital"
                />
                <Input
                  label="Country"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleAddressChange}
                  placeholder="Tamil Nadu"
                  required
                />
              </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white p-8 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
            <div className="space-y-4">
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Online Payment' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Online Payment" 
                  checked={paymentMethod === 'Online Payment'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="ml-3 font-medium">Online Payment (Card/UPI)</span>
              </label>
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Cash on Delivery' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Cash on Delivery" 
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="ml-3 font-medium">Cash on Delivery</span>
              </label>
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Items Preview */}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <img src={getImageUrl(item.image)} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-sm font-medium text-gray-900">{item.qty} x ${(item.discountPrice || item.price).toFixed(2)}</p>
                      {item.discountPrice && (
                        <p className="text-xs text-gray-500 line-through">${item.price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <div className="flex gap-2">
                 <Input 
                   placeholder="Coupon Code" 
                   value={couponCodeInput}
                   onChange={e => setCouponCodeInput(e.target.value)}
                   className="flex-1"
                   disabled={couponApplied}
                 />
                 {!couponApplied ? (
                   <Button onClick={handleApplyCoupon} isLoading={isValidatingCoupon} variant="outline" className="px-6">Apply</Button>
                 ) : (
                   <Button onClick={() => { setCouponApplied(null); setCouponCodeInput(''); }} variant="outline" className="px-6 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">Remove</Button>
                 )}
              </div>
            </div>

            <div className="space-y-4 mb-6 text-gray-600">
              <div className="flex justify-between">
                <span>Items Total</span>
                <span className="font-medium text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag size={16}/> Coupon ({couponApplied.code})</span>
                  <span className="font-medium">-${couponApplied.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">{cartShipping === 0 ? <span className="text-green-600">Free</span> : `$${cartShipping.toFixed(2)}`}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">${(cartTotal + cartShipping - (couponApplied?.discountAmount || 0)).toFixed(2)}</span>
            </div>
            
            <Button 
              className="w-full rounded-xl h-14 text-lg font-bold"
              onClick={placeOrderHandler}
              isLoading={isSubmitting}
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
