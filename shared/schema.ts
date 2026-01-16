import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player Registration
export const players = pgTable("players", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address").notNull(),
  role: text("role").notNull(), // Batsman, Bowler, All-rounder
  battingRating: integer("batting_rating").notNull(),
  bowlingRating: integer("bowling_rating").notNull(),
  fieldingRating: integer("fielding_rating").notNull(),
  photoUrl: text("photo_url").notNull(),
  tshirtSize: text("tshirt_size"), // S, M, L, XL
  basePoints: integer("base_points").notNull(),
  category: text("category").default("1500"), // 1500, 2000, 2500, 3000
  isLocked: boolean("is_locked").default(false),
  isCaptain: boolean("is_captain").default(false),
  isViceCaptain: boolean("is_vice_captain").default(false),
  teamId: varchar("team_id", { length: 36 }),
  soldPrice: integer("sold_price"),
  status: text("status").default("pending"), // pending, approved, rejected, registered, in_auction, sold, unsold, lost_gold
  paymentStatus: text("payment_status").default("pending"), // pending, verified, rejected
  approvalStatus: text("approval_status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({ 
  id: true, 
  basePoints: true,
  status: true,
  paymentStatus: true,
  approvalStatus: true,
  category: true,
  isLocked: true,
  isCaptain: true,
  isViceCaptain: true,
  teamId: true,
  soldPrice: true,
  createdAt: true,
});
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
  budget: integer("budget").notNull().default(25000), // Updated to 25,000 as per new spec
  remainingBudget: integer("remaining_budget").notNull().default(25000),
  groupName: text("group_name"), // A, B, C, D
  captainId: varchar("captain_id", { length: 36 }),
  viceCaptainId: varchar("vice_captain_id", { length: 36 }),
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
  currentCategory: text("current_category").default("3000"), // Tracks current auction category (3000 -> 2500 -> 2000 -> 1500)
  categoryBreak: boolean("category_break").default(false), // True when a category is complete and break animation should show
  completedCategory: text("completed_category"), // Which category just completed (for break display)
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
  stage: text("stage").default("group"), // group, semifinal, final
  groupName: text("group_name"), // A, B, C, D (for group stage matches)
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
  // Power Over fields
  powerOverActive: boolean("power_over_active").default(false),
  powerOverNumber: integer("power_over_number"), // Which over is power over
  powerOverInnings: integer("power_over_innings"), // 1 or 2
  // Current batting/bowling tracking
  strikerId: varchar("striker_id", { length: 36 }),
  nonStrikerId: varchar("non_striker_id", { length: 36 }),
  currentBowlerId: varchar("current_bowler_id", { length: 36 }),
  // Batting order for each innings (JSON array of player IDs in order they came to bat)
  innings1BattingOrder: jsonb("innings1_batting_order").$type<string[]>(),
  innings2BattingOrder: jsonb("innings2_batting_order").$type<string[]>(),
  // Bowling order for each innings
  innings1BowlingOrder: jsonb("innings1_bowling_order").$type<string[]>(),
  innings2BowlingOrder: jsonb("innings2_bowling_order").$type<string[]>(),
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
  extraType: text("extra_type"), // wide, no_ball (no free hit as per spec)
  isWicket: boolean("is_wicket").default(false),
  wicketType: text("wicket_type"), // bowled, caught, lbw, run_out, stumped
  dismissedPlayerId: varchar("dismissed_player_id", { length: 36 }),
  fielderId: varchar("fielder_id", { length: 36 }), // Who caught/stumped/ran out
  isSuperOver: boolean("is_super_over").default(false),
  isPowerOver: boolean("is_power_over").default(false), // If this ball was during power over
  actualRuns: integer("actual_runs").default(0), // Runs before power over doubling
});

export const insertBallEventSchema = createInsertSchema(ballEvents).omit({ id: true });
export type InsertBallEvent = z.infer<typeof insertBallEventSchema>;
export type BallEvent = typeof ballEvents.$inferSelect;

// Player Match Stats (for leaderboards)
export const playerMatchStats = pgTable("player_match_stats", {
  id: varchar("id", { length: 36 }).primaryKey(),
  matchId: varchar("match_id", { length: 36 }).notNull(),
  playerId: varchar("player_id", { length: 36 }).notNull(),
  innings: integer("innings").default(1), // 1 or 2
  runsScored: integer("runs_scored").default(0),
  ballsFaced: integer("balls_faced").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  wicketsTaken: integer("wickets_taken").default(0),
  oversBowled: text("overs_bowled").default("0.0"),
  runsConceded: integer("runs_conceded").default(0),
  catches: integer("catches").default(0),
  runOuts: integer("run_outs").default(0),
  isOut: boolean("is_out").default(false),
  dismissalType: text("dismissal_type"), // bowled, caught, lbw, run_out, stumped, not_out
  dismissedBy: varchar("dismissed_by", { length: 36 }), // bowler who got the wicket
  battingPosition: integer("batting_position"), // Order in which they came to bat
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
  role: text("role").default("admin"), // admin, display, user
});

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Legacy user exports for compatibility
export const users = admins;
export const insertUserSchema = insertAdminSchema;
export type InsertUser = InsertAdmin;
export type User = Admin;

// Tournament Settings (Payment Configuration, etc.)
export const tournamentSettings = pgTable("tournament_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  registrationFee: integer("registration_fee").default(25),
  zellePhone: text("zelle_phone"),
  zelleEmail: text("zelle_email"),
  zelleQrUrl: text("zelle_qr_url"),
  cashappId: text("cashapp_id"),
  cashappQrUrl: text("cashapp_qr_url"),
  venmoId: text("venmo_id"),
  venmoQrUrl: text("venmo_qr_url"),
  auctionDate: text("auction_date").default("January 25th"),
  tournamentDate: text("tournament_date").default("February 7th"),
  displayUsername: text("display_username").default("Bhulku"),
  displayPassword: text("display_password").default("weareone"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTournamentSettingsSchema = createInsertSchema(tournamentSettings).omit({ id: true });
export type InsertTournamentSettings = z.infer<typeof insertTournamentSettingsSchema>;
export type TournamentSettings = typeof tournamentSettings.$inferSelect;

// Admin Broadcasts / Announcements
export const broadcasts = pgTable("broadcasts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("announcement"), // announcement, rule, ticker
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({ id: true });
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Broadcast = typeof broadcasts.$inferSelect;

// Validation schemas for forms
export const playerRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  role: z.enum(["Batsman", "Bowler", "All-rounder"]),
  tshirtSize: z.enum(["S", "M", "L", "XL"]),
  battingRating: z.number().min(1).max(10),
  bowlingRating: z.number().min(1).max(10),
  fieldingRating: z.number().min(1).max(10),
  photoUrl: z.string().min(1, "Photo is required"),
});

export type PlayerRegistration = z.infer<typeof playerRegistrationSchema>;

// Auction Category Names (Hinglish fun names)
export const AUCTION_CATEGORIES = {
  "3000": "Jhakaas Superstars",
  "2500": "Solid Performers",
  "2000": "Promising Talent",
  "1500": "Hidden Gems",
} as const;

export type AuctionCategory = keyof typeof AUCTION_CATEGORIES;

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
