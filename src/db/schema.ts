
import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["employee", "pm", "hr"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "active", "rejected"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "review", "done", "blocked"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "critical"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);

// Auth Tables (Better Auth)
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	role: roleEnum("role").default("employee").notNull(),
    status: accountStatusEnum("status").default("pending").notNull(),
    department: text("department"),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// Business Logic Tables

export const projects = pgTable("projects", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("active"), // active, completed, archived
    managerId: text("manager_id").references(() => user.id),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id),
    assigneeId: text("assignee_id").references(() => user.id),
    creatorId: text("creator_id").references(() => user.id), // Bisa PM atau AI (via system user)
    
    title: text("title").notNull(),
    description: text("description"),
    
    status: taskStatusEnum("status").default("todo"),
    priority: taskPriorityEnum("priority").default("medium"),
    
    // Time Management
    dueDate: timestamp("due_date"),
    startDate: timestamp("start_date"), // Actual start
    completedDate: timestamp("completed_date"), // Actual finish
    estimatedHours: integer("estimated_hours"),
    actualHours: integer("actual_hours"),
    
    // AI & Risk
    aiRiskAnalysis: text("ai_risk_analysis"), // Penjelasan risiko dari AI
    riskLevel: riskLevelEnum("risk_level").default("low"),
    aiBreakdown: jsonb("ai_breakdown"), // JSON hasil breakdown subtasks dari Gemini
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const subtasks = pgTable("subtasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: 'cascade' }),
    title: text("title").notNull(),
    isCompleted: boolean("is_completed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export const taskEvidences = pgTable("task_evidences", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text("user_id").references(() => user.id),
    
    fileUrl: text("file_url").notNull(), // Cloudinary URL
    publicId: text("public_id"), // Cloudinary Public ID
    fileType: text("file_type"),
    
    description: text("description"), // Catatan singkat user
    submittedAt: timestamp("submitted_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id),
    action: text("action").notNull(), // TASK_CREATED, STATUS_CHANGED, etc.
    entityId: text("entity_id"), // ID dari task/project
    entityType: text("entity_type"), // 'task', 'project'
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id),
    periodMonth: integer("period_month"), // 1-12
    periodYear: integer("period_year"), // 2024
    
    tasksCompleted: integer("tasks_completed").default(0),
    onTimeRate: integer("on_time_rate").default(0), // Percentage
    reliabilityScore: integer("reliability_score").default(0), // 0-100 (AI Calculated)
    workloadScore: integer("workload_score").default(0), // 0-100 (Indikator beban kerja)
    
    aiInsight: text("ai_insight"), // Rekomendasi/Evaluasi naratif dari AI
    
    calculatedAt: timestamp("calculated_at").defaultNow(),
});
