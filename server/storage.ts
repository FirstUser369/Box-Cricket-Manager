import { randomUUID } from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  players,
  teams,
  matches,
  ballEvents,
  pointsTable,
  playerMatchStats,
  auctionState,
  tournamentSettings,
  broadcasts,
  captainPairs,
  type Player, type InsertPlayer,
  type Team, type InsertTeam,
  type Match, type InsertMatch,
  type AuctionState,
  type BallEvent, type InsertBallEvent,
  type PointsTable,
  type PlayerMatchStats, type InsertPlayerMatchStats,
  type OrangeCapLeader, type PurpleCapLeader, type MVPLeader,
  type TournamentSettings, type InsertTournamentSettings,
  type Broadcast, type InsertBroadcast,
  type CaptainPair, type InsertCaptainPair
} from "@shared/schema";

// Type for importing players with all fields (for data transfer between environments)
export type ImportPlayerData = {
  id?: string;
  name: string;
  mobile: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  role: string;
  battingRating?: number;
  bowlingRating?: number;
  fieldingRating?: number;
  photoUrl?: string;
  tshirtSize?: string | null;
  basePoints?: number;
  isLocked?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  teamId?: string | null;
  soldPrice?: number | null;
  status?: string;
  paymentStatus?: string;
  approvalStatus?: string;
};

export interface IStorage {
  getAllPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByMobile(mobile: string): Promise<Player | undefined>;
  getPlayerByEmail(email: string): Promise<Player | undefined>;
  getPendingPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, data: Partial<Player>): Promise<Player | undefined>;
  importPlayer(playerData: ImportPlayerData): Promise<Player>;
  deletePlayer(id: string): Promise<void>;

  getAllTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined>;

  getAuctionState(): Promise<AuctionState | undefined>;
  updateAuctionState(data: Partial<AuctionState>): Promise<AuctionState>;

  getAllMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, data: Partial<Match>): Promise<Match | undefined>;
  deleteMatch(id: string): Promise<void>;

  getAllBallEvents(): Promise<BallEvent[]>;
  getMatchBallEvents(matchId: string): Promise<BallEvent[]>;
  createBallEvent(event: InsertBallEvent): Promise<BallEvent>;
  deleteLastBallEvent(matchId: string): Promise<void>;

  getAllPointsTable(): Promise<PointsTable[]>;
  getTeamPoints(teamId: string): Promise<PointsTable | undefined>;
  updatePointsTable(teamId: string, data: Partial<PointsTable>): Promise<PointsTable>;

  getPlayerStats(playerId: string): Promise<PlayerMatchStats[]>;
  updatePlayerStats(matchId: string, playerId: string, data: Partial<PlayerMatchStats>): Promise<PlayerMatchStats>;
  getPlayerMatchStats(matchId: string, playerId: string, innings: number): Promise<PlayerMatchStats | undefined>;
  createPlayerMatchStats(data: InsertPlayerMatchStats): Promise<PlayerMatchStats>;
  getMatchPlayerStats(matchId: string): Promise<PlayerMatchStats[]>;

  getOrangeCapLeaders(): Promise<OrangeCapLeader[]>;
  getPurpleCapLeaders(): Promise<PurpleCapLeader[]>;
  getMVPLeaders(): Promise<MVPLeader[]>;

  // Tournament Settings
  getTournamentSettings(): Promise<TournamentSettings | undefined>;
  updateTournamentSettings(data: Partial<TournamentSettings>): Promise<TournamentSettings>;

  // Broadcasts
  getAllBroadcasts(): Promise<Broadcast[]>;
  getActiveBroadcasts(): Promise<Broadcast[]>;
  createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast>;
  updateBroadcast(id: string, data: Partial<Broadcast>): Promise<Broadcast | undefined>;
  deleteBroadcast(id: string): Promise<void>;

  // Captain Pairs
  getAllCaptainPairs(): Promise<CaptainPair[]>;
  getCaptainPair(id: string): Promise<CaptainPair | undefined>;
  createCaptainPair(pair: InsertCaptainPair): Promise<CaptainPair>;
  updateCaptainPair(id: string, data: Partial<CaptainPair>): Promise<CaptainPair | undefined>;
  deleteCaptainPair(id: string): Promise<void>;
}

