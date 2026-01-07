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
  type Player, type InsertPlayer,
  type Team, type InsertTeam,
  type Match, type InsertMatch,
  type AuctionState,
  type BallEvent, type InsertBallEvent,
  type PointsTable,
  type PlayerMatchStats,
  type OrangeCapLeader, type PurpleCapLeader, type MVPLeader
} from "@shared/schema";

export interface IStorage {
  getAllPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByMobile(mobile: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, data: Partial<Player>): Promise<Player | undefined>;
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

  getOrangeCapLeaders(): Promise<OrangeCapLeader[]>;
  getPurpleCapLeaders(): Promise<PurpleCapLeader[]>;
  getMVPLeaders(): Promise<MVPLeader[]>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  private async ensureDefaultTeams() {
    if (this.initialized) return;
    this.initialized = true;

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
        budget: 30000,
        remainingBudget: 30000,
      });
    }
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
      address: player.address,
      role: player.role,
      battingRating: player.battingRating || 5,
      bowlingRating: player.bowlingRating || 5,
      fieldingRating: player.fieldingRating || 5,
      photoUrl: player.photoUrl,
      basePoints,
      isLocked: false,
      teamId: null,
      soldPrice: null,
      status: "registered",
    }).returning();

    return newPlayer;
  }

  async updatePlayer(id: string, data: Partial<Player>): Promise<Player | undefined> {
    const [updated] = await db.update(players).set(data).where(eq(players.id, id)).returning();
    return updated || undefined;
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
      budget: team.budget || 30000,
      remainingBudget: team.remainingBudget || 30000,
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
}

export const storage = new DatabaseStorage();
