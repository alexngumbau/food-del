import { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../context/StoreContext';
import './Orders.css';

const PAGE_SIZES = [10, 25, 50];

const STATUS = {
  PROCESSING: 'Food Processing',
  DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
};

const STATUS_META = {
  [STATUS.PROCESSING]: { label: 'Processing', cls: 'processing' },
  [STATUS.DELIVERY]: { label: 'Out for delivery', cls: 'delivery' },
  [STATUS.DELIVERED]: { label: 'Delivered', cls: 'delivered' },
};

const AREA_OPTIONS = ['All areas', 'Downtown', 'Midtown', 'East Side', 'West End', 'North Hills'];

const formatTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatRelative = (date) => {
  if (!date) return '—';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getOrderStatus = (status) => {
  if (status === STATUS.PROCESSING || status === STATUS.DELIVERY || status === STATUS.DELIVERED) {
    return status;
  }
  return STATUS.PROCESSING;
};

export const Orders = () => {
  const { url, token } = useContext(StoreContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All areas');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/api/order/list-orders`, { headers: { token } });
      if (res.data.success) {
        setOrders(res.data.data || []);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await axios.post(
        `${url}/api/order/update-status`,
        { orderId, status },
        { headers: { token } }
      );

      if (res.data.success) {
        await fetchOrders();
      } else {
        toast.error('Unable to update status');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update status');
    }
  };

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
      const orderStatus = getOrderStatus(order.status);
      const itemCount = Array.isArray(order.items) ? order.items.length : 0;
      const customerName = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim();
      const area = order.address?.city || order.address?.state || order.address?.country || 'Unknown';
      const phone = order.address?.phone || '';
      const orderId = order._id ? `#${order._id.slice(-4)}` : '#0000';
      const itemsLabel = Array.isArray(order.items)
        ? order.items.map((item) => `${item.name} x ${item.quantity}`).join(', ')
        : '';

      return {
        ...order,
        orderStatus,
        itemCount,
        customerName,
        area,
        phone,
        orderId,
        itemsLabel,
      };
    });
  }, [orders]);


  const todayOrders = useMemo(() => {
  const now = new Date();
  return enrichedOrders.filter((order) => {
    if (!order.date) return false;
    const d = new Date(order.date);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });
}, [enrichedOrders]);

  const stats = useMemo(() => {
    const total = todayOrders.length;
    const processing = todayOrders.filter((order) => order.orderStatus === STATUS.PROCESSING).length;
    const delivery = todayOrders.filter((order) => order.orderStatus === STATUS.DELIVERY).length;
    const delivered = todayOrders.filter((order) => order.orderStatus === STATUS.DELIVERED).length;

    return { total, processing, delivery, delivered };
  }, [enrichedOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrichedOrders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        order.itemsLabel.toLowerCase().includes(query);

      const matchesArea =
        areaFilter === 'All areas' || order.area.toLowerCase().includes(areaFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'All statuses' || order.orderStatus === statusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [areaFilter, enrichedOrders, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, areaFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleOrders = filteredOrders.slice(pageStart, pageStart + pageSize);

  const startItem = filteredOrders.length === 0 ? 0 : pageStart + 1;
  const endItem = Math.min(pageStart + pageSize, filteredOrders.length);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 4;
    const start = Math.max(1, safePage - 1);
    const end = Math.min(totalPages, start + maxVisible - 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="orders">
      <div className="orders-header">
        <div>
          <h1>Dense Operations</h1>
          <p>Table-first layout for fast scanning, filtering, search and per-order status updates</p>
        </div>

        <input
          className="orders-search"
          type="search"
          placeholder="Search by name, id, item, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="orders-stats">
        <div className="stat">
          <div className="label">Today Orders</div>
          <div className="value">{loading ? '-' : stats.total}</div>
        </div>
        <div className="stat">
          <div className="label">Processing</div>
          <div className="value">{loading ? '-' : stats.processing}</div>
        </div>
        <div className="stat unavailable">
          <div className="label">Needs Attention</div>
          <div className="value">{loading ? '-' : stats.delivery}</div>
        </div>
        <div className="stat">
          <div className="label">Completed</div>
          <div className="value">{loading ? '-' : stats.delivered}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className={`chip ${statusFilter === 'All statuses' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All statuses')}
          >
            All · {stats.total}
          </button>
          <button
            type="button"
            className={`chip ${statusFilter === STATUS.PROCESSING ? 'active' : ''}`}
            onClick={() => setStatusFilter(STATUS.PROCESSING)}
          >
            Processing · {stats.processing}
          </button>
          <button
            type="button"
            className={`chip ${statusFilter === STATUS.DELIVERY ? 'active' : ''}`}
            onClick={() => setStatusFilter(STATUS.DELIVERY)}
          >
            Delivery · {stats.delivery}
          </button>
          <button
            type="button"
            className={`chip ${statusFilter === STATUS.DELIVERED ? 'active' : ''}`}
            onClick={() => setStatusFilter(STATUS.DELIVERED)}
          >
            Delivered · {stats.delivered}
          </button>
        </div>

        <div className="toolbar-right">
          <select
            className="select"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            {AREA_OPTIONS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All statuses">Status</option>
            <option value={STATUS.PROCESSING}>{STATUS.PROCESSING}</option>
            <option value={STATUS.DELIVERY}>{STATUS.DELIVERY}</option>
            <option value={STATUS.DELIVERED}>{STATUS.DELIVERED}</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {visibleOrders.map((order, index) => (
              <tr key={order._id} className={index < 3 ? 'priority' : ''}>
                <td>
                  <div className="order-cell">
                    <div className="order-id">{order.orderId}</div>
                    <div className="meta">{order.area}</div>
                  </div>
                </td>

                <td>
                  <div className="customer-cell">
                    <div className="customer-name">{order.customerName || '—'}</div>
                    <div className="meta">{order.phone}</div>
                  </div>
                </td>

                <td>{order.itemCount}</td>

                <td className="amount">${order.amount}</td>

                <td>
                  <span className={`pill ${STATUS_META[order.orderStatus].cls}`}>
                    {STATUS_META[order.orderStatus].label}
                  </span>
                </td>

                <td>{formatTime(order.date)} · {formatRelative(order.date)}</td>

                <td>
                  <select
                    className={`status-select ${STATUS_META[order.orderStatus].cls}`}
                    value={order.orderStatus}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                  >
                    <option value={STATUS.PROCESSING}>{STATUS.PROCESSING}</option>
                    <option value={STATUS.DELIVERY}>{STATUS.DELIVERY}</option>
                    <option value={STATUS.DELIVERED}>{STATUS.DELIVERED}</option>
                  </select>
                </td>
              </tr>
            ))}

            {!loading && visibleOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  <div className="icon">⌕</div>
                  <h3>No orders found</h3>
                  <p>Try adjusting the search or filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <div>Showing {startItem}–{endItem} of {filteredOrders.length} orders</div>

          <div className="footer-right">
            <span className="footer-label">Rows per page</span>
            <select
              className="select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <div className="page-controls">
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                ←
              </button>

              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`page-btn ${num === safePage ? 'active' : ''}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};