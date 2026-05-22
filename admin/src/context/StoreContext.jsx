import axios from "axios";
import { useCallback, useEffect, useRef } from "react";
import { createContext } from "react";
import { useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const url = "http://localhost:4000";
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("admin_refresh_token") || "",
  );

  // Track if a refresh is already in progress to avoid duplicate calls
  const isRefreshing = useRef(false);
  const failedQueue = useRef([]);

  const processQueue = (newToken) => {
    failedQueue.current.forEach((cb) => cb(newToken));
    failedQueue.current = [];
  };

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    setToken("");
    setRefreshToken("");
  }, []);

  // set up axios response interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        if (
          response.data &&
          response.data.success === false &&
          response.data.expired === true
        ) {
          const originalRequest = response.config;

          // dont retry refresh token endpoint itself
          if (originalRequest.url.includes("/refresh-token")) {
            logout();
            return response;
          }

          // dont retry if already retried
          if (originalRequest._retry) {
            logout();
            return response;
          }

          originalRequest._retry = true;

          if (isRefreshing.current) {
            // Queue this request until refresh completes
            return new Promise((resolve) => {
              failedQueue.current.push((newToken) => {
                if (!newToken) {
                  resolve(response);
                  return;
                }

                originalRequest.headers.token = newToken;
                resolve(axios(originalRequest));
              });
            });
          }

          isRefreshing.current = true;

          const storedRefreshToken = localStorage.getItem(
            "admin_refresh_token",
          );

          return axios
            .post(`${url}/api/user/refresh-token`, {
              refreshToken: storedRefreshToken,
            })
            .then((res) => {
              if (res.data.success) {
                const newToken = res.data.token;
                localStorage.setItem("admin_token", newToken);
                setToken(newToken);
                processQueue(newToken);

                // Retry the original request with the new token
                originalRequest.headers.token = newToken;
                return axios(originalRequest);
              } else {
                processQueue(null);
                logout();
                return response;
              }
            })
            .catch(() => {
              processQueue(null);
              logout();
              return response;
            })
            .finally(() => {
              isRefreshing.current = false;
            });
        }
        return response;
      },
      (error) => Promise.reject(error),
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [url, logout]);


  const refreshAccessToken = useCallback( async () => {
    const storedRefreshToken = localStorage.getItem("admin_refresh_token");
    if (!storedRefreshToken) {
      logout();
      return null;
    }

    try {
      const response = await axios.post(`${url}/api/user/refresh-token`, {refreshToken: storedRefreshToken});

      if (response.data.success) {
        const newToken = response.data.token;
        localStorage.setItem("admin_token", newToken);
        setToken(newToken);
        return newToken;
      }

      logout();
      return null;
    } catch {
      logout();
      return null;
    }
  }, [url, logout]);

  const getTokenExpiryTime = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000;
    } catch  {
      return null;
    }
  }

  useEffect(() => {
    if (!token) return;

    const expiryTime = getTokenExpiryTime(token);
    if (!expiryTime) {
      const timer = setTimeout(() => {
        logout();
      }, 0);
      return () => clearTimeout(timer);
    }

    const refreshTime = expiryTime - Date.now() - 15 * 1000;

    if (refreshTime <= 0) {
      const timer = setTimeout(() => {
        refreshAccessToken();
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      refreshAccessToken();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [token, logout, refreshAccessToken]);

  

  const contextValue = {
    url,
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    logout,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
