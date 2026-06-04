import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import { Add } from "./pages/Add/Add";
import { List } from "./pages/List/List";
import { Orders } from "./pages/Orders/Orders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";
import { StoreContext } from "./context/StoreContext";
import Login from "./components/Login/Login";
import IdleTimer from "./components/IdleTimer/IdleTimer";
import { Admins } from "./pages/admins/Admins";
import Dashboard from "./pages/Dashboard/Dashboard";

const App = () => {
  const { url, token, authLoading } = useContext(StoreContext);

  if (authLoading) {
    return null;
  }

  if (!token) {
    return (
      <>
        <ToastContainer />
        <Login />
      </>
    );
  }
  return (
    <IdleTimer>
      <div>
        <ToastContainer />
        <div className="app-content">
          <Sidebar />
          <div className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<Add url={url} token={token} />} />
              <Route path="/list" element={<List url={url} />} />
              <Route path="/orders" element={<Orders url={url} />} />
              <Route path="/admins" element={<Admins />} />
            </Routes>
          </div>
        </div>
      </div>
    </IdleTimer>
  );
};

export default App;
