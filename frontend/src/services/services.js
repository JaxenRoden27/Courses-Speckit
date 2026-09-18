import axios from "axios";
import Utils from "../config/utils.js";
import router from "../router.js";

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:3200/api/" : "/api/",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const user = Utils.getStore("user");

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";

    if (error.response?.status === 401 || /Unauthorized/i.test(message)) {
      Utils.removeItem("user");
      if (router.hasRoute("login")) {
        router.push({ name: "login" });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
