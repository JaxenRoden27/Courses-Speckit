# Feature: Section Management

**Feature ID:** 5
**Branch pattern:** `feature/5-section-management` **Status:** Ready
**Created:** 2026-09-23
**Input:** Signed-in admin users manage a teams list and a team view. A team has a name, belongs to a league, and has players. The team view shows team info, **Edit team**, **Add Players**, and a player list. A player is a Feature 4 person on that team with a name, number, and position.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Semester Management](feature-2-semester-management.md), [Feature 3 — Course Management](feature-3-course-management.md), [Feature 4 — Faculty Management](feature-4-faculty-management.md)

---



## User Stories



### US-5.1: Select to work with Teams

**As a** signed-in admin user  
**I want to** open the teams view from the menu  
**So that** I can maintain league teams

**Priority:** P1  
**Independent test:** login, view Teams on menubar; teams view appears  
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Create team

**As a** signed-in admin user  
**I want to** create a team with a name in a league  
**So that** the league has teams

**Priority:** P1  
**Independent test:** Open add-team dialog, create a team for an existing league; it appears in the teams view  
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: View teams

**As a** signed-in admin user  
**I want to** see all teams on one screen  
**So that** I can see each league's teams

**Priority:** P1  
**Independent test:** Selecting Teams loads a screen that displays all teams  
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Manage team rows

**As a** signed-in admin user  
**I want** each team row to show a **team** icon and a **delete** action  
**So that** I can open a team or remove it from the list

**Priority:** P1  
**Independent test:** Each team row shows an **Open team** icon and a delete icon action  
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

### US-5.10: View a team

**As a** signed-in admin user  
**I want to** open a team view with team info, **Edit team**, **Add Players**, and the player list  
**So that** I can work with one team's roster

**Priority:** P1  
**Independent test:** From the teams list, open a team; heading shows team info and the player list  
**Acceptance scenarios:** see ### US-5.10 under Acceptance Criteria

### US-5.5: Edit a team

**As a** signed-in admin user  
**I want to** edit a team's name or league from the team view  
**So that** I can keep team data accurate

**Priority:** P2  
**Independent test:** On the team view, **Edit team** opens the Edit Team dialog; save updates the heading  
**Acceptance scenarios:** see ### US-5.5 under Acceptance Criteria

### US-5.6: Delete a team

**As a** signed-in admin user  
**I want to** delete a team  
**So that** I can remove teams that no longer belong in a league

**Priority:** P2  
**Independent test:** Delete a team from row actions; teams view updates  
**Acceptance scenarios:** see ### US-5.6 under Acceptance Criteria

### US-5.7: Restrict team management to admins

**As the** application  
**I want to** allow only users with role `admin` to manage teams and players  
**So that** students cannot create, edit, or delete teams or roster rows

**Priority:** P1  
**Independent test:** Sign in as a student — **Teams** is hidden; `POST /league/teams` returns `403`  
**Acceptance scenarios:** see ### US-5.7 under Acceptance Criteria

### US-5.8: Manage team players

**As a** signed-in admin user  
**I want to** add and edit players on the team view  
**So that** each player is a person with a name, number, and position on that team

**Priority:** P1  
**Independent test:** On the team view, **Add Players** opens the Add Player dialog; the player appears in the list  
**Acceptance scenarios:** see ### US-5.8 under Acceptance Criteria

### US-5.9: Block delete of referenced league or person

**As the** application  
**I want to** refuse delete of a league that still has teams, and of a person who is still a player  
**So that** teams and rosters are not left pointing at missing rows

**Priority:** P1  
**Independent test:** Create a team with a player; `DELETE` of that league or person returns `400` and the parent row remains  
**Acceptance scenarios:** see ### US-5.9 under Acceptance Criteria

## Requirements



### Functional Requirements

