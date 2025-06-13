import axios from "axios";
export const axiosInstance = axios.create({
  baseURL: "https://chatterbox-backend-rus5.onrender.com/api",
  withCredentials: true, // IMPORTANT if using cookies
  timeout:2000,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
    }
    
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
    }
    
    return Promise.reject(error);
  }
);