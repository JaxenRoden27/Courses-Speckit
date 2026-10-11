import apiClient from "./services.js";
import Utils from "../config/utils.js";
import router from "../router.js";

const authServices = {
  registerUser(payload) {
    return apiClient.post("register", payload);
  },

  loginUser(credentials) {
    return apiClient.post("login", credentials);
  },

  async logoutUser() {
    try {
      await apiClient.post("logout");
    } finally {
      Utils.removeItem("user");
      window.dispatchEvent(new CustomEvent("user-logged-out"));
      await router.push({ name: "login" });
    }
  },
};

export default authServices;
