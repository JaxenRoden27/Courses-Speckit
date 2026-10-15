/**
 * Feature 6 — Enrollment Management
 * Spec: features/feature-6-enrollment-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, authHeader } from "./helpers.js";

const studentEnrollmentsPath = (studentId) =>
  `/course-t4/students/${studentId}/enrollments`;
const oneEnrollmentPath = (studentId, enrollmentId) =>
  `${studentEnrollmentsPath(studentId)}/${enrollmentId}`;
const allEnrollmentsPath = "/course-t4/enrollments";
const sectionsPath = "/course-t4/sections";
const semestersPath = "/course-t4/semesters";

const unauthorizedMessage = "Unauthorized! No token provided.";
const expiredMessage = "Unauthorized! Invalid or expired token.";
const studentRoleMessage = "Student role required.";
const facultyRoleMessage = "Faculty role required.";
const ownEnrollmentsMessage = "You can only access your own enrollments.";

const registerStudent = (overrides = {}) =>
  request(app)
    .post("/course-t4/register")
    .send({
      fName: "Sam",
      lName: "Student",
      email: "sam.student@example.com",
      universityId: "ST1111",
      password: "password123",
      ...overrides,
    });

const insertFacultyUser = async (overrides = {}) => {
  const user = await db.user.create({
    fName: "Alex",
    lName: "Faculty",
    email: "alex.faculty@example.com",
    universityId: "FA0001",
    password: await bcrypt.hash("password123", 10),
    role: "faculty",
    ...overrides,
  });
  const token = `faculty-token-${user.id}`;
  await db.session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    userId: user.id,
  });
  return { user, token, userId: user.id };
};

const seedCourse = (overrides = {}) =>
  db.course.create({
    courseNumber: "CS101",
    courseName: "Programming 1",
    courseDescription: "Intro programming",
    courseTerm: "Fall",
    ...overrides,
  });

const seedFacultyMember = (overrides = {}) =>
  db.faculty.create({
    firstName: "David",
    lastName: "North",
    dept: "Computer Science",
    ...overrides,
  });

const seedSection = (courseId, facultyId, overrides = {}) =>
  db.section.create({
    sectionNumber: "01",
    courseId,
    facultyId,
    daysOfWeek: "MWF",
    startTime: "09:00:00",
    endTime: "09:50:00",
    ...overrides,
  });

const seedSemester = (userId, overrides = {}) =>
  db.semester.create({
    semester: "Fall 2026",
    startDate: "2026-08-27",
    endDate: "2026-12-18",
    userId,
    ...overrides,
  });

const seedCatalog = async () => {
  const student = await registerStudent();
  const facultyMember = await seedFacultyMember();
  const course = await seedCourse();
  const section01 = await seedSection(course.id, facultyMember.id);
  const section02 = await seedSection(course.id, facultyMember.id, {
    sectionNumber: "02",
    daysOfWeek: "TR",
    startTime: "10:00:00",
    endTime: "10:50:00",
  });
  const semester = await seedSemester(student.body.userId);

  return {
    token: student.body.token,
    userId: student.body.userId,
    email: student.body.email,
    course,
    section01,
    section02,
    semester,
  };
};

const enrollmentBody = (sectionId, semesterId, extra = {}) => ({
  sectionId,
  semesterId,
  ...extra,
});

const createEnrollment = (token, studentId, body) =>
  request(app)
    .post(studentEnrollmentsPath(studentId))
    .set(authHeader(token))
    .send(body);

const listStudentEnrollments = (token, studentId) =>
  request(app)
    .get(studentEnrollmentsPath(studentId))
    .set(authHeader(token));

const listAllEnrollments = (token) =>
  request(app).get(allEnrollmentsPath).set(authHeader(token));

const updateEnrollment = (token, studentId, enrollmentId, body) =>
  request(app)
    .put(oneEnrollmentPath(studentId, enrollmentId))
    .set(authHeader(token))
    .send(body);

const deleteEnrollment = (token, studentId, enrollmentId) =>
  request(app)
    .delete(oneEnrollmentPath(studentId, enrollmentId))
    .set(authHeader(token));

describe("Feature 6 — Enrollment Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-6.2 — Create enrollment", () => {
    it("User creates a new enrollment", async () => {
      const missing = await request(app)
        .post(studentEnrollmentsPath(1))
        .send({ sectionId: 1, semesterId: 1 });
      expect(missing.status).toBe(401);
      expect(missing.body).toEqual({ message: unauthorizedMessage });

      const { token, userId, section01, semester } = await seedCatalog();

      const invalid = await createEnrollment(token, userId, {});
      expect(invalid.status).toBe(400);
      expect(invalid.body).toEqual({ message: "Section not found." });
      expect(await db.enrollment.count()).toBe(0);

      const response = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id, { studentId: 999 }),
      );

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body).toMatchObject({
        sectionId: section01.id,
        semesterId: semester.id,
        studentId: userId,
      });
      expect(response.body.createdAt).toBeTruthy();
      expect(response.body.updatedAt).toBeTruthy();

      const stored = await db.enrollment.findByPk(response.body.id);
      expect(stored.sectionId).toBe(section01.id);
      expect(stored.semesterId).toBe(semester.id);
      expect(stored.studentId).toBe(userId);
      expect(await db.enrollment.count()).toBe(1);

      const other = await registerStudent({
        fName: "Pat",
        lName: "Lee",
        email: "pat.student@example.com",
        universityId: "ST2222",
      });
      const forbidden = await createEnrollment(
        token,
        other.body.userId,
        enrollmentBody(section01.id, semester.id),
      );
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ message: ownEnrollmentsMessage });
      expect(
        await db.enrollment.count({ where: { studentId: other.body.userId } }),
      ).toBe(0);

      const { userId: facultyUserId } = await insertFacultyUser();
      const notStudent = await createEnrollment(
        token,
        facultyUserId,
        enrollmentBody(section01.id, semester.id),
      );
      expect(notStudent.status).toBe(404);
      expect(notStudent.body).toEqual({ message: "Student not found." });
      expect(await db.enrollment.count()).toBe(1);
    });

    it("User creates an enrollment with an unknown section", async () => {
      const { token, userId, semester } = await seedCatalog();

      const response = await createEnrollment(
        token,
        userId,
        enrollmentBody(999999, semester.id),
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Section not found." });
      expect(await db.enrollment.count()).toBe(0);
    });

    it("User creates an enrollment with an unknown semester", async () => {
      const { token, userId, section01 } = await seedCatalog();

      const response = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, 999999),
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Semester not found." });
      expect(await db.enrollment.count()).toBe(0);
    });
  });

  describe("US-6.3 — Student View enrollments", () => {
    it("Student enrollments view loads with existing enrollments", async () => {
      const { token, userId, section01, section02, semester } = await seedCatalog();
      const laterSection = await createEnrollment(
        token,
        userId,
        enrollmentBody(section02.id, semester.id),
      );
      expect(laterSection.status).toBe(201);
      const earlierSection = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );
      expect(earlierSection.status).toBe(201);

      const other = await registerStudent({
        fName: "Pat",
        lName: "Lee",
        email: "pat.student@example.com",
        universityId: "ST2222",
      });
      const otherSemester = await seedSemester(other.body.userId, {
        semester: "Spring 2026",
      });
      await db.enrollment.create({
        sectionId: section01.id,
        semesterId: otherSemester.id,
        studentId: other.body.userId,
      });

      const response = await listStudentEnrollments(token, userId);

      expect(response.status).toBe(200);
      expect(response.body.map((enrollment) => enrollment.sectionId)).toEqual([
        section01.id,
        section02.id,
      ]);
      expect(response.body.every((enrollment) => enrollment.studentId === userId)).toBe(
        true,
      );
      expect(response.body).toEqual([
        expect.objectContaining({
          id: earlierSection.body.id,
          sectionId: section01.id,
          semesterId: semester.id,
          studentId: userId,
        }),
        expect.objectContaining({
          id: laterSection.body.id,
          sectionId: section02.id,
          semesterId: semester.id,
          studentId: userId,
        }),
      ]);
    });
  });

  describe("US-6.4 — Faculty View enrollments", () => {
    it("Faculty enrollments view loads with existing enrollments", async () => {
      const { userId, section01, section02, semester } = await seedCatalog();
      const second = await registerStudent({
        fName: "Pat",
        lName: "Lee",
        email: "pat.student@example.com",
        universityId: "ST2222",
      });
      const secondSemester = await seedSemester(second.body.userId, {
        semester: "Spring 2026",
      });
      const firstEnrollment = await db.enrollment.create({
        sectionId: section02.id,
        semesterId: semester.id,
        studentId: userId,
      });
      const secondEnrollment = await db.enrollment.create({
        sectionId: section01.id,
        semesterId: secondSemester.id,
        studentId: second.body.userId,
      });
      const { token } = await insertFacultyUser();

      const response = await listAllEnrollments(token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({
          id: secondEnrollment.id,
          sectionId: section01.id,
          semesterId: secondSemester.id,
          studentId: second.body.userId,
        }),
        expect.objectContaining({
          id: firstEnrollment.id,
          sectionId: section02.id,
          semesterId: semester.id,
          studentId: userId,
        }),
      ]);
    });
  });

  describe("US-6.6 — Edit an enrollment", () => {
    it("User edits an enrollment with valid values and saves", async () => {
      const missingToken = await request(app)
        .put(oneEnrollmentPath(1, 1))
        .send({ sectionId: 1, semesterId: 1 });
      expect(missingToken.status).toBe(401);
      expect(missingToken.body).toEqual({ message: unauthorizedMessage });

      const { token, userId, section01, section02, semester } = await seedCatalog();
      const created = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );
      const enrollmentId = created.body.id;

      const response = await updateEnrollment(
        token,
        userId,
        enrollmentId,
        enrollmentBody(section02.id, semester.id),
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: enrollmentId,
        sectionId: section02.id,
        semesterId: semester.id,
        studentId: userId,
      });
      expect((await db.enrollment.findByPk(enrollmentId)).sectionId).toBe(section02.id);

      const missing = await updateEnrollment(
        token,
        userId,
        999999,
        enrollmentBody(section01.id, semester.id),
      );
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({
        message: "Enrollment with id=999999 not found.",
      });

      const other = await registerStudent({
        fName: "Pat",
        lName: "Lee",
        email: "pat.student@example.com",
        universityId: "ST2222",
      });
      const forbidden = await updateEnrollment(
        other.body.token,
        userId,
        enrollmentId,
        enrollmentBody(section01.id, semester.id),
      );
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ message: ownEnrollmentsMessage });
      expect((await db.enrollment.findByPk(enrollmentId)).sectionId).toBe(section02.id);

      const second = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );
      const duplicate = await updateEnrollment(
        token,
        userId,
        second.body.id,
        enrollmentBody(section02.id, semester.id),
      );
      expect(duplicate.status).toBe(400);
      expect(duplicate.body).toEqual({ message: "Enrollment already exists." });
      expect((await db.enrollment.findByPk(second.body.id)).sectionId).toBe(section01.id);
    });
  });

  describe("US-6.7 — Delete an enrollment", () => {
    it("User deletes an enrollment", async () => {
      const missingToken = await request(app).delete(oneEnrollmentPath(1, 1));
      expect(missingToken.status).toBe(401);
      expect(missingToken.body).toEqual({ message: unauthorizedMessage });

      const { token, userId, section01, semester } = await seedCatalog();
      const created = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );
      const enrollmentId = created.body.id;

      const other = await registerStudent({
        fName: "Pat",
        lName: "Lee",
        email: "pat.student@example.com",
        universityId: "ST2222",
      });
      const forbidden = await deleteEnrollment(other.body.token, userId, enrollmentId);
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ message: ownEnrollmentsMessage });
      expect(await db.enrollment.findByPk(enrollmentId)).not.toBeNull();

      const response = await deleteEnrollment(token, userId, enrollmentId);
      expect(response.status).toBe(200);
      expect(await db.enrollment.findByPk(enrollmentId)).toBeNull();
      expect(await db.enrollment.count()).toBe(0);

      const missing = await deleteEnrollment(token, userId, enrollmentId);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({
        message: `Enrollment with id=${enrollmentId} not found.`,
      });
    });
  });

  describe("US-6.8 — Restrict enrollment management to students", () => {
    it("Student can GET enrollments via the API", async () => {
      const { token, userId, section01, semester } = await seedCatalog();
      await createEnrollment(token, userId, enrollmentBody(section01.id, semester.id));

      const response = await listStudentEnrollments(token, userId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({
          sectionId: section01.id,
          semesterId: semester.id,
          studentId: userId,
        }),
      ]);
    });

    it("Faculty can GET enrollments via the API", async () => {
      const { userId, section01, semester } = await seedCatalog();
      await db.enrollment.create({
        sectionId: section01.id,
        semesterId: semester.id,
        studentId: userId,
      });
      const { token } = await insertFacultyUser();

      const response = await listAllEnrollments(token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({
          sectionId: section01.id,
          semesterId: semester.id,
          studentId: userId,
        }),
      ]);
    });

    it("Faculty cannot create an enrollment via the API", async () => {
      const { userId, section01, semester } = await seedCatalog();
      const { token } = await insertFacultyUser();

      const response = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: studentRoleMessage });
      expect(await db.enrollment.count()).toBe(0);
    });

    it("Faculty cannot update an enrollment via the API", async () => {
      const { userId, section01, section02, semester } = await seedCatalog();
      const enrollment = await db.enrollment.create({
        sectionId: section01.id,
        semesterId: semester.id,
        studentId: userId,
      });
      const { token } = await insertFacultyUser();

      const response = await updateEnrollment(
        token,
        userId,
        enrollment.id,
        enrollmentBody(section02.id, semester.id),
      );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: studentRoleMessage });
      expect((await db.enrollment.findByPk(enrollment.id)).sectionId).toBe(section01.id);
    });

    it("Faculty cannot delete an enrollment via the API", async () => {
      const { userId, section01, semester } = await seedCatalog();
      const enrollment = await db.enrollment.create({
        sectionId: section01.id,
        semesterId: semester.id,
        studentId: userId,
      });
      const { token } = await insertFacultyUser();

      const response = await deleteEnrollment(token, userId, enrollment.id);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: studentRoleMessage });
      expect(await db.enrollment.findByPk(enrollment.id)).not.toBeNull();
    });

    it("Student cannot read another student's enrollments", async () => {
      const { token, section01 } = await seedCatalog();
      const other = await registerStudent({
        fName: "Pat",
        lName: "Lee",
        email: "pat.student@example.com",
        universityId: "ST2222",
      });
      const otherSemester = await seedSemester(other.body.userId, {
        semester: "Spring 2026",
      });
      await db.enrollment.create({
        sectionId: section01.id,
        semesterId: otherSemester.id,
        studentId: other.body.userId,
      });

      const response = await listStudentEnrollments(token, other.body.userId);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: ownEnrollmentsMessage });
      expect(await db.enrollment.count({ where: { studentId: other.body.userId } })).toBe(
        1,
      );
    });

    it("Student cannot list every enrollment", async () => {
      const { token } = await seedCatalog();

      const response = await listAllEnrollments(token);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: facultyRoleMessage });
    });

    it("Student cannot enroll in the same section twice", async () => {
      const { token, userId, section01, semester } = await seedCatalog();
      const first = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );
      expect(first.status).toBe(201);

      const duplicate = await createEnrollment(
        token,
        userId,
        enrollmentBody(section01.id, semester.id),
      );

      expect(duplicate.status).toBe(400);
      expect(duplicate.body).toEqual({ message: "Enrollment already exists." });
      expect(
        await db.enrollment.count({
          where: { studentId: userId, sectionId: section01.id },
        }),
      ).toBe(1);
    });

    it("Unauthenticated API request to enrollments", async () => {
      const missing = await request(app).get(studentEnrollmentsPath(1));
      expect(missing.status).toBe(401);
      expect(missing.body).toEqual({ message: unauthorizedMessage });

      const student = await registerStudent();
      await db.session.create({
        token: "expired-enrollment-token",
        email: student.body.email,
        expirationDate: new Date(Date.now() - 60 * 1000),
        userId: student.body.userId,
      });
      const expired = await request(app)
        .get(studentEnrollmentsPath(student.body.userId))
        .set(authHeader("expired-enrollment-token"));
      expect(expired.status).toBe(401);
      expect(expired.body).toEqual({ message: expiredMessage });
    });
  });

  describe("US-6.9 — Block delete of a section and semester that has an enrollment", () => {
    it("User cannot delete a section that has an enrollment", async () => {
      const { userId, section01, semester } = await seedCatalog();
      const enrollment = await db.enrollment.create({
        sectionId: section01.id,
        semesterId: semester.id,
        studentId: userId,
      });
      const { token } = await insertFacultyUser();

      const response = await request(app)
        .delete(`${sectionsPath}/${section01.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete section: enrollments still exist.",
      });
      expect(await db.section.findByPk(section01.id)).not.toBeNull();
      expect(await db.enrollment.findByPk(enrollment.id)).not.toBeNull();
    });

    it("User cannot delete a semester that has an enrollment", async () => {
      const { token, userId, section01, semester } = await seedCatalog();
      const enrollment = await db.enrollment.create({
        sectionId: section01.id,
        semesterId: semester.id,
        studentId: userId,
      });

      const response = await request(app)
        .delete(`${semestersPath}/${semester.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete semester: enrollments still exist.",
      });
      expect(await db.semester.findByPk(semester.id)).not.toBeNull();
      expect(await db.enrollment.findByPk(enrollment.id)).not.toBeNull();
    });
  });
});
