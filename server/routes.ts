import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  playerRegistrationSchema, 
  insertTournamentSettingsSchema,
  insertBroadcastSchema
} from "@shared/schema";
import { z } from "zod";

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

      const existingEmail = await storage.getPlayerByEmail(validation.data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
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
      const { action } = req.body;
      const currentState = await storage.getAuctionState();
      
      switch (action) {
        case "start": {
          const players = await storage.getAllPlayers();
          // Start with category 3000 (Jhakaas Superstars) first
          const categories = ["3000", "2500", "2000", "1500"];
          let availablePlayer = null;
          let currentCategory = "3000";
          
          // Find first available player in category order
          for (const cat of categories) {
            availablePlayer = players.find(p => p.status === "registered" && p.category === cat);
            if (availablePlayer) {
              currentCategory = cat;
              break;
            }
          }
          
          if (!availablePlayer) {
            return res.status(400).json({ error: "No players available for auction" });
          }
          
          await storage.updatePlayer(availablePlayer.id, { status: "in_auction" });
          
          // Use category base price instead of calculated basePoints
          const categoryBasePrice = parseInt(currentCategory);
          
          const state = await storage.updateAuctionState({
            status: "in_progress",
            currentPlayerId: availablePlayer.id,
            currentBid: categoryBasePrice,
            currentBiddingTeamId: null,
            bidHistory: [],
            currentCategory,
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
        
        case "next": {
          const players = await storage.getAllPlayers();
          const categories = ["3000", "2500", "2000", "1500"];
          let nextPlayer = null;
          let currentCategory = currentState?.currentCategory || "3000";
          
          // First try to find player in current category
          nextPlayer = players.find(p => p.status === "registered" && p.category === currentCategory);
          
          // If no player in current category, move to next category
          if (!nextPlayer) {
            const currentCatIndex = categories.indexOf(currentCategory);
            for (let i = currentCatIndex + 1; i < categories.length; i++) {
              nextPlayer = players.find(p => p.status === "registered" && p.category === categories[i]);
              if (nextPlayer) {
                currentCategory = categories[i];
                break;
              }
            }
          }
          
          if (!nextPlayer) {
            // All categories exhausted, try lost gold round
            const lostGoldPlayers = players.filter(p => p.status === "lost_gold");
            if (lostGoldPlayers.length > 0) {
              const player = lostGoldPlayers[0];
              await storage.updatePlayer(player.id, { status: "in_auction" });
              const categoryBasePrice = parseInt(player.category || "1500");
              const state = await storage.updateAuctionState({
                status: "lost_gold_round",
                currentPlayerId: player.id,
                currentBid: categoryBasePrice,
                currentBiddingTeamId: null,
                bidHistory: [],
                currentCategory: player.category || "1500",
              });
              return res.json(state);
            }
            
            const state = await storage.updateAuctionState({
              status: "completed",
              currentPlayerId: null,
              currentBid: null,
              currentBiddingTeamId: null,
            });
            return res.json(state);
          }
          
          await storage.updatePlayer(nextPlayer.id, { status: "in_auction" });
          
          const categoryBasePrice = parseInt(currentCategory);
          const state = await storage.updateAuctionState({
            currentPlayerId: nextPlayer.id,
            currentBid: categoryBasePrice,
            currentBiddingTeamId: null,
            bidHistory: [],
            currentCategory,
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
      
      const currentBid = state.currentBid || 0;
      // New bid increment rules: +100 (up to 4000), +200 (above 4000)
      let increment = currentBid >= 4000 ? 200 : 100;
      
      const newBid = currentBid + increment;
      
      if (newBid > team.remainingBudget) {
        return res.status(400).json({ error: "Insufficient budget" });
      }
      
      const bidHistory = [...(state.bidHistory || []), {
        teamId,
        amount: newBid,
        timestamp: Date.now(),
      }];
      
      const updatedState = await storage.updateAuctionState({
        currentBid: newBid,
        currentBiddingTeamId: teamId,
        bidHistory,
      });
      
      res.json(updatedState);
    } catch (error) {
      res.status(500).json({ error: "Failed to place bid" });
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
      
      await storage.updatePlayer(state.currentPlayerId, {
        status: "sold",
        teamId: state.currentBiddingTeamId,
        soldPrice: state.currentBid,
      });
      
      await storage.updateTeam(state.currentBiddingTeamId, {
        remainingBudget: team.remainingBudget - (state.currentBid || 0),
      });
      
      const players = await storage.getAllPlayers();
      const nextPlayer = players.find(p => p.status === "registered");
      
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
      
      const updatedState = await storage.updateAuctionState({
        status: "completed",
        currentPlayerId: null,
        currentBid: null,
        currentBiddingTeamId: null,
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
      const nextPlayer = isLostGoldRound
        ? players.find(p => p.status === "lost_gold")
        : players.find(p => p.status === "registered");
      
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
      
      if (!isLostGoldRound) {
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
        });
      }
      
      const teams = await storage.getAllTeams();
      for (const team of teams) {
        await storage.updateTeam(team.id, {
          remainingBudget: team.budget,
        });
      }
      
      await storage.updateAuctionState({
        status: "not_started",
        currentPlayerId: null,
        currentBid: null,
        currentBiddingTeamId: null,
        bidHistory: [],
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
      });
      
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: "Failed to start match" });
    }
  });

  app.post("/api/matches/:id/ball", async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match || match.status !== "live") {
        return res.status(400).json({ error: "Match not live" });
      }
      
      const { runs, extraType, isWicket, wicketType } = req.body;
      
      const isFirstInnings = match.currentInnings === 1;
      const currentScore = isFirstInnings ? match.team1Score : match.team2Score;
      const currentWickets = isFirstInnings ? match.team1Wickets : match.team2Wickets;
      const currentOvers = isFirstInnings ? match.team1Overs : match.team2Overs;
      
      const [overs, balls] = (currentOvers || "0.0").split(".").map(Number);
      let newBalls = balls + 1;
      let newOvers = overs;
      
      if (!extraType || extraType !== "wide") {
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
      
      // Power Over: Runs are doubled
      let effectiveRuns = runs || 0;
      if (isPowerOver && effectiveRuns > 0) {
        effectiveRuns = effectiveRuns * 2;
      }
      
      let newScore = (currentScore || 0) + effectiveRuns;
      let newWickets = currentWickets || 0;
      
      if (extraType) {
        newScore += 1;
      }
      
      // Power Over: Wicket costs -5 points
      if (isWicket) {
        newWickets += 1;
        if (isPowerOver) {
          newScore = Math.max(0, newScore - 5);
        }
      }
      
      const isInningsOver = newOvers >= 6 || newWickets >= 10;
      
      let updateData: any = {};
      
      if (isFirstInnings) {
        updateData = {
          team1Score: newScore,
          team1Wickets: newWickets,
          team1Overs: newOversStr,
        };
        
        if (isInningsOver) {
          updateData.currentInnings = 2;
        }
      } else {
        updateData = {
          team2Score: newScore,
          team2Wickets: newWickets,
          team2Overs: newOversStr,
        };
        
        const target = (match.team1Score || 0) + 1;
        if (newScore >= target) {
          updateData.status = "completed";
          updateData.winnerId = match.team2Id;
          updateData.result = "win";
          
          await updatePointsAfterMatch(match.team2Id, match.team1Id, match);
        } else if (isInningsOver) {
          if (newScore === match.team1Score) {
            updateData.status = "completed";
            updateData.result = "tie";
          } else {
            updateData.status = "completed";
            updateData.winnerId = match.team1Id;
            updateData.result = "win";
            
            await updatePointsAfterMatch(match.team1Id, match.team2Id, match);
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

  async function updatePointsAfterMatch(winnerId: string, loserId: string, match: any) {
    const winnerPoints = await storage.getTeamPoints(winnerId);
    const loserPoints = await storage.getTeamPoints(loserId);
    
    await storage.updatePointsTable(winnerId, {
      played: (winnerPoints?.played || 0) + 1,
      won: (winnerPoints?.won || 0) + 1,
      points: (winnerPoints?.points || 0) + 2,
      runsFor: (winnerPoints?.runsFor || 0) + (match.currentInnings === 1 ? match.team1Score : match.team2Score),
      runsAgainst: (winnerPoints?.runsAgainst || 0) + (match.currentInnings === 1 ? match.team2Score : match.team1Score),
    });
    
    await storage.updatePointsTable(loserId, {
      played: (loserPoints?.played || 0) + 1,
      lost: (loserPoints?.lost || 0) + 1,
      runsFor: (loserPoints?.runsFor || 0) + (match.currentInnings === 1 ? match.team2Score : match.team1Score),
      runsAgainst: (loserPoints?.runsAgainst || 0) + (match.currentInnings === 1 ? match.team1Score : match.team2Score),
    });
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
      const player = await storage.updatePlayer(req.params.id, {
        approvalStatus: "approved",
        status: "registered",
      });
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
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

  return httpServer;
}
