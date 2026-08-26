import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { createOrder, validateCoupon } from '../services/orderService';
import { getProfile } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { CheckCircle2, Tag } from 'lucide-react';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
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
      });
    } else {
      setShippingAddress({ address: '', city: '', postalCode: '', country: '' });
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
    if (!user) {
      navigate('/login?redirect=/checkout');
    }
    if (cartItems.length === 0 && !orderComplete) {
      navigate('/cart');
    }
  }, [user, navigate, cartItems, orderComplete]);

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
        shippingAddress,
        paymentMethod,
        couponCode: couponApplied ? couponApplied.code : null,
      };

      const orderRes = await createOrder(orderData);
      setNewOrderId(orderRes.data._id);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error('Error placing order');
    }
    setIsSubmitting(false);
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

            {selectedAddressIndex === -1 && (
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
                  placeholder="New York"
                  required
                />
                <Input
                  label="Postal Code"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleAddressChange}
                  placeholder="10001"
                  required
                />
                <div className="col-span-2">
                  <Input
                    label="Country"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    placeholder="United States"
                    required
                  />
                </div>
              </div>
            )}
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
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.qty} x ${item.price.toFixed(2)}</p>
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
                <span className="font-medium text-green-600">Free</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">${(cartTotal - (couponApplied?.discountAmount || 0)).toFixed(2)}</span>
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
