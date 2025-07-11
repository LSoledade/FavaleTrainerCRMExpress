import type { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase.js";

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      role?: string;
      app_metadata?: {
        role?: string;
        roles?: string[];
        [key: string]: any;
      };
      user_metadata?: {
        [key: string]: any;
      };
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
}

export async function jwtAuthMiddlewareGlobal(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

        if (error) {
          if (error.message === "Invalid JWT" || error.message.includes("expired")) {
            // console.warn(`Supabase auth: ${error.message} for token: ${token.substring(0, 10)}...`);
          } else {
            // console.error("Error fetching user from Supabase:", error);
          }
        }

        if (supabaseUser) {
          let userRole = 'user';
          if (supabaseUser.app_metadata?.role) {
            userRole = supabaseUser.app_metadata.role;
          } else if (supabaseUser.app_metadata?.roles && supabaseUser.app_metadata.roles.length > 0) {
            userRole = supabaseUser.app_metadata.roles[0];
          }

          req.user = {
            ...supabaseUser,
            role: userRole,
          };
        }
      } catch (err) {
        // console.error("Unexpected error in JWT auth middleware:", err);
      }
    }
  }
  next();
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: "Não autenticado. Token JWT válido é obrigatório para este recurso." });
    return;
  }
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: "Não autenticado." });
    return;
  }

  const userRole = req.user.role;

  if (userRole !== "admin") {
    res.status(403).json({ message: "Acesso negado. Requer privilégios de administrador." });
    return;
  }
  next();
}