- **FR-001**: All team and player endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `admin`.
- **FR-002**: Teams and players MUST be a **shared catalog**. The `teams` and `players` tables MUST NOT use `userId` as ownership. The API MUST ignore any client-supplied ownership `userId`.
- **FR-003**: Authenticated non-admin users (including `student`) MUST receive `403` with `{ "message": "Admin role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Teams** in `MenuBar`.
- **FR-004**: Required team and player fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated team API requests MUST return `401`. Unauthenticated navigation to `/teams` or `/teams/:teamId` MUST redirect to `login`.
- **FR-006**: Teams MUST be ordered by related league `name`, then team `name`, in API responses. Players on a team MUST be ordered by `number`.
- **FR-007**: This feature MUST deliver a **teams list** in `Teams.vue` and a **team view** in `Team.vue`. The team view MUST have a heading area for team info, an **Edit team** button that opens the **Edit Team** dialog, an **Add Players** button that opens the **Add Player** dialog, and a player list (name, number, position) with an **Edit player** icon that opens the **Edit Player** dialog. Team and player mutations stay dialog-based. No sidebar/main split. Player management MUST NOT live inside the **Edit Team** dialog.
- **FR-008**: Team `name` MUST be required, trimmed, and at most 50 characters. Too-long message: **"Team name must be 50 characters or fewer."** The pair (`leagueId`, `name`) MUST be unique. Duplicate message: **"Team name is already taken in this league."** `homeField` MUST be required, trimmed, and at most 50 characters. Too-long message: **"Home field must be 50 characters or fewer."** `homeField` is the venue used as the game `location` when that team is home (Feature 6).
- **FR-009**: `leagueId` MUST be a required integer that exists in `leagues`. Missing league message: **"League not found."** (HTTP `400`). A league MAY have many teams.
- **FR-010**: A player MUST belong to one team and one Feature 4 person. `teamId` comes from the route. `personId` MUST be a required integer that exists in `people`. Missing person message: **"Person not found."** (HTTP `400`). The pair (`teamId`, `personId`) MUST be unique. Duplicate-person message: **"Person is already on this team."** A person MAY be on more than one team.
- **FR-011**: Player `position` MUST be required, trimmed, and at most 30 characters. Too-long message: **"Position must be 30 characters or fewer."**
- **FR-012**: Player `number` MUST be a required integer from `0` through `99`. Invalid message: **"Player number must be between 0 and 99."** The pair (`teamId`, `number`) MUST be unique. Duplicate-number message: **"Player number is already taken on this team."**
- **FR-013**: `DELETE` of a league MUST fail with `400` when any team references that league. `DELETE` of a person MUST fail with `400` when any player references that person. Do **not** cascade-delete teams when a league is deleted, and do **not** delete people when a player or team is deleted. Messages: **"Cannot delete league: teams still exist."**, **"Cannot delete person: team roster still exists."** The parent row and its dependents MUST remain stored. `DELETE` of a team MUST remove that team's player rows and MUST NOT delete the people.

---



## Assumptions

- Features 1–4 (auth/`MenuBar`, seasons, leagues, people) MUST be merged to `dev` before implementing this feature.
- A user with role `admin` exists (Feature 1 `role`; tests may seed an admin).
- Tests MAY seed at least one league and one person (from Features 3–4) before creating a team or player.
- Teams belong to a **league**, not to a season and not to a signed-in user. No FK from `teams` to `seasons`.
- A team MAY be created with an empty roster. Players are added in this feature.
- A **player** is a roster row (person + position + number on a team), not a second copy of the person.
- `position` is free text (not a closed list). Sports differ by league.
- Add/Edit dialogs load leagues from `GET /league/leagues` and people from `GET /league/people`.
- Foreign keys from `teams.leagueId` and `players.personId` MUST use **RESTRICT**. Foreign key from `players.teamId` MUST use **CASCADE** so deleting a team removes roster rows only.
- This feature updates Feature 3–4 `DELETE` handlers for `/league/leagues/:leagueId` and `/league/people/:personId` to enforce FR-013.
- The **teams list** creates and deletes teams. The **team view** edits one team and manages that team's players.
- Team and player forms use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/league/…`. Use `/league/teams`.



## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- Team `name` longer than 50 characters → **"Team name must be 50 characters or fewer."**
- Duplicate team `name` in the same league → `400` with `{ "message": "Team name is already taken in this league." }`
- Same team name in a **different** league is allowed.
- Unknown `leagueId` → `400` with `{ "message": "League not found." }`
- Unknown `personId` → `400` with `{ "message": "Person not found." }`
- Person already on that team → `400` with `{ "message": "Person is already on this team." }`
- Same person on a **different** team is allowed.
- Player `number` outside 0–99 → **"Player number must be between 0 and 99."**
- Duplicate `number` on the same team → `400` with `{ "message": "Player number is already taken on this team." }`
- Same number on a **different** team is allowed.
- `position` longer than 30 characters → **"Position must be 30 characters or fewer."**
- Unknown `teamId` or `playerId` on PUT/DELETE → `404` with `{ "message": "Team with id=<id> not found." }` or `{ "message": "Player with id=<id> not found." }`
- `DELETE` league while teams still reference it → `400`; league and teams remain.
- `DELETE` person while a player still references them → `400`; person and player remain.
- `DELETE` team → team and its player rows are removed; people remain.
- Authenticated `student` (or any non-admin) on `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `student` on `GET` → `200`.
- Unauthenticated user on `/teams`, `/teams/:teamId`, or `GET /league/teams` → redirect or `401`.
- Unknown `teamId` on the team view → error **"Team with id= not found."**



## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can create and delete teams on the teams list, and edit a team from the team view.
- **SC-003**: A signed-in admin can open a team view and add or edit players (name, number, position) from that view.
- **SC-004**: A signed-in student MAY `GET` teams and players; they cannot open the teams manager and cannot mutate teams or players via the API.
- **SC-005**: An admin cannot delete a league that still has teams, or a person who is still on a roster.
- **SC-006**: `npm test` passes for team and player API and teams view behavior.

---



## Data Ownership & Isolation

Teams and players are a **shared catalog**. They are not owned by the signed-in admin. Only role `admin` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI.


| Rule               | Requirement                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Read scope**     | `GET /league/teams` returns **all** teams (with league and players) to any authenticated user.                         |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `admin`.                                          |
| **Create scope**   | New teams and players have no owner. Ignore ownership `userId` if sent in the body.                                    |
| **Missing team**   | Unknown `teamId` → `404` with `{ "message": "Team with id=<id> not found." }`. Never use ownership `404` to hide rows. |
| **Missing player** | Unknown `playerId` → `404` with `{ "message": "Player with id=<id> not found." }`.                                     |
| **Non-admin**      | Authenticated non-admin `GET` → `200`. `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Admin role required." }`. |
| **UI scope**       | **Teams** menu, `/teams`, and `/teams/:teamId` are admin-only. Students do not see this manager.                       |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireAdmin` after `authenticate` on `POST`, `PUT`, and `DELETE` only.      |


---



## API Requirements


| Method   | Endpoint                                  | Auth       | Purpose                                     |
| -------- | ----------------------------------------- | ---------- | ------------------------------------------- |
| `GET`    | `/league/teams`                           | Yes        | Fetch all teams with league and players     |
| `POST`   | `/league/teams`                           | Yes, admin | Create a team in a league                   |
| `PUT`    | `/league/teams/:teamId`                   | Yes, admin | Update a team's name, league, or home field |
| `DELETE` | `/league/teams/:teamId`                   | Yes, admin | Delete a team and its player rows           |
| `GET`    | `/league/teams/:teamId/players`           | Yes        | Fetch players on one team                   |
| `POST`   | `/league/teams/:teamId/players`           | Yes, admin | Add a player to a team                      |
| `PUT`    | `/league/teams/:teamId/players/:playerId` | Yes, admin | Update a player's position or number        |
| `DELETE` | `/league/teams/:teamId/players/:playerId` | Yes, admin | Remove a player from a team                 |


**Create team request body:**

```json
{
  "name": "OKC Strikers",
  "leagueId": 1,
  "homeField": "Memorial Field"
}
```

Do not send `id` on create. Players are **not** created in this body.

**Update team request body:** same fields as create (no `id`).

**Team success response** (`200` / `201`):

```json
{
  "id": 1,
  "name": "OKC Strikers",
  "leagueId": 1,
  "homeField": "Memorial Field",
  "league": {
    "id": 1,
    "name": "OKC Youth Soccer",
    "sport": "soccer"
  },
  "players": [],
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /league/teams` returns an **array** of team objects in this shape, including each team's `players` array.

**Create player request body:**

```json
{
  "personId": 1,
  "position": "Forward",
  "number": 10
}
```

**Update player request body:** `position` and `number` (and `personId` if changing the person). Do not send `teamId` in the body.

**Player success response** (`200` / `201`):

```json
{
  "id": 1,
  "teamId": 1,
  "personId": 1,
  "position": "Forward",
  "number": 10,
  "person": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Doe"
  },
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` for unknown `teamId` / `playerId`.  
**Missing parent:** `400` (FR-009 / FR-010).

This feature also changes Feature 3–4 delete APIs (FR-013): `DELETE /league/leagues/:leagueId` and `DELETE /league/people/:personId` MUST return `400` with the quoted FR-013 message when teams or players still reference that row.

---



## Screen Requirements



### [View: Teams] — route name `teams` — path `/teams` — `Teams.vue`

- Heading: **Teams**
- Primary action: **+ New team** (`oc-cta`) opens the **Add Team** `<v-dialog>`.
- **Add Team** fields:
  - **Team Name** (`v-text-field`)
  - **League** (`v-select` of existing leagues, display league `name`)
  - **Home Field** (`v-text-field`)
- **Add Team** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **team name**, **league**, and **players** (count); rows ordered by league name then team name (FR-006).
- Team name is plain text (not a link).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Open team** — team icon (`mdi-account-group`) navigates to the **Team** view (`/teams/:teamId`)
  - **Delete team** — opens **Delete Team** confirmation `<v-dialog>` with copy **"Delete this team?"**; **Delete Team** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No teams yet. Create your first team."** when the catalog has zero teams.
- **Loading state:** skeleton or progress indicator while teams are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **Teams** menu item and `/teams` are for signed-in admin users. Other roles do not see the **Teams** item. Unauthenticated navigation to `/teams` redirects to `login`.



### [View: Team] — route name `team` — path `/teams/:teamId` — `Team.vue`

This is the team view (team main).

- **Heading area** shows team info: team **name**, **league** name (and sport if already on the nested `league` object), and **home field**.
- Actions in the heading area:
  - **Edit team** (`oc-cta`) opens the **Edit Team** `<v-dialog>` pre-filled with current name, league, and home field.
  - **Add Players** (`oc-cta`) opens the **Add Player** `<v-dialog>`.
- **Edit Team** fields (name, league, and home field — no player list in this dialog):
  - **Team Name** (`v-text-field`)
  - **League** (`v-select` of existing leagues, display league `name`)
  - **Home Field** (`v-text-field`)
- **Edit Team** actions: **Save Team** (`oc-cta`) / **Cancel** (secondary). After a successful save, the heading area shows the updated team info and the dialog closes.
- **Player list:** `v-table` (or `v-list`); columns **name** (person last name, first name), **number**, and **position**; rows ordered by `number` (FR-006).
- Each player row has an icon-only **Edit player** action (`size="small"`, `aria-label` **Edit player**) that opens the **Edit Player** `<v-dialog>` pre-filled with that player's person, number, and position.
- **Add Player** / **Edit Player** fields (same set; edit pre-filled):
  - **Person** (`v-select` of existing people, display last name, first name)
  - **Number** (`v-text-field` type number)
  - **Position** (`v-text-field`)
- **Add Player** actions: **Add** (`oc-cta`) / **Cancel** (secondary).
- **Edit Player** actions: **Save Player** (`oc-cta`) / **Cancel** (secondary).
- Each player row also has **Remove player** (existing US-5.8): confirmation **"Remove this player from the team?"**; **Remove Player** (`oc-cta`) / **Cancel** (secondary).
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty roster:** **"No players yet. Add the first player."** when the team has zero players.
- **Loading state:** skeleton or progress indicator while the team is fetching.
- **Error state:** `<v-alert type="error">` for API failures. Unknown `teamId` shows **"Team with id= not found."**
- Admin-only: `/teams/:teamId` is for signed-in admin users. Unauthenticated navigation redirects to `login`.
- Team and player dialogs live in `Team.vue` (or child presentational dialogs). **Edit Team** MUST NOT contain the player list. No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Teams** (allowed role `admin`; navigates to `/teams`) to `MenuBar`. Keep name, **Sign out**, **Seasons**, **Leagues**, and **People** from Features 1–4.
- Students MUST NOT see **Teams**.
- After login, the user remains on Feature 1 `home`. Selecting **Teams** in the menu opens the teams list. Opening a team from that list shows the team view.

---



## Key Entities

- **Team**: named roster that belongs to one **League**. Shared catalog row. Not owned by a user. A league may have many teams.
- **Player**: a **Person** on a **Team**, with a `position` and `number`. Not a second person record. Deleting a player or team does not delete the person.

---



## Data Model Requirements



### `teams` table


| Field       | Type       | Rules                                    |
| ----------- | ---------- | ---------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                           |
| `name`      | STRING(50) | Required; trimmed; at most 50 characters |
| `homeField` | STRING(50) | Required; trimmed; at most 50 characters |
| `leagueId`  | INTEGER FK | Required; references `leagues.id`        |
| `createdAt` | DATE       | Sequelize timestamps                     |
| `updatedAt` | DATE       | Sequelize timestamps                     |


Unique index on (`leagueId`, `name`).  
`leagueId` uses `ON DELETE RESTRICT`.

### `players` table


| Field       | Type       | Rules                                    |
| ----------- | ---------- | ---------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                           |
| `teamId`    | INTEGER FK | Required; references `teams.id`          |
| `personId`  | INTEGER FK | Required; references `people.id`         |
| `position`  | STRING(30) | Required; trimmed; at most 30 characters |
| `number`    | INTEGER    | Required; integer 0–99                   |
| `createdAt` | DATE       | Sequelize timestamps                     |
| `updatedAt` | DATE       | Sequelize timestamps                     |


Unique index on (`teamId`, `personId`).  
Unique index on (`teamId`, `number`).  
`teamId` uses `ON DELETE CASCADE`.  
`personId` uses `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Team belongsTo League` (`leagueId`, `onDelete: 'RESTRICT'`)
- `League hasMany Team`
- `Player belongsTo Team` (`teamId`, `onDelete: 'CASCADE'`)
- `Player belongsTo Person` (`personId`, `onDelete: 'RESTRICT'`)
- `Team hasMany Player`
- `Person hasMany Player`

---



## Acceptance Criteria (Gherkin)



### US-5.1 — Select to work with Teams



#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **Teams** in the `MenuBar`
- **Then** the teams view is displayed



### US-5.2 — Create team



#### Scenario: User creates a new team

- **Given** I am signed in as a user with role `admin`
- **And** a league `OKC Youth Soccer` exists
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter team name `OKC Strikers`, home field `Memorial Field`, and select league `OKC Youth Soccer`
- **And** I click **Create**
- **Then** the API returns `201` with a team object containing `id`, `name` `OKC Strikers`, `homeField` `Memorial Field`, and nested `league.name` `OKC Youth Soccer`
- **And** `OKC Strikers` appears in the teams view list
- **And** the add-team dialog closes



#### Scenario: User creates a team with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**



#### Scenario: User creates a team with a name that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter a team name longer than 50 characters with a valid league
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Team name must be 50 characters or fewer."**



#### Scenario: User creates a team with an unknown league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I send `POST /league/teams` with a `leagueId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "League not found." }`
- **And** no team is stored



#### Scenario: User creates a team with a duplicate name in the same league

- **Given** I am signed in as a user with role `admin`
- **And** a team named `OKC Strikers` already exists in league `OKC Youth Soccer`
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter team name `OKC Strikers` and select league `OKC Youth Soccer`
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "Team name is already taken in this league." }`
- **And** no second team named `OKC Strikers` is stored in that league

