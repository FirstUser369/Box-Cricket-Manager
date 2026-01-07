import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player Registration
export const players = pgTable("players", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull().unique(),
  address: text("address").notNull(),
  role: text("role").notNull(), // Batsman, Bowler, All-rounder
  battingRating: integer("batting_rating").notNull(),
  bowlingRating: integer("bowling_rating").notNull(),
  fieldingRating: integer("fielding_rating").notNull(),
  photoUrl: text("photo_url").notNull(),
  basePoints: integer("base_points").notNull(),
  isLocked: boolean("is_locked").default(false),
  teamId: varchar("team_id", { length: 36 }),
  soldPrice: integer("sold_price"),
  status: text("status").default("registered"), // registered, in_auction, sold, unsold, lost_gold
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Teams
export const teams = pgTable("teams", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  logoUrl: text("logo_url"),
  budget: integer("budget").notNull().default(30000),
  remainingBudget: integer("remaining_budget").notNull().default(30000),
});

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Auction State
export const auctionState = pgTable("auction_state", {
  id: varchar("id", { length: 36 }).primaryKey(),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, paused, completed, lost_gold_round
  currentPlayerId: varchar("current_player_id", { length: 36 }),
  currentBid: integer("current_bid"),
  currentBiddingTeamId: varchar("current_bidding_team_id", { length: 36 }),
  bidHistory: jsonb("bid_history").$type<Array<{ teamId: string; amount: number; timestamp: number }>>(),
});

export const insertAuctionStateSchema = createInsertSchema(auctionState).omit({ id: true });
export type InsertAuctionState = z.infer<typeof insertAuctionStateSchema>;
export type AuctionState = typeof auctionState.$inferSelect;

// Matches
export const matches = pgTable("matches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  matchNumber: integer("match_number").notNull(),
  team1Id: varchar("team1_id", { length: 36 }).notNull(),
  team2Id: varchar("team2_id", { length: 36 }).notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, live, completed
  tossWinnerId: varchar("toss_winner_id", { length: 36 }),
  tossDecision: text("toss_decision"), // bat, bowl
  winnerId: varchar("winner_id", { length: 36 }),
  result: text("result"), // win, tie, super_over
  team1Score: integer("team1_score").default(0),
  team1Wickets: integer("team1_wickets").default(0),
  team1Overs: text("team1_overs").default("0.0"),
  team2Score: integer("team2_score").default(0),
  team2Wickets: integer("team2_wickets").default(0),
  team2Overs: text("team2_overs").default("0.0"),
  currentInnings: integer("current_innings").default(1),
  superOverTeam1Score: integer("super_over_team1_score"),
  superOverTeam1Wickets: integer("super_over_team1_wickets"),
  superOverTeam2Score: integer("super_over_team2_score"),
  superOverTeam2Wickets: integer("super_over_team2_wickets"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Ball by Ball Scoring
export const ballEvents = pgTable("ball_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  matchId: varchar("match_id", { length: 36 }).notNull(),
  innings: integer("innings").notNull(),
  overNumber: integer("over_number").notNull(),
  ballNumber: integer("ball_number").notNull(),
  batsmanId: varchar("batsman_id", { length: 36 }).notNull(),
  bowlerId: varchar("bowler_id", { length: 36 }).notNull(),
  runs: integer("runs").notNull().default(0),
  extras: integer("extras").default(0),
  extraType: text("extra_type"), // wide, no_ball
  isWicket: boolean("is_wicket").default(false),
  wicketType: text("wicket_type"), // bowled, caught, lbw, run_out, stumped
  dismissedPlayerId: varchar("dismissed_player_id", { length: 36 }),
  isSuperOver: boolean("is_super_over").default(false),
});

export const insertBallEventSchema = createInsertSchema(ballEvents).omit({ id: true });
export type InsertBallEvent = z.infer<typeof insertBallEventSchema>;
export type BallEvent = typeof ballEvents.$inferSelect;

// Player Match Stats (for leaderboards)
export const playerMatchStats = pgTable("player_match_stats", {
  id: varchar("id", { length: 36 }).primaryKey(),
  matchId: varchar("match_id", { length: 36 }).notNull(),
  playerId: varchar("player_id", { length: 36 }).notNull(),
  runsScored: integer("runs_scored").default(0),
  ballsFaced: integer("balls_faced").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  wicketsTaken: integer("wickets_taken").default(0),
  oversBowled: text("overs_bowled").default("0.0"),
  runsConceded: integer("runs_conceded").default(0),
  catches: integer("catches").default(0),
  runOuts: integer("run_outs").default(0),
});

export const insertPlayerMatchStatsSchema = createInsertSchema(playerMatchStats).omit({ id: true });
export type InsertPlayerMatchStats = z.infer<typeof insertPlayerMatchStatsSchema>;
export type PlayerMatchStats = typeof playerMatchStats.$inferSelect;

// Points Table
export const pointsTable = pgTable("points_table", {
  id: varchar("id", { length: 36 }).primaryKey(),
  teamId: varchar("team_id", { length: 36 }).notNull().unique(),
  played: integer("played").default(0),
  won: integer("won").default(0),
  lost: integer("lost").default(0),
  tied: integer("tied").default(0),
  points: integer("points").default(0),
  runsFor: integer("runs_for").default(0),
  oversFor: text("overs_for").default("0.0"),
  runsAgainst: integer("runs_against").default(0),
  oversAgainst: text("overs_against").default("0.0"),
  nrr: text("nrr").default("0.000"),
});

export const insertPointsTableSchema = createInsertSchema(pointsTable).omit({ id: true });
export type InsertPointsTable = z.infer<typeof insertPointsTableSchema>;
export type PointsTable = typeof pointsTable.$inferSelect;

// Admin Users
export const admins = pgTable("admins", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Legacy user exports for compatibility
export const users = admins;
export const insertUserSchema = insertAdminSchema;
export type InsertUser = InsertAdmin;
export type User = Admin;

// Validation schemas for forms
export const playerRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  role: z.enum(["Batsman", "Bowler", "All-rounder"]),
  battingRating: z.number().min(1).max(10),
  bowlingRating: z.number().min(1).max(10),
  fieldingRating: z.number().min(1).max(10),
  photoUrl: z.string().min(1, "Photo is required"),
});

export type PlayerRegistration = z.infer<typeof playerRegistrationSchema>;

// Leaderboard types
export interface OrangeCapLeader {
  player: Player;
  totalRuns: number;
  matches: number;
  average: number;
  strikeRate: number;
}

export interface PurpleCapLeader {
  player: Player;
  totalWickets: number;
  matches: number;
  economy: number;
  average: number;
}

export interface MVPLeader {
  player: Player;
  mvpPoints: number;
  runs: number;
  wickets: number;
  catches: number;
}
