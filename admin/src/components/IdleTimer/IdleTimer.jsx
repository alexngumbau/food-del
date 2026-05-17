import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import './IdleTimer.css'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_DURATION = 60; // 60 seconds countdown

const IdleTimer = ({children}) => {

  const {url, token, setToken, refreshToken, logout} = useContext(StoreContext);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION);

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    if (showWarning) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_DURATION);
    }, IDLE_TIMEOUT);
  }, [showWarning]);

  // listen for user activity
  useEffect(() => {
    if (!token) return;

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [token, resetIdleTimer]);

  // countdown when warning is visible
  useEffect(() => {
    if (!showWarning) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      })
    }, 1000);

    return () => clearInterval (countdownRef.current);
  }, [showWarning]);

  // logout when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && showWarning) {
      logout();
    }
  }, [countdown, showWarning, logout]);


  const handleStayLoggedIn = async () => {
    try {
      const response = await axios.post(`${url}/api/user/refresh-token`, {refreshToken});
      if (response.data.success) {
        localStorage.setItem("admin_token", response.data.token);
        setToken(response.data.token);
        setShowWarning(false);
        setCountdown(WARNING_DURATION);
        
        // restart idle timer
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          setShowWarning(true);
          setCountdown(WARNING_DURATION);
        }, IDLE_TIMEOUT);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }

  const handleLogout = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    logout();
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  

  return (
    
    <>
    {children}
    {showWarning && (
      <div className="idle-overlay">
        <div className="idle-modal">
          <h3>Session Expiring</h3>
          <p>You've been inactive for a while. Your session will expire in:</p>
          <div className="idle-countdown">{formatTime(countdown)}</div>
          <div className="idle-actions">
            <button className="idle-stay" onClick={handleStayLoggedIn}>
              Stay Logged In
            </button>
            <button className="idle-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default IdleTimer