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
const studentRoleMessage = "Student role required.";

const validCourse = (overrides = {}) => ({
  courseNumber: "CS101",
  courseName: "Intro to CS",
  courseDescription: "Basic concepts",
  courseSemesters: "Fall/Spring",
  courseFrequency: "Annual",
  courseHours: 3,
  courseDept: "CS",
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

/**
 * Insert a catalog row. Copies spec fields the model already has, and fills
 * columns the current table still requires so later scenarios can address a row.
 */
const seedCourse = (overrides = {}) => {
  const spec = validCourse(overrides);
  const attributes = db.course.rawAttributes;
  const data = {};

  for (const [key, value] of Object.entries(spec)) {
    if (key in attributes) {
      data[key] = value;
    }
  }

  if ("term" in attributes && data.term == null) {
    data.term = "Fall";
  }
  if ("description" in attributes && data.description == null) {
    data.description = spec.courseDescription;
  }
  if ("sections" in attributes && data.sections == null) {
    data.sections = [];
  }

  return db.course.create(data);
};

describe("Feature 3 — Course Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.2 — Create Course", () => {
    it("Signed-in student creates a new course", async () => {
      await expectMissingToken("post", coursesPath, validCourse());

      const registered = await registerStudent();
      const { token } = registered.body;

      const response = await createCourse(token, validCourse({ userId: 999999 }));

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        courseNumber: "CS101",
        courseName: "Intro to CS",
        courseDescription: "Basic concepts",
        courseSemesters: "Fall/Spring",
        courseFrequency: "Annual",
        courseHours: 3,
        courseDept: "CS",
      });
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.userId).toBeUndefined();
      expect(response.body.createdAt).toBeTruthy();
      expect(response.body.updatedAt).toBeTruthy();

      const stored = await db.course.findByPk(response.body.id);
      expect(stored).toBeTruthy();
      expect(stored.courseNumber).toBe("CS101");
      expect(stored.userId).toBeUndefined();
      expect(await db.course.count()).toBe(1);
    });

    it("Create without course number is rejected", async () => {
      const registered = await registerStudent();
      const { token } = registered.body;
      const body = validCourse();
      delete body.courseNumber;

      const missing = await createCourse(token, body);
      expect(missing.status).toBe(400);
      expect(missing.body).toEqual({
        message: "Course Number cannot be empty for course!",
      });

      const blank = await createCourse(token, validCourse({ courseNumber: "   " }));
      expect(blank.status).toBe(400);
      expect(blank.body).toEqual({
        message: "Course Number cannot be empty for course!",
      });
      expect(await db.course.count()).toBe(0);
    });

    it("Create without course name is rejected", async () => {
      const registered = await registerStudent();
      const { token } = registered.body;
      const body = validCourse();
      delete body.courseName;

      const missing = await createCourse(token, body);
      expect(missing.status).toBe(400);
      expect(missing.body).toEqual({
        message: "Course Name cannot be empty for course!",
      });

      const blank = await createCourse(token, validCourse({ courseName: "   " }));
      expect(blank.status).toBe(400);
      expect(blank.body).toEqual({
        message: "Course Name cannot be empty for course!",
      });
      expect(await db.course.count()).toBe(0);
    });
  });

  describe("US-3.3 — Read Course Catalog", () => {
    it("Signed-in student views courses catalog", async () => {
      await expectMissingToken("get", coursesPath);

      const registered = await registerStudent();
      await seedCourse({
        courseNumber: "CS101",
        courseName: "Intro to CS",
        courseHours: 3,
      });
      await seedCourse({
        courseNumber: "CS201",
        courseName: "Algorithms",
        courseDescription: "Design of algorithms.",
        courseHours: 4,
      });

      const response = await listCourses(registered.body.token);

      expect(response.status).toBe(200);
      expect(response.body.map((course) => course.courseName)).toEqual([
        "Algorithms",
        "Intro to CS",
      ]);
      expect(response.body).toEqual([
        expect.objectContaining({
          courseNumber: "CS201",
          courseName: "Algorithms",
          courseHours: 4,
        }),
        expect.objectContaining({
          courseNumber: "CS101",
          courseName: "Intro to CS",
          courseHours: 3,
        }),
      ]);
    });
  });

  describe("US-3.5 — Edit Course", () => {
    it("Signed-in student updates course details", async () => {
      await expectMissingToken("put", oneCoursePath(1), validCourse({ courseHours: 4 }));

      const registered = await registerStudent();
      const { token } = registered.body;
      const existing = await seedCourse();

      const response = await request(app)
        .put(oneCoursePath(existing.id))
        .set(authHeader(token))
        .send(validCourse({ courseHours: 4 }));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Course was updated successfully.",
      });

      const listed = await listCourses(token);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([
        expect.objectContaining({
          id: existing.id,
          courseNumber: "CS101",
          courseName: "Intro to CS",
          courseHours: 4,
        }),
      ]);
    });
  });

  describe("US-3.6 — Delete Course", () => {
    it("Signed-in student deletes a course with confirmation", async () => {
      await expectMissingToken("delete", oneCoursePath(1));

      const registered = await registerStudent();
      const { token } = registered.body;
      const existing = await seedCourse();

      const response = await request(app)
        .delete(oneCoursePath(existing.id))
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Course was deleted successfully!",
      });
      expect(await db.course.count()).toBe(0);

      const listed = await listCourses(token);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([]);
    });
  });

  describe("US-3.7 — Role-Based Access Control", () => {
    it("Faculty user access restricted", async () => {
      const registered = await registerStudent();
      const existing = await seedCourse();
      const before = await db.course.findByPk(existing.id);
      const faculty = await insertFaculty();

      const created = await createCourse(
        faculty.token,
        validCourse({
          courseNumber: "CS999",
          courseName: "Should Not Exist",
        })
      );
      expect(created.status).toBe(403);
      expect(created.body).toEqual({ message: studentRoleMessage });

      const updated = await request(app)
        .put(oneCoursePath(existing.id))
        .set(authHeader(faculty.token))
        .send(validCourse({ courseHours: 9, courseName: "Renamed" }));
      expect(updated.status).toBe(403);
      expect(updated.body).toEqual({ message: studentRoleMessage });

      const removed = await request(app)
        .delete(oneCoursePath(existing.id))
        .set(authHeader(faculty.token));
      expect(removed.status).toBe(403);
      expect(removed.body).toEqual({ message: studentRoleMessage });

      const after = await db.course.findByPk(existing.id);
      expect(after).toBeTruthy();
      expect(after.courseName).toBe(before.courseName);
      expect(after.courseNumber).toBe(before.courseNumber);
      expect(after.courseHours).toBe(before.courseHours);
      expect(await db.course.count()).toBe(1);

      const listed = await listCourses(faculty.token);
      expect(listed.status).toBe(200);
      expect(listed.body.map((course) => course.courseName)).toEqual([
        before.courseName,
      ]);

      const missing = await request(app).post(coursesPath).send(validCourse());
      expect(missing.status).toBe(401);
      expect(missing.body).toEqual({ message: unauthorizedMessage });

      await db.session.create({
        token: "expired-course-token",
        email: faculty.user.email,
        expirationDate: new Date(Date.now() - 60 * 1000),
        userId: faculty.userId,
      });
      const expired = await request(app)
        .post(coursesPath)
        .set(authHeader("expired-course-token"))
        .send(validCourse());
      expect(expired.status).toBe(401);
      expect(expired.body).toEqual({ message: expiredMessage });

      const studentStillListed = await listCourses(registered.body.token);
      expect(studentStillListed.status).toBe(200);
      expect(studentStillListed.body).toHaveLength(1);
    });
  });
});
