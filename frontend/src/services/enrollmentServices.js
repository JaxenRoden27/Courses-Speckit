import apiClient from "./services.js";

const enrollmentServices = {
  getStudentEnrollments(studentId) {
    return apiClient.get(`students/${studentId}/enrollments`);
  },

  getEnrollments() {
    return apiClient.get("enrollments");
  },

  createEnrollment(studentId, enrollment) {
    return apiClient.post(`students/${studentId}/enrollments`, enrollment);
  },

  updateEnrollment(arg1, arg2, arg3) {
    if (arg3 !== undefined) {
      return apiClient.put(
        `students/${arg1}/enrollments/${arg2}`,
        arg3,
      );
    }
    return apiClient.put(`academic/enrollments/${arg1}`, arg2);
  },

  deleteEnrollment(studentId, enrollmentId) {
    return apiClient.delete(
      `students/${studentId}/enrollments/${enrollmentId}`,
    );
  },
};

export default enrollmentServices;