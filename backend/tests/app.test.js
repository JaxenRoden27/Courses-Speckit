import app from "../server.js";

describe("Express app", () => {
  it("exports an Express application", () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe("function");
  });
});
