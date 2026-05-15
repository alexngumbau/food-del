import { Navbar } from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import {Route, Routes} from 'react-router-dom';
import { Add } from './pages/Add/Add';
import { List } from './pages/List/List';
import { Orders } from './pages/Orders/Orders';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { StoreContext } from './context/StoreContext';
import Login from './components/Login/Login';
import IdleTimer from './components/IdleTimer/IdleTimer';

const App = () => {
  const {url, token} = useContext(StoreContext);

  if (!token) {
    return (
      <>
      <ToastContainer />
      <Login />
      </>
    )
  }
  return (
    <IdleTimer>
      <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path='/add' element={<Add url={url, token}/>} />
          <Route path='/list' element={<List url={url}/>} />
          <Route path='/orders' element={<Orders url={url}/>} />
        </Routes>
      </div>
    </div>
    </IdleTimer>
  )
}

export default App