
import { db } from "../server/db";
import { players, teams, tournamentSettings, auctionState } from "../shared/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // 1. Seed Teams
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

  console.log("Seeding teams...");
  for (const team of defaultTeams) {
    const existing = await db.query.teams.findFirst({
        where: (teams: { name: any; }, { eq }: any) => eq(teams.name, team.name)
    });

    if (!existing) {
        await db.insert(teams).values({
            id: randomUUID(),
            ...team,
            budget: 25000,
            remainingBudget: 25000,
        });
        console.log(`Created team: ${team.name}`);
    } else {
        console.log(`Team already exists: ${team.name}`);
    }
  }

  // 2. Tournament Settings
  console.log("Seeding tournament settings...");
  const settings = await db.query.tournamentSettings.findFirst();
  if (!settings) {
      await db.insert(tournamentSettings).values({
          id: randomUUID(),
          isAuctionOpen: false,
          isRegistrationOpen: true,
          defaultBudget: 25000,
      });
       console.log("Created tournament settings");
  } else {
      console.log("Tournament settings already exist");
  }

    // 3. Auction State
    console.log("Seeding auction state...");
    const auction = await db.query.auctionState.findFirst();
    if (!auction) {
        await db.insert(auctionState).values({
            id: randomUUID(),
            status: "not_started",
            currentCategory: "3000",
        });
        console.log("Created auction state");
    } else {
        console.log("Auction state already exists");
    }


  // 4. Dummy Players
  console.log("Seeding dummy players...");
  const dummyPlayers = [
  {
    name: "Rohit Sharma",
    mobile: "9999999991",
    email: "rohit@example.com",
    address: "Mumbai",
    role: "Batsman",
    battingRating: 95,
    bowlingRating: 60,
    fieldingRating: 90,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rohit_Sharma_at_press_conference.jpg/640px-Rohit_Sharma_at_press_conference.jpg",
    basePoints: 3000,
    category: "3000",
    approvalStatus: "approved",
  },
  {
    name: "Virat Kohli",
    mobile: "9999999992",
    email: "virat@example.com",
    address: "Delhi",
    role: "Batsman",
    battingRating: 98,
    bowlingRating: 50,
    fieldingRating: 95,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg",
    basePoints: 3000,
    category: "3000",
    approvalStatus: "approved",
  },
  {
    name: "Jasprit Bumrah",
    mobile: "9999999993",
    email: "bumrah@example.com",
    address: "Ahmedabad",
    role: "Bowler",
    battingRating: 40,
    bowlingRating: 98,
    fieldingRating: 85,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Jasprit_Bumrah_in_PMO_New_Delhi.jpg",
    basePoints: 2500,
    category: "2500",
    approvalStatus: "approved",
  },
  {
    name: "KL Rahul",
    mobile: "9999999994",
    email: "klrahul@example.com",
    address: "Bangalore",
    role: "Wicketkeeper",
    battingRating: 88,
    bowlingRating: 30,
    fieldingRating: 92,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/KL_Rahul_at_Femina_Miss_India_2018_Grand_Finale_%28cropped%29.jpg/440px-KL_Rahul_at_Femina_Miss_India_2018_Grand_Finale_%28cropped%29.jpg",
    basePoints: 2500,
    category: "2500",
    approvalStatus: "approved",
  },
  {
    name: "Ravindra Jadeja",
    mobile: "9999999995",
    email: "jadeja@example.com",
    address: "Rajkot",
    role: "All-rounder",
    battingRating: 82,
    bowlingRating: 90,
    fieldingRating: 98,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ravindra_Jadeja_in_2023.jpg/440px-Ravindra_Jadeja_in_2023.jpg",
    basePoints: 2500,
    category: "2500",
    approvalStatus: "approved",
  },
  {
    name: "Hardik Pandya",
    mobile: "9999999996",
    email: "hardik@example.com",
    address: "Vadodara",
    role: "All-rounder",
    battingRating: 80,
    bowlingRating: 78,
    fieldingRating: 88,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Hardik_Pandya_at_the_Narendra_Modi_Stadium%2C_Ahmedabad_%28cropped%29.jpg/440px-Hardik_Pandya_at_the_Narendra_Modi_Stadium%2C_Ahmedabad_%28cropped%29.jpg",
    basePoints: 2500,
    category: "2500",
    approvalStatus: "approved",
  },
  {
    name: "Shubman Gill",
    mobile: "9999999997",
    email: "gill@example.com",
    address: "Mohali",
    role: "Batsman",
    battingRating: 90,
    bowlingRating: 35,
    fieldingRating: 85,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Shubman_Gill_%282%29.jpg/440px-Shubman_Gill_%282%29.jpg",
    basePoints: 2000,
    category: "2000",
    approvalStatus: "approved",
  },
  {
    name: "Mohammed Shami",
    mobile: "9999999998",
    email: "shami@example.com",
    address: "Kolkata",
    role: "Bowler",
    battingRating: 45,
    bowlingRating: 92,
    fieldingRating: 75,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Mohammed_Shami_%282%29.jpg/440px-Mohammed_Shami_%282%29.jpg",
    basePoints: 2000,
    category: "2000",
    approvalStatus: "approved",
  },
  {
    name: "Rishabh Pant",
    mobile: "9999999999",
    email: "pant@example.com",
    address: "Delhi",
    role: "Wicketkeeper",
    battingRating: 85,
    bowlingRating: 20,
    fieldingRating: 88,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Rishabh_Pant_%282%29.jpg/440px-Rishabh_Pant_%282%29.jpg",
    basePoints: 2500,
    category: "2500",
    approvalStatus: "approved",
  },
  {
    name: "Ravichandran Ashwin",
    mobile: "9999999910",
    email: "ashwin@example.com",
    address: "Chennai",
    role: "All-rounder",
    battingRating: 70,
    bowlingRating: 95,
    fieldingRating: 80,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ravichandran_Ashwin_%282%29.jpg/440px-Ravichandran_Ashwin_%282%29.jpg",
    basePoints: 2000,
    category: "2000",
    approvalStatus: "approved",
  },
  {
    name: "Suryakumar Yadav",
    mobile: "9999999911",
    email: "surya@example.com",
    address: "Mumbai",
    role: "Batsman",
    battingRating: 92,
    bowlingRating: 25,
    fieldingRating: 90,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Suryakumar_Yadav.jpg/440px-Suryakumar_Yadav.jpg",
    basePoints: 2500,
    category: "2500",
    approvalStatus: "approved",
  },
  {
    name: "Mohammed Siraj",
    mobile: "9999999912",
    email: "siraj@example.com",
    address: "Hyderabad",
    role: "Bowler",
    battingRating: 35,
    bowlingRating: 88,
    fieldingRating: 82,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Mohammed_Siraj_%282%29.jpg/440px-Mohammed_Siraj_%282%29.jpg",
    basePoints: 2000,
    category: "2000",
    approvalStatus: "approved",
  },
  {
    name: "Shreyas Iyer",
    mobile: "9999999913",
    email: "shreyas@example.com",
    address: "Mumbai",
    role: "Batsman",
    battingRating: 84,
    bowlingRating: 40,
    fieldingRating: 85,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Shreyas_Iyer_%282%29.jpg/440px-Shreyas_Iyer_%282%29.jpg",
    basePoints: 1500,
    category: "1500",
    approvalStatus: "approved",
  },
  {
    name: "Kuldeep Yadav",
    mobile: "9999999914",
    email: "kuldeep@example.com",
    address: "Kanpur",
    role: "Bowler",
    battingRating: 40,
    bowlingRating: 86,
    fieldingRating: 78,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Kuldeep_Yadav_%282%29.jpg/440px-Kuldeep_Yadav_%282%29.jpg",
    basePoints: 1500,
    category: "1500",
    approvalStatus: "approved",
  },
  {
    name: "Axar Patel",
    mobile: "9999999915",
    email: "axar@example.com",
    address: "Ahmedabad",
    role: "All-rounder",
    battingRating: 72,
    bowlingRating: 85,
    fieldingRating: 82,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Axar_Patel_%282%29.jpg/440px-Axar_Patel_%282%29.jpg",
    basePoints: 1500,
    category: "1500",
    approvalStatus: "approved",
  },
  {
    name: "Ishan Kishan",
    mobile: "9999999916",
    email: "ishan@example.com",
    address: "Patna",
    role: "Wicketkeeper",
    battingRating: 78,
    bowlingRating: 20,
    fieldingRating: 85,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Ishan_Kishan_%282%29.jpg/440px-Ishan_Kishan_%282%29.jpg",
    basePoints: 1500,
    category: "1500",
    approvalStatus: "approved",
  },
];

    for (const player of dummyPlayers) {
        const existing = await db.query.players.findFirst({
            where: (players: { mobile: any; }, { eq }: any) => eq(players.mobile, player.mobile)
        });

        if (!existing) {
             await db.insert(players).values({
                id: randomUUID(),
                ...player,
            });
            console.log(`Created player: ${player.name}`);
        } else {
            console.log(`Player already exists: ${player.name}`);
        }
    }

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
