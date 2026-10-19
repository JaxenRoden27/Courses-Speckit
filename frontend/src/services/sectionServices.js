import apiClient from "./services.js";

const sectionServices = {
  getSections() {
    return apiClient.get("sections");
  },

  createSection(section) {
    return apiClient.post("sections", section);
  },

  updateSection(sectionId, section) {
    return apiClient.put(`sections/${sectionId}`, section);
  },

  deleteSection(sectionId) {
    return apiClient.delete(`sections/${sectionId}`);
  },

};

export default sectionServices;