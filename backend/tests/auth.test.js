/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, authHeader } from "./helpers.js";

const registerPayload = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  universityId: "ST1111",
  password: "password123",
  ...overrides,
});

const register = (payload) => request(app).post("/courses/register").send(payload);

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const payload = registerPayload({ role: "faculty" });
      const response = await register(payload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        userId: expect.any(Number),
        universityId: "ST1111",
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "student",
        token: expect.any(String),
      });
      expect(response.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findOne({
        where: { universityId: "st1111" },
      });
      expect(stored).not.toBeNull();
      expect(stored.role).toBe("student");
      expect(stored.password).not.toBe(payload.password);
      expect(stored.password).toMatch(/^\$2[ab]\$10\$/);
      expect(await bcrypt.compare(payload.password, stored.password)).toBe(true);

      const session = await db.session.findOne({
        where: { token: response.body.token, userId: response.body.userId },
      });
      expect(session).not.toBeNull();
      expect(session.email).toBe("jane@example.com");
      const ttlMs = new Date(session.expirationDate).getTime() - Date.now();
      expect(ttlMs).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(ttlMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it("User submits registration with missing email", async () => {
      const response = await register(registerPayload({ email: "" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is required." });
      expect(await db.user.count()).toBe(0);
    });

    it("User submits registration with password too short", async () => {
      const response = await register(registerPayload({ password: "short" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
      expect(await db.user.count()).toBe(0);
    });

    it("User registers with a duplicate universityId", async () => {
      await register(registerPayload({ email: "first@example.com" }));

      const response = await register(
        registerPayload({
          email: "other@example.com",
          universityId: "ST1111",
        })
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "University ID is already in use.",
      });
      expect(await db.user.count()).toBe(1);
    });

    it("User registers with a duplicate email", async () => {
      await register(registerPayload({ universityId: "ST1111" }));

      const response = await register(
        registerPayload({
          email: "jane@example.com",
          universityId: "ST3333",
        })
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already registered." });
      expect(await db.user.count()).toBe(1);
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      const registered = await register(
        registerPayload({
          email: "sam@example.com",
          universityId: "ST2222",
        })
      );

      const response = await request(app).post("/courses/login").send({
        universityId: "ST2222",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: registered.body.userId,
        universityId: "ST2222",
        role: "student",
      });
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.password).toBeUndefined();

      const sessions = await db.session.findAll({
        where: { userId: registered.body.userId },
      });
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.some((session) => session.token === response.body.token)).toBe(
        true
      );
    });

    it("User signs in with invalid password", async () => {
      await register(
        registerPayload({
          email: "sam@example.com",
          universityId: "ST2222",
        })
      );

      const response = await request(app).post("/courses/login").send({
        universityId: "ST2222",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Invalid University ID or password.",
      });
    });

    it("User signs in with missing universityId", async () => {
      const response = await request(app).post("/courses/login").send({
        universityId: "",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "University ID is required." });
    });

    it("User signs in with missing password", async () => {
      const response = await request(app).post("/courses/login").send({
        universityId: "ST2222",
        password: "",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const registered = await register(registerPayload());
      const { token, userId } = registered.body;

      const response = await request(app)
        .post("/courses/logout")
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const session = await db.session.findOne({ where: { token } });
      expect(session).toBeNull();

      const protectedResponse = await request(app)
        .get(`/courses/users/${userId}`)
        .set(authHeader(token));

      expect(protectedResponse.status).toBe(401);
      expect(protectedResponse.body).toEqual({
        message: "Unauthorized! Invalid or expired token.",
      });
    });
  });
});
