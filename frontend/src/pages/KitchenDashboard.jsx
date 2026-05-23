import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ChefHat, Flame, Check, RefreshCw, Printer, AlertTriangle, Clock, Layers } from 'lucide-react';

const KitchenDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kotTicket, setKotTicket] = useState(null);
  
  const [viewMode, setViewMode] = useState('queue'); // 'queue' or 'table'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cookingSelectId, setCookingSelectId] = useState(null);

  useEffect(() => {
    fetchKitchenOrders();
    // Poll every 5 seconds for fast real-time synchronization
    const interval = setInterval(fetchKitchenOrders, 5000);
    // Timer clock for exact dynamic second counters
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  const fetchKitchenOrders = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/orders`, { headers });
      const resData = await response.json();
      if (resData.success) {
        // Filter out orders that are already served (delivered)
        const kitchenFeed = resData.data.filter(ord => ord.status !== 'served');
        // Sort oldest first so kitchen fulfills priority correctly
        setOrders(kitchenFeed.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      }
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKitchenOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus, estimatedPrepTime = 15) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, estimatedPrepTime }),
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? data.data : o).filter(o => o.status !== 'served'));
      } else {
        alert(data.message || 'Error updating order');
      }
    } catch (err) {
      alert('Server connection error');
    }
  };

  // Helper: check if order is urgent
  const isOrderUrgent = (order) => {
    if (order.status === 'pending') {
      const elapsed = (currentTime - new Date(order.createdAt)) / 1000 / 60; // minutes
      return elapsed > 5;
    }
    if (order.status === 'cooking' && order.prepStartedAt && order.estimatedPrepTime) {
      const elapsed = (currentTime - new Date(order.prepStartedAt)) / 1000 / 60; // minutes
      return elapsed > order.estimatedPrepTime;
    }
    return false;
  };

  // Helper: elapsed string
  const getElapsedTime = (order) => {
    const diffMs = currentTime - new Date(order.createdAt);
    const minutes = Math.floor(diffMs / 1000 / 60);
    const seconds = Math.floor((diffMs / 1000) % 60);
    return `${minutes}m ${seconds}s`;
  };

  // Helper: countdown time left and prep progress percentage
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

  // Helper: group active orders by table number
  const getGroupedOrdersByTable = () => {
    const grouped = {};
    orders.forEach(order => {
      const tblNum = order.tableNumber;
      if (!grouped[tblNum]) {
        grouped[tblNum] = [];
      }
      grouped[tblNum].push(order);
    });

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map(tblNum => ({
        tableNumber: tblNum,
        ordersList: grouped[tblNum]
      }));
  };

  // Render KDS item card body
  const renderKdsCard = (order, index = null) => {
    const urgent = isOrderUrgent(order);
    const prep = getPrepStats(order);
    
    return (
      <div
        key={order._id}
        className={`glass-card p-6 flex flex-col justify-between border-t-4 transition-all duration-300 ${
          urgent
            ? 'border-t-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-rose-950/[0.03]'
            : order.status === 'pending'
              ? 'border-t-emerald-500 bg-emerald-500/[0.01]'
              : order.status === 'cooking'
                ? 'border-t-amber-500 bg-amber-500/[0.01]'
                : 'border-t-blue-500 bg-blue-500/[0.01]'
        }`}
      >
        <div>
          {/* Top Info */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {index !== null && (
                <span className="text-[10px] text-dark-400 font-extrabold tracking-wider block">QUEUE #{index + 1}</span>
              )}
              <span className="font-extrabold text-white text-lg flex items-center gap-1.5">
                Table {order.tableNumber}
              </span>
              {order.status === 'pending' && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400 font-medium">
                  <Clock size={12} className="animate-pulse" />
                  <span>Placed {getElapsedTime(order)} ago</span>
                </div>
              )}
              {order.status === 'cooking' && (
                <div className="flex flex-col gap-1 mt-1.5 w-full">
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                    <Clock size={12} className={prep.overdue ? 'animate-bounce text-rose-400' : 'animate-spin'} />
                    <span className={prep.overdue ? 'text-rose-400 animate-pulse' : ''}>{prep.timeLeft}</span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-36 h-1.5 rounded-full bg-dark-950 overflow-hidden mt-1 border border-dark-850">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        prep.overdue ? 'bg-rose-500' : prep.pct > 75 ? 'bg-amber-400' : 'bg-brand-500'
                      }`}
                      style={{ width: `${prep.pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                urgent
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30 animate-pulse'
                  : order.status === 'pending'
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/20'
                    : order.status === 'cooking'
                      ? 'bg-amber-950/70 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-950/70 text-blue-400 border border-blue-500/20'
              }`}>
                {urgent ? 'URGENT' : order.status}
              </span>
              <span className="text-[10px] text-dark-500">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 border-y border-dark-850/60 py-3 my-4">
            {order.items.map(item => (
              <div key={item._id} className="flex justify-between items-center text-sm">
                <span className="text-white font-medium">{item.foodItem?.name || 'Dish'}</span>
                <span className="font-extrabold text-brand-400 text-base">x{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Cooking instructions */}
          {order.notes ? (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 flex items-start gap-2 mb-4">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Chef Notes</p>
                <p className="text-xs text-dark-200 mt-0.5 italic">"{order.notes}"</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-dark-500 italic mb-4">No special requests</p>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-3 mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setKotTicket(order)}
              className="flex-1 glass bg-dark-850 hover:bg-dark-800 text-dark-200 hover:text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-dark-750 transition-all active:scale-[0.98]"
            >
              <Printer size={14} />
              <span>View KOT</span>
            </button>
          </div>

          {order.status === 'pending' && cookingSelectId !== order._id && (
            <button
              onClick={() => setCookingSelectId(order._id)}
              className="w-full glass-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Flame size={14} />
              <span>Start Cooking (Prep)</span>
            </button>
          )}

          {/* Inline duration select */}
          {order.status === 'pending' && cookingSelectId === order._id && (
            <div className="bg-dark-950/60 p-3 rounded-xl border border-dark-850/80 space-y-2.5 animate-fade-in">
              <p className="text-[10px] font-extrabold text-brand-400 uppercase tracking-wider text-center">Set Prep Duration</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 15, 20, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      handleUpdateStatus(order._id, 'cooking', mins);
                      setCookingSelectId(null);
                    }}
                    className="bg-dark-900 hover:bg-brand-500 hover:text-white border border-dark-800 text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCookingSelectId(null)}
                className="w-full text-center text-[10px] text-dark-400 hover:text-rose-400 pt-1 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {order.status === 'cooking' && (
            <button
              onClick={() => handleUpdateStatus(order._id, 'ready')}
              className="w-full glass bg-brand-500 hover:bg-brand-400 text-white border-brand-400 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Check size={14} />
              <span>Mark Prepared (Ready)</span>
            </button>
          )}

          {order.status === 'ready' && (
            <p className="text-center text-xs text-brand-400 font-semibold py-2 bg-brand-950/20 rounded-lg border border-brand-500/10">
              Awaiting server pick up
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display flex items-center gap-2">
            <ChefHat size={28} className="text-brand-400" />
            <span>Kitchen Preparation Feed</span>
          </h1>
          <p className="text-sm text-dark-300">View customer orders, print KOT bills, and notify servers when ready</p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Toggle button */}
          <div className="flex rounded-xl bg-dark-950/50 p-1 border border-dark-850">
            <button
              onClick={() => setViewMode('queue')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'queue' ? 'bg-brand-500 text-white shadow-md' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Clock size={12} />
              <span>Queue View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-brand-500 text-white shadow-md' : 'text-dark-400 hover:text-white'
              }`}
            >
              <Layers size={12} />
              <span>Table View</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="glass-btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Feed</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass max-w-xl mx-auto p-12 text-center text-dark-400 rounded-2xl flex flex-col items-center gap-3">
          <ChefHat size={48} className="text-dark-500" />
          <h3 className="text-lg font-bold text-white">No Pending Orders</h3>
          <p className="text-sm">Tables are empty or orders have been served. Enjoy the break, Chef!</p>
        </div>
      ) : (
        <>
          {/* standard queue view */}
          {viewMode === 'queue' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order, index) => renderKdsCard(order, index))}
            </div>
          )}

          {/* Grouped table view */}
          {viewMode === 'table' && (
            <div className="space-y-8">
              {getGroupedOrdersByTable().map(group => (
                <div key={group.tableNumber} className="glass p-6 rounded-2xl border-dark-850">
                  <div className="flex items-center gap-2 mb-6 border-b border-dark-850 pb-4">
                    <span className="font-extrabold text-2xl text-white">Table {group.tableNumber}</span>
                    <span className="px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 text-xs font-bold border border-brand-500/15">
                      {group.ordersList.length} Active Orders
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.ordersList.map(order => renderKdsCard(order))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* KOT Printable Ticket Dialog */}
      {kotTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white text-black max-w-sm w-full p-6 rounded-lg font-mono text-xs shadow-2xl relative border-4 border-dashed border-gray-300">
            <div className="text-center pb-4 border-b border-dashed border-gray-400 mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider">Kitchen Order Ticket (KOT)</h2>
              <p className="text-[10px] text-gray-600 mt-1">FoodForMe Restaurant System</p>
            </div>

            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span>TICKET ID:</span>
                <span className="font-bold">{kotTicket._id.substring(12).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>TABLE NUMBER:</span>
                <span className="font-bold text-sm">TABLE {kotTicket.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(kotTicket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME:</span>
                <span>{new Date(kotTicket.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 font-bold flex justify-between text-[11px]">
              <span>DISH ITEM</span>
              <span>QTY</span>
            </div>

            <div className="space-y-1.5 mb-4 border-b border-dashed border-gray-400 pb-4">
              {kotTicket.items.map(item => (
                <div key={item._id} className="flex justify-between text-[11px] font-bold">
                  <span>{item.foodItem?.name || 'Dish'}</span>
                  <span>{item.quantity}</span>
                </div>
              ))}
            </div>

            {kotTicket.notes && (
              <div className="bg-gray-100 p-2.5 rounded border border-gray-300 mb-6">
                <span className="block font-bold text-[10px] text-red-600">SPECIAL INSTRUCTIONS:</span>
                <span className="italic text-gray-800">"{kotTicket.notes}"</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2 rounded font-bold text-center text-[10px] hover:bg-gray-800 transition-colors"
              >
                Print Ticket (KOT)
              </button>
              <button
                onClick={() => setKotTicket(null)}
                className="flex-1 bg-gray-250 border border-gray-400 text-black py-2 rounded font-bold text-center text-[10px] hover:bg-gray-100 transition-colors"
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

export default KitchenDashboard;
