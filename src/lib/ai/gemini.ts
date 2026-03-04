
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// --- Provider Setup ---

const geminiKey = process.env.GEMINI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;

if (!geminiKey && !groqKey) {
  throw new Error("Missing AI API key. Set GEMINI_API_KEY or GROQ_API_KEY in .env");
}

// Gemini setup (primary)
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const geminiModel = genAI?.getGenerativeModel({ model: "gemini-2.0-flash" });

// Groq setup (fallback)
const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;
const GROQ_MODEL = "llama-3.3-70b-versatile";

// --- Core AI Call with Fallback ---

/**
 * Sends a prompt to Gemini first. If Gemini fails (rate limit, error, etc.),
 * falls back to Groq. Returns the raw text response.
 */
async function callAI(prompt: string): Promise<string> {
  // Try Gemini first
  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(
        `⚠️ Gemini failed (${error?.status || "unknown"}), falling back to Groq...`
      );
      // Fall through to Groq
    }
  }

  // Fallback to Groq
  if (groq) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant. Always respond with valid JSON only, no markdown formatting, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 2048,
      });

      return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("❌ Groq also failed:", error);
      throw new Error("All AI providers failed");
    }
  }

  throw new Error("No AI provider available");
}

/**
 * Parses JSON from AI response text, handling markdown code blocks.
 */
function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  // Determine if it's an object or array
  if (arrayStart !== -1 && (jsonStart === -1 || arrayStart < jsonStart)) {
    return JSON.parse(cleaned.substring(arrayStart, arrayEnd + 1));
  }
  if (jsonStart !== -1 && jsonEnd !== -1) {
    return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
  }
  return JSON.parse(cleaned);
}

// --- Exported AI Functions ---

export interface TaskBreakdown {
  subtasks: { title: string; estimatedHours: number }[];
  riskAnalysis: string;
  estimatedTotalHours: number;
}

export async function breakdownTaskDescription(
  description: string,
  title: string
): Promise<TaskBreakdown> {
  const prompt = `
    You are an expert Project Manager AI. I will provide a task title and description.
    Your job is to:
    1. Break down this task into smaller, actionable subtasks (max 5).
    2. Estimate hours for each subtask.
    3. Provide a brief risk analysis.

    Task Title: ${title}
    Task Description: ${description}

    Output specifically in this JSON format (no markdown):
    {
      "subtasks": [{"title": "Subtask 1", "estimatedHours": 2}],
      "riskAnalysis": "Risk analysis text here...",
      "estimatedTotalHours": 10
    }
  `;

  try {
    const text = await callAI(prompt);
    return parseJSON<TaskBreakdown>(text);
  } catch (error) {
    console.error("Gemini/Groq Breakdown Error:", error);
    return {
      subtasks: [],
      riskAnalysis: "AI breakdown failed. Please review manually.",
      estimatedTotalHours: 0,
    };
  }
}

export async function analyzeWorkloadRisk(
  tasks: { title: string; dueDate: Date | null; status: string }[]
): Promise<{
  riskLevel: "low" | "medium" | "high" | "critical";
  insight: string;
}> {
  const prompt = `
    Analyze the following user workload and determine the risk level (low, medium, high, critical) of missing deadlines or burnout.
    Tasks: ${JSON.stringify(tasks)}

    Output JSON:
    {
      "riskLevel": "medium",
      "insight": "Explain why..."
    }
  `;

  try {
    const text = await callAI(prompt);
    return parseJSON(text);
  } catch (error) {
    return { riskLevel: "low", insight: "AI analysis unavailable" };
  }
}

export async function analyzeBatchTasksRisk(
  tasksData: { id: string; title: string; dueDate: string; status: string }[]
): Promise<{ taskId: string; riskLevel: string; reason: string }[]> {
  if (tasksData.length === 0) return [];

  const prompt = `
    You are a project risk analyzer. Review these tasks (Today is ${new Date().toISOString().split("T")[0]}):
    ${JSON.stringify(tasksData)}

    Identify tasks that are at "high" or "critical" risk of missing deadlines.
    Ignore tasks that are "done".

    Return a JSON array ONLY for risky tasks:
    [
      { "taskId": "...", "riskLevel": "high", "reason": "Deadline in 2 days but status is todo" }
    ]
    If no risky tasks, return [].
  `;

  try {
    const text = await callAI(prompt);
    const json = parseJSON<any>(text);
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error("Batch Risk Analysis Failed", error);
    return [];
  }
}

export interface QualityAnalysisResult {
  score: number;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  confidenceLevel: number;
}

export async function analyzeTaskQuality(
  taskTitle: string,
  taskDescription: string,
  evidenceDescription: string,
  isLate: boolean,
  daysLate: number
): Promise<QualityAnalysisResult> {
  const prompt = `
    You are a strict QA Manager. Evaluate the quality of this completed task.

    TASK: "${taskTitle}"
    REQUIREMENTS: "${taskDescription}"
    EVIDENCE SUBMITTED: "${evidenceDescription}"
    TIMELINESS: ${isLate ? `Late by ${daysLate} days` : "On Time"}

    Rate the quality on a scale of 0-100 based on:
    1. Alignment with requirements (Did they do what was asked?).
    2. Clarity of evidence provided.
    3. Timeliness (Penalize heavily if late).

    Also evaluate:
    - Key strengths of the work (list up to 3).
    - Weaknesses or gaps compared to the original instructions (list up to 3).
    - Your confidence level as a percentage (0-100) representing how confident you are in the accuracy of this assessment based on the evidence quality.

    Return JSON ONLY:
    {
      "score": 85,
      "analysis": "Summary of overall quality assessment.",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "confidenceLevel": 78
    }
  `;

  try {
    const text = await callAI(prompt);
    const result = parseJSON<QualityAnalysisResult>(text);
    return {
      score: result.score ?? 70,
      analysis: result.analysis ?? "Analysis unavailable.",
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      confidenceLevel: result.confidenceLevel ?? 50,
    };
  } catch (error) {
    console.error("Quality Analysis Failed", error);
    return {
      score: 70,
      analysis:
        "AI Analysis unavailable currently. Please review manually.",
      strengths: [],
      weaknesses: [],
      confidenceLevel: 0,
    };
  }
}