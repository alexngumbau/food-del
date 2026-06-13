import { useMemo, useEffect, useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { StoreContext } from '../../context/StoreContext';

const STATUS = {
  PROCESSING: 'Food Processing',
  DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
}

const STATUS_META = {
  [STATUS.PROCESSING]: {label: 'Processing', cls: 'processing'},
  [STATUS.DELIVERY]: {label: 'Out for delivery', cls: 'delivery'},
  [STATUS.DELIVERED]: {label: 'Delivered', cls: 'delivered'},
}

const formatRelative = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const RANGE = {
  TODAY: 'today',
  WEEK: 'week',
  ALL: 'all',
};

const Dashboard = () => {

  const {url, token} = useContext(StoreContext);
  const navigate = useNavigate();
  const [range, setRange] = useState(RANGE.TODAY);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning, Admin";
    if (hour < 18) return "Good Afternoon, Admin";
    return "Good evening, Admin";
  }, [])


  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${url}/api/order/list-orders`, {headers: {token} });
      if (res.data.success) {
        setOrders(res.data.data);
        setLastUpdated(new Date());
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (err){
      console.log('fetchOrders failed', err)
      const msg = err.response?.data?.message || 'Failed to fetch orders';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchOrders();
    const id = setInterval(fetchOrders, 30000); // refresh every 30s
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Newest 5 orders for the queue
  const queueOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        // Sort by date desc, fall back to _id (which encodes creation time)
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b._id.localeCompare(a._id);
      })
      .slice(0, 5);
  }, [orders]);

  // Group orders by status for the kanban view
  const ordersByStatus = useMemo(() => {
    const buckets = {
      [STATUS.PROCESSING]: [],
      [STATUS.DELIVERY]: [],
      [STATUS.DELIVERED]: [],
    }

    orders.forEach((order) => {
      if (buckets[order.status]) {
        buckets[order.status].push(order);
      }
    });
    return buckets;
  }, [orders]);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>{greeting}</h1>
          <p>Focus: orders that need attention</p>
        </div>
        <select className="dash-filter" value={range} onChange={e => setRange(e.target.value)}>
          <option value={RANGE.TODAY}>Today</option>
          <option value={RANGE.WEEK}>Last 7 days</option>
          <option value={RANGE.ALL}>All time</option>
        </select>
      </div>

      <div className="dash-stats">
        <div className="stat">
          <div className="label">Orders</div>
          <div className="value">24</div>
        </div>
        <div className="stat">
          <div className="label">Revenue</div>
          <div className="value">$24</div>
        </div>
        <div className="stat pending">
          <div className="label">Pending</div>
          <div className="value">7</div>
        </div>
      </div>

      {/* TODO: Add sales trend chart */}
      <div className="card">
        <h3>
          <span>Sales Trend (last 7 days)</span>
          <span className="chart-legend">
            <span className="legend-item"><span className="dot revenue"></span>Revenue</span>
            <span className="legend-item"><span className="dot orders"></span>Orders</span>
          </span>
        </h3>
      </div>

      <div className="card">
        <h3>
          <span><span className="live-dot"></span>Live Order Queue</span>
          <span className="muted">
            {lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : '-'}
          </span>
        </h3>

        <div className="queue">
          <div className="queue-row queue-head">
            <span>#</span><span>Customer</span><span>Amount</span><span>Status</span><span>Action</span>
          </div>

          {loading && (
            <div className="queue-empty">Loading orders...</div>
          )}

          {!loading && queueOrders.length === 0 && (
            <div className="queue-empty">No orders yet</div>
          )}

          {!loading && queueOrders.map((order) => {
            const meta = STATUS_META[order.status] ?? {label: order.status, cls: 'unknown'};
            const shortId = `#${String(order._id).slice(-4)}`;
            const customer = `${order.address?.firstName ?? ''} ${order.address?.lastName ?? ''}`.trim() || 'Customer';
            return (
              <div key={order._id} className="queue-row">
                <span className="id">{shortId}</span>
                <span>{customer}</span>
                <span>${order.amount}</span>
                <span><span className={`badge ${meta.cls}`}>{meta.label}</span></span>
                <button className="view-btn" onClick={() => navigate('/orders')}>View</button>
              </div>
            )
          })}
        </div>

      </div>

      {/* Kanban - orders grouped by status */}
      <div className="columns">
        {[STATUS.PROCESSING, STATUS.DELIVERY, STATUS.DELIVERED].map((status) => {
          const meta = STATUS_META[status];
          const items = ordersByStatus[status] ?? [];
          return (
            <div key={status} className="card kanban-card">
              <div className={`col-header ${meta.cls}`}>
                {meta.label} ({items.length})
              </div>

              {items.length === 0 && (
                <div className = "kanban-empty" >No orders</div>
              )}

              {items.slice(0, 6).map((order) => {
                const customer = `${order.address?.firstName ?? ''} ${order.address?.lastName ?? ''}`.trim() || 'Customer';
                const itemCount = order.items?.length ?? 0;
                return (
                  <div key={order._id} className="order-card" onClick={() => navigate('/orders')}>
                    <div className="name">{customer}</div>
                    <div className="meta">{itemCount} {itemCount === 1 ? 'item' : 'items'} • ${order.amount}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default Dashboard