import { useMemo } from 'react';
import './Dashboard.css';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useState } from 'react';

const STATUS = {
  PROCESSING: 'Food Processing',
  DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
}

const RANGE = {
  TODAY: 'today',
  WEEK: 'week',
  ALL: 'all',
};

const Dashboard = () => {

  const {url, token} = useContext(StoreContext);
  const [range, setRange] = useState(RANGE.TODAY);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning, Admin";
    if (hour < 18) return "Good Afternoon, Admin";
    return "Good evening, Admin";
  }, [])

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
          <span className="muted">Updated just now</span>
        </h3>
        <div className="queue">
          <div className="queue-row queue-head">
            <span>#</span><span>Customer</span><span>Amount</span><span>Status</span>
          </div>
        </div>
      </div>



      
    </div>
  )
}

export default Dashboard