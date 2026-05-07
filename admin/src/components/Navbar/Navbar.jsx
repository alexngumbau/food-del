import { assets } from '../../assets/admin_assets/assets'
import './Navbar.css'

export const Navbar = () => {
  return (
    <div className="navbar">
      <img className='logo' src={assets.logo} alt="" />
      <img className="profile" src={assets.profile_image} alt="" />
    </div>
  )
}
