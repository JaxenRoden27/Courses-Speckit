import request from "supertest";
import db from "../app/models/index.js";

const LEFTOVER_TABLES = ["sections", "faculties", "courses"];

export const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of LEFTOVER_TABLES) {
    await db.sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  await db.sequelize.sync({ force: true });
};

export const validRegisterPayload = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "password123",
  ...overrides,
});

export const registerUser = async (app, overrides = {}) => {
  const payload = validRegisterPayload(overrides);
  const response = await request(app).post("/league/register").send(payload);
  return { payload, response };
};

export const loginUser = async (app, credentials) => {
  return request(app).post("/league/login").send(credentials);
};

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const registerAdmin = async (app, overrides = {}) => {
  const { payload, response } = await registerUser(app, {
    username: "adminuser",
    email: "admin@example.com",
    ...overrides,
  });

  const user = await db.user.findByPk(response.body.userId);
  user.role = "admin";
  await user.save();

  return {
    payload,
    response,
    token: response.body.token,
    userId: response.body.userId,
  };
};

export const validSeason = (overrides = {}) => ({
  name: "2026 Fall",
  startDate: "2026-08-15",
  endDate: "2026-12-15",
  gameDays: ["saturday"],
  gameTime: "18:00",
  minDaysBetweenGames: 7,
  ...overrides,
});

export const createSeason = async (app, token, overrides = {}) => {
  let { leagueId, ...rest } = overrides;

  if (leagueId == null) {
    const existingLeague = await db.league.findOne({ order: [["id", "ASC"]] });
    if (existingLeague) {
      leagueId = existingLeague.id;
    } else {
      const league = await createLeague(app, token);
      leagueId = league.body.id;
    }
  }

  return request(app)
    .post("/league/seasons")
    .set(authHeader(token))
    .send(validSeason({ ...rest, leagueId }));
};

export const validLeague = (overrides = {}) => ({
  name: "OKC Youth Soccer",
  sport: "soccer",
  ...overrides,
});

export const createLeague = async (app, token, overrides = {}) => {
  return request(app)
    .post("/league/leagues")
    .set(authHeader(token))
    .send(validLeague(overrides));
};

export const validPerson = (overrides = {}) => ({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  birthDate: "1990-05-15",
  gender: "female",
  ...overrides,
});

export const createPerson = async (app, token, overrides = {}) => {
  return request(app)
    .post("/league/people")
    .set(authHeader(token))
    .send(validPerson(overrides));
};

export const validTeam = (overrides = {}) => ({
  name: "OKC Strikers",
  homeField: "Memorial Field",
  ...overrides,
});

export const createTeam = async (app, token, overrides = {}) => {
  return request(app)
    .post("/league/teams")
    .set(authHeader(token))
    .send(validTeam(overrides));
};

export const validPlayer = (overrides = {}) => ({
  position: "Forward",
  number: 10,
  ...overrides,
});

export const createPlayer = async (app, token, teamId, overrides = {}) => {
  return request(app)
    .post(`/league/teams/${teamId}/players`)
    .set(authHeader(token))
    .send(validPlayer(overrides));
};

export const createSeasonGames = (app, token, seasonId) => {
  return request(app)
    .post(`/league/seasons/${seasonId}/games`)
    .set(authHeader(token));
};

export const validGame = (overrides = {}) => ({
  gameDate: "2026-09-12",
  startTime: "18:00",
  ...overrides,
});

export const createGame = async (app, token, overrides = {}) => {
  let { seasonId, homeTeamId, visitingTeamId, ...rest } = overrides;

  if (seasonId == null) {
    const season = await createSeason(app, token);
    seasonId = season.body.id;
  }

  const season = await db.season.findByPk(seasonId);

  if (homeTeamId == null) {
    const homeTeam = await createTeam(app, token, {
      name: "OKC Strikers",
      leagueId: season.leagueId,
    });
    homeTeamId = homeTeam.body.id;
  }

  if (visitingTeamId == null) {
    const visitingTeam = await createTeam(app, token, {
      name: "Tulsa FC",
      leagueId: season.leagueId,
    });
    visitingTeamId = visitingTeam.body.id;
  }

  return request(app)
    .post("/league/games")
    .set(authHeader(token))
    .send(validGame({ ...rest, seasonId, homeTeamId, visitingTeamId }));
};