---



### US-5.3 — View teams



#### Scenario: Teams view loads with existing teams

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** teams exist
- **When** I view the teams list
- **Then** all the teams are displayed in the list



#### Scenario: User has no teams

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** there are no teams
- **When** I view the teams list
- **Then** I see **"No teams yet. Create your first team."**

---



### US-5.4 — Manage team rows



#### Scenario: team rows open the team view and show a delete action

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I view a team row
- **Then** the team name is not a link
- **And** the team row shows an **Open team** icon action
- **And** the team row shows a **Delete team** icon action

---



### US-5.5 — Edit a team



#### Scenario: User selects to edit a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **When** I click **Edit team**
- **Then** the team edit dialog is displayed



#### Scenario: User edits a team with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** the team edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save Team**
- **Then** the team data is updated
- **And** the heading area shows the updated team info
- **And** the dialog is closed



#### Scenario: User edits a team with invalid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** the team edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Team**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed



#### Scenario: User edits a team and cancels

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** the team edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the team data is not updated
- **And** the dialog is closed

---



### US-5.6 — Delete a team



#### Scenario: User selects to delete a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click the delete icon on a team row
- **Then** the team delete dialog is displayed



#### Scenario: User deletes a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team delete dialog is displayed
- **When** I click **Delete Team**
- **Then** the team is deleted
- **And** the dialog is closed
- **And** the team is not in the teams list



