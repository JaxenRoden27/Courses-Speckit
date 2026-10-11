/**
 * Feature 2 — Semester Management
 * Spec: features/feature-2-semester-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, authHeader } from "./helpers.js";

const semestersPath = "/course-t4/semesters";
const oneSemesterPath = (semesterId) => `${semestersPath}/${semesterId}`;

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

const createSemester = (token, body) =>
  request(app).post(semestersPath).set(authHeader(token)).send(body);

const listSemesters = (token) =>
  request(app).get(semestersPath).set(authHeader(token));

describe("Feature 2 — Semester Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.2 — Create a semester", () => {
    it("Student creates a semester", async () => {
      const registered = await registerStudent();
      const { token, userId } = registered.body;

      const response = await createSemester(token, { term: "Fall", year: 2026 });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Fall 2026",
        semester: "Fall 2026",
        startDate: "2026-08-27",
        endDate: "2026-12-18",
        classCount: 0,
        userId,
        user: {
          id: userId,
          fName: "Jane",
          lName: "Doe",
        },
      });
      expect(await db.semester.count()).toBe(1);
    });

    it("Student creates a semester that already exists", async () => {
      const registered = await registerStudent();
      const { token } = registered.body;
      const first = await createSemester(token, { term: "Fall", year: 2026 });
      expect(first.status).toBe(201);

      const response = await createSemester(token, { term: "Fall", year: 2026 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Semester already exists." });
      expect(await db.semester.count()).toBe(1);
    });

    it("Student creates a semester for an unknown student", async () => {
      const registered = await registerStudent();

      const response = await createSemester(registered.body.token, {
        term: "Fall",
        year: 2026,
        studentId: 999999,
        userId: 999999,
      });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(registered.body.userId);
      expect(response.body.user.id).toBe(registered.body.userId);
      expect(await db.semester.count()).toBe(1);
    });

    it("Student creates a semester for another student", async () => {
      const owner = await registerStudent({
        fName: "Sam",
        lName: "Student",
        email: "sam@example.com",
        universityId: "ST2222",
      });
      const other = await registerStudent();

      const response = await createSemester(other.body.token, {
        term: "Fall",
        year: 2026,
        studentId: owner.body.userId,
        userId: owner.body.userId,
      });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(other.body.userId);
      expect(
        await db.semester.count({ where: { userId: owner.body.userId } })
      ).toBe(0);
      expect(
        await db.semester.count({ where: { userId: other.body.userId } })
      ).toBe(1);
    });

    it("Winter semester ends in January of the next year", async () => {
      const registered = await registerStudent();

      const response = await createSemester(registered.body.token, {
        term: "Winter",
        year: 2026,
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "Winter 2026",
        semester: "Winter 2026",
        startDate: "2026-12-28",
        endDate: "2027-01-07",
      });
    });
  });

  describe("US-2.3 — View semesters as cards", () => {
    it("Student sees their semesters as cards", async () => {
      const registered = await registerStudent();
      const { token } = registered.body;
      await createSemester(token, { term: "Fall", year: 2026 });
      await createSemester(token, { term: "Spring", year: 2026 });

      const response = await listSemesters(token);

      expect(response.status).toBe(200);
      expect(response.body.map((semester) => semester.semester)).toEqual([
        "Spring 2026",
        "Fall 2026",
      ]);
      expect(response.body[0]).toMatchObject({
        startDate: "2026-01-05",
        endDate: "2026-05-07",
      });
      expect(response.body[1]).toMatchObject({
        startDate: "2026-08-27",
        endDate: "2026-12-18",
      });
    });
  });

  describe("US-2.8 — Edit a semester", () => {
    it("Student saves a valid semester edit", async () => {
      const registered = await registerStudent();
      const { token } = registered.body;
      const created = await createSemester(token, { term: "Fall", year: 2026 });

      const response = await request(app)
        .put(oneSemesterPath(created.body.id))
        .set(authHeader(token))
        .send({ term: "Spring", year: 2025 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: "Spring 2025",
        semester: "Spring 2025",
        startDate: "2025-01-06",
        endDate: "2025-05-01",
      });
    });
  });

  describe("US-2.9 — Delete a semester", () => {
    it("Student deletes a semester", async () => {
      const registered = await registerStudent();
      const { token } = registered.body;
      const created = await createSemester(token, { term: "Fall", year: 2026 });

      const response = await request(app)
        .delete(oneSemesterPath(created.body.id))
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Semester deleted." });
      expect(await db.semester.count()).toBe(0);
    });
  });

  describe("US-2.10 — Show each role only the semesters they may see", () => {
    it("Student lists only their own semesters", async () => {
      const jane = await registerStudent();
      const sam = await registerStudent({
        fName: "Sam",
        lName: "Student",
        email: "sam@example.com",
        universityId: "ST2222",
      });
      await createSemester(jane.body.token, { term: "Fall", year: 2026 });
      await createSemester(sam.body.token, { term: "Spring", year: 2025 });

      const response = await listSemesters(jane.body.token);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        semester: "Fall 2026",
        userId: jane.body.userId,
      });
    });

    it("Student cannot list another student's semesters", async () => {
      const jane = await registerStudent();
      const sam = await registerStudent({
        fName: "Sam",
        lName: "Student",
        email: "sam@example.com",
        universityId: "ST2222",
      });
      await createSemester(sam.body.token, { term: "Spring", year: 2025 });

      const response = await listSemesters(jane.body.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("Faculty lists every semester", async () => {
      const jane = await registerStudent();
      const sam = await registerStudent({
        fName: "Sam",
        lName: "Student",
        email: "sam@example.com",
        universityId: "ST2222",
      });
      await createSemester(jane.body.token, { term: "Fall", year: 2026 });
      await createSemester(sam.body.token, { term: "Spring", year: 2025 });
      const faculty = await insertFaculty();

      const response = await listSemesters(faculty.token);

      expect(response.status).toBe(200);
      expect(response.body.map((semester) => semester.semester)).toEqual([
        "Spring 2025",
        "Fall 2026",
      ]);
      expect(response.body[0].user).toMatchObject({
        fName: "Sam",
        lName: "Student",
      });
      expect(response.body[1].user).toMatchObject({
        fName: "Jane",
        lName: "Doe",
      });
    });

    it("Faculty cannot create a semester", async () => {
      await registerStudent();
      const faculty = await insertFaculty();

      const response = await createSemester(faculty.token, {
        term: "Fall",
        year: 2026,
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Only the owning student can change this semester.",
      });
      expect(await db.semester.count()).toBe(0);
    });

    it("Faculty cannot edit a semester", async () => {
      const student = await registerStudent();
      const created = await createSemester(student.body.token, {
        term: "Fall",
        year: 2026,
      });
      const faculty = await insertFaculty();

      const response = await request(app)
        .put(oneSemesterPath(created.body.id))
        .set(authHeader(faculty.token))
        .send({ term: "Spring", year: 2026 });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Only the owning student can change this semester.",
      });

      const stored = await listSemesters(student.body.token);
      expect(stored.body).toHaveLength(1);
      expect(stored.body[0]).toMatchObject({
        semester: "Fall 2026",
        startDate: "2026-08-27",
        endDate: "2026-12-18",
      });
    });

    it("Faculty cannot delete a semester", async () => {
      const student = await registerStudent();
      const created = await createSemester(student.body.token, {
        term: "Fall",
        year: 2026,
      });
      const faculty = await insertFaculty();

      const response = await request(app)
        .delete(oneSemesterPath(created.body.id))
        .set(authHeader(faculty.token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Only the owning student can change this semester.",
      });
      expect(await db.semester.count()).toBe(1);

      const stored = await listSemesters(student.body.token);
      expect(stored.body.map((semester) => semester.semester)).toEqual([
        "Fall 2026",
      ]);
    });

    it("Unauthenticated API request to semesters", async () => {
      const response = await request(app).get(semestersPath);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Unauthorized! No token provided.",
      });
    });
  });
});
