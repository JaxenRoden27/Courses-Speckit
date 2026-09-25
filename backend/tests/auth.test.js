/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  validRegisterPayload,
  registerUser,
  registerAdmin,
  loginUser,
  authHeader,
} from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const { payload, response } = await registerUser(app);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        username: "jdoe",
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "manager",
      });
      expect(response.body.userId).toEqual(expect.any(Number));
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findOne({ where: { username: "jdoe" } });
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe(payload.password);
      expect(await bcrypt.compare(payload.password, stored.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const response = await request(app)
        .post("/league/register")
        .send(validRegisterPayload({ email: "" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is required." });
    });

    it("User submits registration with password too short", async () => {
      const response = await request(app)
        .post("/league/register")
        .send(validRegisterPayload({ password: "short" }));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Password must be at least 8 characters.",
      });
    });

    it("User registers with a duplicate username", async () => {
      await registerUser(app);

      const response = await request(app)
        .post("/league/register")
        .send(
          validRegisterPayload({
            email: "other@example.com",
            username: "jdoe",
          })
        );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser(app);

      const response = await request(app)
        .post("/league/register")
        .send(
          validRegisterPayload({
            email: "jane@example.com",
            username: "janedoe",
          })
        );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser(app);

      const response = await loginUser(app, {
        username: "jdoe",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        username: "jdoe",
        role: "manager",
      });
      expect(response.body.userId).toEqual(expect.any(Number));
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.password).toBeUndefined();

      const sessions = await db.session.findAll({ where: { email: "jane@example.com" } });
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.some((session) => session.token === response.body.token)).toBe(true);
    });

    it("User signs in with invalid password", async () => {
      await registerUser(app);

      const response = await loginUser(app, {
        username: "jdoe",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Invalid username or password." });
    });

    it("User signs in with missing username", async () => {
      const response = await loginUser(app, { password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const response = await loginUser(app, { username: "jdoe" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const { response: registerResponse } = await registerUser(app);
      const { token, userId } = registerResponse.body;

      const response = await request(app)
        .post("/league/logout")
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const session = await db.session.findOne({ where: { userId } });
      expect(session.token).toBe("");

      const protectedResponse = await request(app)
        .get(`/league/users/${userId}`)
        .set(authHeader(token));

      expect(protectedResponse.status).toBe(401);
    });
  });

  describe("US-9.3 — Default new-user role is manager", () => {
    it("User registers with role manager", async () => {
      const { response } = await registerUser(app);

      expect(response.status).toBe(201);
      expect(response.body.role).toBe("manager");
      const stored = await db.user.findOne({ where: { username: "jdoe" } });
      expect(stored.role).toBe("manager");
    });
  });

  describe("US-9.4 — Connect a new user to a person with the same email", () => {
    it("User registers and links to a person with the same email", async () => {
      const { token } = await registerAdmin(app);
      await request(app)
        .post("/league/people")
        .set(authHeader(token))
        .send({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          birthDate: "1990-05-15",
          gender: "female",
        });

      const { response } = await registerUser(app, {
        username: "janedoe",
        email: "jane.doe@example.com",
      });

      expect(response.status).toBe(201);
      const person = await db.person.findOne({
        where: { email: "jane.doe@example.com" },
      });
      expect(person.userId).toBe(response.body.userId);
    });

    it("User registers when no person has that email", async () => {
      const { response } = await registerUser(app, {
        username: "newuser",
        email: "new.user@example.com",
      });

      expect(response.status).toBe(201);
      expect(await db.person.count()).toBe(0);
    });

    it("User registers when the matching person is already linked", async () => {
      const { token, userId } = await registerAdmin(app);
      const personResponse = await request(app)
        .post("/league/people")
        .set(authHeader(token))
        .send({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          birthDate: "1990-05-15",
          gender: "female",
        });
      await db.person.update(
        { userId },
        { where: { id: personResponse.body.id } }
      );

      const { response } = await registerUser(app, {
        username: "janedoe",
        email: "jane.doe@example.com",
      });

      expect(response.status).toBe(201);
      const person = await db.person.findByPk(personResponse.body.id);
      expect(person.userId).toBe(userId);
    });
  });
});