// Single source of truth for budget
const TEAM_BUDGET = 25000;

export class DatabaseStorage implements IStorage {
  private initialized = false;

  private async ensureDefaultTeams() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Fix any incorrect budget values on startup
    await this.fixBudgetValues();

    const existingTeams = await db.select().from(teams);
    if (existingTeams.length > 0) return;

    const defaultTeams = [
      { name: "Mumbai Strikers", shortName: "MS", primaryColor: "#004BA0", secondaryColor: "#D4AF37" },
      { name: "Chennai Warriors", shortName: "CW", primaryColor: "#FFCB05", secondaryColor: "#004BA0" },
      { name: "Bangalore Royals", shortName: "BR", primaryColor: "#EC1C24", secondaryColor: "#000000" },
      { name: "Kolkata Knights", shortName: "KK", primaryColor: "#3A225D", secondaryColor: "#FFD700" },
      { name: "Delhi Capitals", shortName: "DC", primaryColor: "#0078BC", secondaryColor: "#EF1B23" },
      { name: "Hyderabad Sunrisers", shortName: "HS", primaryColor: "#FF822A", secondaryColor: "#000000" },
      { name: "Punjab Kings", shortName: "PK", primaryColor: "#ED1B24", secondaryColor: "#A7A9AC" },
      { name: "Rajasthan Royals", shortName: "RR", primaryColor: "#EA1A85", secondaryColor: "#254AA5" },
      { name: "Gujarat Titans", shortName: "GT", primaryColor: "#1C1C1C", secondaryColor: "#0B4973" },
      { name: "Lucknow Giants", shortName: "LG", primaryColor: "#A72056", secondaryColor: "#FFCC00" },
      { name: "Ahmedabad Eagles", shortName: "AE", primaryColor: "#2E8B57", secondaryColor: "#FFD700" },
      { name: "Jaipur Jaguars", shortName: "JJ", primaryColor: "#FF6347", secondaryColor: "#4169E1" },
    ];

