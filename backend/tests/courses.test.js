/**
 * Feature 3 — Course Management
 * Spec: features/feature-3-course-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, authHeader } from "./helpers.js";

const coursesPath = "/course-t4/courses";
const oneCoursePath = (courseId) => `${coursesPath}/${courseId}`;

const unauthorizedMessage = "Unauthorized! No token provided.";
const expiredMessage = "Unauthorized! Invalid or expired token.";
const facultyRoleMessage = "Faculty role required.";
const notFoundMessage = (courseId) => `Cannot find Course with id=${courseId}.`;

const validCourse = (overrides = {}) => ({
  courseNumber: "CS101",
  courseName: "Intro to CS",
  courseDescription: "Basic concepts",
  courseTerm: "Spring",
  ...overrides,
});

const registerStudent = (overrides = {}) =>
  request(app)
    .post("/course-t4/register")
    .send({
      fName: "Jane",
      lName: "Doe",
      email: "jane@example.com",
      universityId: "ST1111",
      password: "password123",
      ...overrides,
    });

const insertFaculty = async (overrides = {}) => {
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

const createCourse = (token, body) =>
  request(app).post(coursesPath).set(authHeader(token)).send(body);

const listCourses = (token) =>
  request(app).get(coursesPath).set(authHeader(token));

const expectMissingToken = async (method, path, body) => {
  const call = request(app)[method](path);
  const response = body === undefined ? await call : await call.send(body);
  expect(response.status).toBe(401);
  expect(response.body).toEqual({ message: unauthorizedMessage });
};

const seedCourse = (overrides = {}) => db.course.create(validCourse(overrides));

describe("Feature 3 — Course Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.2 — Create Course", () => {
    it("Signed-in faculty creates a new course", async () => {
      await expectMissingToken("post", coursesPath, validCourse());

      const faculty = await insertFaculty();
      const response = await createCourse(
        faculty.token,
        validCourse({
          courseNumber: "  CS101  ",
          courseName: "  Intro to CS  ",
          courseDescription: "  Basic concepts  ",
          courseTerm: "  Spring  ",
          userId: 999999,
          sections: "[{}]",
        }),
      );

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        courseNumber: "CS101",
        courseName: "Intro to CS",
        courseDescription: "Basic concepts",
        courseTerm: "Spring",
      });
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.userId).toBeUndefined();
      expect(response.body.createdAt).toBeTruthy();
      expect(response.body.updatedAt).toBeTruthy();

      const stored = await db.course.findByPk(response.body.id);
      expect(stored.courseNumber).toBe("CS101");
      expect(stored.courseTerm).toBe("Spring");
      expect(stored.userId).toBeUndefined();
      expect(await db.course.count()).toBe(1);

      const duplicate = await createCourse(
        faculty.token,
        validCourse({ courseName: "Another name" }),
      );
      expect(duplicate.status).toBe(400);
      expect(duplicate.body).toEqual({ message: "Course number already exists." });
      expect(await db.course.count()).toBe(1);

      const tooLong = await createCourse(
        faculty.token,
        validCourse({ courseNumber: "C".repeat(16), courseName: "Too Long" }),
      );
      expect(tooLong.status).toBe(400);
      expect(tooLong.body).toEqual({
        message: "Course number must be at most 15 characters.",
      });
      expect(await db.course.count()).toBe(1);

      const missingTerm = await createCourse(faculty.token, {
        courseNumber: "CS102",
        courseName: "Data Structures",
        courseDescription: "Lists and trees",
      });
      expect(missingTerm.status).toBe(400);
      expect(missingTerm.body).toEqual({
        message: "Course Term cannot be empty for course!",
      });

      const blankTerm = await createCourse(
        faculty.token,
        validCourse({ courseNumber: "CS103", courseTerm: "   " }),
      );
      expect(blankTerm.status).toBe(400);
      expect(blankTerm.body).toEqual({
        message: "Course Term cannot be empty for course!",
      });
      expect(await db.course.count()).toBe(1);

      await db.session.create({
        token: "expired-course-token",
        email: faculty.user.email,
        expirationDate: new Date(Date.now() - 60 * 1000),
        userId: faculty.userId,
      });
      const expired = await request(app)
        .post(coursesPath)
        .set(authHeader("expired-course-token"))
        .send(validCourse({ courseNumber: "CS104" }));
      expect(expired.status).toBe(401);
      expect(expired.body).toEqual({ message: expiredMessage });
    });

    it("Create without course number is rejected", async () => {
      const faculty = await insertFaculty();
      const body = validCourse();
      delete body.courseNumber;

      const missing = await createCourse(faculty.token, body);
      expect(missing.status).toBe(400);
      expect(missing.body).toEqual({
        message: "Course Number cannot be empty for course!",
      });

      const blank = await createCourse(faculty.token, validCourse({ courseNumber: "   " }));
      expect(blank.status).toBe(400);
      expect(blank.body).toEqual({
        message: "Course Number cannot be empty for course!",
      });
      expect(await db.course.count()).toBe(0);
    });

    it("Create without course name is rejected", async () => {
      const faculty = await insertFaculty();
      const body = validCourse();
      delete body.courseName;

      const missing = await createCourse(faculty.token, body);
      expect(missing.status).toBe(400);
      expect(missing.body).toEqual({
        message: "Course Name cannot be empty for course!",
      });

      const blank = await createCourse(faculty.token, validCourse({ courseName: "   " }));
      expect(blank.status).toBe(400);
      expect(blank.body).toEqual({
        message: "Course Name cannot be empty for course!",
      });
      expect(await db.course.count()).toBe(0);
    });
  });

  describe("US-3.3 — Read Course Catalog", () => {
    it("Signed-in faculty views courses catalog", async () => {
      await expectMissingToken("get", coursesPath);

      const faculty = await insertFaculty();
      await seedCourse({
        courseNumber: "CS101",
        courseName: "Intro to CS",
        courseTerm: "Spring",
      });
      await seedCourse({
        courseNumber: "CS201",
        courseName: "Algorithms",
        courseDescription: "Design of algorithms.",
        courseTerm: "Fall",
      });

      const response = await listCourses(faculty.token);

      expect(response.status).toBe(200);
      expect(response.body.map((course) => course.courseName)).toEqual([
        "Algorithms",
        "Intro to CS",
      ]);
      expect(response.body).toEqual([
        expect.objectContaining({
          courseNumber: "CS201",
          courseName: "Algorithms",
          courseTerm: "Fall",
        }),
        expect.objectContaining({
          courseNumber: "CS101",
          courseName: "Intro to CS",
          courseTerm: "Spring",
        }),
      ]);
    });
  });

  describe("US-3.5 — Edit Course", () => {
    it("Signed-in faculty updates course details", async () => {
      await expectMissingToken("put", oneCoursePath(1), validCourse({ courseTerm: "Fall" }));

      const faculty = await insertFaculty();
      const existing = await seedCourse();

      const response = await request(app)
        .put(oneCoursePath(existing.id))
        .set(authHeader(faculty.token))
        .send(validCourse({ courseTerm: "Fall", userId: 999999 }));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Course was updated successfully.",
      });

      const listed = await listCourses(faculty.token);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([
        expect.objectContaining({
          id: existing.id,
          courseNumber: "CS101",
          courseName: "Intro to CS",
          courseTerm: "Fall",
        }),
      ]);

      const missing = await request(app)
        .put(oneCoursePath(existing.id + 1000))
        .set(authHeader(faculty.token))
        .send(validCourse({ courseTerm: "Winter" }));
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ message: notFoundMessage(existing.id + 1000) });
    });
  });

  describe("US-3.6 — Delete Course", () => {
    it("Signed-in faculty deletes a course with confirmation", async () => {
      await expectMissingToken("delete", oneCoursePath(1));

      const faculty = await insertFaculty();
      const existing = await seedCourse();

      const response = await request(app)
        .delete(oneCoursePath(existing.id))
        .set(authHeader(faculty.token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Course was deleted successfully!",
      });
      expect(await db.course.count()).toBe(0);

      const listed = await listCourses(faculty.token);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([]);

      const missing = await request(app)
        .delete(oneCoursePath(existing.id))
        .set(authHeader(faculty.token));
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ message: notFoundMessage(existing.id) });
    });
  });

  describe("US-3.7 — Role-Based Access Control", () => {
    it("Student user edit access restricted", async () => {
      const registered = await registerStudent();
      const existing = await seedCourse();
      const before = await db.course.findByPk(existing.id);

      const created = await createCourse(
        registered.body.token,
        validCourse({
          courseNumber: "CS999",
          courseName: "Should Not Exist",
        }),
      );
      expect(created.status).toBe(403);
      expect(created.body).toEqual({ message: facultyRoleMessage });

      const updated = await request(app)
        .put(oneCoursePath(existing.id))
        .set(authHeader(registered.body.token))
        .send(validCourse({ courseTerm: "Winter", courseName: "Renamed" }));
      expect(updated.status).toBe(403);
      expect(updated.body).toEqual({ message: facultyRoleMessage });

      const removed = await request(app)
        .delete(oneCoursePath(existing.id))
        .set(authHeader(registered.body.token));
      expect(removed.status).toBe(403);
      expect(removed.body).toEqual({ message: facultyRoleMessage });

      const after = await db.course.findByPk(existing.id);
      expect(after.courseName).toBe(before.courseName);
      expect(after.courseNumber).toBe(before.courseNumber);
      expect(after.courseTerm).toBe(before.courseTerm);
      expect(await db.course.count()).toBe(1);
    });

    it("Student user GET access", async () => {
      const registered = await registerStudent();
      const existing = await seedCourse();

      const listed = await listCourses(registered.body.token);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([
        expect.objectContaining({
          id: existing.id,
          courseNumber: "CS101",
          courseName: "Intro to CS",
        }),
      ]);

      const one = await request(app)
        .get(oneCoursePath(existing.id))
        .set(authHeader(registered.body.token));
      expect(one.status).toBe(200);
      expect(one.body).toEqual([
        expect.objectContaining({
          id: existing.id,
          courseNumber: "CS101",
          courseName: "Intro to CS",
        }),
      ]);

      const stored = await db.course.findByPk(existing.id);
      expect(stored.courseName).toBe(existing.courseName);
      expect(await db.course.count()).toBe(1);
    });

    it("Student user view list of courses access", async () => {
      const registered = await registerStudent();
      await seedCourse({ courseNumber: "CS101", courseName: "Intro to CS" });
      await seedCourse({
        courseNumber: "CS201",
        courseName: "Algorithms",
        courseTerm: "Fall",
      });

      const listed = await listCourses(registered.body.token);
      expect(listed.status).toBe(200);
      expect(listed.body.map((course) => course.courseName)).toEqual([
        "Algorithms",
        "Intro to CS",
      ]);

      const one = await request(app)
        .get(oneCoursePath(listed.body[0].id))
        .set(authHeader(registered.body.token));
      expect(one.status).toBe(200);
      expect(one.body[0].courseName).toBe("Algorithms");
      expect(await db.course.count()).toBe(2);
    });
  });
});
