import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeUsername(username: string): string {
  const hashDigest = crypto.createHash("sha256").update(username).digest("hex")
  const truncatedHash = hashDigest.slice(0, 10)
  const hashInt = Number.parseInt(truncatedHash, 16)

  const base36Chars = "0123456789abcdefghijklmnopqrstuvwxyz"
  let encoded = ""
  let num = hashInt

  while (num > 0) {
    const remainder = num % 36
    encoded = base36Chars[remainder] + encoded
    num = Math.floor(num / 36)
  }

  return encoded.padStart(6, "0").slice(0, 6)
}

export function scorePrompt(prompt: string): number {
  const jailbreakKeywords = [
    "ignore previous instructions",
    "disregard above",
    "override",
    "forget",
    "bypass",
    "reveal",
    "unfiltered",
    "developer note",
    "internal",
    "flag",
    "hidden",
    "system prompt",
    "act as",
    "break character",
    "vulnerability",
    "dev notes",
    "secret",
    "confidential",
  ]

  let score = 1

  for (const keyword of jailbreakKeywords) {
    if (prompt.toLowerCase().includes(keyword)) {
      score += 2
      break
    }
  }

  if (
    ["if you were allowed", "hypothetically", "imagine", "suppose", "roleplay", "let's pretend"].some((phrase) =>
      prompt.toLowerCase().includes(phrase),
    )
  ) {
    score += 1
  }

  if (prompt.length > 100) {
    score += 1
  }

  return Math.min(score, 5)
}

export function computeTotalScore(promptScore: number, attempts: number, timeInSeconds: number): number {
  return promptScore * 10 - attempts * 5 - timeInSeconds * 0.1
}