#### Scenario: User deletes a team that has players

- **Given** I am signed in as a user with role `admin`
- **And** a team `OKC Strikers` has a player
- **And** I am viewing the teams view
- **And** the team delete dialog is displayed
- **When** I click **Delete Team**
- **Then** the team is deleted
- **And** that team's player rows are deleted
- **And** the people who were players still exist



#### Scenario: User cancels deleting a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team delete dialog is displayed
- **When** I click **Cancel**
- **Then** the team is not deleted
- **And** the dialog is closed
- **And** the team is still in the teams list

---



### US-5.7 — Restrict team management to admins



#### Scenario: Student does not see Teams in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Teams** is not shown



#### Scenario: Student can list teams via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /league/teams`
- **Then** the API returns `200` with an array of team objects



#### Scenario: Student cannot create a team via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /league/teams` with a valid team body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new team is stored



#### Scenario: Student cannot add a player via the API

- **Given** I am signed in as a user with role `student`
- **And** a team exists
- **When** I send `POST /league/teams/:teamId/players` with a valid player body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new player is stored



#### Scenario: Unauthenticated API request to teams

- **Given** I have no valid session token
- **When** I request `GET /league/teams`
- **Then** the API returns `401` with an unauthorized message



#### Scenario: Unauthenticated user navigates to teams

