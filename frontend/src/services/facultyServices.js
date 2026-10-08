import apiClient from "./services.js";

const facultyServices = {
  getFaculty() {
    return apiClient.get("faculty");
  },

  createFaculty(faculty) {
    return apiClient.post("faculty", faculty);
  },

  updateFaculty(facultyId, faculty) {
    return apiClient.put(`faculty/${facultyId}`, faculty);
  },

  deleteFaculty(facultyId) {
    return apiClient.delete(`faculty/${facultyId}`);
  },
};

export default facultyServices;