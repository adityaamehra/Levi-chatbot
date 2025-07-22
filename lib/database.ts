// Simple in-memory database for demo purposes
// In production, you'd want to use a real database like Supabase

export interface LeaderboardEntry {
  username: string
  attempts: number
  timeInSeconds: number
  promptScore: number
  totalScore: number
  timestamp: string
}

// In-memory storage (resets on server restart)
let leaderboard: LeaderboardEntry[] = []

export function addToLeaderboard(entry: LeaderboardEntry) {
  // Ensure all values are properly formatted
  const cleanEntry: LeaderboardEntry = {
    username: String(entry.username || "Anonymous"),
    attempts: Number(entry.attempts) || 0,
    timeInSeconds: Number(entry.timeInSeconds) || 0,
    promptScore: Number(entry.promptScore) || 0,
    totalScore: Number(entry.totalScore) || 0,
    timestamp: entry.timestamp || new Date().toISOString(),
  }

  leaderboard.push(cleanEntry)

  // Keep only top 20, sorted by total score
  leaderboard.sort((a, b) => b.totalScore - a.totalScore)
  leaderboard = leaderboard.slice(0, 20)
}

export function getLeaderboard(): LeaderboardEntry[] {
  // Return a clean copy of the leaderboard
  return leaderboard
    .map((entry) => ({
      username: String(entry.username),
      attempts: Number(entry.attempts),
      timeInSeconds: Number(entry.timeInSeconds),
      promptScore: Number(entry.promptScore),
      totalScore: Number(entry.totalScore),
      timestamp: String(entry.timestamp),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
}
