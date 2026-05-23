import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Bell, ClipboardCheck, DollarSign, RefreshCw, CheckCircle, Clock, Smartphone, Layers, Printer, X, Flame } from 'lucide-react';

const WaiterDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Responsive mobile tabs & timer trackers
  const [mobileTab, setMobileTab] = useState('ready'); // 'ready', 'cooking', 'billing'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cookingSelectId, setCookingSelectId] = useState(null);
  const [activeBill, setActiveBill] = useState(null); // stores populated bill for modal printing

  useEffect(() => {
    fetchWaiterData();
    // Poll every 5 seconds for fast real-time responsiveness
    const interval = setInterval(fetchWaiterData, 5000);
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  const fetchWaiterData = async () => {
    try {
      const headers = getAuthHeaders();
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/orders`, { headers }),
        fetch(`${API_BASE_URL}/tables`, { headers }),
      ]);

      const ordersData = await ordersRes.json();
      const tablesData = await tablesRes.json();

      if (ordersData.success) setOrders(ordersData.data);
      if (tablesData.success) setTables(tablesData.data);
    } catch (err) {
      console.error('Error fetching waiter data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWaiterData();
  };

  // General Status Transition Action
  const handleUpdateStatus = async (orderId, newStatus, estimatedPrepTime = 15) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, estimatedPrepTime }),
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? data.data : o));
        setCookingSelectId(null);
      } else {
        alert(data.message || 'Error updating order status');
      }
    } catch (err) {
      alert('Connection error');
    }
  };

  // Fetch or generate bill invoice for a table
  const handleFetchBill = async (tableNum) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableNum}/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setActiveBill(data.data);
      } else {
        alert(data.message || 'Error generating table bill');
      }
    } catch (err) {
      alert('Error fetching invoice details');
    }
  };

  const handlePayBill = async (tableNum, method) => {
    if (!window.confirm(`Mark Table ${tableNum} bill as Paid via ${method.toUpperCase()}?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableNum}/pay-bill`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentMethod: method }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setActiveBill(null); // Dismiss print invoice modal
        fetchWaiterData(); // Refresh tables and bills status
      } else {
        alert(data.message || 'Error paying bill');
      }
    } catch (err) {
      alert('Error updating payment status');
    }
  };

  // Helper countdown calculations
  const getPrepStats = (order) => {
    if (!order.prepStartedAt || !order.estimatedPrepTime) {
      return { timeLeft: 'N/A', pct: 0, overdue: false };
    }
    const start = new Date(order.prepStartedAt);
    const targetMs = order.estimatedPrepTime * 60 * 1000;
    const elapsedMs = currentTime - start;
    const timeLeftMs = targetMs - elapsedMs;

    if (timeLeftMs <= 0) {
      const overdueMs = Math.abs(timeLeftMs);
      const ovMin = Math.floor(overdueMs / 1000 / 60);
      const ovSec = Math.floor((overdueMs / 1000) % 60);
      return { timeLeft: `-${ovMin}m ${ovSec}s (OVERDUE)`, pct: 100, overdue: true };
    }

    const minutes = Math.floor(timeLeftMs / 1000 / 60);
    const seconds = Math.floor((timeLeftMs / 1000) % 60);
    const pct = Math.min(100, Math.floor((elapsedMs / targetMs) * 100));

    return { timeLeft: `${minutes}m ${seconds}s left`, pct, overdue: false };
  };

  // Helper: check if pending order is urgent (> 5 mins)
  const isPendingUrgent = (order) => {
    if (order.status !== 'pending') return false;
    const elapsed = (currentTime - new Date(order.createdAt)) / 1000 / 60;
    return elapsed > 5;
  };

  // Filter orders
  const readyToServeOrders = orders.filter(o => o.status === 'ready');
  const activePreparingOrders = orders.filter(o => o.status === 'cooking' || o.status === 'pending');

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display flex items-center gap-2">
            <span>Waiter Service Console</span>
          </h1>
          <p className="text-sm text-dark-300">Manage order states, serve table dishes, and print customer bills</p>
        </div>
        
        {/* Sync Button */}
        <button
          onClick={handleRefresh}
          className="glass-btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto active:scale-95 transition-transform"
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Sync Live</span>
        </button>
      </div>

      {/* Mobile Sliding Tabs Switcher (lg:hidden) */}
      <div className="flex lg:hidden rounded-xl bg-dark-950/50 p-1 border border-dark-850 mb-6">
        <button
          onClick={() => setMobileTab('ready')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            mobileTab === 'ready' ? 'bg-brand-500 text-white' : 'text-dark-400'
          }`}
        >
          <Bell size={13} />
          <span>Ready ({readyToServeOrders.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('cooking')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            mobileTab === 'cooking' ? 'bg-brand-500 text-white' : 'text-dark-400'
          }`}
        >
          <Clock size={13} />
          <span>Prep Queue ({activePreparingOrders.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('billing')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            mobileTab === 'billing' ? 'bg-brand-500 text-white' : 'text-dark-400'
          }`}
        >
          <DollarSign size={13} />
          <span>Billing ({tables.filter(t => t.status === 'occupied').length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Console: Ready to Serve Orders */}
          <div className={`lg:col-span-2 space-y-6 ${mobileTab !== 'ready' && 'hidden lg:block'}`}>
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span>Ready to Serve (Deliver immediately)</span>
                {readyToServeOrders.length > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 text-xs font-extrabold border border-brand-500/15">
                    {readyToServeOrders.length} Alerts
                  </span>
                )}
              </h2>

              {readyToServeOrders.length === 0 ? (
                <div className="glass p-8 text-center text-dark-400 rounded-2xl flex flex-col items-center gap-2">
                  <CheckCircle size={32} className="text-dark-500" />
                  <p className="text-sm">No dishes awaiting serving. Kitchen is working on pending orders.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {readyToServeOrders.map(order => (
                    <div
                      key={order._id}
                      className="glass bg-brand-950/10 border-brand-500/25 p-5 rounded-2xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-extrabold text-white">Table #{order.tableNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-brand-500 text-white animate-pulse-subtle">
                            Ready
                          </span>
                        </div>

                        <div className="space-y-1.5 my-3">
                          {order.items.map(item => (
                            <div key={item._id} className="flex justify-between text-xs text-dark-100 font-medium">
                              <span>{item.foodItem?.name || 'Dish'}</span>
                              <span className="text-brand-400">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {order.notes && (
                          <p className="text-[11px] text-amber-400 bg-amber-500/5 px-2.5 py-1.5 rounded-lg italic border border-amber-500/10 mt-2">
                            Note: "{order.notes}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleUpdateStatus(order._id, 'served')}
                        className="glass-btn-primary py-2.5 text-xs font-bold w-full mt-4 cursor-pointer active:scale-95 transition-transform"
                      >
                        <ClipboardCheck size={14} className="inline mr-1" /> Mark Delivered to Table
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prep/Pending orders column */}
          <div className={`lg:col-span-2 space-y-6 ${mobileTab !== 'cooking' && 'hidden lg:block'}`}>
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-dark-400" />
                <span>Cooking & Pending In Kitchen</span>
              </h2>

              {activePreparingOrders.length === 0 ? (
                <div className="glass p-6 text-center text-dark-400 rounded-2xl text-xs">
                  No active orders cooking in the kitchen right now.
                </div>
              ) : (
                <div className="space-y-4">
                  {activePreparingOrders.map(order => {
                    const urgent = isPendingUrgent(order);
                    const prep = getPrepStats(order);

                    return (
                      <div
                        key={order._id}
                        className={`p-4 rounded-2xl border transition-all duration-300 ${
                          urgent
                            ? 'border-rose-500/30 bg-rose-950/10 shadow-[0_0_10px_rgba(244,63,94,0.05)]'
                            : 'border-dark-850 bg-dark-900/10'
                        } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">Table #{order.tableNumber}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide ${
                              urgent
                                ? 'bg-rose-950 text-rose-400 border border-rose-500/20 animate-pulse'
                                : order.status === 'pending'
                                  ? 'bg-emerald-950/40 text-emerald-400'
                                  : 'bg-amber-950/40 text-amber-400'
                            }`}>
                              {urgent ? 'URGENT' : order.status}
                            </span>
                          </div>
                          <p className="text-xs text-dark-300 font-medium truncate max-w-md">
                            {order.items.map(i => `${i.foodItem?.name || 'Dish'} (x${i.quantity})`).join(', ')}
                          </p>

                          {/* Countdown timers inside waiter console */}
                          {order.status === 'cooking' && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] font-bold ${prep.overdue ? 'text-rose-400' : 'text-amber-400'}`}>
                                {prep.timeLeft}
                              </span>
                              <div className="w-24 h-1.5 rounded-full bg-dark-950 overflow-hidden border border-dark-850">
                                <div
                                  className={`h-full rounded-full ${prep.overdue ? 'bg-rose-500' : 'bg-brand-500'}`}
                                  style={{ width: `${prep.pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Direct action triggers for the waiter */}
                        <div className="flex items-center gap-3">
                          {order.status === 'pending' && cookingSelectId !== order._id && (
                            <button
                              onClick={() => setCookingSelectId(order._id)}
                              className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-emerald-650 hover:text-white border border-dark-700 hover:border-emerald-500 text-dark-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                            >
                              <Flame size={12} className="inline mr-1" /> Start Cooking
                            </button>
                          )}

                          {order.status === 'pending' && cookingSelectId === order._id && (
                            <div className="flex items-center gap-1.5 bg-dark-950/50 p-1.5 rounded-lg border border-dark-850 animate-fade-in">
                              {[10, 15, 20].map(mins => (
                                <button
                                  key={mins}
                                  onClick={() => handleUpdateStatus(order._id, 'cooking', mins)}
                                  className="px-2 py-1 rounded bg-dark-900 hover:bg-brand-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                                >
                                  {mins}m
                                </button>
                              ))}
                              <button
                                onClick={() => setCookingSelectId(null)}
                                className="px-1.5 text-[9px] text-dark-400 hover:text-rose-400"
                              >
                                X
                              </button>
                            </div>
                          )}

                          {order.status === 'cooking' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'ready')}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer active:scale-95"
                            >
                              Mark Ready
                            </button>
                          )}

                          <span className="text-xs text-dark-500 font-mono font-bold self-end md:self-center">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tables billing and checkout console */}
          <div className={`lg:col-span-1 ${mobileTab !== 'billing' && 'hidden lg:block'}`}>
            <div className="glass p-6 rounded-2xl sticky top-28 border-dark-850">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-brand-400" />
                <span>Live Table Checkout Billing</span>
              </h2>

              <div className="space-y-4">
                {tables.map(tbl => (
                  <div
                    key={tbl._id}
                    className="p-4 rounded-xl border border-dark-850 bg-dark-950/40 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-white">Table {tbl.number}</span>
                        <span className="text-[10px] text-dark-400 block">{tbl.capacity} seater</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        tbl.status === 'empty'
                          ? 'bg-emerald-950/40 text-emerald-400'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-500/15'
                      }`}>
                        {tbl.status}
                      </span>
                    </div>

                    {tbl.status === 'occupied' && (
                      <div className="space-y-2 border-t border-dark-850/60 pt-3">
                        <button
                          onClick={() => handleFetchBill(tbl.number)}
                          className="w-full glass bg-dark-900 hover:bg-dark-800 text-brand-400 hover:text-white border border-dark-800 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Printer size={13} />
                          <span>Print Invoice Bill</span>
                        </button>

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            onClick={() => handlePayBill(tbl.number, 'cash')}
                            className="bg-dark-900 hover:bg-emerald-950/40 hover:text-emerald-400 text-dark-200 border border-dark-800 hover:border-emerald-500/20 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Cash
                          </button>
                          <button
                            onClick={() => handlePayBill(tbl.number, 'card')}
                            className="bg-dark-900 hover:bg-brand-950/40 hover:text-brand-400 text-dark-200 border border-dark-800 hover:border-brand-500/20 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Card
                          </button>
                          <button
                            onClick={() => handlePayBill(tbl.number, 'upi')}
                            className="bg-dark-900 hover:bg-blue-950/40 hover:text-blue-400 text-dark-200 border border-dark-800 hover:border-blue-500/20 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            UPI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Printable Invoice Ticket Dialog */}
      {activeBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white text-black max-w-sm w-full p-6 rounded-lg font-mono text-xs shadow-2xl relative border-4 border-double border-gray-400 animate-fade-in">
            <button
              onClick={() => setActiveBill(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black font-bold p-1"
            >
              <X size={16} />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-gray-400 mb-4">
              <h2 className="text-base font-extrabold uppercase tracking-wider">FoodForMe Bistro</h2>
              <p className="text-[9px] text-gray-650 mt-0.5">128 Gourmet Street, Bangalore</p>
              <p className="text-[9px] text-gray-650">Ph: +91 98765 43210</p>
              <h3 className="text-xs font-bold uppercase tracking-wider mt-2.5 bg-black text-white py-1">CUSTOMER BILL INVOICE</h3>
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span>INVOICE ID:</span>
                <span className="font-bold">{activeBill._id.substring(12).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>TABLE NUMBER:</span>
                <span className="font-bold text-sm">TABLE {activeBill.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(activeBill.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>BILL STATUS:</span>
                <span className={`font-extrabold uppercase ${activeBill.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activeBill.paymentStatus}
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 font-bold flex justify-between text-[10px]">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/6 text-right">QTY</span>
              <span className="w-1/6 text-right">PRICE</span>
              <span className="w-1/6 text-right text-black font-extrabold">TOT</span>
            </div>

            {/* List items consolidated across all orders */}
            <div className="space-y-1.5 mb-4 border-b border-dashed border-gray-400 pb-4">
              {activeBill.orders?.map(order => 
                order.items?.map(item => (
                  <div key={item._id} className="flex justify-between text-[10px]">
                    <span className="w-1/2 text-left truncate">{item.foodItem?.name || 'Dish'}</span>
                    <span className="w-1/6 text-right">x{item.quantity}</span>
                    <span className="w-1/6 text-right">₹{item.price}</span>
                    <span className="w-1/6 text-right font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))
              )}
            </div>

            {/* Financial breakdown */}
            <div className="space-y-1.5 mb-6 border-b border-dashed border-gray-400 pb-4 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{activeBill.subTotal}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>CGST/SGST (5.0%):</span>
                <span>₹{activeBill.tax}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Service Charge (10.0%):</span>
                <span>₹{activeBill.serviceCharge}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm border-t border-gray-300 pt-2 text-black mt-2">
                <span>GRAND TOTAL:</span>
                <span>₹{activeBill.totalAmount}</span>
              </div>
            </div>

            {/* Quick checkout in modal if pending */}
            {activeBill.paymentStatus === 'pending' ? (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-600 text-center uppercase tracking-wide">
                  Collect Payment & Checkout
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handlePayBill(activeBill.tableNumber, 'cash')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-2 rounded transition-colors cursor-pointer"
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => handlePayBill(activeBill.tableNumber, 'card')}
                    className="bg-black hover:bg-gray-800 text-white font-bold text-[10px] py-2 rounded transition-colors cursor-pointer"
                  >
                    Card
                  </button>
                  <button
                    onClick={() => handlePayBill(activeBill.tableNumber, 'upi')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-2 rounded transition-colors cursor-pointer"
                  >
                    UPI
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-2.5 rounded text-center font-bold mb-4">
                PAID VIA {activeBill.paymentMethod?.toUpperCase()}
              </div>
            )}

            <div className="flex gap-2 border-t border-dashed border-gray-400 pt-4 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2.5 rounded font-bold text-center text-[10px] hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer size={12} />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setActiveBill(null)}
                className="flex-1 bg-gray-250 border border-gray-450 text-black py-2.5 rounded font-bold text-center text-[10px] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
