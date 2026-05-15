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

                // Retry the original request with the new token
                originalRequest.headers.token = newToken;
                return axios(originalRequest);
              } else {
                logout();
                return response;
              }
            })
            .catch(() => {
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

  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      setToken(localStorage.getItem("admin_token"));
    }

    if (localStorage.getItem("admin_refresh_token")) {
      setRefreshToken(localStorage.getItem("admin_refresh_token"));
    }
  }, []);

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
