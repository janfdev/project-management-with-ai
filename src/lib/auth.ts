
import { db } from "@/db";
import * as schema from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "employee",
      },
      department: {
         type: "string",
         required: false,
      },
      status: {
         type: "string",
         defaultValue: "pending",
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
           // Jika emailnya adalah SUPER_ADMIN, jadikan HR & Active
           if (user.email === process.env.SUPER_ADMIN_EMAIL) {
              return {
                 data: {
                   ...user,
                   role: "hr",
                   status: "active"
                 }
              }
           }
           // Default: Employee & Pending
           return {
             data: {
                ...user,
                role: "employee",
                status: "pending"
             }
           }
        }
      }
    }
  },
  plugins: [nextCookies()],
});
