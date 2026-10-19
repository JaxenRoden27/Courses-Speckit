import apiClient from "./services.js";

const userServices = {
  getUsers() {
    return apiClient.get("users");
  },

  getUser(userId) {
    return apiClient.get(`users/${userId}`);
  },

  updateUser(userId, payload) {
    return apiClient.put(`users/${userId}`, payload);
  },
};

export default userServices;