- **Given** I have no session in `localStorage`
- **When** I navigate to `/teams`
- **Then** I am redirected to the login page



#### Scenario: Unauthenticated user navigates to a team

- **Given** I have no session in `localStorage`
- **When** I navigate to `/teams/1`
- **Then** I am redirected to the login page

---



### US-5.8 — Manage team players



#### Scenario: User adds a player to a team

- **Given** I am signed in as a user with role `admin`
- **And** a team `OKC Strikers` exists
- **And** a person `Jane Doe` exists
- **And** I am viewing the team view for `OKC Strikers`
- **When** I click **Add Players**
- **And** I select person `Doe, Jane`, enter number `10`, and position `Forward`
- **And** I click **Add**
- **Then** the API returns `201` with a player object containing `personId` for `Jane Doe`, `position` `Forward`, and `number` `10`
- **And** `Doe` appears in the team's players list with number `10` and position `Forward`
- **And** the add-player dialog closes



#### Scenario: User selects to add a player

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **When** I click **Add Players**
- **Then** the add-player dialog is displayed



#### Scenario: User adds a player with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** the add-player dialog is displayed
- **When** I leave a required field empty
- **And** I click **Add**
- **Then** no API call is made
- **And** I see the message **"Required"**



#### Scenario: User adds a player who is already on the team

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is already a player on team `OKC Strikers`
- **And** I am viewing the team view for `OKC Strikers`
- **And** the add-player dialog is displayed
- **When** I select person `Doe, Jane` with otherwise valid data
- **And** I click **Add**
- **Then** the API returns `400` with `{ "message": "Person is already on this team." }`
- **And** no second player row for `Jane Doe` is stored on that team



#### Scenario: User adds a player with a number that is already taken on the team

- **Given** I am signed in as a user with role `admin`
- **And** team `OKC Strikers` already has a player with number `10`
- **And** I am viewing the team view for `OKC Strikers`
- **And** the add-player dialog is displayed
- **When** I enter number `10` with otherwise valid data
- **And** I click **Add**
- **Then** the API returns `400` with `{ "message": "Player number is already taken on this team." }`
- **And** no second player with number `10` is stored on that team



#### Scenario: User adds a player with an unknown person

- **Given** I am signed in as a user with role `admin`
- **When** I send `POST /league/teams/:teamId/players` with a `personId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Person not found." }`
- **And** no player is stored



#### Scenario: User selects to edit a player

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** a player is in the players list
- **When** I click the edit icon on that player row
- **Then** the player edit dialog is displayed



#### Scenario: User edits a player with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** the player edit dialog is displayed
- **When** I update number and position with valid values
- **And** I click **Save Player**
- **Then** the player data is updated
- **And** the players list shows the updated number and position
- **And** the dialog is closed



