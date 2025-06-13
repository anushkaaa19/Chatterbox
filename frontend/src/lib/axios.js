import axios from "axios";
export const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === "development" 
    ? "http://localhost:5001/api" 
    : "https://chatterbox-backend-rus5.onrender.com/api", // Add your production URL here
  withCredentials: true,
  timeout: 20000,
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