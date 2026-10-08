/**
 * Feature 4 — Faculty Management
 * Spec: features/feature-4-faculty-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, authHeader } from "./helpers.js";

const facultyPath = "/course-t4/faculty";
const oneFacultyPath = (facultyId) => `${facultyPath}/${facultyId}`;
const usersPath = "/course-t4/users";

const validFaculty = (overrides = {}) => ({
  firstName: "Jane",
  lastName: "Doe",
  dept: "Computer Science",
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

const createFaculty = (token, body) =>
  request(app).post(facultyPath).set(authHeader(token)).send(body);

const listFaculty = (token) =>
  request(app).get(facultyPath).set(authHeader(token));

const updateFaculty = (token, facultyId, body) =>
  request(app).put(oneFacultyPath(facultyId)).set(authHeader(token)).send(body);

const deleteFaculty = (token, facultyId) =>
  request(app).delete(oneFacultyPath(facultyId)).set(authHeader(token));

describe("Feature 4 — Faculty Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.2 — Create faculty member", () => {
    it("User creates a new faculty member without a linked user", async () => {
      const { token } = await insertFacultyUser();

      const response = await createFaculty(token, validFaculty());

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        firstName: "Jane",
        lastName: "Doe",
        dept: "Computer Science",
        userId: null,
      });
      expect(await db.faculty.count()).toBe(1);
    });

    it("User creates a new faculty member with a linked user", async () => {
      const { token } = await insertFacultyUser();
      const linked = await insertFacultyUser({
        fName: "Pat",
        lName: "Link",
        email: "pat.link@example.com",
        universityId: "fa1111",
      });

      const response = await createFaculty(
        token,
        validFaculty({ userId: linked.userId })
      );

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        firstName: "Jane",
        lastName: "Doe",
        dept: "Computer Science",
        userId: linked.userId,
      });
      expect(await db.faculty.count()).toBe(1);
    });

    it("User creates a faculty member with a user that is already linked", async () => {
      const { token } = await insertFacultyUser();
      const linked = await insertFacultyUser({
        fName: "Pat",
        lName: "Link",
        email: "pat.link@example.com",
        universityId: "fa1111",
      });
      const first = await createFaculty(
        token,
        validFaculty({ userId: linked.userId })
      );
      expect(first.status).toBe(201);

      const response = await createFaculty(
        token,
        validFaculty({
          firstName: "Robert",
          lastName: "Smith",
          dept: "Mathematics",
          userId: linked.userId,
        })
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "User is already linked to a faculty member.",
      });
      expect(await db.faculty.count()).toBe(1);
      const stored = await db.faculty.findOne({
        where: { userId: linked.userId },
      });
      expect(stored.lastName).toBe("Doe");
    });

    it("User creates a faculty member with an unknown user", async () => {
      const { token } = await insertFacultyUser();

      const response = await createFaculty(
        token,
        validFaculty({ userId: 999999 })
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "User not found." });
      expect(await db.faculty.count()).toBe(0);
    });

    it("User creates a faculty member linked to a student user", async () => {
      const { token } = await insertFacultyUser();
      const student = await registerStudent();

      const response = await createFaculty(
        token,
        validFaculty({ userId: student.body.userId })
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "User must have role faculty." });
      expect(await db.faculty.count()).toBe(0);
    });
  });

  describe("US-4.3 — View faculty", () => {
    it("Faculty view loads with existing faculty", async () => {
      const { token } = await insertFacultyUser();
      await createFaculty(token, validFaculty());
      await createFaculty(
        token,
        validFaculty({
          firstName: "Robert",
          lastName: "Smith",
          dept: "Mathematics",
        })
      );

      const response = await listFaculty(token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            firstName: "Jane",
            lastName: "Doe",
            dept: "Computer Science",
          }),
          expect.objectContaining({
            firstName: "Robert",
            lastName: "Smith",
            dept: "Mathematics",
          }),
        ])
      );
      expect(response.body).toHaveLength(2);
    });
  });

  describe("US-4.5 — Edit a faculty member", () => {
    it("User edits a faculty member with valid values and saves", async () => {
      const { token } = await insertFacultyUser();
      const created = await createFaculty(token, validFaculty());

      const response = await updateFaculty(token, created.body.id, {
        firstName: "Janet",
        lastName: "Doer",
        dept: "Physics",
        userId: null,
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: created.body.id,
        firstName: "Janet",
        lastName: "Doer",
        dept: "Physics",
        userId: null,
      });
      const stored = await db.faculty.findByPk(created.body.id);
      expect(stored.firstName).toBe("Janet");
      expect(stored.lastName).toBe("Doer");
      expect(stored.dept).toBe("Physics");
    });
  });

  describe("US-4.6 — Delete a faculty member", () => {
    it("User deletes a faculty member", async () => {
      const { token } = await insertFacultyUser();
      const created = await createFaculty(token, validFaculty());

      const response = await deleteFaculty(token, created.body.id);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Faculty deleted." });
      expect(await db.faculty.count()).toBe(0);
    });

    it("User deletes a faculty member who has a linked user", async () => {
      const { token } = await insertFacultyUser();
      const linked = await insertFacultyUser({
        fName: "Pat",
        lName: "Link",
        email: "pat.link@example.com",
        universityId: "fa1111",
      });
      const created = await createFaculty(
        token,
        validFaculty({ userId: linked.userId })
      );

      const response = await deleteFaculty(token, created.body.id);

      expect(response.status).toBe(200);
      expect(await db.faculty.count()).toBe(0);
      const storedUser = await db.user.findByPk(linked.userId);
      expect(storedUser).not.toBeNull();
      expect(storedUser.universityId).toBe("fa1111");
    });
  });

  describe("US-4.7 — Restrict faculty management to faculty users", () => {
    it("Student can list faculty via the API", async () => {
      const { token: facultyToken } = await insertFacultyUser();
      await createFaculty(facultyToken, validFaculty());
      const student = await registerStudent();

      const response = await listFaculty(student.body.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({
          firstName: "Jane",
          lastName: "Doe",
          dept: "Computer Science",
          userId: null,
        }),
      ]);
    });

    it("Student cannot create a faculty member via the API", async () => {
      const student = await registerStudent();

      const response = await createFaculty(student.body.token, validFaculty());

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Faculty role required." });
      expect(await db.faculty.count()).toBe(0);
    });

    it("Student cannot list users via the API", async () => {
      const student = await registerStudent();

      const response = await request(app)
        .get(usersPath)
        .set(authHeader(student.body.token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Faculty role required." });
    });

    it("Unauthenticated API request to faculty", async () => {
      const response = await request(app).get(facultyPath);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Unauthorized! No token provided.",
      });
    });
  });
});