#### Scenario: User removes a player from a team

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is a player on team `OKC Strikers`
- **And** I am viewing the team view for `OKC Strikers`
- **And** the remove-player dialog is displayed
- **When** I click **Remove Player**
- **Then** the player row is deleted
- **And** `Jane Doe` is not in that team's players list
- **And** the person `Jane Doe` still exists



#### Scenario: Team with no players shows empty roster

- **Given** I am signed in as a user with role `admin`
- **And** team `OKC Strikers` has no players
- **And** I am viewing the team view for `OKC Strikers`
- **When** I view the players list
- **Then** I see **"No players yet. Add the first player."**

---



### US-5.10 — View a team



#### Scenario: User opens a team from the teams list

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** a team `OKC Strikers` exists in league `OKC Youth Soccer`
- **When** I click the **Open team** icon on the `OKC Strikers` row
- **Then** the team view is displayed



#### Scenario: Team view shows team info and actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view for `OKC Strikers` in league `OKC Youth Soccer`
- **Then** the heading area shows team name `OKC Strikers`
- **And** the heading area shows league `OKC Youth Soccer`
- **And** **Edit team** is shown
- **And** **Add Players** is shown



#### Scenario: Team view lists players with name, number, and position

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is a player on team `OKC Strikers` with number `10` and position `Forward`
- **And** I am viewing the team view for `OKC Strikers`
- **When** I view the players list
- **Then** the list shows name `Doe, Jane`, number `10`, and position `Forward`
- **And** the player row shows an **Edit player** icon action

---



### US-5.9 — Block delete of referenced league or person



#### Scenario: User cannot delete a league that has a team

- **Given** I am signed in as a user with role `admin`
- **And** a team exists in league `OKC Youth Soccer`
- **When** I send `DELETE /league/leagues/:leagueId` for that league
- **Then** the API returns `400` with `{ "message": "Cannot delete league: teams still exist." }`
- **And** the league is still stored
- **And** the team is still stored



#### Scenario: User cannot delete a person who is a player

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is a player on a team
- **When** I send `DELETE /league/people/:personId` for that person
- **Then** the API returns `400` with `{ "message": "Cannot delete person: team roster still exists." }`
- **And** the person is still stored
- **And** the player row is still stored

---



## Test Coverage Map


