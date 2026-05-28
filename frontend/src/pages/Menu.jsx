import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Utensils, ShoppingBag, Plus, Minus, X, Check, Flame, AlertCircle, PhoneCall, Receipt, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../context/AuthContext';
import axios from 'axios';

const Menu = () => {
  const { restaurantId: routeRestaurantId, tableNumber: routeTableNumber } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Multi-tenant parameter resolution
  const restaurantId = routeRestaurantId || queryParams.get('restaurantId') || localStorage.getItem('restaurantId');
  const tableNumber = parseInt(routeTableNumber) || parseInt(queryParams.get('table')) || parseInt(localStorage.getItem('tableNumber'));

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

  // Responsive Drawer and Toast feedback
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [waiterCalled, setWaiterCalled] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem(`cart_table_${tableNumber}`, JSON.stringify(cart));
    }
  }, [cart, tableNumber]);

  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem('restaurantId', restaurantId);
    }
    if (tableNumber) {
      localStorage.setItem('tableNumber', tableNumber);
    }
    if (restaurantId && tableNumber) {
      fetchMenu();
    } else {
      setLoading(false);
    }
  }, [restaurantId, tableNumber]);

  const fetchMenu = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/menu?isAvailable=true&restaurantId=${restaurantId}`);
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

    // Sleek Toast Confirmation
    setActiveToast({ name: item.name });
    setTimeout(() => {
      setActiveToast((curr) => (curr?.name === item.name ? null : curr));
    }, 2500);
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
    if (cart.length === 0 || !restaurantId) return;
    
    setIsSubmitting(true);
    try {
      const orderItems = cart.map((item) => ({
        foodItem: item.foodItem._id,
        quantity: item.quantity,
      }));

      const response = await axios.post(`${API_BASE_URL}/orders`, {
        tableNumber,
        restaurantId,
        items: orderItems,
        notes,
      });

      if (response.data.success) {
        setOrderSuccess(response.data.data);
        setCart([]);
        setNotes('');
        setIsCartOpen(false);
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
    if (!tableNumber || !restaurantId) return;
    setBillLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/tables/${tableNumber}/checkout?restaurantId=${restaurantId}`);
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

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
    alert(`🛎️ Waiter Called! A staff member has been notified and is coming to Table ${tableNumber} immediately.`);
  };

  // Filter food items by category
  const filteredItems = selectedCategory === 'All'
    ? foodItems
    : foodItems.filter((item) => item.category === selectedCategory);

  if (!restaurantId || !tableNumber) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-20 text-center animate-fade-in">
        <div className="glass border-rose-500/25 rounded-2xl p-6 sm:p-8 shadow-xl">
          <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">No Table Scanned</h1>
          <p className="text-xs sm:text-sm text-dark-300 mb-6">
            To view the menu and place an order, you must scan a table's QR code or visit a restaurant-specific table link.
          </p>
          <Link to="/" className="glass-btn-primary block w-full text-center py-3 text-xs sm:text-sm">
            Go to Home Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-1 sm:pt-4 pb-8 sm:px-6 relative animate-fade-in">
      {/* Scoped CSS styling injected directly for clean customization */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Floating Micro-Toast confirmation */}
      {activeToast && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-55 bg-emerald-500 text-white text-xs font-extrabold py-2.5 px-5 rounded-full shadow-lg shadow-emerald-950/20 flex items-center gap-2 animate-slide-up border border-emerald-400/25 whitespace-nowrap">
          <Check size={14} />
          <span>Added {activeToast.name} to basket!</span>
        </div>
      )}

      {/* Customer Header - Swiggy/Zomato Style Compact Mobile Header */}
      <div className="border-b border-dark-900/50 pb-3 mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-brand-400 font-semibold mb-0.5 text-xs">
              <Utensils size={12} className="flex-shrink-0" />
              <span>Table {tableNumber} Digital Menu</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-1.5">
              Discover Food
              <Sparkles size={14} className="text-brand-400 hidden sm:inline animate-pulse" />
            </h1>
          </div>
          {/* Mobile top round waiter caller button to balance Swiggy structure */}
          <button
            onClick={handleCallWaiter}
            className="sm:hidden rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 p-2 text-xs font-bold transition-all flex items-center justify-center active:scale-95 cursor-pointer flex-shrink-0"
            title="Call Waiter"
          >
            <PhoneCall size={14} />
          </button>
        </div>
        
        {/* Full-width Responsive Action Row BELOW the title for Swiggy/Zomato flow */}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={handleCallWaiter}
            className="hidden sm:flex flex-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 py-2.5 text-xs font-bold transition-all items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <PhoneCall size={13} />
            <span>Call Waiter</span>
          </button>
          <button
            onClick={handleRequestBill}
            disabled={billLoading}
            className="flex-1 glass-btn-primary py-2.5 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-brand-500/10"
          >
            {billLoading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Receipt size={13} />
                <span>Ask for Bill & Checkout</span>
              </>
            )}
          </button>
          {/* Mobile-only Call Waiter button in bottom action row */}
          <button
            onClick={handleCallWaiter}
            className="sm:hidden flex-[0.5] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <PhoneCall size={13} />
            <span>Call</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Menu Listings */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Horizontal Scrolling Sticky Category Tabs (with hidden scrollbar & snap alignment) */}
          <div className="sticky top-[45px] sm:top-[68px] z-40 bg-dark-950/95 backdrop-blur-md py-2.5 -mx-4 border-b border-dark-900/50">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory px-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap border snap-start ${
                    selectedCategory === cat
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20 scale-105'
                      : 'bg-dark-900/60 text-dark-350 border-dark-800/80 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="glass p-5 text-center text-rose-455 border-rose-500/10 rounded-2xl text-xs sm:text-sm font-semibold">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass p-10 text-center text-dark-400 rounded-2xl text-xs sm:text-sm">
              No items available in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <div key={item._id} className="glass-card overflow-hidden flex flex-col justify-between h-[365px] group transition-all duration-300 hover:border-brand-500/25">
                  <div className="relative h-44 w-full bg-dark-950 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-dark-900 text-dark-500">
                        <Utensils size={36} />
                      </div>
                    )}
                    {/* Category / Veg Badge absolute positioning */}
                    <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-md uppercase tracking-wider ${
                        item.isVeg
                          ? 'bg-emerald-950/70 text-emerald-455 border-emerald-500/20'
                          : 'bg-rose-950/70 text-rose-455 border-rose-500/20'
                      }`}>
                        {item.isVeg ? '● Veg' : '▲ Non-Veg'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-extrabold text-white text-base truncate pr-1 group-hover:text-brand-400 transition-colors">{item.name}</h3>
                        <span className="font-extrabold text-brand-400 text-base flex-shrink-0">₹{item.price}</span>
                      </div>
                      <p className="text-dark-350 text-xs line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-dark-850 pt-3 mt-auto">
                      {/* Spicy display */}
                      <div className="flex items-center gap-0.5">
                        {item.spicyLevel > 0 ? (
                          Array.from({ length: item.spicyLevel }).map((_, idx) => (
                            <Flame key={idx} size={12} className="text-amber-500 fill-amber-500" />
                          ))
                        ) : (
                          <span className="text-[10px] text-dark-500 font-semibold uppercase tracking-wider">Mild</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="glass-btn-primary py-1.5 px-3.5 text-[11px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-brand-500/5 hover:shadow-brand-500/10 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="glass rounded-2xl p-5 border-dark-850 sticky top-24 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-brand-400 animate-pulse-subtle" />
              <span>Your Basket</span>
              {cart.length > 0 && (
                <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </h2>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-dark-400 flex flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-full bg-dark-900 border border-dark-800 flex items-center justify-center text-dark-500">
                  <ShoppingBag size={16} />
                </div>
                <p className="text-xs max-w-[200px] leading-relaxed">Select delicious dishes from the menu to populate your basket.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
                  {cart.map((item) => (
                    <div
                      key={item.foodItem._id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dark-850 bg-dark-900/40"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-white truncate">{item.foodItem.name}</p>
                        <p className="text-[10px] text-brand-400 font-bold mt-0.5">₹{item.foodItem.price}</p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.foodItem._id, -1)}
                          className="h-6 w-6 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white flex items-center justify-center cursor-pointer border border-dark-750"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-semibold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.foodItem._id, 1)}
                          className="h-6 w-6 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white flex items-center justify-center cursor-pointer border border-dark-750"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.foodItem._id)}
                        className="text-dark-500 hover:text-rose-455 cursor-pointer p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dark-850 pt-4 space-y-4">
                  {/* Special Requests */}
                  <div>
                    <label htmlFor="notes" className="block text-[10px] font-semibold text-dark-400 mb-1.5 uppercase tracking-wider">
                      Cooking Notes / Special Requests
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. No onions, make it extra spicy..."
                      className="w-full text-xs glass-input resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center text-xs font-bold text-white pt-2 border-b border-dark-850 pb-3">
                    <span>Basket Subtotal</span>
                    <span className="text-brand-400 text-base">₹{getCartTotal()}</span>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full glass-btn-primary flex items-center justify-center gap-2 mt-1 py-3 text-xs"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Check size={14} />
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

      {/* Floating Sticky Cart Summary Button (Mobile & Tablet viewports only) */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-45 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-full py-3.5 px-5 shadow-2xl flex items-center gap-2.5 font-extrabold border border-brand-400/35 backdrop-blur-md active:scale-95 transition-transform duration-200 animate-slide-up"
        >
          <ShoppingBag size={16} />
          <span className="text-xs">{cart.reduce((sum, item) => sum + item.quantity, 0)} Items • ₹{getCartTotal()}</span>
        </button>
      )}

      {/* Mobile Cart Bottom Sheet Drawer (Mobile & Tablet viewports only) */}
      {isCartOpen && (
        <>
          {/* Slide Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 z-45 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          />
          {/* Drawer Sheet */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-dark-950/98 border-t border-brand-500/20 rounded-t-[2.5rem] shadow-2xl max-h-[85vh] flex flex-col backdrop-blur-lg transform transition-transform duration-300 ease-out animate-slide-up">
            {/* Grab Bar Handle */}
            <div className="w-12 h-1.5 rounded-full bg-dark-800 mx-auto mt-4 mb-3" />
            
            <div className="px-6 pb-8 flex-1 overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-brand-400" />
                    <span>Your Basket</span>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-dark-400 hover:text-white p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-dark-500">
                    Your basket is empty.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto scrollbar-none pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.foodItem._id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dark-850 bg-dark-900/40"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-white truncate">{item.foodItem.name}</p>
                          <p className="text-[10px] text-brand-400 font-bold mt-0.5">₹{item.foodItem.price}</p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.foodItem._id, -1)}
                            className="h-6 w-6 rounded-lg bg-dark-800 text-dark-200 flex items-center justify-center border border-dark-750"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-semibold text-white w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.foodItem._id, 1)}
                            className="h-6 w-6 rounded-lg bg-dark-800 text-dark-200 flex items-center justify-center border border-dark-750"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.foodItem._id)}
                          className="text-dark-500 hover:text-rose-405 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-dark-850 pt-4 mt-6 space-y-4">
                  {/* Mobile Special Requests */}
                  <div>
                    <label htmlFor="mobile-notes" className="block text-[10px] font-semibold text-dark-400 mb-1.5 uppercase tracking-wider">
                      Cooking Notes / Special Requests
                    </label>
                    <textarea
                      id="mobile-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. No onions, make it extra spicy..."
                      className="w-full text-xs glass-input resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-white pt-2 border-b border-dark-850 pb-3">
                    <span>Basket Subtotal</span>
                    <span className="text-brand-400 text-base">₹{getCartTotal()}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      handleSubmitOrder(e);
                    }}
                    disabled={isSubmitting}
                    className="w-full glass-btn-primary py-3.5 flex items-center justify-center gap-2 text-xs font-extrabold shadow-md shadow-brand-500/10 active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Place Order to Kitchen</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bill Checkout Modal Dialog */}
      {checkoutBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-5 border-brand-500/20 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center pb-4 border-b border-dark-850 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Utensils className="text-brand-400 w-4 h-4 sm:w-5 sm:h-5" />
                <span>Table {checkoutBill.tableNumber} Receipt</span>
              </h2>
              <button
                onClick={() => setCheckoutBill(null)}
                className="text-dark-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-dark-400">Bill ID: {checkoutBill._id}</p>
                <p className="text-[10px] text-dark-400 mt-0.5">Date: {new Date(checkoutBill.createdAt).toLocaleString()}</p>
              </div>

              {/* Aggregated Orders */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white border-b border-dark-850 pb-1 uppercase tracking-wider">Itemized Breakdown</p>
                <div className="max-h-[200px] overflow-y-auto space-y-3 pr-1 scrollbar-none">
                  {checkoutBill.orders.map((order, orderIdx) => (
                    <div key={order._id} className="text-xs space-y-1">
                      <p className="text-brand-400 font-semibold">Order #{orderIdx + 1} ({new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</p>
                      {order.items.map((item) => (
                        <div key={item._id} className="flex justify-between text-dark-300 py-0.5 text-[11px]">
                          <span>{item.foodItem?.name || 'Dish'} x {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="border-t border-dark-850 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-dark-350">
                  <span>Subtotal</span>
                  <span>₹{checkoutBill.subTotal}</span>
                </div>
                <div className="flex justify-between text-dark-350">
                  <span>Tax (5% GST)</span>
                  <span>₹{checkoutBill.tax}</span>
                </div>
                <div className="flex justify-between text-dark-350">
                  <span>Service Charge (10%)</span>
                  <span>₹{checkoutBill.serviceCharge}</span>
                </div>
                <div className="flex justify-between text-white font-extrabold text-base border-t border-dark-850 pt-3">
                  <span>Total Amount</span>
                  <span className="text-brand-400 text-lg">₹{checkoutBill.totalAmount}</span>
                </div>
              </div>

              <div className="rounded-xl bg-brand-500/5 border border-brand-500/10 p-3.5 text-center mt-4">
                <p className="text-[11px] text-brand-400 font-semibold mb-1">🛎️ Bill Generation Successful</p>
                <p className="text-[10px] text-dark-300 leading-relaxed">
                  Please show this receipt to your waiter. They will finalize your checkout and process payment (Cash, Card, or UPI) at your table.
                </p>
              </div>

              <button
                onClick={() => setCheckoutBill(null)}
                className="w-full glass-btn-secondary py-2.5 text-xs font-semibold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Sent Successfully Dialog Popup */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="glass max-w-md w-full rounded-2xl p-6 sm:p-8 border-brand-500/20 text-center animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4 animate-bounce">
              <Check size={28} />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 font-display">Sent to Kitchen!</h2>
            <p className="text-dark-300 text-xs sm:text-sm mb-5 leading-relaxed">
              We've received your order for table <span className="text-brand-400 font-bold">#{orderSuccess.tableNumber}</span>. The kitchen is preparing it, and our waiter will serve it to your table shortly.
            </p>

            <div className="glass bg-dark-950/60 p-4 rounded-xl mb-5 text-left space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-none">
              <p className="text-[10px] text-dark-400 font-semibold uppercase tracking-wider">Order Items</p>
              {orderSuccess.items.map((item) => (
                <div key={item._id} className="flex justify-between text-[11px] text-dark-250">
                  <span>{item.foodItem?.name || 'Item'} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-dark-850 pt-2 flex justify-between text-xs font-bold text-white">
                <span>Total Amount</span>
                <span className="text-brand-400">₹{orderSuccess.totalAmount}</span>
              </div>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full glass-btn-primary py-2.5 text-xs font-semibold shadow-md active:scale-95"
            >
              Order More Food
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
