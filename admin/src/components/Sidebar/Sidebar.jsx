import { NavLink } from 'react-router-dom'
import { useContext } from 'react'
import { assets } from '../../assets/admin_assets/assets'
import { StoreContext } from '../../context/StoreContext'
import './Sidebar.css'

const Sidebar = () => {
  const { logout } = useContext(StoreContext);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Tomato Admin</div>

      <nav className="sidebar-nav">
        <NavLink to='/' end className="sidebar-link">
          <img src={assets.order_icon} alt="" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to='/add' className="sidebar-link">
          <img src={assets.add_icon} alt="" />
          <span>Add Items</span>
        </NavLink>
        <NavLink to='/list' className="sidebar-link">
          <img src={assets.order_icon} alt="" />
          <span>List Items</span>
        </NavLink>
        <NavLink to='/orders' className="sidebar-link">
          <img src={assets.parcel_icon} alt="" />
          <span>Orders</span>
        </NavLink>
        <NavLink to='/admins' className="sidebar-link">
          <img src={assets.shield} alt="" />
          <span>Admins</span>
        </NavLink>
      </nav>

      <button className="sidebar-logout" onClick={logout}>
        <img src={assets.logout_icon} alt="" />
        <span>Logout</span>
      </button>
    </aside>
  )
}

export default Sidebar