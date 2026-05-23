import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Utensils, ShoppingBag, Plus, Minus, X, Check, Flame, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';
import axios from 'axios';

const Menu = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tableNumber = parseInt(queryParams.get('table')) || parseInt(localStorage.getItem('tableNumber'));

  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState(['All', 'Starters', 'Main Course', 'Desserts', 'Beverages']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState(() => {
    if (tableNumber) {
      const savedCart = localStorage.getItem(`cart_table_${tableNumber}`);
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Order status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Bill checkout state
  const [checkoutBill, setCheckoutBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem(`cart_table_${tableNumber}`, JSON.stringify(cart));
    }
  }, [cart, tableNumber]);

  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('tableNumber', tableNumber);
    }
    fetchMenu();
  }, [tableNumber]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/menu?isAvailable=true`);
      if (response.data.success) {
        setFoodItems(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch menu items');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to database server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((cartItem) => cartItem.foodItem._id === item._id);
      if (existing) {
        return prevCart.map((cartItem) =>
          cartItem.foodItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { foodItem: item, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (itemId, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.foodItem._id === itemId) {
            const newQty = item.quantity + amount;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.foodItem._id !== itemId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.foodItem.price * item.quantity, 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const orderItems = cart.map((item) => ({
        foodItem: item.foodItem._id,
        quantity: item.quantity,
      }));

      const response = await axios.post(`${API_BASE_URL}/orders`, {
        tableNumber,
        items: orderItems,
        notes,
      });

      if (response.data.success) {
        setOrderSuccess(response.data.data);
        setCart([]);
        setNotes('');
      } else {
        alert(response.data.message || 'Failed to submit order');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestBill = async () => {
    if (!tableNumber) return;
    setBillLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/tables/${tableNumber}/checkout`);
      if (response.data.success) {
        setCheckoutBill(response.data.data);
      } else {
        alert(response.data.message || 'Failed to generate bill');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Server error generating bill');
    } finally {
      setBillLoading(false);
    }
  };

  // Filter food items by category
  const filteredItems = selectedCategory === 'All'
    ? foodItems
    : foodItems.filter((item) => item.category === selectedCategory);

  if (!tableNumber) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center animate-fade-in">
        <div className="glass border-rose-500/25 rounded-2xl p-8 shadow-xl">
          <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Table Scanned</h1>
          <p className="text-dark-300 mb-6">
            To view the menu and place an order, you must scan a table's QR code.
          </p>
          <Link to="/" className="glass-btn-primary block w-full text-center">
            Go to Home & Select a Table
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold mb-1">
            <Utensils size={18} />
            <span>Table {tableNumber} digital menu</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">Discover Delicious Food</h1>
        </div>
        <button
          onClick={handleRequestBill}
          className="glass-btn-secondary flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <span>Ask for Bill / Checkout</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Menu Listings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-900/10'
                    : 'bg-dark-900 text-dark-300 border-dark-850 hover:bg-dark-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="glass p-6 text-center text-rose-400 border-rose-500/10 rounded-2xl">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass p-12 text-center text-dark-400 rounded-2xl">
              No items available in this category.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div key={item._id} className="glass-card overflow-hidden flex flex-col justify-between">
                  <div>
                    {item.image && (
                      <div className="relative h-44 w-full bg-dark-950 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm ${
                            item.isVeg
                              ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-950/70 text-rose-400 border-rose-500/20'
                          }`}>
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-white text-lg">{item.name}</h3>
                        <span className="font-bold text-brand-400 text-lg">₹{item.price}</span>
                      </div>
                      <p className="text-dark-300 text-sm line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0 flex items-center justify-between mt-auto">
                    {/* Spicy Level display */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: item.spicyLevel }).map((_, idx) => (
                        <Flame key={idx} size={14} className="text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="glass-btn-primary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 border-dark-850 sticky top-28">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-brand-400" />
              <span>Your Basket</span>
              {cart.length > 0 && (
                <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </h2>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-dark-400 flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-dark-900 border border-dark-800 flex items-center justify-center text-dark-500">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-sm">Select delicious food from the menu to populate your basket.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.foodItem._id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dark-850 bg-dark-900/40"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{item.foodItem.name}</p>
                        <p className="text-xs text-brand-400 font-bold mt-0.5">₹{item.foodItem.price}</p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.foodItem._id, -1)}
                          className="h-7 w-7 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white flex items-center justify-center cursor-pointer border border-dark-750"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.foodItem._id, 1)}
                          className="h-7 w-7 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white flex items-center justify-center cursor-pointer border border-dark-750"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.foodItem._id)}
                        className="text-dark-400 hover:text-rose-400 cursor-pointer p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dark-850 pt-4 space-y-3">
                  {/* Special Requests */}
                  <div>
                    <label htmlFor="notes" className="block text-xs font-semibold text-dark-400 mb-1.5">
                      Cooking Notes / Special Requests
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. No onions, make it extra spicy, etc."
                      className="w-full text-xs glass-input resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-b border-dark-850 pb-3">
                    <span>Basket Subtotal</span>
                    <span className="text-brand-400 text-lg">₹{getCartTotal()}</span>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full glass-btn-primary flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Place Order to Kitchen</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bill Dialog Popup */}
      {checkoutBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 border-brand-500/20 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center pb-4 border-b border-dark-850 mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Utensils className="text-brand-400" />
                <span>Table {checkoutBill.tableNumber} Receipt</span>
              </h2>
              <button
                onClick={() => setCheckoutBill(null)}
                className="text-dark-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-400">Bill ID: {checkoutBill._id}</p>
                <p className="text-xs text-dark-400 mt-0.5">Date: {new Date(checkoutBill.createdAt).toLocaleString()}</p>
              </div>

              {/* Aggregated Orders list */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-white border-b border-dark-850 pb-1">Items Details</p>
                {checkoutBill.orders.map((order, orderIdx) => (
                  <div key={order._id} className="text-xs space-y-1">
                    <p className="text-brand-400 font-semibold">Order #{orderIdx + 1} ({new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</p>
                    {order.items.map((item) => (
                      <div key={item._id} className="flex justify-between text-dark-300 py-0.5">
                        <span>{item.foodItem?.name || 'Dish'} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-dark-850 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-dark-300">
                  <span>Subtotal</span>
                  <span>₹{checkoutBill.subTotal}</span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>Tax (5% GST)</span>
                  <span>₹{checkoutBill.tax}</span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>Service Charge (10%)</span>
                  <span>₹{checkoutBill.serviceCharge}</span>
                </div>
                <div className="flex justify-between text-white font-extrabold text-lg border-t border-dark-850 pt-3">
                  <span>Total Amount</span>
                  <span className="text-brand-400">₹{checkoutBill.totalAmount}</span>
                </div>
              </div>

              <div className="rounded-xl bg-brand-500/5 border border-brand-500/10 p-4 text-center mt-6">
                <p className="text-xs text-brand-400 font-semibold mb-1">Electronic Bill Requested</p>
                <p className="text-xs text-dark-300">
                  Please show this bill to your waiter. They will process your payment at your table.
                </p>
              </div>

              <button
                onClick={() => setCheckoutBill(null)}
                className="w-full glass-btn-secondary text-sm font-semibold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Popup */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-md w-full rounded-2xl p-8 border-brand-500/20 text-center animate-scale-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-5">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Order Sent to Kitchen!</h2>
            <p className="text-dark-300 text-sm mb-6 leading-relaxed">
              We have received your order for table <span className="text-brand-400 font-bold">#{orderSuccess.tableNumber}</span>. The kitchen is preparing it, and our waiter will serve it to your table shortly.
            </p>

            <div className="glass bg-dark-950/60 p-4 rounded-xl mb-6 text-left space-y-1.5">
              <p className="text-xs text-dark-400 font-semibold">Order Details</p>
              {orderSuccess.items.map((item) => (
                <div key={item._id} className="flex justify-between text-xs text-dark-200">
                  <span>{item.foodItem?.name || 'Item'} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-dark-850 pt-2 flex justify-between text-xs font-bold text-white">
                <span>Total Amount</span>
                <span className="text-brand-400">₹{orderSuccess.totalAmount}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOrderSuccess(null)}
                className="flex-1 glass-btn-primary py-2 text-sm font-semibold"
              >
                Order More Food
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