| Story   | Scenario                                                           | Test file                                                        | Test name                                                            |
| ------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| US-5.1  | Menu Selection                                                     | `frontend/tests/MenuBar.test.js`, `frontend/tests/Teams.test.js` | `Menu Selection`                                                     |
| US-5.2  | User creates a new team                                            | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User creates a new team`                                            |
| US-5.2  | User creates a team with a missing required field                  | `frontend/tests/Teams.test.js`                                   | `User creates a team with a missing required field`                  |
| US-5.2  | User creates a team with a name that is too long                   | `frontend/tests/Teams.test.js`                                   | `User creates a team with a name that is too long`                   |
| US-5.2  | User creates a team with an unknown league                         | `backend/tests/teams.test.js`                                    | `User creates a team with an unknown league`                         |
| US-5.2  | User creates a team with a duplicate name in the same league       | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User creates a team with a duplicate name in the same league`       |
| US-5.3  | Teams view loads with existing teams                               | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `Teams view loads with existing teams`                               |
| US-5.3  | User has no teams                                                  | `frontend/tests/Teams.test.js`                                   | `User has no teams`                                                  |
| US-5.4  | team rows open the team view and show a delete action              | `frontend/tests/Teams.test.js`                                   | `team rows open the team view and show a delete action`              |
| US-5.5  | User selects to edit a team                                        | `frontend/tests/Teams.test.js`                                   | `User selects to edit a team`                                        |
| US-5.5  | User edits a team with valid values and saves                      | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User edits a team with valid values and saves`                      |
| US-5.5  | User edits a team with invalid values and saves                    | `frontend/tests/Teams.test.js`                                   | `User edits a team with invalid values and saves`                    |
| US-5.5  | User edits a team and cancels                                      | `frontend/tests/Teams.test.js`                                   | `User edits a team and cancels`                                      |
| US-5.6  | User selects to delete a team                                      | `frontend/tests/Teams.test.js`                                   | `User selects to delete a team`                                      |
| US-5.6  | User deletes a team                                                | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User deletes a team`                                                |
| US-5.6  | User deletes a team that has players                               | `backend/tests/teams.test.js`                                    | `User deletes a team that has players`                               |
| US-5.6  | User cancels deleting a team                                       | `frontend/tests/Teams.test.js`                                   | `User cancels deleting a team`                                       |
| US-5.7  | Student does not see Teams in the menu                             | `frontend/tests/MenuBar.test.js`                                 | `Student does not see Teams in the menu`                             |
| US-5.7  | Student can list teams via the API                                 | `backend/tests/teams.test.js`                                    | `Student can list teams via the API`                                 |
| US-5.7  | Student cannot create a team via the API                           | `backend/tests/teams.test.js`                                    | `Student cannot create a team via the API`                           |
| US-5.7  | Student cannot add a player via the API                            | `backend/tests/teams.test.js`                                    | `Student cannot add a player via the API`                            |
| US-5.7  | Unauthenticated API request to teams                               | `backend/tests/teams.test.js`                                    | `Unauthenticated API request to teams`                               |
| US-5.7  | Unauthenticated user navigates to teams                            | `frontend/tests/router.test.js`                                  | `Unauthenticated user navigates to teams`                            |
| US-5.7  | Unauthenticated user navigates to a team                           | `frontend/tests/router.test.js`                                  | `Unauthenticated user navigates to a team`                           |
| US-5.8  | User adds a player to a team                                       | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User adds a player to a team`                                       |
| US-5.8  | User selects to add a player                                       | `frontend/tests/Teams.test.js`                                   | `User selects to add a player`                                       |
| US-5.8  | User adds a player with a missing required field                   | `frontend/tests/Teams.test.js`                                   | `User adds a player with a missing required field`                   |
| US-5.8  | User adds a player who is already on the team                      | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User adds a player who is already on the team`                      |
| US-5.8  | User adds a player with a number that is already taken on the team | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User adds a player with a number that is already taken on the team` |
| US-5.8  | User adds a player with an unknown person                          | `backend/tests/teams.test.js`                                    | `User adds a player with an unknown person`                          |
| US-5.8  | User selects to edit a player                                      | `frontend/tests/Teams.test.js`                                   | `User selects to edit a player`                                      |
| US-5.8  | User edits a player with valid values and saves                    | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User edits a player with valid values and saves`                    |
| US-5.8  | User removes a player from a team                                  | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`    | `User removes a player from a team`                                  |
| US-5.8  | Team with no players shows empty roster                            | `frontend/tests/Teams.test.js`                                   | `Team with no players shows empty roster`                            |
| US-5.10 | User opens a team from the teams list                              | `frontend/tests/Teams.test.js`                                   | `User opens a team from the teams list`                              |
| US-5.10 | Team view shows team info and actions                              | `frontend/tests/Teams.test.js`                                   | `Team view shows team info and actions`                              |
| US-5.10 | Team view lists players with name, number, and position            | `frontend/tests/Teams.test.js`                                   | `Team view lists players with name, number, and position`            |
| US-5.9  | User cannot delete a league that has a team                        | `backend/tests/leagues.test.js`, `backend/tests/teams.test.js`   | `User cannot delete a league that has a team`                        |
| US-5.9  | User cannot delete a person who is a player                        | `backend/tests/people.test.js`, `backend/tests/teams.test.js`    | `User cannot delete a person who is a player`                        |




---



## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-team-management.md on branch `feature/5-team-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---



## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [ ] **Success Criteria (SC-00N)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---



## Out of Scope

- Student-facing team or roster UI (API `GET` is in this feature)
- Assigning a team to a season
- Coaches, staff, or captains as separate roles ([Feature 9](feature-9-team-manager.md) adds an optional team **manager** person)
- A closed list of positions
- Creating people from the add-player dialog (people stay in [Feature 4](feature-4-people-management.md))
- Non-admin team management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Teams** for role `admin`)

---



## Delivered to later features

- `MenuBar` is Feature 1 chrome; Features 2–4 added **Seasons**, **Leagues**, and **People**; this feature added **Teams** for `admin`.
- A later feature MUST add its nav item to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `teams` table belongs to `leagues`. The `players` table attaches Feature 4 **people** to a team with position and number.
- [Feature 6](feature-6-game-management.md) attaches games to teams. A team MAY have many games. Feature 6 MUST reject `DELETE /league/teams/:teamId` with `400` when games still reference that team.
- [Feature 9](feature-9-team-manager.md) adds optional `managerId` (a Feature 4 person) on the team.

---

