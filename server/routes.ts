import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { 
  playerRegistrationSchema, 
  insertTournamentSettingsSchema,
  insertCaptainPairSchema
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Single source of truth for team/captain pair budget
const TEAM_BUDGET = 25000;
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendPaymentConfirmationEmail(playerEmail: string, playerName: string) {
  // Get tournament settings for dynamic display credentials
  const settings = await storage.getTournamentSettings();
  const displayUsername = settings?.displayUsername || "Bhulku";
  const displayPassword = settings?.displayPassword || "weareone";
  
  // Always use the published production URL for emails
  const baseUrl = 'https://samanvaypremierleagues02.replit.app';
  const displayUrl = `${baseUrl}/display`;
  const logoUrl = `${baseUrl}/spl-logo.png`;
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background: #ffffff; color: #000000; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px; border-bottom: 2px solid #000;">
      <img src="${logoUrl}" alt="SPL" style="width: 100px; margin-bottom: 10px;">
      <h1 style="color: #000; margin: 0; font-size: 28px;">YOU'RE IN!</h1>
    </div>
    
    <div style="padding: 24px 0;">
      <p style="font-size: 18px; margin-bottom: 20px;">Hey <strong>${playerName}</strong>, your payment is confirmed!</p>

      <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
        <h3 style="color: #000; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Event Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px;">Event</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">SPL Season 2</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px; border-top: 1px solid #ddd;">Location</td><td style="padding: 8px 0; text-align: right; font-weight: bold; border-top: 1px solid #ddd;">839 Upper Union St, Franklin MA</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px; border-top: 1px solid #ddd;">Auction</td><td style="padding: 8px 0; text-align: right; font-weight: bold; border-top: 1px solid #ddd;">Jan 25, 2026</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 13px; border-top: 1px solid #ddd;">Tournament</td><td style="padding: 8px 0; text-align: right; font-weight: bold; border-top: 1px solid #ddd;">Feb 7, 2026</td></tr>
        </table>
      </div>

      <div style="background: #000; text-align: center; padding: 14px; border-radius: 8px; margin: 20px 0;">
        <span style="color: #fff; font-weight: bold; font-size: 14px;">RIDES PROVIDED IF NEEDED</span>
      </div>

      <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #000; font-size: 14px; font-weight: bold; margin: 0 0 16px 0;">Live Display Access</h3>
        <div style="background: #fff; padding: 12px; border-radius: 6px; margin: 10px 0; border: 1px solid #ddd;">
          <span style="color: #666; font-size: 11px; text-transform: uppercase;">Username</span>
          <span style="float: right; font-weight: bold;">${displayUsername}</span>
        </div>
        <div style="background: #fff; padding: 12px; border-radius: 6px; margin: 10px 0; border: 1px solid #ddd;">
          <span style="color: #666; font-size: 11px; text-transform: uppercase;">Password</span>
          <span style="float: right; font-weight: bold;">${displayPassword}</span>
        </div>
        <p style="margin: 16px 0 0; font-size: 13px; color: #666;">Link: <a href="${displayUrl}" style="color: #000; font-weight: bold;">${displayUrl}</a></p>
        <a href="${displayUrl}" style="display: block; background: #000; color: #fff; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">WATCH LIVE</a>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 24px;">See you on the pitch!<br><strong style="color: #000;">Team SPL</strong></p>
    </div>
    
    <div style="text-align: center; color: #999; font-size: 11px; padding-top: 20px; border-top: 1px solid #ddd;">
      © 2026 Samanvay Premier League
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"Samanvay Premier League" <${process.env.GMAIL_USER}>`,
      to: playerEmail,
      subject: "YOU'RE IN! Payment Confirmed - SPL Season 2",
      html: emailHtml,
    });
    console.log(`Confirmation email sent to ${playerEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ PLAYERS ============
  
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  // Pending players route MUST come before /:id to avoid conflicts
  app.get("/api/players/pending", async (req, res) => {
    try {
      const players = await storage.getPendingPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending players" });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch player" });
    }
  });

  // Get player career stats across all matches
  app.get("/api/players/:id/career-stats", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const playerStats = await storage.getPlayerStats(req.params.id);
      const matches = await storage.getAllMatches();
      const teams = await storage.getAllTeams();

      // Calculate career totals
      let totalRuns = 0;
      let totalBalls = 0;
      let totalFours = 0;
      let totalSixes = 0;
      let totalWickets = 0;
      let totalOversBowled = 0;
      let totalRunsConceded = 0;
      let totalCatches = 0;
      let totalRunOuts = 0;
      let highestScore = 0;
      let bestBowling = { wickets: 0, runs: 0 };
      let matchesPlayed = 0;
      let timesOut = 0;

      // Track unique matches
      const uniqueMatches = new Set<string>();
      
      // Match details for history
      const matchHistory: Array<{
        matchId: string;
        matchNumber: number;
        team1: string;
        team2: string;
        date: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        isOut: boolean;
        wickets: number;
        oversBowled: string;
        runsConceded: number;
        catches: number;
        runOuts: number;
      }> = [];

      for (const stat of playerStats) {
        uniqueMatches.add(stat.matchId);
        
        // Batting stats
        totalRuns += stat.runsScored || 0;
        totalBalls += stat.ballsFaced || 0;
        totalFours += stat.fours || 0;
        totalSixes += stat.sixes || 0;
        if (stat.isOut) timesOut++;
        
        // Track highest score
        if ((stat.runsScored || 0) > highestScore) {
          highestScore = stat.runsScored || 0;
        }

        // Bowling stats
        totalWickets += stat.wicketsTaken || 0;
        totalCatches += stat.catches || 0;
        totalRunOuts += stat.runOuts || 0;
        
        // Parse overs bowled
        const oversStr = stat.oversBowled || "0.0";
        const [overs, balls] = oversStr.split(".").map(Number);
        totalOversBowled += overs + (balls || 0) / 6;
        totalRunsConceded += stat.runsConceded || 0;

        // Track best bowling
        if ((stat.wicketsTaken || 0) > bestBowling.wickets || 
            ((stat.wicketsTaken || 0) === bestBowling.wickets && (stat.runsConceded || 0) < bestBowling.runs)) {
          bestBowling = { wickets: stat.wicketsTaken || 0, runs: stat.runsConceded || 0 };
        }

        // Get match details
        const match = matches.find(m => m.id === stat.matchId);
        if (match) {
          const team1 = teams.find(t => t.id === match.team1Id);
          const team2 = teams.find(t => t.id === match.team2Id);
          
          // Check if this match already exists in history (combine innings)
          const existingMatch = matchHistory.find(m => m.matchId === stat.matchId);
          if (existingMatch) {
            existingMatch.runs += stat.runsScored || 0;
            existingMatch.balls += stat.ballsFaced || 0;
            existingMatch.fours += stat.fours || 0;
            existingMatch.sixes += stat.sixes || 0;
            existingMatch.isOut = existingMatch.isOut || !!stat.isOut;
            existingMatch.wickets += stat.wicketsTaken || 0;
            existingMatch.runsConceded += stat.runsConceded || 0;
            existingMatch.catches += stat.catches || 0;
            existingMatch.runOuts += stat.runOuts || 0;
            // Combine overs bowled
            const prevOvers = existingMatch.oversBowled.split(".").map(Number);
            const currOvers = (stat.oversBowled || "0.0").split(".").map(Number);
            const totalBallsBowled = (prevOvers[0] * 6 + (prevOvers[1] || 0)) + (currOvers[0] * 6 + (currOvers[1] || 0));
            existingMatch.oversBowled = `${Math.floor(totalBallsBowled / 6)}.${totalBallsBowled % 6}`;
          } else {
            matchHistory.push({
              matchId: stat.matchId,
              matchNumber: match.matchNumber || 0,
              team1: team1?.shortName || "TBD",
              team2: team2?.shortName || "TBD",
              date: "",
              runs: stat.runsScored || 0,
              balls: stat.ballsFaced || 0,
              fours: stat.fours || 0,
              sixes: stat.sixes || 0,
              isOut: !!stat.isOut,
              wickets: stat.wicketsTaken || 0,
              oversBowled: stat.oversBowled || "0.0",
              runsConceded: stat.runsConceded || 0,
              catches: stat.catches || 0,
              runOuts: stat.runOuts || 0,
            });
          }
        }
      }

      matchesPlayed = uniqueMatches.size;

      // Calculate averages and rates
      const battingAverage = timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : totalRuns > 0 ? "N/A" : "0.00";
      const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : "0.00";
      const bowlingAverage = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : "N/A";
      const economyRate = totalOversBowled > 0 ? (totalRunsConceded / totalOversBowled).toFixed(2) : "0.00";

      res.json({
        player,
        career: {
          matchesPlayed,
          batting: {
            runs: totalRuns,
            balls: totalBalls,
            fours: totalFours,
            sixes: totalSixes,
            highestScore,
            average: battingAverage,
            strikeRate,
            timesOut,
          },
          bowling: {
            wickets: totalWickets,
            oversBowled: totalOversBowled.toFixed(1),
            runsConceded: totalRunsConceded,
            bestBowling: `${bestBowling.wickets}/${bestBowling.runs}`,
            average: bowlingAverage,
            economyRate,
          },
          fielding: {
            catches: totalCatches,
            runOuts: totalRunOuts,
          },
        },
        matchHistory: matchHistory.sort((a, b) => b.matchNumber - a.matchNumber),
      });
    } catch (error) {
      console.error("Error fetching player career stats:", error);
      res.status(500).json({ error: "Failed to fetch player career stats" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const validation = playerRegistrationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const existingMobile = await storage.getPlayerByMobile(validation.data.mobile);
      if (existingMobile) {
        return res.status(400).json({ error: "Mobile number already registered" });
      }

      if (validation.data.email) {
        const existingEmail = await storage.getPlayerByEmail(validation.data.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already registered" });
        }
      }

      const player = await storage.createPlayer(validation.data);
      res.status(201).json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to create player" });
    }
  });

  app.patch("/api/players/:id", async (req, res) => {
    try {
      const player = await storage.updatePlayer(req.params.id, req.body);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      await storage.deletePlayer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete player" });
    }
  });

  // Export all players as JSON (for data transfer between environments)
  app.get("/api/players/export/all", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=players-export.json');
      res.json({
        exportDate: new Date().toISOString(),
        playerCount: players.length,
        players: players
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to export players" });
    }
  });

  // Import players from JSON (for data transfer between environments)
  // Relaxed validation schema - accepts case variations and allows role OR category
  const importPlayerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    mobile: z.string().min(1, "Mobile is required"),
    email: z.string().optional().nullable(), // Allow invalid emails during import
    phone: z.string().optional().nullable(),
    address: z.string().min(1, "Address is required"),
    // Accept any role string (will be normalized in storage layer)
    role: z.string().optional(),
    // Accept any category string (will be normalized in storage layer)
    category: z.string().optional().nullable(),
    battingRating: z.number().min(0).max(100).optional(),
    bowlingRating: z.number().min(0).max(100).optional(),
    fieldingRating: z.number().min(0).max(100).optional(),
    photoUrl: z.string().optional(),
    tshirtSize: z.string().optional().nullable(),
    basePoints: z.number().optional(),
    isLocked: z.boolean().optional(),
    isCaptain: z.boolean().optional(),
    isViceCaptain: z.boolean().optional(),
    teamId: z.string().optional().nullable(),
    soldPrice: z.number().optional().nullable(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    approvalStatus: z.string().optional(),
  }).refine(
    // Require at least one of role or category
    (data) => data.role,
    { message: "Either role or category is required" }
  );
  
  app.post("/api/players/import/all", async (req, res) => {
    try {
      const { players: importedPlayers, mode } = req.body;
      
      if (!Array.isArray(importedPlayers)) {
        return res.status(400).json({ error: "Invalid format: expected players array" });
      }
      
      const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
      
      for (const playerData of importedPlayers) {
        try {
          // Validate the player data
          const validation = importPlayerSchema.safeParse(playerData);
          if (!validation.success) {
            results.errors.push(`Validation failed for ${playerData.name || 'unknown'}: ${validation.error.errors[0].message}`);
            continue;
          }
          
          const validatedData = validation.data;
          
          // Check if player already exists by mobile
          const existingPlayer = validatedData.mobile ? await storage.getPlayerByMobile(validatedData.mobile) : null;
          
          if (existingPlayer) {
            if (mode === "overwrite") {
              // Normalize role/category for update (handles case variations)
              const normalizeRole = (role: string | null | undefined): string => {
                const value = (role || "Batsman").toLowerCase();
                if (value === "batsman") return "Batsman";
                if (value === "bowler") return "Bowler";
                if (value === "all-rounder" || value === "allrounder") return "All-rounder";
                return "Batsman";
              };
              
              const normalizeCategory = (cat: string | null | undefined, role: string): string => {
                if (!cat) return role;
                const lower = cat.toLowerCase();
                if (lower === "batsman") return "Batsman";
                if (lower === "bowler") return "Bowler";
                if (lower === "all-rounder" || lower === "allrounder") return "All-rounder";
                return role;
              };
              
              const normalizedRole = normalizeRole(validatedData.role);
              
              // Update existing player with validated fields, preserving existing values for undefined fields
              await storage.updatePlayer(existingPlayer.id, {
                name: validatedData.name,
                email: validatedData.email ?? existingPlayer.email,
                phone: validatedData.phone ?? existingPlayer.phone,
                address: validatedData.address,
                role: normalizedRole,
                battingRating: validatedData.battingRating ?? existingPlayer.battingRating,
                bowlingRating: validatedData.bowlingRating ?? existingPlayer.bowlingRating,
                fieldingRating: validatedData.fieldingRating ?? existingPlayer.fieldingRating,
                photoUrl: validatedData.photoUrl ?? existingPlayer.photoUrl,
                tshirtSize: validatedData.tshirtSize ?? existingPlayer.tshirtSize,
                basePoints: validatedData.basePoints ?? existingPlayer.basePoints,
                isLocked: validatedData.isLocked ?? existingPlayer.isLocked,
                isCaptain: validatedData.isCaptain ?? existingPlayer.isCaptain,
                isViceCaptain: validatedData.isViceCaptain ?? existingPlayer.isViceCaptain,
                teamId: validatedData.teamId ?? existingPlayer.teamId,
                soldPrice: validatedData.soldPrice ?? existingPlayer.soldPrice,
                status: validatedData.status ?? existingPlayer.status,
                paymentStatus: validatedData.paymentStatus ?? existingPlayer.paymentStatus,
                approvalStatus: validatedData.approvalStatus ?? existingPlayer.approvalStatus,
              });
              results.updated++;
            } else {
              results.skipped++;
            }
          } else {
            // Create new player using storage layer (handles role normalization)
            await storage.importPlayer({
              id: validatedData.id,
              name: validatedData.name,
              mobile: validatedData.mobile,
              email: validatedData.email,
              phone: validatedData.phone,
              address: validatedData.address,
              role: validatedData.role || "Batsman",
              battingRating: validatedData.battingRating,
              bowlingRating: validatedData.bowlingRating,
              fieldingRating: validatedData.fieldingRating,
              photoUrl: validatedData.photoUrl,
              tshirtSize: validatedData.tshirtSize,
              basePoints: validatedData.basePoints,
              isLocked: validatedData.isLocked,
              isCaptain: validatedData.isCaptain,
              isViceCaptain: validatedData.isViceCaptain,
              teamId: validatedData.teamId,
              soldPrice: validatedData.soldPrice,
              status: validatedData.status,
              paymentStatus: validatedData.paymentStatus,
              approvalStatus: validatedData.approvalStatus,
            });
            results.created++;
          }
        } catch (playerError: any) {
          results.errors.push(`Failed to import ${playerData.name || 'unknown'}: ${playerError.message}`);
        }
      }
      
      res.json({
        success: true,
        message: `Import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
        results
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to import players: " + error.message });
    }
  });

  // Player reassignment (post-auction)
  app.post("/api/players/:id/reassign", async (req, res) => {
    try {
      const { newTeamId } = req.body;
      
      if (!newTeamId || typeof newTeamId !== 'string') {
        return res.status(400).json({ error: "newTeamId is required" });
      }
      
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      if (!player.teamId) {
        return res.status(400).json({ error: "Player is not assigned to any team" });
      }
      if (player.teamId === newTeamId) {
        return res.status(400).json({ error: "Player is already on this team" });
      }
      
      // Get all data fresh to avoid stale reads
      const [oldTeam, newTeam, allPlayers] = await Promise.all([
        storage.getTeam(player.teamId),
        storage.getTeam(newTeamId),
        storage.getAllPlayers(),
      ]);
      
      if (!oldTeam || !newTeam) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check roster limit (9 players max per team)
      const newTeamPlayers = allPlayers.filter(p => p.teamId === newTeamId);
      if (newTeamPlayers.length >= 9) {
        return res.status(400).json({ error: "New team already has 9 players (maximum roster size)" });
      }
      
      const soldPrice = player.soldPrice || player.basePoints;
      
      // Check if new team has enough budget
      if (newTeam.remainingBudget < soldPrice) {
        return res.status(400).json({ error: "New team does not have enough budget" });
      }
      
      // Calculate correct budgets based on all players in each team
      const oldTeamPlayersAfter = allPlayers.filter(p => p.teamId === oldTeam.id && p.id !== player.id);
      const oldTeamSpentAfter = oldTeamPlayersAfter.reduce((sum, p) => sum + (p.soldPrice || p.basePoints), 0);
      const oldTeamBudgetAfter = oldTeam.budget - oldTeamSpentAfter;
      
      const newTeamSpentAfter = newTeamPlayers.reduce((sum, p) => sum + (p.soldPrice || p.basePoints), 0) + soldPrice;
      const newTeamBudgetAfter = newTeam.budget - newTeamSpentAfter;
      
      // Update player's team first
      const updatedPlayer = await storage.updatePlayer(player.id, { teamId: newTeamId });
      
      // Then update team budgets atomically based on recalculated values
      await Promise.all([
        storage.updateTeam(oldTeam.id, { remainingBudget: oldTeamBudgetAfter }),
        storage.updateTeam(newTeam.id, { remainingBudget: newTeamBudgetAfter }),
      ]);
      
      res.json(updatedPlayer);
    } catch (error) {
      console.error("Reassign player error:", error);
      res.status(500).json({ error: "Failed to reassign player" });
    }
  });

  // Manual player assignment (for adding unsold/unassigned players to teams)
  app.post("/api/players/:id/assign", async (req, res) => {
    try {
      const { teamId, soldPrice } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ error: "Team ID is required" });
      }
      
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      if (player.teamId) {
        return res.status(400).json({ error: "Player is already assigned to a team. Use reassign instead." });
      }
      
      const [team, allPlayers] = await Promise.all([
        storage.getTeam(teamId),
        storage.getAllPlayers(),
      ]);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check roster limit (9 players max per team)
      const teamPlayers = allPlayers.filter(p => p.teamId === teamId);
      if (teamPlayers.length >= 9) {
        return res.status(400).json({ error: "Team already has 9 players (maximum roster size)" });
      }
      
      const price = typeof soldPrice === 'number' ? soldPrice : player.basePoints;
      
      // Check if team has enough budget
      if (team.remainingBudget < price) {
        return res.status(400).json({ error: "Team does not have enough budget" });
      }
      
      // Update player with team assignment
      const updatedPlayer = await storage.updatePlayer(player.id, { 
        teamId, 
        soldPrice: price,
        status: "sold",
      });
      
      // Update team budget
      await storage.updateTeam(teamId, { 
        remainingBudget: team.remainingBudget - price 
      });
      
      res.json(updatedPlayer);
    } catch (error) {
      console.error("Assign player error:", error);
      res.status(500).json({ error: "Failed to assign player" });
    }
  });

  // ============ TEAMS ============
  
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const team = await storage.createTeam(req.body);
      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });


  app.post("/api/tournament/assign-groups", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      const groups = ["A", "B", "C", "D"];
      
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffledTeams.length; i++) {
        const groupIndex = Math.floor(i / 3);
        if (groupIndex < groups.length) {
          await storage.updateTeam(shuffledTeams[i].id, {
            groupName: groups[groupIndex],
          });
        }
      }
      
      const existingMatches = await storage.getAllMatches();
      for (const match of existingMatches) {
        if (match.stage === "group" || match.stage === "semifinal" || match.stage === "final") {
          await storage.deleteMatch(match.id);
        }
      }
      
      const updatedTeams = await storage.getAllTeams();
      let matchNumber = 1;
      
      for (const group of groups) {
        const groupTeams = updatedTeams.filter(t => t.groupName === group);
        if (groupTeams.length >= 2) {
          for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
              await storage.createMatch({
                matchNumber: matchNumber++,
                team1Id: groupTeams[i].id,
                team2Id: groupTeams[j].id,
                stage: "group",
                groupName: group,
              });
            }
          }
        }
      }
      
      res.json(updatedTeams);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign groups" });
    }
  });

  app.post("/api/tournament/create-quarterfinals", async (req, res) => {
    try {
      const { qf1Teams, qf2Teams, qf3Teams, qf4Teams } = req.body;
      
      const qf1 = await storage.createMatch({
        matchNumber: 0,
        team1Id: qf1Teams[0],
        team2Id: qf1Teams[1],
        stage: "quarterfinal",
      });
      
      const qf2 = await storage.createMatch({
        matchNumber: 0,
        team1Id: qf2Teams[0],
        team2Id: qf2Teams[1],
        stage: "quarterfinal",
      });
      
      const qf3 = await storage.createMatch({
        matchNumber: 0,
        team1Id: qf3Teams[0],
        team2Id: qf3Teams[1],
        stage: "quarterfinal",
      });
      
      const qf4 = await storage.createMatch({
        matchNumber: 0,
        team1Id: qf4Teams[0],
        team2Id: qf4Teams[1],
        stage: "quarterfinal",
      });
      
      res.json([qf1, qf2, qf3, qf4]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quarterfinals" });
    }
  });

  app.post("/api/tournament/create-semifinals", async (req, res) => {
    try {
      const { semifinal1Teams, semifinal2Teams } = req.body;
      
      const semi1 = await storage.createMatch({
        matchNumber: 0,
        team1Id: semifinal1Teams[0],
        team2Id: semifinal1Teams[1],
        stage: "semifinal",
      });
      
      const semi2 = await storage.createMatch({
        matchNumber: 0,
        team1Id: semifinal2Teams[0],
        team2Id: semifinal2Teams[1],
        stage: "semifinal",
      });
      
      res.json([semi1, semi2]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create semifinals" });
    }
  });

  app.post("/api/tournament/create-final", async (req, res) => {
    try {
      const { team1Id, team2Id } = req.body;
      
      const final = await storage.createMatch({
        matchNumber: 0,
        team1Id,
        team2Id,
        stage: "final",
      });
      
      res.json(final);
    } catch (error) {
      res.status(500).json({ error: "Failed to create final" });
    }
  });

  // ============ MATCHES ============
  
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getAllMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch match" });
    }
  });

  app.post("/api/matches", async (req, res) => {
    try {
      const match = await storage.createMatch(req.body);
      res.status(201).json(match);
    } catch (error) {
      res.status(500).json({ error: "Failed to create match" });
    }
  });

  // Clear all scheduled group stage matches (not semis/finals)
  app.delete("/api/matches/clear-scheduled", async (req, res) => {
    try {
      const matches = await storage.getAllMatches();
      const scheduledGroupMatches = matches.filter(m => 
        m.status === "scheduled" && (m.stage === "group" || !m.stage)
      );
      
      for (const match of scheduledGroupMatches) {
        await storage.deleteMatch(match.id);
      }
      
      res.json({ deleted: scheduledGroupMatches.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear matches" });
    }
  });

  app.post("/api/matches/:id/start", async (req, res) => {
    try {
      const { tossWinnerId, tossDecision } = req.body;
      
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, {
        status: "live",
        tossWinnerId,
        tossDecision,
        currentInnings: 1,
        innings1BattingOrder: [],
        innings2BattingOrder: [],
        innings1BowlingOrder: [],
        innings2BowlingOrder: [],
        innings1StartTime: new Date(),
      });
      
      res.json(updatedMatch);
    } catch (error) {
      console.error("Start match error:", error);
      res.status(500).json({ error: "Failed to start match" });
    }
  });

  // Set opening batsmen for current innings
  app.post("/api/matches/:id/set-batsmen", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      
      const { strikerId, nonStrikerId } = req.body;
      
      if (!strikerId || !nonStrikerId) {
        return res.status(400).json({ error: "Both striker and non-striker required" });
      }

      if (strikerId === nonStrikerId) {
           return res.status(400).json({ error: "Striker and Non-Striker must be different players" });
      }

      // Check if players are already out
      for (const playerId of [strikerId, nonStrikerId]) {
         const existingStats = await storage.getPlayerMatchStats(match.id, playerId, match.currentInnings!);
         if (existingStats && existingStats.isOut) {
             return res.status(400).json({ error: "One or more selected players are already out" });
         }
      }
      
      const isFirstInnings = match.currentInnings === 1;
      const battingOrder = isFirstInnings ? (match.innings1BattingOrder || []) : (match.innings2BattingOrder || []);
      
      // Add batsmen to batting order if not already there
      const newBattingOrder = [...battingOrder];
      if (!newBattingOrder.includes(strikerId)) {
        newBattingOrder.push(strikerId);
      }
      if (!newBattingOrder.includes(nonStrikerId)) {
        newBattingOrder.push(nonStrikerId);
      }
      
      const updateData: any = {
        strikerId,
        nonStrikerId,
      };
      
      if (isFirstInnings) {
        updateData.innings1BattingOrder = newBattingOrder;
      } else {
        updateData.innings2BattingOrder = newBattingOrder;
      }
      
      // Create/update player match stats for batsmen
      for (const playerId of [strikerId, nonStrikerId]) {
        const existingStats = await storage.getPlayerMatchStats(match.id, playerId, match.currentInnings!);
        if (!existingStats) {
          await storage.createPlayerMatchStats({
            matchId: match.id,
            playerId,
            innings: match.currentInnings!,
            battingPosition: newBattingOrder.indexOf(playerId) + 1,
          });
        }
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to set batsmen" });
    }
  });

  // Set current bowler
  app.post("/api/matches/:id/set-bowler", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      
      const { bowlerId } = req.body;
      
      if (!bowlerId) {
        return res.status(400).json({ error: "Bowler ID required" });
      }
      
      const isFirstInnings = match.currentInnings === 1;
      const bowlingOrder = isFirstInnings ? (match.innings1BowlingOrder || []) : (match.innings2BowlingOrder || []);
      
      // Check for consecutive overs rule
      const ballEvents = await storage.getMatchBallEvents(match.id);
      const currentInningsEvents = ballEvents.filter(e => e.innings === match.currentInnings);
      
      if (currentInningsEvents.length > 0) {
          // Sort to find the very last ball delivered
          currentInningsEvents.sort((a,b) => {
              if (a.overNumber !== b.overNumber) return b.overNumber - a.overNumber;
              return b.ballNumber - a.ballNumber;
          });
          const lastBall = currentInningsEvents[0];
          
          if (lastBall && lastBall.bowlerId === bowlerId) {
             return res.status(400).json({ error: "Player cannot bowl two consecutive overs" });
          }
      }

      // Add bowler to bowling order if not already there
      const newBowlingOrder = [...bowlingOrder];
      if (!newBowlingOrder.includes(bowlerId)) {
        newBowlingOrder.push(bowlerId);
      }
      
      const updateData: any = {
        currentBowlerId: bowlerId,
      };
      
      if (isFirstInnings) {
        updateData.innings1BowlingOrder = newBowlingOrder;
      } else {
        updateData.innings2BowlingOrder = newBowlingOrder;
      }
      
      // Create/update player match stats for bowler
      const existingStats = await storage.getPlayerMatchStats(match.id, bowlerId, match.currentInnings!);
      if (!existingStats) {
        await storage.createPlayerMatchStats({
          matchId: match.id,
          playerId: bowlerId,
          innings: match.currentInnings!,
        });
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to set bowler" });
    }
  });

  // Bring in new batsman after wicket
  app.post("/api/matches/:id/new-batsman", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      console.log("Adding new batsman:", req.body);
      const { newBatsmanId: paramNewBatsmanId, batsmanId, replaceStriker } = req.body ;
      const newBatsmanId = paramNewBatsmanId || batsmanId;
      
      if (!newBatsmanId) {
        return res.status(400).json({ error: "New batsman ID required" });
      }

      // Check if player is already out in this innings
      const existingStats = await storage.getPlayerMatchStats(match.id, newBatsmanId, match.currentInnings!);
      if (existingStats && existingStats.isOut) {
          return res.status(400).json({ error: "Player is already out in this innings" });
      }
      
      const isFirstInnings = match.currentInnings === 1;
      const battingOrder = isFirstInnings ? (match.innings1BattingOrder || []) : (match.innings2BattingOrder || []);
      
      // Add new batsman to batting order
      const newBattingOrder = [...battingOrder];
      if (!newBattingOrder.includes(newBatsmanId)) {
        newBattingOrder.push(newBatsmanId);
      }
      
      const updateData: any = {};
      
      // If replaceStriker is explicitly provided, respect it.
      // Otherwise, fill the empty slot.
      if (typeof replaceStriker !== 'undefined') {
        if (replaceStriker) {
            updateData.strikerId = newBatsmanId;
        } else {
            updateData.nonStrikerId = newBatsmanId;
        }
      } else {
        // Auto-detect empty slot
        if (!match.strikerId) {
             updateData.strikerId = newBatsmanId;
        } else if (!match.nonStrikerId) {
             updateData.nonStrikerId = newBatsmanId;
        } else {
             // Fallback if both are somehow set (shouldn't happen in this flow usually)
             // Default to non-striker as per original logic, or maybe striker? 
             // Let's stick to filling the logical empty slot.
             // If both are full, we might be forcing a replacement. 
             // Let's default to replacing striker if both are full? No, that's risky.
             // But usually one should be null here.
             updateData.nonStrikerId = newBatsmanId;
        }
      }
      
      if (isFirstInnings) {
        updateData.innings1BattingOrder = newBattingOrder;
      } else {
        updateData.innings2BattingOrder = newBattingOrder;
      }
      
      // Create player match stats for new batsman
      if (!existingStats) {
        await storage.createPlayerMatchStats({
          matchId: match.id,
          playerId: newBatsmanId,
          innings: match.currentInnings!,
          battingPosition: newBattingOrder.indexOf(newBatsmanId) + 1,
        });
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add new batsman" });
    }
  });

  app.post("/api/matches/:id/ball", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      
      const { runs, extraType, isWicket, wicketType, dismissedPlayerId, fielderId } = req.body;
      
      // Validate batsmen and bowler are set
      const currentWicketsForValidation = match.currentInnings === 1 ? match.team1Wickets : match.team2Wickets;
      const isLastManStandingMode = (currentWicketsForValidation || 0) >= 7;
      
      if (!match.strikerId || !match.currentBowlerId) {
        return res.status(400).json({ error: "Batsmen and bowler must be selected first" });
      }
      
      if (!match.nonStrikerId && !isLastManStandingMode) {
        return res.status(400).json({ error: "Both batsmen must be selected" });
      }
      
      const isFirstInnings = match.currentInnings === 1;
      const currentScore = isFirstInnings ? match.team1Score : match.team2Score;
      const currentWickets = isFirstInnings ? match.team1Wickets : match.team2Wickets;
      const currentOvers = isFirstInnings ? match.team1Overs : match.team2Overs;
      
      const [overs, balls] = (currentOvers || "0.0").split(".").map(Number);
      let newBalls = balls;
      let newOvers = overs;
      
      // Wide and No-ball: DON'T count as legal delivery (reball required)
      const isLegalDelivery = !extraType || (extraType !== "wide" && extraType !== "no_ball");
      
      if (isLegalDelivery) {
        newBalls += 1;
        if (newBalls >= 6) {
          newOvers += 1;
          newBalls = 0;
        }
      }
      
      const newOversStr = `${newOvers}.${newBalls}`;
      
      // Calculate runs
      let actualRuns = runs || 0;
      let effectiveRuns = actualRuns;
      
      let newScore = (currentScore || 0) + effectiveRuns;
      let newWickets = currentWickets || 0;
      
      // Wide and No-ball: Add exactly 1 extra run
      if (extraType === "wide" || extraType === "no_ball") {
        newScore += 1;
      }
      
      const MAX_WICKETS = 7;
      
      if (isWicket && (currentWickets || 0) >= MAX_WICKETS) {
        return res.status(400).json({ error: "Cannot take more wickets - last man standing" });
      }
      
      if (isWicket) {
        newWickets += 1;
      }
      
      newWickets = Math.min(newWickets, MAX_WICKETS);
      const isInningsOver = newOvers >= 6;
      
      // Determine strike rotation
      let shouldRotateStrike = false;
      const isLastManStanding = newWickets >= MAX_WICKETS;
      
      // Only rotate strike if we have a non-striker to rotate with
      if (!isWicket && !extraType && match.nonStrikerId && !isLastManStanding) {
        // Normal ball - rotate on odd runs
        if (actualRuns % 2 === 1) {
          shouldRotateStrike = true;
        }
      }
      
      
      const isEndOfOver = isLegalDelivery && newBalls === 0 && newOvers > overs;
      if (isEndOfOver && !isLastManStanding && match.nonStrikerId) {
        shouldRotateStrike = !shouldRotateStrike; // Toggle - since we may have already rotated for odd runs
      }
      
      // Create ball event
      await storage.createBallEvent({
        matchId: match.id,
        innings: match.currentInnings!,
        overNumber: overs + 1,
        ballNumber: isLegalDelivery ? balls + 1 : balls,
        batsmanId: match.strikerId,
        bowlerId: match.currentBowlerId,
        runs: effectiveRuns,
        extras: extraType ? 1 : 0,
        extraType: extraType || null,
        isWicket: isWicket || false,
        wicketType: wicketType || null,
        dismissedPlayerId: dismissedPlayerId || null,
        fielderId: fielderId || null,
        isPowerOver: false,
        actualRuns,
      });
      
      // Update fielder stats (catches, run outs)
      if (isWicket && fielderId) {
        const fielderStats = await storage.getPlayerMatchStats(match.id, fielderId, match.currentInnings!);
        if (fielderStats) {
          if (wicketType === 'caught' || wicketType === 'stumped') {
            await storage.updatePlayerStats(match.id, fielderId, {
              catches: (fielderStats.catches || 0) + 1,
            });
          } else if (wicketType === 'run_out') {
            await storage.updatePlayerStats(match.id, fielderId, {
              runOuts: (fielderStats.runOuts || 0) + 1,
            });
          }
        }
      }
      
      // Update batsman stats
      if (isLegalDelivery) {
        const batsmanStats = await storage.getPlayerMatchStats(match.id, match.strikerId, match.currentInnings!);
        if (batsmanStats) {
          await storage.updatePlayerStats(match.id, match.strikerId, {
            runsScored: (batsmanStats.runsScored || 0) + actualRuns,
            ballsFaced: (batsmanStats.ballsFaced || 0) + 1,
            fours: (batsmanStats.fours || 0) + (actualRuns === 4 ? 1 : 0),
            sixes: (batsmanStats.sixes || 0) + (actualRuns === 6 ? 1 : 0),
            innings: match.currentInnings!,
          });
        }
      }
      
      // Update bowler stats
      if (isLegalDelivery) {
        const bowlerStats = await storage.getPlayerMatchStats(match.id, match.currentBowlerId, match.currentInnings!);
        const currentBowlerOvers = bowlerStats?.oversBowled || "0.0";
        const [bOvers, bBalls] = currentBowlerOvers.split(".").map(Number);
        let newBBalls = bBalls + 1;
        let newBOvers = bOvers;
        if (newBBalls >= 6) {
          newBOvers += 1;
          newBBalls = 0;
        }
        
        await storage.updatePlayerStats(match.id, match.currentBowlerId, {
          runsConceded: (bowlerStats?.runsConceded || 0) + effectiveRuns + (extraType ? 1 : 0),
          oversBowled: `${newBOvers}.${newBBalls}`,
          wicketsTaken: (bowlerStats?.wicketsTaken || 0) + (isWicket ? 1 : 0),
          innings: match.currentInnings!,
        });
      } else {
        // Extras still count against bowler
        const bowlerStats = await storage.getPlayerMatchStats(match.id, match.currentBowlerId, match.currentInnings!);
        await storage.updatePlayerStats(match.id, match.currentBowlerId, {
          runsConceded: (bowlerStats?.runsConceded || 0) + 1,
          innings: match.currentInnings!,
        });
      }
      
      // Mark dismissed batsman as out
      if (isWicket && dismissedPlayerId) {
        await storage.updatePlayerStats(match.id, dismissedPlayerId, {
          isOut: true,
          dismissalType: wicketType,
          dismissedBy: match.currentBowlerId,
        });
      }
      
      let updateData: any = {};
      
      // Handle wicket first (before strike rotation, as wickets override rotation logic)
      if (isWicket) {
        // Determine which batsman was dismissed based on original state
        const originalStriker = match.strikerId;
        const originalNonStriker = match.nonStrikerId;
        const dismissedIsStriker = !dismissedPlayerId || dismissedPlayerId === originalStriker;
        const dismissedIsNonStriker = dismissedPlayerId && dismissedPlayerId === originalNonStriker;
        
        // Identify the survivor
        const survivorId = dismissedIsStriker ? originalNonStriker : originalStriker;
        
        
        if (newWickets >= MAX_WICKETS) {
          
          updateData.strikerId = survivorId;
          updateData.nonStrikerId = null;
        } else {
          // Regular wicket - clear dismissed position, survivor stays
          if (dismissedIsStriker) {
            // Striker out - clear striker, non-striker stays at their end
            updateData.strikerId = null;
            // Non-striker stays (don't override if already set)
          } else if (dismissedIsNonStriker) {
            // Non-striker run out - striker stays, clear non-striker
            updateData.nonStrikerId = null;
            // Striker stays (don't override if already set)
          } else {
            // Default: assume striker dismissed
            updateData.strikerId = null;
          }
        }
      } else {
        // No wicket - handle normal strike rotation
        if (shouldRotateStrike && match.nonStrikerId) {
          updateData.strikerId = match.nonStrikerId;
          updateData.nonStrikerId = match.strikerId;
        }
      }
      
      // End of over - need new bowler
      if (isEndOfOver) {
        updateData.currentBowlerId = null;
      }
      
      if (isFirstInnings) {
        updateData.team1Score = newScore;
        updateData.team1Wickets = newWickets;
        updateData.team1Overs = newOversStr;
        
        if (isInningsOver) {
          updateData.currentInnings = 2;
          updateData.strikerId = null;
          updateData.nonStrikerId = null;
          updateData.currentBowlerId = null;
          updateData.innings2StartTime = new Date();
        }
      } else {
        updateData.team2Score = newScore;
        updateData.team2Wickets = newWickets;
        updateData.team2Overs = newOversStr;
        
        const target = (match.team1Score || 0) + 1;
        if (newScore >= target) {
          updateData.status = "completed";
          updateData.winnerId = match.team2Id;
          updateData.result = "win";
          
          await updatePointsAfterMatch(match.team2Id, match.team1Id, { ...match, team2Score: newScore, team2Overs: newOversStr });
        } else if (isInningsOver) {
          if (newScore === match.team1Score) {
            updateData.status = "completed";
            updateData.result = "tie";
            
            await updatePointsAfterMatch(null, null, { ...match, team2Score: newScore, team2Overs: newOversStr }, true);
          } else {
            updateData.status = "completed";
            updateData.winnerId = match.team1Id;
            updateData.result = "win";
            
            await updatePointsAfterMatch(match.team1Id, match.team2Id, { ...match, team2Score: newScore, team2Overs: newOversStr });
          }
        }
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record ball" });
    }
  });

  // Undo last ball
  app.post("/api/matches/:id/undo-ball", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      
      const ballEvents = await storage.getMatchBallEvents(match.id);
      const currentInningsBalls = ballEvents.filter(e => e.innings === match.currentInnings);
      
      if (currentInningsBalls.length === 0) {
        return res.status(400).json({ error: "No balls to undo" });
      }
      
      // Get the last ball event for current innings
      const lastBall = currentInningsBalls[currentInningsBalls.length - 1];
      
      const isFirstInnings = match.currentInnings === 1;
      const currentScore = isFirstInnings ? match.team1Score : match.team2Score;
      const currentWickets = isFirstInnings ? match.team1Wickets : match.team2Wickets;
      const currentOvers = isFirstInnings ? match.team1Overs : match.team2Overs;
      
      // Calculate new score (subtract the runs from last ball)
      let newScore = (currentScore || 0) - (lastBall.runs || 0);
      if (lastBall.extras) {
        newScore -= lastBall.extras;
      }
      newScore = Math.max(0, newScore);
      
      // Calculate new wickets
      let newWickets = currentWickets || 0;
      if (lastBall.isWicket) {
        newWickets = Math.max(0, newWickets - 1);
        
        // Restore dismissed player stats
        if (lastBall.dismissedPlayerId) {
          await storage.updatePlayerStats(match.id, lastBall.dismissedPlayerId, {
            isOut: false,
            dismissalType: null,
            dismissedBy: null,
          });
        }
        
        // Undo fielder stats
        if (lastBall.fielderId) {
          const fielderStats = await storage.getPlayerMatchStats(match.id, lastBall.fielderId, match.currentInnings!);
          if (fielderStats) {
            if (lastBall.wicketType === 'caught' || lastBall.wicketType === 'stumped') {
              await storage.updatePlayerStats(match.id, lastBall.fielderId, {
                catches: Math.max(0, (fielderStats.catches || 0) - 1),
              });
            } else if (lastBall.wicketType === 'run_out') {
              await storage.updatePlayerStats(match.id, lastBall.fielderId, {
                runOuts: Math.max(0, (fielderStats.runOuts || 0) - 1),
              });
            }
          }
        }
      }
      
      // Calculate new overs
      const [overs, balls] = (currentOvers || "0.0").split(".").map(Number);
      let newBalls = balls;
      let newOvers = overs;
      
      // Only decrement if it was a legal delivery
      const wasLegalDelivery = !lastBall.extraType || (lastBall.extraType !== "wide" && lastBall.extraType !== "no_ball");
      if (wasLegalDelivery) {
        if (balls === 0 && overs > 0) {
          newOvers -= 1;
          newBalls = 5;
        } else if (balls > 0) {
          newBalls -= 1;
        }
      }
      
      const newOversStr = `${newOvers}.${newBalls}`;
      
      // Undo batsman stats
      if (wasLegalDelivery) {
        const batsmanStats = await storage.getPlayerMatchStats(match.id, lastBall.batsmanId, match.currentInnings!);
        if (batsmanStats) {
          await storage.updatePlayerStats(match.id, lastBall.batsmanId, {
            runsScored: Math.max(0, (batsmanStats.runsScored || 0) - (lastBall.actualRuns || 0)),
            ballsFaced: Math.max(0, (batsmanStats.ballsFaced || 0) - 1),
            fours: Math.max(0, (batsmanStats.fours || 0) - ((lastBall.actualRuns || 0) === 4 ? 1 : 0)),
            sixes: Math.max(0, (batsmanStats.sixes || 0) - ((lastBall.actualRuns || 0) === 6 ? 1 : 0)),
          });
        }
      }
      
      // Undo bowler stats
      const bowlerStats = await storage.getPlayerMatchStats(match.id, lastBall.bowlerId, match.currentInnings!);
      if (bowlerStats) {
        if (wasLegalDelivery) {
          const [bOvers, bBalls] = (bowlerStats.oversBowled || "0.0").split(".").map(Number);
          let newBBalls = bBalls;
          let newBOvers = bOvers;
          if (bBalls === 0 && bOvers > 0) {
            newBOvers -= 1;
            newBBalls = 5;
          } else if (bBalls > 0) {
            newBBalls -= 1;
          }
          
          await storage.updatePlayerStats(match.id, lastBall.bowlerId, {
            runsConceded: Math.max(0, (bowlerStats.runsConceded || 0) - (lastBall.runs || 0) - (lastBall.extras || 0)),
            oversBowled: `${newBOvers}.${newBBalls}`,
            wicketsTaken: Math.max(0, (bowlerStats.wicketsTaken || 0) - (lastBall.isWicket ? 1 : 0)),
          });
        } else {
          // Just extras
          await storage.updatePlayerStats(match.id, lastBall.bowlerId, {
            runsConceded: Math.max(0, (bowlerStats.runsConceded || 0) - 1),
          });
        }
      }
      
      // Delete the last ball event
      await storage.deleteLastBallEvent(match.id);
      
      // Update match
      let updateData: any = {};
      if (isFirstInnings) {
        updateData.team1Score = newScore;
        updateData.team1Wickets = newWickets;
        updateData.team1Overs = newOversStr;
      } else {
        updateData.team2Score = newScore;
        updateData.team2Wickets = newWickets;
        updateData.team2Overs = newOversStr;
      }
      
      // Restore batsmen/bowler state from the ball event
      updateData.strikerId = lastBall.batsmanId;
      updateData.currentBowlerId = lastBall.bowlerId;
      
      // If wicket was undone, restore dismissed player to their position
      if (lastBall.isWicket && lastBall.dismissedPlayerId) {
        if (lastBall.dismissedPlayerId === lastBall.batsmanId) {
          // Striker was dismissed - restore striker, keep current non-striker
          updateData.strikerId = lastBall.batsmanId;
          // The non-striker should be whoever is currently set (they became striker after wicket)
          // But if the current striker is someone else, that person was the non-striker
          if (match.strikerId && match.strikerId !== lastBall.batsmanId) {
            updateData.nonStrikerId = match.strikerId;
          }
        } else {
          // Non-striker was run out - restore them as non-striker
          updateData.nonStrikerId = lastBall.dismissedPlayerId;
        }
      } else if (!lastBall.isWicket) {
        // No wicket - check if strike was rotated and restore
        // For odd runs, strike would have rotated, so we need to reverse it
        const actualRuns = lastBall.actualRuns || 0;
        const wasLegalDelivery = !lastBall.extraType || (lastBall.extraType !== "wide" && lastBall.extraType !== "no_ball");
        const wasEndOfOver = wasLegalDelivery && newBalls === 5 && newOvers < overs;
        
        // If strike rotated due to odd runs or end of over, reverse it
        if (actualRuns % 2 === 1 && match.nonStrikerId) {
          // Strike rotated due to odd runs - swap back
          updateData.strikerId = match.strikerId; // Current striker was non-striker before
          updateData.nonStrikerId = lastBall.batsmanId; // Ball's batsman was striker before
        }
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, updateData);
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to undo ball" });
    }
  });

  // Reset match
  app.post("/api/matches/:id/reset", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      // Delete all ball events for this match
      const ballEvents = await storage.getMatchBallEvents(match.id);
      for (const ball of ballEvents) {
        await db.delete(schema.ballEvents).where(eq(schema.ballEvents.id, ball.id));
      }
      
      // Delete all player match stats for this match
      await db.delete(schema.playerMatchStats).where(eq(schema.playerMatchStats.matchId, match.id));
      
      // Reset match to scheduled state
      const updatedMatch = await storage.updateMatch(req.params.id, {
        status: "scheduled",
        team1Score: 0,
        team2Score: 0,
        team1Wickets: 0,
        team2Wickets: 0,
        team1Overs: "0.0",
        team2Overs: "0.0",
        currentInnings: 1,
        strikerId: null,
        nonStrikerId: null,
        currentBowlerId: null,
        innings1BattingOrder: [],
        innings2BattingOrder: [],
        powerOverActive: false,
        powerOverNumber: null,
        powerOverInnings: null,
        winnerId: null,
        result: null,
      });
      
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to reset match" });
    }
  });

  // Add penalty runs (manual +5 for overtime)
  const penaltySchema = z.object({
    runs: z.number().int().min(1).max(10).default(5),
  });
  
  app.post("/api/matches/:id/penalty", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      if (match.status !== "live") {
        return res.status(400).json({ error: "Match is not live" });
      }
      
      const validation = penaltySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid penalty runs value" });
      }
      
      const { runs } = validation.data;
      
      // Add penalty runs to the batting team's score
      // In this tournament: innings 1 = team1 bats, innings 2 = team2 bats
      if (match.currentInnings === 1) {
        await storage.updateMatch(req.params.id, {
          team1Score: (match.team1Score || 0) + runs,
        });
      } else {
        await storage.updateMatch(req.params.id, {
          team2Score: (match.team2Score || 0) + runs,
        });
      }
      
      const updatedMatch = await storage.getMatch(req.params.id);
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add penalty runs" });
    }
  });

  function parseOversToDecimal(overs: string): number {
    const parts = overs.split('.');
    const fullOvers = parseInt(parts[0]) || 0;
    const balls = parseInt(parts[1]) || 0;
    return fullOvers + (balls / 6);
  }

  function addOvers(overs1: string, overs2: string): string {
    const parts1 = overs1.split('.');
    const parts2 = overs2.split('.');
    let fullOvers = (parseInt(parts1[0]) || 0) + (parseInt(parts2[0]) || 0);
    let balls = (parseInt(parts1[1]) || 0) + (parseInt(parts2[1]) || 0);
    
    if (balls >= 6) {
      fullOvers += Math.floor(balls / 6);
      balls = balls % 6;
    }
    
    return `${fullOvers}.${balls}`;
  }

  function calculateNRR(runsFor: number, oversFor: string, runsAgainst: number, oversAgainst: string): string {
    const oversForDecimal = parseOversToDecimal(oversFor);
    const oversAgainstDecimal = parseOversToDecimal(oversAgainst);
    
    if (oversForDecimal === 0 || oversAgainstDecimal === 0) return "0.000";
    const runRateFor = runsFor / oversForDecimal;
    const runRateAgainst = runsAgainst / oversAgainstDecimal;
    const nrr = runRateFor - runRateAgainst;
    return nrr.toFixed(3);
  }

  async function updatePointsAfterMatch(winnerId: string | null, loserId: string | null, match: any, isTied: boolean = false) {
    const team1Id = match.team1Id;
    const team2Id = match.team2Id;
    
    const team1Points = await storage.getTeamPoints(team1Id);
    const team2Points = await storage.getTeamPoints(team2Id);
    
    const team1Score = match.team1Score || 0;
    const team2Score = match.team2Score || 0;
    const team1Overs = match.team1Overs || "0.0";
    const team2Overs = match.team2Overs || "0.0";
    
    const newTeam1RunsFor = (team1Points?.runsFor || 0) + team1Score;
    const newTeam1RunsAgainst = (team1Points?.runsAgainst || 0) + team2Score;
    const newTeam1OversFor = addOvers(team1Points?.oversFor || "0.0", team1Overs);
    const newTeam1OversAgainst = addOvers(team1Points?.oversAgainst || "0.0", team2Overs);
    
    const newTeam2RunsFor = (team2Points?.runsFor || 0) + team2Score;
    const newTeam2RunsAgainst = (team2Points?.runsAgainst || 0) + team1Score;
    const newTeam2OversFor = addOvers(team2Points?.oversFor || "0.0", team2Overs);
    const newTeam2OversAgainst = addOvers(team2Points?.oversAgainst || "0.0", team1Overs);
    
    if (isTied) {
      await storage.updatePointsTable(team1Id, {
        played: (team1Points?.played || 0) + 1,
        tied: (team1Points?.tied || 0) + 1,
        points: (team1Points?.points || 0) + 1,
        runsFor: newTeam1RunsFor,
        runsAgainst: newTeam1RunsAgainst,
        oversFor: newTeam1OversFor,
        oversAgainst: newTeam1OversAgainst,
        nrr: calculateNRR(newTeam1RunsFor, newTeam1OversFor, newTeam1RunsAgainst, newTeam1OversAgainst),
      });
      
      await storage.updatePointsTable(team2Id, {
        played: (team2Points?.played || 0) + 1,
        tied: (team2Points?.tied || 0) + 1,
        points: (team2Points?.points || 0) + 1,
        runsFor: newTeam2RunsFor,
        runsAgainst: newTeam2RunsAgainst,
        oversFor: newTeam2OversFor,
        oversAgainst: newTeam2OversAgainst,
        nrr: calculateNRR(newTeam2RunsFor, newTeam2OversFor, newTeam2RunsAgainst, newTeam2OversAgainst),
      });
    } else if (winnerId && loserId) {
      const isTeam1Winner = winnerId === team1Id;
      const winnerPts = isTeam1Winner ? team1Points : team2Points;
      const loserPts = isTeam1Winner ? team2Points : team1Points;
      
      await storage.updatePointsTable(winnerId, {
        played: (winnerPts?.played || 0) + 1,
        won: (winnerPts?.won || 0) + 1,
        points: (winnerPts?.points || 0) + 3,
        runsFor: isTeam1Winner ? newTeam1RunsFor : newTeam2RunsFor,
        runsAgainst: isTeam1Winner ? newTeam1RunsAgainst : newTeam2RunsAgainst,
        oversFor: isTeam1Winner ? newTeam1OversFor : newTeam2OversFor,
        oversAgainst: isTeam1Winner ? newTeam1OversAgainst : newTeam2OversAgainst,
        nrr: calculateNRR(
          isTeam1Winner ? newTeam1RunsFor : newTeam2RunsFor,
          isTeam1Winner ? newTeam1OversFor : newTeam2OversFor,
          isTeam1Winner ? newTeam1RunsAgainst : newTeam2RunsAgainst,
          isTeam1Winner ? newTeam1OversAgainst : newTeam2OversAgainst
        ),
      });
      
      await storage.updatePointsTable(loserId, {
        played: (loserPts?.played || 0) + 1,
        lost: (loserPts?.lost || 0) + 1,
        runsFor: isTeam1Winner ? newTeam2RunsFor : newTeam1RunsFor,
        runsAgainst: isTeam1Winner ? newTeam2RunsAgainst : newTeam1RunsAgainst,
        oversFor: isTeam1Winner ? newTeam2OversFor : newTeam1OversFor,
        oversAgainst: isTeam1Winner ? newTeam2OversAgainst : newTeam1OversAgainst,
        nrr: calculateNRR(
          isTeam1Winner ? newTeam2RunsFor : newTeam1RunsFor,
          isTeam1Winner ? newTeam2OversFor : newTeam1OversFor,
          isTeam1Winner ? newTeam2RunsAgainst : newTeam1RunsAgainst,
          isTeam1Winner ? newTeam2OversAgainst : newTeam1OversAgainst
        ),
      });
    }
  }

  // ============ BALL EVENTS ============
  
  app.get("/api/ball-events", async (req, res) => {
    try {
      const events = await storage.getAllBallEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ball events" });
    }
  });

  app.get("/api/matches/:id/player-stats", async (req, res) => {
    try {
      const stats = await storage.getMatchPlayerStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch match player stats" });
    }
  });

  // ============ POINTS TABLE ============
  
  app.get("/api/points-table", async (req, res) => {
    try {
      const table = await storage.getAllPointsTable();
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points table" });
    }
  });

  // ============ LEADERBOARDS ============
  
  app.get("/api/leaderboards/orange-cap", async (req, res) => {
    try {
      const leaders = await storage.getOrangeCapLeaders();
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orange cap leaders" });
    }
  });

  app.get("/api/leaderboards/purple-cap", async (req, res) => {
    try {
      const leaders = await storage.getPurpleCapLeaders();
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purple cap leaders" });
    }
  });

  app.get("/api/leaderboards/mvp", async (req, res) => {
    try {
      const leaders = await storage.getMVPLeaders();
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MVP leaders" });
    }
  });

  // ============ TOURNAMENT SETTINGS ============
  
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getTournamentSettings();
      res.json(settings || {
        registrationFee: 25,
        auctionDate: "January 25th",
        tournamentDate: "February 7th",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const validation = insertTournamentSettingsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const settings = await storage.updateTournamentSettings(validation.data);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ============ PLAYER APPROVAL WORKFLOW ============
  
  app.post("/api/players/:id/approve", async (req, res) => {
    try {
      // First get the player to get their role for category
      const existingPlayer = await storage.getPlayer(req.params.id);
      if (!existingPlayer) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      // Category is based on player's role (Batsman, Bowler, All-rounder)
      const player = await storage.updatePlayer(req.params.id, {
        approvalStatus: "approved",
        status: "registered",
      });
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve player" });
    }
  });

  app.post("/api/players/:id/reject", async (req, res) => {
    try {
      const player = await storage.updatePlayer(req.params.id, {
        approvalStatus: "rejected",
        status: "rejected",
      });
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject player" });
    }
  });

  app.post("/api/players/:id/verify-payment", async (req, res) => {
    try {
      const player = await storage.updatePlayer(req.params.id, {
        paymentStatus: "verified",
      });
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      if (player.email) {
        sendPaymentConfirmationEmail(player.email, player.name)
          .then(sent => {
            if (sent) {
              console.log(`Payment confirmation email sent to ${player.name}`);
            }
          })
          .catch(err => console.error("Email send error:", err));
      }
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      await storage.deletePlayer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete player" });
    }
  });

  // ============ CAPTAIN / VICE-CAPTAIN ASSIGNMENT ============
  
  app.post("/api/teams/:id/set-captain", async (req, res) => {
    try {
      const { captainId, viceCaptainId } = req.body;
      
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      if (team.captainId) {
        await storage.updatePlayer(team.captainId, { isCaptain: false });
      }
      if (team.viceCaptainId) {
        await storage.updatePlayer(team.viceCaptainId, { isViceCaptain: false });
      }

      if (captainId) {
        await storage.updatePlayer(captainId, { isCaptain: true });
      }
      if (viceCaptainId) {
        await storage.updatePlayer(viceCaptainId, { isViceCaptain: true });
      }

      const updatedTeam = await storage.updateTeam(req.params.id, {
        captainId: captainId || null,
        viceCaptainId: viceCaptainId || null,
      });

      res.json(updatedTeam);
    } catch (error) {
      res.status(500).json({ error: "Failed to set captain" });
    }
  });

  return httpServer;
}
