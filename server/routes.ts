import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { 
  playerRegistrationSchema, 
  insertTournamentSettingsSchema,
  insertBroadcastSchema,
  insertCaptainPairSchema
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
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
      
      // Check roster limit (8 players max per team)
      const newTeamPlayers = allPlayers.filter(p => p.teamId === newTeamId);
      if (newTeamPlayers.length >= 8) {
        return res.status(400).json({ error: "New team already has 8 players (maximum roster size)" });
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

  // ============ AUCTION ============
  
  app.get("/api/auction/state", async (req, res) => {
    try {
      const state = await storage.getAuctionState();
      res.json(state || { status: "not_started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch auction state" });
    }
  });

  app.post("/api/auction/control", async (req, res) => {
    try {
      const { action, category } = req.body;
      const currentState = await storage.getAuctionState();
      
      switch (action) {
        case "start": {
          // Category is now role-based (Team Names, Batsman, Bowler, All-rounder, Unsold)
          const selectedCategory = category || "Team Names";
          
          // Team Names auction - auction team identities to captain pairs
          if (selectedCategory === "Team Names") {
            const teams = await storage.getAllTeams();
            const captainPairs = await storage.getAllCaptainPairs();
            
            // Find teams not yet assigned to any captain pair
            const assignedTeamIds = new Set(captainPairs.map(p => p.assignedTeamId).filter(Boolean));
            const availableTeam = teams.find(t => !assignedTeamIds.has(t.id));
            
            if (!availableTeam) {
              return res.status(400).json({ error: "No teams available for auction. All teams have been assigned." });
            }
            
            const state = await storage.updateAuctionState({
              status: "in_progress",
              currentTeamId: availableTeam.id,
              currentBid: availableTeam.basePrice || 1000,
              currentBiddingPairId: null,
              currentPlayerId: null,
              currentBiddingTeamId: null,
              bidHistory: [],
              currentCategory: selectedCategory,
            });
            
            res.json(state);
            break;
          }
          
          const players = await storage.getAllPlayers();
          
          // IMPORTANT: Only payment-verified AND approved players can be in auction
          // "Unsold" is special - it means re-auction unsold players from any category
          let availablePlayer;
          if (selectedCategory === "Unsold") {
            availablePlayer = players.find(p => 
              p.status === "unsold" && 
              p.paymentStatus === "verified" && 
              p.approvalStatus === "approved"
            );
          } else {
            availablePlayer = players.find(p => 
              (p.status === "registered" || p.status === "unsold") && 
              p.paymentStatus === "verified" && 
              p.approvalStatus === "approved" &&
              p.category === selectedCategory
            );
          }
          
          if (!availablePlayer) {
            return res.status(400).json({ error: `No payment-verified players available in category ${selectedCategory}` });
          }
          
          await storage.updatePlayer(availablePlayer.id, { status: "in_auction" });
          
          // Use player's basePoints as the starting bid
          const state = await storage.updateAuctionState({
            status: "in_progress",
            currentPlayerId: availablePlayer.id,
            currentBid: availablePlayer.basePoints,
            currentBiddingTeamId: null,
            currentTeamId: null,
            currentBiddingPairId: null,
            bidHistory: [],
            currentCategory: selectedCategory,
          });
          
          res.json(state);
          break;
        }
        
        case "pause": {
          const state = await storage.updateAuctionState({ status: "paused" });
          res.json(state);
          break;
        }
        
        case "resume": {
          const state = await storage.updateAuctionState({ status: "in_progress" });
          res.json(state);
          break;
        }
        
        case "select_category": {
          // Admin manually selects which category to auction next
          const selectedCategory = category;
          if (!selectedCategory || !["Team Names", "Batsman", "Bowler", "All-rounder", "Unsold"].includes(selectedCategory)) {
            return res.status(400).json({ error: "Invalid category. Must be Team Names, Batsman, Bowler, All-rounder, or Unsold" });
          }
          
          // Team Names category - switch to first available team
          if (selectedCategory === "Team Names") {
            const teams = await storage.getAllTeams();
            const captainPairs = await storage.getAllCaptainPairs();
            const assignedTeamIds = new Set(captainPairs.map(p => p.assignedTeamId).filter(Boolean));
            const availableTeam = teams.find(t => !assignedTeamIds.has(t.id));
            
            if (availableTeam) {
              const state = await storage.updateAuctionState({
                currentCategory: selectedCategory,
                currentTeamId: availableTeam.id,
                currentBid: availableTeam.basePrice || 1000,
                currentBiddingPairId: null,
                currentPlayerId: null,
                currentBiddingTeamId: null,
                bidHistory: [],
                categoryBreak: false,
                completedCategory: null,
              });
              return res.json(state);
            }
            
            // No teams available - Team Names auction is complete
            const state = await storage.updateAuctionState({
              currentCategory: selectedCategory,
              categoryBreak: true,
              completedCategory: "Team Names",
            });
            return res.json(state);
          }
          
          // If auction is in progress with a player, mark current player as unsold first
          if (currentState?.status === "in_progress" && currentState.currentPlayerId) {
            const currentPlayer = await storage.getPlayer(currentState.currentPlayerId);
            if (currentPlayer && currentPlayer.status === "in_auction") {
              await storage.updatePlayer(currentPlayer.id, { status: "unsold" });
            }
          }
          
          // Find first available player from new category (registered OR unsold players can be auctioned again)
          // "Unsold" is special - it means re-auction unsold players from any category
          const players = await storage.getAllPlayers();
          let nextPlayer;
          if (selectedCategory === "Unsold") {
            nextPlayer = players.find(p => 
              p.status === "unsold" && 
              p.paymentStatus === "verified" && 
              p.approvalStatus === "approved"
            );
          } else {
            nextPlayer = players.find(p => 
              (p.status === "registered" || p.status === "unsold") && 
              p.paymentStatus === "verified" && 
              p.approvalStatus === "approved" &&
              p.category === selectedCategory
            );
          }
          
          if (nextPlayer) {
            await storage.updatePlayer(nextPlayer.id, { status: "in_auction" });
            const state = await storage.updateAuctionState({
              currentCategory: selectedCategory,
              currentPlayerId: nextPlayer.id,
              currentBid: nextPlayer.basePoints,
              currentBiddingTeamId: null,
              currentTeamId: null,
              currentBiddingPairId: null,
              bidHistory: [],
              categoryBreak: false,
              completedCategory: null,
            });
            return res.json(state);
          }
          
          // No players available in this category
          const state = await storage.updateAuctionState({
            currentCategory: selectedCategory,
            currentPlayerId: null,
            currentTeamId: null,
            currentBiddingPairId: null,
            categoryBreak: false,
            completedCategory: null,
          });
          
          res.json(state);
          break;
        }
        
        case "select_player": {
          // Admin manually selects a specific player or team from dropdown
          const { playerId } = req.body;
          if (!playerId) {
            return res.status(400).json({ error: "Player/Team ID is required" });
          }
          
          // Check if this is a Team Names auction - playerId is actually teamId
          if (currentState?.currentCategory === "Team Names") {
            const selectedTeam = await storage.getTeam(playerId);
            if (!selectedTeam) {
              return res.status(404).json({ error: "Team not found" });
            }
            
            // Check if team is already assigned
            const captainPairs = await storage.getAllCaptainPairs();
            const isAssigned = captainPairs.some(p => p.assignedTeamId === playerId);
            if (isAssigned) {
              return res.status(400).json({ error: "Team already assigned to a captain pair" });
            }
            
            const state = await storage.updateAuctionState({
              status: "in_progress",
              currentTeamId: selectedTeam.id,
              currentBid: selectedTeam.basePrice || 1000,
              currentBiddingPairId: null,
              currentPlayerId: null,
              bidHistory: [],
            });
            
            return res.json(state);
          }
          
          const selectedPlayer = await storage.getPlayer(playerId);
          if (!selectedPlayer) {
            return res.status(404).json({ error: "Player not found" });
          }
          
          if (selectedPlayer.status === "sold") {
            return res.status(400).json({ error: "Player already sold" });
          }
          
          if (selectedPlayer.paymentStatus !== "verified") {
            return res.status(400).json({ error: "Player payment not verified" });
          }
          
          if (selectedPlayer.approvalStatus !== "approved") {
            return res.status(400).json({ error: "Player not approved" });
          }
          
          // Mark current player as unsold if they're in auction
          if (currentState?.currentPlayerId && currentState.currentPlayerId !== playerId) {
            const currentPlayer = await storage.getPlayer(currentState.currentPlayerId);
            if (currentPlayer && currentPlayer.status === "in_auction") {
              await storage.updatePlayer(currentPlayer.id, { status: "unsold" });
            }
          }
          
          // Set selected player to in_auction
          await storage.updatePlayer(selectedPlayer.id, { status: "in_auction" });
          
          // Keep the current category - don't override with player's category
          const state = await storage.updateAuctionState({
            status: "in_progress",
            currentPlayerId: selectedPlayer.id,
            currentBid: selectedPlayer.basePoints,
            currentBiddingTeamId: null,
            currentTeamId: null,
            bidHistory: [],
          });
          
          res.json(state);
          break;
        }
        
        case "next": {
          const players = await storage.getAllPlayers();
          // Admin can override category, otherwise use current
          const selectedCategory = category || currentState?.currentCategory || "Batsman";
          
          // First, mark the current player as unsold if they're in auction
          if (currentState?.currentPlayerId) {
            const currentPlayer = await storage.getPlayer(currentState.currentPlayerId);
            if (currentPlayer && currentPlayer.status === "in_auction") {
              await storage.updatePlayer(currentPlayer.id, { status: "unsold" });
            }
          }
          
          // Clear break state when moving to next player
          await storage.updateAuctionState({
            categoryBreak: false,
            completedCategory: null,
          });
          
          // Refresh players list after updating current player
          const updatedPlayers = await storage.getAllPlayers();
          
          // IMPORTANT: Only payment-verified AND approved players can be in auction
          // "Unsold" is special - it means re-auction unsold players from any category
          let nextPlayer;
          if (selectedCategory === "Unsold") {
            nextPlayer = updatedPlayers.find(p => 
              p.status === "unsold" && 
              p.paymentStatus === "verified" && 
              p.approvalStatus === "approved"
            );
          } else {
            nextPlayer = updatedPlayers.find(p => 
              (p.status === "registered" || p.status === "unsold") && 
              p.paymentStatus === "verified" && 
              p.approvalStatus === "approved" &&
              p.category === selectedCategory
            );
          }
          
          if (!nextPlayer) {
            // Check if there are lost gold players for this category
            const lostGoldPlayers = updatedPlayers.filter(p => 
              p.status === "lost_gold" && 
              p.paymentStatus === "verified"
            );
            
            if (lostGoldPlayers.length > 0) {
              const player = lostGoldPlayers[0];
              await storage.updatePlayer(player.id, { status: "in_auction" });
              const state = await storage.updateAuctionState({
                status: "lost_gold_round",
                currentPlayerId: player.id,
                currentBid: player.basePoints,
                currentBiddingTeamId: null,
                bidHistory: [],
                currentCategory: player.category || "Batsman",
              });
              return res.json(state);
            }
            
            // No players available in selected category - trigger break
            const state = await storage.updateAuctionState({
              status: "paused",
              currentPlayerId: null,
              currentBid: null,
              currentBiddingTeamId: null,
              bidHistory: [],
              categoryBreak: true,
              completedCategory: selectedCategory,
            });
            
            return res.json({ 
              ...state,
              message: `Category ${selectedCategory} completed! Select a different category.`,
              noPlayersInCategory: true
            });
          }
          
          await storage.updatePlayer(nextPlayer.id, { status: "in_auction" });
          
          // Use player's basePoints as the starting bid
          const state = await storage.updateAuctionState({
            status: "in_progress",
            currentPlayerId: nextPlayer.id,
            currentBid: nextPlayer.basePoints,
            currentBiddingTeamId: null,
            bidHistory: [],
            currentCategory: selectedCategory,
          });
          
          res.json(state);
          break;
        }
        
        // Team Names Auction Actions
        case "bid_team_name": {
          const { pairId } = req.body;
          
          if (!currentState || currentState.status !== "in_progress" || currentState.currentCategory !== "Team Names") {
            return res.status(400).json({ error: "Team Names auction not in progress" });
          }
          
          const pair = await storage.getCaptainPair(pairId);
          if (!pair) {
            return res.status(404).json({ error: "Captain pair not found" });
          }
          
          if (pair.assignedTeamId) {
            return res.status(400).json({ error: "This captain pair already has a team" });
          }
          
          // Get team base price
          const currentTeam = currentState.currentTeamId ? await storage.getTeam(currentState.currentTeamId) : null;
          const basePrice = currentTeam?.budget ? 1000 : 1000; // Default base price for team names
          
          let newBid: number;
          const existingBidHistory = currentState.bidHistory || [];
          
          // First bid is the base price
          if (existingBidHistory.length === 0) {
            newBid = basePrice;
          } else {
            // Subsequent bids add increment
            const currentBid = currentState.currentBid || basePrice;
            const increment = currentBid < 4000 ? 200 : 250;
            newBid = currentBid + increment;
          }
          
          if (pair.remainingBudget < newBid) {
            return res.status(400).json({ error: "Insufficient budget for this bid" });
          }
          
          const updatedBidHistory = [...existingBidHistory, {
            teamId: pairId, // Using pairId in teamId field for history
            amount: newBid,
            timestamp: Date.now(),
          }];
          
          const state = await storage.updateAuctionState({
            currentBid: newBid,
            currentBiddingPairId: pairId,
            bidHistory: updatedBidHistory,
          });
          
          res.json(state);
          break;
        }
        
        case "sell_team_name": {
          if (!currentState || currentState.currentCategory !== "Team Names") {
            return res.status(400).json({ error: "Team Names auction not active" });
          }
          
          const winningPairId = currentState.currentBiddingPairId;
          const teamId = currentState.currentTeamId;
          
          if (!winningPairId || !teamId) {
            return res.status(400).json({ error: "No winning bid or team selected" });
          }
          
          const winningPair = await storage.getCaptainPair(winningPairId);
          const team = await storage.getTeam(teamId);
          
          if (!winningPair || !team) {
            return res.status(400).json({ error: "Captain pair or team not found" });
          }
          
          const soldPrice = currentState.currentBid || team.basePrice || 1000;
          
          // Assign team to captain pair
          await storage.updateCaptainPair(winningPairId, {
            assignedTeamId: teamId,
            remainingBudget: winningPair.remainingBudget - soldPrice,
          });
          
          // Update team with captain and vice-captain IDs
          await storage.updateTeam(teamId, {
            captainId: winningPair.captainId,
            viceCaptainId: winningPair.viceCaptainId,
            remainingBudget: winningPair.remainingBudget - soldPrice,
            teamNameAssigned: true,
          });
          
          // Assign captain and vice-captain players to the team
          await storage.updatePlayer(winningPair.captainId, {
            teamId: teamId,
            isCaptain: true,
            status: "sold",
          });
          await storage.updatePlayer(winningPair.viceCaptainId, {
            teamId: teamId,
            isViceCaptain: true,
            status: "sold",
          });
          
          // Move to next team
          const teams = await storage.getAllTeams();
          const captainPairs = await storage.getAllCaptainPairs();
          const assignedTeamIds = new Set(captainPairs.map(p => p.assignedTeamId).filter(Boolean));
          assignedTeamIds.add(teamId); // Include just-assigned team
          
          const nextTeam = teams.find(t => !assignedTeamIds.has(t.id));
          
          if (nextTeam) {
            const state = await storage.updateAuctionState({
              currentTeamId: nextTeam.id,
              currentBid: nextTeam.basePrice || 1000,
              currentBiddingPairId: null,
              bidHistory: [],
            });
            return res.json(state);
          }
          
          // All teams assigned - Team Names auction complete
          const state = await storage.updateAuctionState({
            status: "paused",
            currentTeamId: null,
            currentBid: null,
            currentBiddingPairId: null,
            bidHistory: [],
            categoryBreak: true,
            completedCategory: "Team Names",
          });
          
          res.json(state);
          break;
        }
        
        case "skip_team": {
          if (!currentState || currentState.currentCategory !== "Team Names") {
            return res.status(400).json({ error: "Team Names auction not active" });
          }
          
          const currentTeamId = currentState.currentTeamId;
          
          // Move to next team (skip this one)
          const teams = await storage.getAllTeams();
          const captainPairs = await storage.getAllCaptainPairs();
          const assignedTeamIds = new Set(captainPairs.map(p => p.assignedTeamId).filter(Boolean));
          
          // Find next team after current one
          const currentIndex = teams.findIndex(t => t.id === currentTeamId);
          const remainingTeams = teams.filter((t, i) => i > currentIndex && !assignedTeamIds.has(t.id));
          const nextTeam = remainingTeams[0] || teams.find(t => !assignedTeamIds.has(t.id) && t.id !== currentTeamId);
          
          if (nextTeam) {
            const state = await storage.updateAuctionState({
              currentTeamId: nextTeam.id,
              currentBid: nextTeam.basePrice || 1000,
              currentBiddingPairId: null,
              bidHistory: [],
            });
            return res.json(state);
          }
          
          // No more teams - pause
          const state = await storage.updateAuctionState({
            status: "paused",
            currentTeamId: null,
            currentBid: null,
            currentBiddingPairId: null,
            bidHistory: [],
          });
          
          res.json(state);
          break;
        }
        
        case "stop": {
          const state = await storage.updateAuctionState({
            status: "completed",
            currentPlayerId: null,
            currentBid: null,
            currentBiddingTeamId: null,
            currentTeamId: null,
            currentBiddingPairId: null,
          });
          res.json(state);
          break;
        }
        
        default:
          res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to control auction" });
    }
  });

  app.post("/api/auction/bid", async (req, res) => {
    try {
      const { teamId } = req.body;
      const state = await storage.getAuctionState();
      
      if (!state || state.status !== "in_progress" && state.status !== "lost_gold_round") {
        return res.status(400).json({ error: "Auction not in progress" });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check roster limit: max 8 players per team (2 captain/VC + 6 bought)
      const players = await storage.getAllPlayers();
      const teamRoster = players.filter(p => p.teamId === teamId);
      const MAX_ROSTER_SIZE = 8;
      if (teamRoster.length >= MAX_ROSTER_SIZE) {
        return res.status(400).json({ error: `Team roster full (${MAX_ROSTER_SIZE} players max)` });
      }
      
      // Get base price from current player
      const currentPlayer = await storage.getPlayer(state.currentPlayerId!);
      const basePrice = currentPlayer?.basePoints || 1500;
      
      let newBid: number;
      
      // Check if this is the first bid (no bids in history yet)
      const existingBidHistory = state.bidHistory || [];
      if (existingBidHistory.length === 0) {
        // First bid is the base price
        newBid = basePrice;
      } else {
        // Subsequent bids: add increment to current bid
        const currentBid = state.currentBid ?? basePrice;
        const increment = currentBid < 4000 ? 200 : 250;
        newBid = currentBid + increment;
      }
      
      if (newBid > team.remainingBudget) {
        return res.status(400).json({ error: "Insufficient budget" });
      }
      
      const updatedBidHistory = [...existingBidHistory, {
        teamId,
        amount: newBid,
        timestamp: Date.now(),
      }];
      
      const updatedState = await storage.updateAuctionState({
        currentBid: newBid,
        currentBiddingTeamId: teamId,
        bidHistory: updatedBidHistory,
      });
      
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ error: "Failed to place bid" });
    }
  });

  // Reset all bids for current player (back to base price)
  app.post("/api/auction/reset-player", async (req, res) => {
    try {
      const state = await storage.getAuctionState();
      
      if (!state || (state.status !== "in_progress" && state.status !== "lost_gold_round")) {
        return res.status(400).json({ error: "Auction not in progress" });
      }
      
      if (!state.currentPlayerId) {
        return res.status(400).json({ error: "No player currently in auction" });
      }
      
      // Get current player's base price
      const currentPlayer = await storage.getPlayer(state.currentPlayerId);
      const basePrice = currentPlayer?.basePoints || 1500;
      
      // Reset all bids - clear history and set bid back to base price
      const updatedState = await storage.updateAuctionState({
        currentBid: basePrice,
        currentBiddingTeamId: null,
        bidHistory: [],
      });
      
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset player bids" });
    }
  });

  // Undo last bid
  app.post("/api/auction/undo-bid", async (req, res) => {
    try {
      const state = await storage.getAuctionState();
      
      if (!state || (state.status !== "in_progress" && state.status !== "lost_gold_round")) {
        return res.status(400).json({ error: "Auction not in progress" });
      }
      
      if (!state.currentPlayerId) {
        return res.status(400).json({ error: "No player currently in auction" });
      }
      
      const originalHistory = state.bidHistory || [];
      
      if (originalHistory.length === 0) {
        return res.status(400).json({ error: "No bids to undo" });
      }
      
      // Create a new array without the last bid (immutable)
      const newBidHistory = originalHistory.slice(0, -1);
      
      // Get current player's base price for fallback
      const currentPlayer = await storage.getPlayer(state.currentPlayerId);
      const basePrice = currentPlayer?.basePoints || 1500;
      
      // Determine new current bid and bidding team
      let newCurrentBid: number;
      let newBiddingTeamId: string | null;
      
      if (newBidHistory.length === 0) {
        // No bids left, revert to player's base price
        newCurrentBid = basePrice;
        newBiddingTeamId = null;
      } else {
        // Restore the previous (now last) bid
        const previousBid = newBidHistory[newBidHistory.length - 1];
        newCurrentBid = previousBid.amount;
        newBiddingTeamId = previousBid.teamId;
      }
      
      const updatedState = await storage.updateAuctionState({
        currentBid: newCurrentBid,
        currentBiddingTeamId: newBiddingTeamId,
        bidHistory: newBidHistory,
      });
      
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ error: "Failed to undo bid" });
    }
  });

  app.post("/api/auction/sell", async (req, res) => {
    try {
      const state = await storage.getAuctionState();
      
      if (!state?.currentPlayerId || !state?.currentBiddingTeamId) {
        return res.status(400).json({ error: "No player or bidding team" });
      }
      
      const team = await storage.getTeam(state.currentBiddingTeamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      const soldPlayerId = state.currentPlayerId;
      const soldTeamId = state.currentBiddingTeamId;
      const soldPrice = state.currentBid || 0;
      const soldTimestamp = Date.now();
      
      await storage.updatePlayer(soldPlayerId, {
        status: "sold",
        teamId: soldTeamId,
        soldPrice: soldPrice,
      });
      
      await storage.updateTeam(soldTeamId, {
        remainingBudget: team.remainingBudget - soldPrice,
      });
      
      const players = await storage.getAllPlayers();
      const currentCategory = state.currentCategory;
      
      // Find next player from the same category
      let nextPlayer = players.find(p => 
        p.status === "registered" && 
        p.category === currentCategory
      );
      
      if (nextPlayer) {
        await storage.updatePlayer(nextPlayer.id, { status: "in_auction" });
        const updatedState = await storage.updateAuctionState({
          currentPlayerId: nextPlayer.id,
          currentBid: nextPlayer.basePoints,
          currentBiddingTeamId: null,
          bidHistory: [],
          lastSoldPlayerId: soldPlayerId,
          lastSoldTeamId: soldTeamId,
          lastSoldPrice: soldPrice,
          lastSoldTimestamp: soldTimestamp,
        });
        return res.json(updatedState);
      }
      
      // No more players in current category - check if other categories have players
      const remainingPlayers = players.find(p => p.status === "registered");
      
      if (remainingPlayers) {
        // Show break/end of category screen - don't auto-switch
        const updatedState = await storage.updateAuctionState({
          currentPlayerId: null,
          currentBid: null,
          currentBiddingTeamId: null,
          bidHistory: [],
          completedCategory: currentCategory,
          categoryBreak: true,
          lastSoldPlayerId: soldPlayerId,
          lastSoldTeamId: soldTeamId,
          lastSoldPrice: soldPrice,
          lastSoldTimestamp: soldTimestamp,
        });
        return res.json(updatedState);
      }
      
      const lostGoldPlayers = players.filter(p => p.status === "lost_gold");
      if (lostGoldPlayers.length > 0) {
        const player = lostGoldPlayers[0];
        await storage.updatePlayer(player.id, { status: "in_auction" });
        const updatedState = await storage.updateAuctionState({
          status: "lost_gold_round",
          currentPlayerId: player.id,
          currentBid: player.basePoints,
          currentBiddingTeamId: null,
          bidHistory: [],
          lastSoldPlayerId: soldPlayerId,
          lastSoldTeamId: soldTeamId,
          lastSoldPrice: soldPrice,
          lastSoldTimestamp: soldTimestamp,
        });
        return res.json(updatedState);
      }
      
      const updatedState = await storage.updateAuctionState({
        status: "completed",
        currentPlayerId: null,
        currentBid: null,
        currentBiddingTeamId: null,
        lastSoldPlayerId: soldPlayerId,
        lastSoldTeamId: soldTeamId,
        lastSoldPrice: soldPrice,
        lastSoldTimestamp: soldTimestamp,
      });
      
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ error: "Failed to sell player" });
    }
  });

  app.post("/api/auction/unsold", async (req, res) => {
    try {
      const state = await storage.getAuctionState();
      
      if (!state?.currentPlayerId) {
        return res.status(400).json({ error: "No player in auction" });
      }
      
      const isLostGoldRound = state.status === "lost_gold_round";
      
      await storage.updatePlayer(state.currentPlayerId, {
        status: isLostGoldRound ? "unsold" : "lost_gold",
      });
      
      const players = await storage.getAllPlayers();
      const currentCategory = state.currentCategory;
      
      // Find next player from same category
      let nextPlayer;
      if (isLostGoldRound) {
        nextPlayer = players.find(p => 
          p.status === "lost_gold" && 
          p.category === currentCategory
        );
      } else {
        nextPlayer = players.find(p => 
          p.status === "registered" && 
          p.category === currentCategory
        );
      }
      
      if (nextPlayer) {
        await storage.updatePlayer(nextPlayer.id, { status: "in_auction" });
        const updatedState = await storage.updateAuctionState({
          currentPlayerId: nextPlayer.id,
          currentBid: nextPlayer.basePoints,
          currentBiddingTeamId: null,
          bidHistory: [],
        });
        return res.json(updatedState);
      }
      
      // No more players in current category - check for remaining players
      if (!isLostGoldRound) {
        const remainingInCategory = players.find(p => p.status === "registered");
        if (remainingInCategory) {
          // Show break/end of category screen
          const updatedState = await storage.updateAuctionState({
            currentPlayerId: null,
            currentBid: null,
            currentBiddingTeamId: null,
            bidHistory: [],
            completedCategory: currentCategory,
            categoryBreak: true,
          });
          return res.json(updatedState);
        }
        
        const lostGoldPlayers = players.filter(p => p.status === "lost_gold");
        if (lostGoldPlayers.length > 0) {
          const player = lostGoldPlayers[0];
          await storage.updatePlayer(player.id, { status: "in_auction" });
          const updatedState = await storage.updateAuctionState({
            status: "lost_gold_round",
            currentPlayerId: player.id,
            currentBid: player.basePoints,
            currentBiddingTeamId: null,
            bidHistory: [],
          });
          return res.json(updatedState);
        }
      }
      
      const updatedState = await storage.updateAuctionState({
        status: "completed",
        currentPlayerId: null,
        currentBid: null,
        currentBiddingTeamId: null,
      });
      
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark player unsold" });
    }
  });

  app.post("/api/auction/reset", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      for (const player of players) {
        await storage.updatePlayer(player.id, {
          status: "registered",
          teamId: null,
          soldPrice: null,
          isLocked: false,
          isCaptain: false,
          isViceCaptain: false,
        });
      }
      
      const teams = await storage.getAllTeams();
      for (const team of teams) {
        await storage.updateTeam(team.id, {
          remainingBudget: team.budget,
        });
      }
      
      // Reset captain pair assignments
      const captainPairs = await storage.getAllCaptainPairs();
      for (const pair of captainPairs) {
        await storage.updateCaptainPair(pair.id, {
          assignedTeamId: null,
          remainingBudget: pair.budget,
        });
      }
      
      await storage.updateAuctionState({
        status: "not_started",
        currentPlayerId: null,
        currentBid: null,
        currentBiddingTeamId: null,
        bidHistory: [],
        currentCategory: "Team Names",
        currentTeamId: null,
        currentBiddingPairId: null,
      });
      
      res.json({ success: true, message: "Auction reset successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset auction" });
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

  app.post("/api/tournament/generate-fixtures", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      const groups = ["A", "B", "C", "D"];
      const fixtures: any[] = [];
      
      for (const group of groups) {
        const groupTeams = teams.filter(t => t.groupName === group);
        if (groupTeams.length >= 2) {
          for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
              const match = await storage.createMatch({
                matchNumber: fixtures.length + 1,
                team1Id: groupTeams[i].id,
                team2Id: groupTeams[j].id,
                stage: "group",
                groupName: group,
              });
              fixtures.push(match);
            }
          }
        }
      }
      
      res.json(fixtures);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate fixtures" });
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

  app.post("/api/matches/:id/start", async (req, res) => {
    try {
      const { tossWinnerId, tossDecision } = req.body;
      
      const match = await storage.updateMatch(req.params.id, {
        status: "live",
        tossWinnerId,
        tossDecision,
        currentInnings: 1,
        innings1BattingOrder: [],
        innings2BattingOrder: [],
        innings1BowlingOrder: [],
        innings2BowlingOrder: [],
      });
      
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
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
      // Allow scoring with just striker if 7 wickets (last man standing - only 1 batsman remains)
      const currentWicketsForValidation = match.currentInnings === 1 ? match.team1Wickets : match.team2Wickets;
      const isLastManStandingMode = (currentWicketsForValidation || 0) >= 7; // 7 wickets down = only 1 batsman left
      
      if (!match.strikerId || !match.currentBowlerId) {
        return res.status(400).json({ error: "Batsmen and bowler must be selected first" });
      }
      
      // Need non-striker unless it's last-man-standing (7 wickets)
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
      
      // Check if current over is the power over
      const isPowerOver = match.powerOverActive && 
                          match.powerOverNumber === overs + 1 && 
                          match.powerOverInnings === match.currentInnings;
      
      // Calculate runs
      let actualRuns = runs || 0;
      let effectiveRuns = actualRuns;
      
      // Power Over: Runs are doubled
      if (isPowerOver && effectiveRuns > 0) {
        effectiveRuns = effectiveRuns * 2;
      }
      
      let newScore = (currentScore || 0) + effectiveRuns;
      let newWickets = currentWickets || 0;
      
      // Wide and No-ball: Add exactly 1 extra run
      if (extraType === "wide" || extraType === "no_ball") {
        newScore += 1;
      }
      
      // 8 players per team = max 7 wickets allowed
      const MAX_WICKETS = 7;
      
      // Prevent wickets beyond 7 (last man standing can't be out)
      if (isWicket && (currentWickets || 0) >= MAX_WICKETS) {
        return res.status(400).json({ error: "Cannot take more wickets - last man standing" });
      }
      
      // Power Over: Wicket costs -5 points
      if (isWicket) {
        newWickets += 1;
        if (isPowerOver) {
          newScore = Math.max(0, newScore - 5);
        }
      }
      
      // Cap wickets at 7 (shouldn't happen due to guard above, but just in case)
      newWickets = Math.min(newWickets, MAX_WICKETS);
      
      // Innings ends at 6 overs. 7 wickets = last man standing, can still bat.
      // Innings ends when overs complete. Last-man-standing (7 wickets) can continue until overs end.
      const isInningsOver = newOvers >= 6;
      
      // Determine strike rotation
      // Strike changes on: odd runs, end of over (unless last man standing)
      let shouldRotateStrike = false;
      // Last man standing = 7 wickets down (only 1 batsman left), no strike rotation possible
      const isLastManStanding = newWickets >= MAX_WICKETS; // 7 wickets = only 1 batsman remains
      
      // Only rotate strike if we have a non-striker to rotate with
      if (!isWicket && !extraType && match.nonStrikerId && !isLastManStanding) {
        // Normal ball - rotate on odd runs
        if (actualRuns % 2 === 1) {
          shouldRotateStrike = true;
        }
      }
      
      // End of over rotation (only if we have 2 batsmen and NOT last man standing)
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
        isPowerOver,
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
        
        // Check if this wicket puts us in last-man-standing mode (7 wickets = only 1 batsman)
        if (newWickets >= MAX_WICKETS) {
          // Last man standing - survivor becomes striker, no non-striker
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

  // Set power over for a match
  app.post("/api/matches/:id/power-over", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      
      const { overNumber, innings } = req.body;
      
      if (!overNumber || !innings) {
        return res.status(400).json({ error: "Over number and innings required" });
      }
      
      if (overNumber < 1 || overNumber > 6) {
        return res.status(400).json({ error: "Over number must be between 1 and 6" });
      }
      
      if (innings < 1 || innings > 2) {
        return res.status(400).json({ error: "Innings must be 1 or 2" });
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, {
        powerOverActive: true,
        powerOverNumber: overNumber,
        powerOverInnings: innings,
      });
      
      res.json(updatedMatch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to set power over" });
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
      const category = existingPlayer.role || "Batsman";
      
      const player = await storage.updatePlayer(req.params.id, {
        approvalStatus: "approved",
        status: "registered",
        category: category,
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

  // ============ BROADCASTS ============
  
  app.get("/api/broadcasts", async (req, res) => {
    try {
      const allBroadcasts = await storage.getAllBroadcasts();
      res.json(allBroadcasts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broadcasts" });
    }
  });

  app.get("/api/broadcasts/active", async (req, res) => {
    try {
      const activeBroadcasts = await storage.getActiveBroadcasts();
      res.json(activeBroadcasts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active broadcasts" });
    }
  });

  app.post("/api/broadcasts", async (req, res) => {
    try {
      const validation = insertBroadcastSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const broadcast = await storage.createBroadcast(validation.data);
      res.status(201).json(broadcast);
    } catch (error) {
      res.status(500).json({ error: "Failed to create broadcast" });
    }
  });

  app.patch("/api/broadcasts/:id", async (req, res) => {
    try {
      const validation = insertBroadcastSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const broadcast = await storage.updateBroadcast(req.params.id, validation.data);
      if (!broadcast) {
        return res.status(404).json({ error: "Broadcast not found" });
      }
      res.json(broadcast);
    } catch (error) {
      res.status(500).json({ error: "Failed to update broadcast" });
    }
  });

  app.delete("/api/broadcasts/:id", async (req, res) => {
    try {
      await storage.deleteBroadcast(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete broadcast" });
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

  // ============ CAPTAIN PAIRS (for Team Names Auction) ============
  
  app.get("/api/captain-pairs", async (req, res) => {
    try {
      const pairs = await storage.getAllCaptainPairs();
      res.json(pairs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch captain pairs" });
    }
  });

  app.post("/api/captain-pairs", async (req, res) => {
    try {
      const validation = insertCaptainPairSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      
      // Check if slot is already taken
      const existingPairs = await storage.getAllCaptainPairs();
      const slotTaken = existingPairs.some(p => p.slotNumber === validation.data.slotNumber);
      if (slotTaken) {
        return res.status(400).json({ error: `Slot ${validation.data.slotNumber} is already assigned` });
      }
      
      // Check if captain or VC is already in another pair
      const captainInUse = existingPairs.some(p => 
        p.captainId === validation.data.captainId || p.viceCaptainId === validation.data.captainId
      );
      const vcInUse = existingPairs.some(p => 
        p.captainId === validation.data.viceCaptainId || p.viceCaptainId === validation.data.viceCaptainId
      );
      if (captainInUse) {
        return res.status(400).json({ error: "Captain is already assigned to another pair" });
      }
      if (vcInUse) {
        return res.status(400).json({ error: "Vice-Captain is already assigned to another pair" });
      }
      
      const pair = await storage.createCaptainPair(validation.data);
      res.status(201).json(pair);
    } catch (error) {
      res.status(500).json({ error: "Failed to create captain pair" });
    }
  });

  app.patch("/api/captain-pairs/:id", async (req, res) => {
    try {
      const pair = await storage.updateCaptainPair(req.params.id, req.body);
      if (!pair) {
        return res.status(404).json({ error: "Captain pair not found" });
      }
      res.json(pair);
    } catch (error) {
      res.status(500).json({ error: "Failed to update captain pair" });
    }
  });

  app.delete("/api/captain-pairs/:id", async (req, res) => {
    try {
      await storage.deleteCaptainPair(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete captain pair" });
    }
  });

  return httpServer;
}
