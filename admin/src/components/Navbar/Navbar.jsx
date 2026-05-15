import { useContext } from 'react'
import { assets } from '../../assets/admin_assets/assets'
import './Navbar.css'
import { StoreContext } from '../../context/StoreContext'

export const Navbar = () => {

  const { logout } = useContext(StoreContext);

  

  return (
    <div className="navbar">
      <img className='logo' src={assets.logo} alt="" />
      <div className="navbar-profile">
        <img className="profile" src={assets.profile_image} alt="" />
        <div className="navbar-profile-dropdown">
          <img src={assets.logout_icon} alt="" />
          <p onClick={logout}>Logout</p>
        </div>
      </div>
    </div>
  )
}
