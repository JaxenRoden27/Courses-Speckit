/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, registerUser, authHeader } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const { response: registerResponse } = await registerUser(app, {
        username: "adminuser",
        email: "admin@example.com",
      });
      const stored = await db.user.findByPk(registerResponse.body.userId);
      stored.role = "admin";
      await stored.save();

      const response = await request(app)
        .get(`/league/users/${registerResponse.body.userId}`)
        .set(authHeader(registerResponse.body.token));

      expect(response.status).toBe(200);
      expect(response.req.getHeader("authorization")).toBe(
        `Bearer ${registerResponse.body.token}`
      );
    });

    it("Expired or invalid session token", async () => {
      const { response: registerResponse } = await registerUser(app, {
        username: "adminuser",
        email: "admin@example.com",
      });
      const stored = await db.user.findByPk(registerResponse.body.userId);
      stored.role = "admin";
      await stored.save();

      await db.session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token: registerResponse.body.token } }
      );

      const response = await request(app)
        .get(`/league/users/${registerResponse.body.userId}`)
        .set(authHeader(registerResponse.body.token));

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const response = await request(app).get("/league/users/1");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
