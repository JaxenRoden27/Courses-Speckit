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

  updateEnrollment(studentId, enrollmentId, enrollment) {
    return apiClient.put(
      `students/${studentId}/enrollments/${enrollmentId}`,
      enrollment,
    );
  },

  deleteEnrollment(studentId, enrollmentId) {
    return apiClient.delete(
      `students/${studentId}/enrollments/${enrollmentId}`,
    );
  },
};

export default enrollmentServices;