
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface TaskBreakdown {
  subtasks: { title: string; estimatedHours: number }[];
  riskAnalysis: string;
  estimatedTotalHours: number;
}

export async function breakdownTaskDescription(description: string, title: string): Promise<TaskBreakdown> {
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Breakdown Error:", error);
    return {
        subtasks: [],
        riskAnalysis: "AI breakdown failed. Please review manually.",
        estimatedTotalHours: 0
    };
  }
}

export async function analyzeWorkloadRisk(
    tasks: { title: string; dueDate: Date | null; status: string }[]
): Promise<{ riskLevel: "low" | "medium" | "high" | "critical"; insight: string }> {
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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        return { riskLevel: "low", insight: "AI analysis unavailable" };
    }
}

export async function analyzeBatchTasksRisk(
    tasksData: { id: string; title: string; dueDate: string; status: string }[]
): Promise<{ taskId: string; riskLevel: string; reason: string }[]> {
    if (tasksData.length === 0) return [];

    const prompt = `
        You are a project risk analyzer. Review these tasks (Today is ${new Date().toISOString().split('T')[0]}):
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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Batch Risk Analysis Failed", error);
        return [];
    }
}
