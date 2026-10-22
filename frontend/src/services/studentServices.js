import apiClient from "./services.js";

const studentServices = {
  getStudents() {
    return apiClient.get("users?role=student");
  },

  getStudent(studentId) {
    return apiClient.get(`users/${studentId}`);
  },

  getStudentCourses(studentId) {
    return apiClient.get(`academic/students/${studentId}/courses`);
  },

  enrollCourse(studentId, enrollmentData) {
    return apiClient.post(`academic/students/${studentId}/courses`, enrollmentData);
  },

  updateEnrollment(enrollmentId, enrollmentData) {
    return apiClient.put(`academic/enrollments/${enrollmentId}`, enrollmentData);
  },
};

export default studentServices;