    for (const team of defaultTeams) {
      await db.insert(teams).values({
        id: randomUUID(),
        ...team,
        logoUrl: null,
        budget: 25000,
        remainingBudget: 25000,
        captainId: null,
        viceCaptainId: null,
      });
    }
  }

  private async fixBudgetValues() {
    // Only fix the base budget field, NOT remaining budget (which tracks auction spending)
    await db.update(teams).set({ 
      budget: TEAM_BUDGET 
    }).where(sql`budget != ${TEAM_BUDGET}`);
    
    // Only fix the base budget for captain pairs
    await db.update(captainPairs).set({ 
      budget: TEAM_BUDGET 
    }).where(sql`budget != ${TEAM_BUDGET}`);
  }

  private calculateBasePoints(batting: number, bowling: number, fielding: number): number {
    return (batting + bowling + fielding) * 100;
  }

  async getAllPlayers(): Promise<Player[]> {
    return db.select().from(players);
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayerByMobile(mobile: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.mobile, mobile));
    return player || undefined;
  }

  async getPlayerByEmail(email: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.email, email));
    return player || undefined;
  }

  async getPendingPlayers(): Promise<Player[]> {
    return db.select().from(players).where(eq(players.approvalStatus, "pending"));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const basePoints = this.calculateBasePoints(
      player.battingRating || 5,
      player.bowlingRating || 5,
      player.fieldingRating || 5
    );

    const [newPlayer] = await db.insert(players).values({
      id,
      name: player.name,
      mobile: player.mobile,
      email: player.email || null,
      phone: player.phone || null,
      address: player.address,
      role: player.role,
      battingRating: player.battingRating || 5,
      bowlingRating: player.bowlingRating || 5,
      fieldingRating: player.fieldingRating || 5,
      photoUrl: player.photoUrl,
      tshirtSize: player.tshirtSize || null,
      basePoints,
      isLocked: false,
      isCaptain: false,
      isViceCaptain: false,
      teamId: null,
      soldPrice: null,
      status: "pending",
      paymentStatus: "pending",
      approvalStatus: "pending",
    }).returning();

    return newPlayer;
  }

  async updatePlayer(id: string, data: Partial<Player>): Promise<Player | undefined> {
    const [updated] = await db.update(players).set(data).where(eq(players.id, id)).returning();
    return updated || undefined;
  }

  // Import a player with all fields (for data transfer between environments)
  async importPlayer(playerData: ImportPlayerData): Promise<Player> {
    const id = playerData.id || randomUUID();
    const battingRating = playerData.battingRating ?? 50;
    const bowlingRating = playerData.bowlingRating ?? 50;
    const fieldingRating = playerData.fieldingRating ?? 50;
    const basePoints = playerData.basePoints ?? this.calculateBasePoints(battingRating, bowlingRating, fieldingRating);
    
    // Normalize role to match expected values (handles case variations)
    const normalizeRole = (role: string | null | undefined): string => {
      const value = (role || "Batsman").toLowerCase();
      if (value === "batsman") return "Batsman";
      if (value === "bowler") return "Bowler";
      if (value === "all-rounder" || value === "allrounder") return "All-rounder";
      return "Batsman"; // default fallback
    };
    
    const normalizedRole = normalizeRole(playerData.role);
    
    const [newPlayer] = await db.insert(players).values({
      id,
      name: playerData.name,
      mobile: playerData.mobile,
      email: playerData.email || null,
      phone: playerData.phone || null,
      address: playerData.address,
      role: normalizedRole,
      battingRating,
      bowlingRating,
      fieldingRating,
      photoUrl: playerData.photoUrl || "",
      tshirtSize: playerData.tshirtSize || null,
      basePoints,
      isLocked: playerData.isLocked ?? false,
      isCaptain: playerData.isCaptain ?? false,
      isViceCaptain: playerData.isViceCaptain ?? false,
      teamId: playerData.teamId || null,
      soldPrice: playerData.soldPrice || null,
      status: playerData.status || "pending",
      paymentStatus: playerData.paymentStatus || "pending",
      approvalStatus: playerData.approvalStatus || "pending",
    }).returning();

    return newPlayer;
  }

  async deletePlayer(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async getAllTeams(): Promise<Team[]> {
    await this.ensureDefaultTeams();
    return db.select().from(teams);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    await this.ensureDefaultTeams();
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const [newTeam] = await db.insert(teams).values({
      id,
      name: team.name,
      shortName: team.shortName,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor || team.primaryColor,
      logoUrl: team.logoUrl || null,
      budget: team.budget || 25000,
      remainingBudget: team.remainingBudget || 25000,
    }).returning();

    return newTeam;
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined> {
    const [updated] = await db.update(teams).set(data).where(eq(teams.id, id)).returning();
    return updated || undefined;
  }

  async getAuctionState(): Promise<AuctionState | undefined> {
    const [state] = await db.select().from(auctionState);
    return state || undefined;
  }

  async updateAuctionState(data: Partial<AuctionState>): Promise<AuctionState> {
    const existing = await this.getAuctionState();

    if (!existing) {
      const id = randomUUID();
      const [newState] = await db.insert(auctionState).values({
        id,
        status: data.status || "not_started",
        currentPlayerId: data.currentPlayerId || null,
        currentBid: data.currentBid || null,
        currentBiddingTeamId: data.currentBiddingTeamId || null,
        bidHistory: data.bidHistory || [],
      }).returning();
      return newState;
    }

    const [updated] = await db.update(auctionState).set(data).where(eq(auctionState.id, existing.id)).returning();
    return updated;
  }

  async getAllMatches(): Promise<Match[]> {
    return db.select().from(matches);
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = randomUUID();

    const [newMatch] = await db.insert(matches).values({
      id,
      matchNumber: match.matchNumber || 1,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      status: "scheduled",
      stage: match.stage || "group",
      groupName: match.groupName || null,
      tossWinnerId: null,
      tossDecision: null,
      winnerId: null,
      result: null,
      team1Score: 0,
      team1Wickets: 0,
      team1Overs: "0.0",
      team2Score: 0,
      team2Wickets: 0,
      team2Overs: "0.0",
      currentInnings: 1,
      superOverTeam1Score: null,
      superOverTeam1Wickets: null,
      superOverTeam2Score: null,
      superOverTeam2Wickets: null,
    }).returning();

    return newMatch;
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<Match | undefined> {
    const [updated] = await db.update(matches).set(data).where(eq(matches.id, id)).returning();
    return updated || undefined;
  }

  async deleteMatch(id: string): Promise<void> {
    await db.delete(matches).where(eq(matches.id, id));
  }

  async getAllBallEvents(): Promise<BallEvent[]> {
    return db.select().from(ballEvents);
  }

  async getMatchBallEvents(matchId: string): Promise<BallEvent[]> {
    return db.select().from(ballEvents).where(eq(ballEvents.matchId, matchId));
  }

  async createBallEvent(event: InsertBallEvent): Promise<BallEvent> {
    const id = randomUUID();
    const [newEvent] = await db.insert(ballEvents).values({
      id,
      matchId: event.matchId,
      innings: event.innings,
      overNumber: event.overNumber,
      ballNumber: event.ballNumber,
      batsmanId: event.batsmanId,
      bowlerId: event.bowlerId,
      runs: event.runs || 0,
      extras: event.extras || 0,
      extraType: event.extraType || null,
      isWicket: event.isWicket || false,
      wicketType: event.wicketType || null,
      dismissedPlayerId: event.dismissedPlayerId || null,
      isSuperOver: event.isSuperOver || false,
    }).returning();

    return newEvent;
  }

  async deleteLastBallEvent(matchId: string): Promise<void> {
    const events = await this.getMatchBallEvents(matchId);
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      await db.delete(ballEvents).where(eq(ballEvents.id, lastEvent.id));
    }
  }

  async getAllPointsTable(): Promise<PointsTable[]> {
    return db.select().from(pointsTable);
  }

  async getTeamPoints(teamId: string): Promise<PointsTable | undefined> {
    const [points] = await db.select().from(pointsTable).where(eq(pointsTable.teamId, teamId));
    return points || undefined;
  }

  async updatePointsTable(teamId: string, data: Partial<PointsTable>): Promise<PointsTable> {
    const existing = await this.getTeamPoints(teamId);

    if (!existing) {
      const id = randomUUID();
      const [newPoints] = await db.insert(pointsTable).values({
        id,
        teamId,
        played: data.played || 0,
        won: data.won || 0,
        lost: data.lost || 0,
        tied: data.tied || 0,
        points: data.points || 0,
        runsFor: data.runsFor || 0,
        oversFor: data.oversFor || "0.0",
        runsAgainst: data.runsAgainst || 0,
        oversAgainst: data.oversAgainst || "0.0",
        nrr: data.nrr || "0.000",
      }).returning();
      return newPoints;
    }

    const [updated] = await db.update(pointsTable).set(data).where(eq(pointsTable.id, existing.id)).returning();
    return updated;
  }

  async getPlayerStats(playerId: string): Promise<PlayerMatchStats[]> {
    return db.select().from(playerMatchStats).where(eq(playerMatchStats.playerId, playerId));
  }

  async updatePlayerStats(matchId: string, playerId: string, data: Partial<PlayerMatchStats>): Promise<PlayerMatchStats> {
    const [existing] = await db.select().from(playerMatchStats)
      .where(and(eq(playerMatchStats.matchId, matchId), eq(playerMatchStats.playerId, playerId)));

    if (!existing) {
      const id = randomUUID();
      const [newStats] = await db.insert(playerMatchStats).values({
        id,
        matchId,
        playerId,
        runsScored: data.runsScored || 0,
        ballsFaced: data.ballsFaced || 0,
        fours: data.fours || 0,
        sixes: data.sixes || 0,
        wicketsTaken: data.wicketsTaken || 0,
        oversBowled: data.oversBowled || "0.0",
        runsConceded: data.runsConceded || 0,
        catches: data.catches || 0,
        runOuts: data.runOuts || 0,
      }).returning();
      return newStats;
    }

    const [updated] = await db.update(playerMatchStats).set(data).where(eq(playerMatchStats.id, existing.id)).returning();
    return updated;
  }

  async getPlayerMatchStats(matchId: string, playerId: string, innings: number): Promise<PlayerMatchStats | undefined> {
    const [stats] = await db.select().from(playerMatchStats)
      .where(and(
        eq(playerMatchStats.matchId, matchId), 
        eq(playerMatchStats.playerId, playerId),
        eq(playerMatchStats.innings, innings)
      ));
    return stats || undefined;
  }

  async createPlayerMatchStats(data: InsertPlayerMatchStats): Promise<PlayerMatchStats> {
    const id = randomUUID();
    const [newStats] = await db.insert(playerMatchStats).values({
      id,
      ...data,
    }).returning();
    return newStats;
  }

  async getMatchPlayerStats(matchId: string): Promise<PlayerMatchStats[]> {
    return db.select().from(playerMatchStats).where(eq(playerMatchStats.matchId, matchId));
  }

  async getOrangeCapLeaders(): Promise<OrangeCapLeader[]> {
    const allPlayers = await this.getAllPlayers();
    const allStats = await db.select().from(playerMatchStats);

    const playerRuns = new Map<string, { runs: number; matches: Set<string>; balls: number }>();

    allStats.forEach(stat => {
      const current = playerRuns.get(stat.playerId) || { runs: 0, matches: new Set(), balls: 0 };
      current.runs += stat.runsScored || 0;
      current.balls += stat.ballsFaced || 0;
      current.matches.add(stat.matchId);
      playerRuns.set(stat.playerId, current);
    });

    const leaders: OrangeCapLeader[] = [];

    playerRuns.forEach((data, playerId) => {
      const player = allPlayers.find(p => p.id === playerId);
      if (player && data.runs > 0) {
        leaders.push({
          player,
          totalRuns: data.runs,
          matches: data.matches.size,
          average: data.matches.size > 0 ? data.runs / data.matches.size : 0,
          strikeRate: data.balls > 0 ? (data.runs / data.balls) * 100 : 0,
        });
      }
    });

    return leaders.sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 10);
  }

  async getPurpleCapLeaders(): Promise<PurpleCapLeader[]> {
    const allPlayers = await this.getAllPlayers();
    const allStats = await db.select().from(playerMatchStats);

    const playerWickets = new Map<string, { wickets: number; matches: Set<string>; runs: number; overs: number }>();

    allStats.forEach(stat => {
      const current = playerWickets.get(stat.playerId) || { wickets: 0, matches: new Set(), runs: 0, overs: 0 };
      current.wickets += stat.wicketsTaken || 0;
      current.runs += stat.runsConceded || 0;
      current.overs += parseFloat(stat.oversBowled || "0");
      current.matches.add(stat.matchId);
      playerWickets.set(stat.playerId, current);
    });

    const leaders: PurpleCapLeader[] = [];

    playerWickets.forEach((data, playerId) => {
      const player = allPlayers.find(p => p.id === playerId);
      if (player && data.wickets > 0) {
        leaders.push({
          player,
          totalWickets: data.wickets,
          matches: data.matches.size,
          economy: data.overs > 0 ? data.runs / data.overs : 0,
          average: data.wickets > 0 ? data.runs / data.wickets : 0,
        });
      }
    });

    return leaders.sort((a, b) => b.totalWickets - a.totalWickets).slice(0, 10);
  }

  async getMVPLeaders(): Promise<MVPLeader[]> {
    const allPlayers = await this.getAllPlayers();
    const allStats = await db.select().from(playerMatchStats);

    const playerPoints = new Map<string, { runs: number; wickets: number; catches: number }>();

    allStats.forEach(stat => {
      const current = playerPoints.get(stat.playerId) || { runs: 0, wickets: 0, catches: 0 };
      current.runs += stat.runsScored || 0;
      current.wickets += stat.wicketsTaken || 0;
      current.catches += stat.catches || 0;
      playerPoints.set(stat.playerId, current);
    });

    const leaders: MVPLeader[] = [];

    playerPoints.forEach((data, playerId) => {
      const player = allPlayers.find(p => p.id === playerId);
      if (player) {
        const mvpPoints = data.runs + (data.wickets * 25) + (data.catches * 10);
        if (mvpPoints > 0) {
          leaders.push({
            player,
            mvpPoints,
            runs: data.runs,
            wickets: data.wickets,
            catches: data.catches,
          });
        }
      }
    });

    return leaders.sort((a, b) => b.mvpPoints - a.mvpPoints).slice(0, 10);
  }

  // Tournament Settings Methods
  async getTournamentSettings(): Promise<TournamentSettings | undefined> {
    const [settings] = await db.select().from(tournamentSettings);
    return settings || undefined;
  }

  async updateTournamentSettings(data: Partial<TournamentSettings>): Promise<TournamentSettings> {
    const existing = await this.getTournamentSettings();

    if (!existing) {
      const id = randomUUID();
      const [newSettings] = await db.insert(tournamentSettings).values({
        id,
        registrationFee: data.registrationFee || 25,
        zellePhone: data.zellePhone || null,
        zelleEmail: data.zelleEmail || null,
        zelleQrUrl: data.zelleQrUrl || null,
        cashappId: data.cashappId || null,
        cashappQrUrl: data.cashappQrUrl || null,
        venmoId: data.venmoId || null,
        venmoQrUrl: data.venmoQrUrl || null,
        auctionDate: data.auctionDate || "January 25th",
        tournamentDate: data.tournamentDate || "February 7th",
        displayUsername: data.displayUsername || "Bhulku",
        displayPassword: data.displayPassword || "weareone",
      }).returning();
      return newSettings;
    }

    const [updated] = await db.update(tournamentSettings).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(tournamentSettings.id, existing.id)).returning();
    return updated;
  }

  // Broadcast Methods
  async getAllBroadcasts(): Promise<Broadcast[]> {
    return db.select().from(broadcasts).orderBy(desc(broadcasts.priority), desc(broadcasts.createdAt));
  }

  async getActiveBroadcasts(): Promise<Broadcast[]> {
    return db.select().from(broadcasts)
      .where(eq(broadcasts.isActive, true))
      .orderBy(desc(broadcasts.priority), desc(broadcasts.createdAt));
  }

  async createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast> {
    const id = randomUUID();
    const [newBroadcast] = await db.insert(broadcasts).values({
      id,
      title: broadcast.title,
      content: broadcast.content,
      type: broadcast.type || "announcement",
      isActive: broadcast.isActive ?? true,
      priority: broadcast.priority || 0,
    }).returning();
    return newBroadcast;
  }

  async updateBroadcast(id: string, data: Partial<Broadcast>): Promise<Broadcast | undefined> {
    const [updated] = await db.update(broadcasts).set(data).where(eq(broadcasts.id, id)).returning();
    return updated || undefined;
  }

  async deleteBroadcast(id: string): Promise<void> {
    await db.delete(broadcasts).where(eq(broadcasts.id, id));
  }

  // Captain Pairs
  async getAllCaptainPairs(): Promise<CaptainPair[]> {
    return db.select().from(captainPairs).orderBy(captainPairs.slotNumber);
  }

  async getCaptainPair(id: string): Promise<CaptainPair | undefined> {
    const results = await db.select().from(captainPairs).where(eq(captainPairs.id, id));
    return results[0];
  }

  async createCaptainPair(pair: InsertCaptainPair): Promise<CaptainPair> {
    const id = randomUUID();
    const newPair = { ...pair, id };
    await db.insert(captainPairs).values(newPair);
    return newPair as CaptainPair;
  }

  async updateCaptainPair(id: string, data: Partial<CaptainPair>): Promise<CaptainPair | undefined> {
    await db.update(captainPairs).set(data).where(eq(captainPairs.id, id));
    return this.getCaptainPair(id);
  }

  async deleteCaptainPair(id: string): Promise<void> {
    await db.delete(captainPairs).where(eq(captainPairs.id, id));
  }
}

export const storage = new DatabaseStorage();
