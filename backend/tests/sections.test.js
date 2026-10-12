/**
 * Feature 5 — Section Management
 * Spec: features/feature-5-section-management.md
 *
 * Feature 6 — Enrollment Management
 * Spec: features/feature-6-enrollment-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, authHeader } from "./helpers.js";

const sectionsPath = "/course-t4/sections";
const oneSectionPath = (sectionId) => `${sectionsPath}/${sectionId}`;

const unauthorizedMessage = "Unauthorized! No token provided.";
const expiredMessage = "Unauthorized! Invalid or expired token.";
const facultyRoleMessage = "Faculty role required.";

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

const validSection = (courseId, facultyId, overrides = {}) => ({
  sectionNumber: "01",
  courseId,
  facultyId,
  daysOfWeek: "MWF",
  startTime: "09:00:00",
  endTime: "09:50:00",
  ...overrides,
});

const createSection = (token, body) =>
  request(app).post(sectionsPath).set(authHeader(token)).send(body);

const listSections = (token) =>
  request(app).get(sectionsPath).set(authHeader(token));

const updateSection = (token, sectionId, body) =>
  request(app).put(oneSectionPath(sectionId)).set(authHeader(token)).send(body);

const deleteSection = (token, sectionId) =>
  request(app).delete(oneSectionPath(sectionId)).set(authHeader(token));

describe("Feature 5 — Section Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-5.2 — Create section", () => {
    it("User creates a new section", async () => {
      const missing = await request(app).post(sectionsPath).send(
        validSection(1, 1),
      );
      expect(missing.status).toBe(401);
      expect(missing.body).toEqual({ message: unauthorizedMessage });

      const { token } = await insertFacultyUser();
      const course = await seedCourse();
      const facultyMember = await seedFacultyMember();

      const response = await createSection(token, {
        ...validSection(course.id, facultyMember.id, {
          sectionNumber: "  01  ",
          daysOfWeek: "  MWF  ",
          startTime: " 09:00:00 ",
          endTime: " 09:50:00 ",
        }),
        userId: 4242,
      });

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body).toMatchObject({
        sectionNumber: "01",
        courseId: course.id,
        facultyId: facultyMember.id,
        daysOfWeek: "MWF",
        startTime: "09:00:00",
        endTime: "09:50:00",
      });
      expect(response.body.userId).toBeUndefined();
      expect(response.body.course).toMatchObject({
        id: course.id,
        courseName: "Programming 1",
      });
      expect(response.body.createdAt).toBeTruthy();
      expect(response.body.updatedAt).toBeTruthy();

      const stored = await db.section.findByPk(response.body.id);
      expect(stored.sectionNumber).toBe("01");
      expect(stored.courseId).toBe(course.id);
      expect(stored.daysOfWeek).toBe("MWF");
      expect(stored.userId).toBeUndefined();
      expect(await db.section.count()).toBe(1);

      const blank = await createSection(
        token,
        validSection(course.id, facultyMember.id, { sectionNumber: "   " }),
      );
      expect(blank.status).toBe(400);
      expect(blank.body).toEqual({ message: "Required" });

      const tooLong = await createSection(
        token,
        validSection(course.id, facultyMember.id, {
          sectionNumber: "12345678901",
        }),
      );
      expect(tooLong.status).toBe(400);
      expect(tooLong.body).toEqual({
        message: "Section number must be 10 characters or fewer.",
      });

      const backwards = await createSection(
        token,
        validSection(course.id, facultyMember.id, {
          sectionNumber: "02",
          startTime: "10:00:00",
          endTime: "09:00:00",
        }),
      );
      expect(backwards.status).toBe(400);
      expect(backwards.body).toEqual({
        message: "Start time must be earlier than end time.",
      });
      expect(await db.section.count()).toBe(1);
    });

    it("User creates a section with an unknown course", async () => {
      const { token } = await insertFacultyUser();
      const facultyMember = await seedFacultyMember();

      const response = await createSection(
        token,
        validSection(999999, facultyMember.id),
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Course not found." });
      expect(await db.section.count()).toBe(0);
    });

    it("User creates a section with a duplicate number in the same course", async () => {
      const { token } = await insertFacultyUser();
      const programming1 = await seedCourse();
      const programming2 = await seedCourse({
        courseNumber: "CS102",
        courseName: "Programming 2",
      });
      const facultyMember = await seedFacultyMember();
      const body = validSection(programming1.id, facultyMember.id);

      const first = await createSection(token, body);
      expect(first.status).toBe(201);

      const otherCourse = await createSection(
        token,
        validSection(programming2.id, facultyMember.id),
      );
      expect(otherCourse.status).toBe(201);

      const duplicate = await createSection(token, body);
      expect(duplicate.status).toBe(400);
      expect(duplicate.body).toEqual({
        message: "Section number is already taken in this course.",
      });
      expect(
        await db.section.count({
          where: { courseId: programming1.id, sectionNumber: "01" },
        }),
      ).toBe(1);
    });
  });

  describe("US-5.3 — View sections", () => {
    it("Sections are shown under their course", async () => {
      const { token } = await insertFacultyUser();
      const programming2 = await seedCourse({
        courseNumber: "CS102",
        courseName: "Programming 2",
      });
      const programming1 = await seedCourse();
      const facultyMember = await seedFacultyMember();

      await createSection(
        token,
        validSection(programming2.id, facultyMember.id, {
          sectionNumber: "02",
        }),
      );
      await createSection(
        token,
        validSection(programming1.id, facultyMember.id),
      );

      const response = await listSections(token);

      expect(response.status).toBe(200);
      expect(response.body.map((section) => section.sectionNumber)).toEqual([
        "01",
        "02",
      ]);
      expect(response.body.map((section) => section.course.courseName)).toEqual([
        "Programming 1",
        "Programming 2",
      ]);
      expect(response.body[0].courseId).toBe(programming1.id);
      expect(response.body[1].courseId).toBe(programming2.id);
    });
  });

  describe("US-5.6 — Edit a section", () => {
    it("User edits a section with valid values and saves", async () => {
      const { token } = await insertFacultyUser();
      const programming1 = await seedCourse();
      const programming2 = await seedCourse({
        courseNumber: "CS102",
        courseName: "Programming 2",
      });
      const facultyMember = await seedFacultyMember();
      const created = await createSection(
        token,
        validSection(programming1.id, facultyMember.id),
      );
      const sectionId = created.body.id;

      const response = await updateSection(
        token,
        sectionId,
        validSection(programming2.id, facultyMember.id, {
          sectionNumber: "02",
          daysOfWeek: "TR",
          startTime: "10:00:00",
          endTime: "10:50:00",
        }),
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: sectionId,
        sectionNumber: "02",
        courseId: programming2.id,
        facultyId: facultyMember.id,
        daysOfWeek: "TR",
        startTime: "10:00:00",
        endTime: "10:50:00",
      });
      expect(response.body.course).toMatchObject({
        id: programming2.id,
        courseName: "Programming 2",
      });

      const stored = await db.section.findByPk(sectionId);
      expect(stored.sectionNumber).toBe("02");
      expect(stored.courseId).toBe(programming2.id);
      expect(stored.daysOfWeek).toBe("TR");

      const missing = await updateSection(
        token,
        999999,
        validSection(programming1.id, facultyMember.id),
      );
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({
        message: "Section with id=999999 not found.",
      });

      const student = await registerStudent();
      const forbidden = await updateSection(
        student.body.token,
        sectionId,
        validSection(programming1.id, facultyMember.id, {
          sectionNumber: "03",
        }),
      );
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ message: facultyRoleMessage });
      expect((await db.section.findByPk(sectionId)).sectionNumber).toBe("02");

      const backwards = await updateSection(
        token,
        sectionId,
        validSection(programming2.id, facultyMember.id, {
          sectionNumber: "02",
          startTime: "11:00:00",
          endTime: "10:00:00",
        }),
      );
      expect(backwards.status).toBe(400);
      expect(backwards.body).toEqual({
        message: "Start time must be earlier than end time.",
      });
      expect((await db.section.findByPk(sectionId)).startTime).toBe("10:00:00");
    });
  });

  describe("US-5.7 — Delete a section", () => {
    it("User deletes a section", async () => {
      const { token } = await insertFacultyUser();
      const course = await seedCourse();
      const facultyMember = await seedFacultyMember();
      const created = await createSection(
        token,
        validSection(course.id, facultyMember.id),
      );
      const sectionId = created.body.id;

      const student = await registerStudent();
      const forbidden = await deleteSection(student.body.token, sectionId);
      expect(forbidden.status).toBe(403);
      expect(forbidden.body).toEqual({ message: facultyRoleMessage });
      expect(await db.section.findByPk(sectionId)).not.toBeNull();

      const response = await deleteSection(token, sectionId);
      expect(response.status).toBe(200);
      expect(await db.section.findByPk(sectionId)).toBeNull();
      expect(await db.section.count()).toBe(0);

      const missing = await deleteSection(token, sectionId);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({
        message: `Section with id=${sectionId} not found.`,
      });
    });
  });

  describe("US-5.8 — Restrict section management to faculty", () => {
    it("Student can list sections via the API", async () => {
      const { token } = await insertFacultyUser();
      const course = await seedCourse();
      const facultyMember = await seedFacultyMember();
      await createSection(token, validSection(course.id, facultyMember.id));
      const student = await registerStudent();

      const response = await listSections(student.body.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({
          sectionNumber: "01",
          courseId: course.id,
          facultyId: facultyMember.id,
          daysOfWeek: "MWF",
          startTime: "09:00:00",
          endTime: "09:50:00",
        }),
      ]);
    });

    it("Student cannot create a section via the API", async () => {
      const course = await seedCourse();
      const facultyMember = await seedFacultyMember();
      const student = await registerStudent();

      const response = await createSection(
        student.body.token,
        validSection(course.id, facultyMember.id),
      );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: facultyRoleMessage });
      expect(await db.section.count()).toBe(0);
    });

    it("Unauthenticated API request to sections", async () => {
      const missing = await request(app).get(sectionsPath);
      expect(missing.status).toBe(401);
      expect(missing.body).toEqual({ message: unauthorizedMessage });

      const { user, userId } = await insertFacultyUser();
      await db.session.create({
        token: "expired-section-token",
        email: user.email,
        expirationDate: new Date(Date.now() - 60 * 1000),
        userId,
      });
      const expired = await request(app)
        .get(sectionsPath)
        .set(authHeader("expired-section-token"));
      expect(expired.status).toBe(401);
      expect(expired.body).toEqual({ message: expiredMessage });
    });
  });
});

describe("Feature 6 — Enrollment Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-6.9 — Block delete of a section and semester that has an enrollment", () => {
    it("User cannot delete a section that has an enrollment", async () => {
      const { token } = await insertFacultyUser();
      const student = await registerStudent();
      const course = await seedCourse();
      const facultyMember = await seedFacultyMember();
      const created = await createSection(
        token,
        validSection(course.id, facultyMember.id),
      );
      const sectionId = created.body.id;
      const semester = await db.semester.create({
        semester: "Fall 2026",
        startDate: "2026-08-27",
        endDate: "2026-12-18",
        userId: student.body.userId,
      });
      const enrollment = await db.enrollment.create({
        sectionId,
        semesterId: semester.id,
        studentId: student.body.userId,
      });

      const response = await deleteSection(token, sectionId);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete section: enrollments still exist.",
      });
      expect(await db.section.findByPk(sectionId)).not.toBeNull();
      expect(await db.enrollment.findByPk(enrollment.id)).not.toBeNull();
    });
  });
});
