import apiClient from "./services.js";

const courseServices = {
  findAll() {
    return apiClient.get("courses");
  },

  getCourses() {
    return apiClient.get("courses");
  },

  create(course) {
    return apiClient.post("courses", course);
  },

  update(courseId, course) {  
    return apiClient.put(`courses/${courseId}`, course);
  },

  delete(courseId) {
    return apiClient.delete(`courses/${courseId}`);
  },
};

export default courseServices;
