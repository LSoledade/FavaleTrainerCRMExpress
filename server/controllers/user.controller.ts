import type { Request, Response } from "express";
import { storage } from "../storage.js"; // .js for ES modules
// import { hashPassword } from "../utils/auth.utils"; // No longer needed, Supabase handles passwords
import { professorValidationSchema } from "@shared/schema"; // Assuming this path is correct
import { ZodError } from "zod";
import { supabase } from "../supabase.js"; // Import Supabase client for admin operations if needed

// Note: General user management (getAllUsers, createUser, deleteUser)
// will now largely be handled by Supabase Auth on the client-side or via Supabase dashboard.
// If specific backend admin operations for users are needed, they would use Supabase Admin API.

// Example: Listing all users (admin only, using Supabase Admin API - placeholder)
// export const getAllUsers = async (_req: Request, res: Response) => {
//   try {
//     // This requires Supabase Admin privileges, typically not done with anon key
//     // const { data: { users }, error } = await supabase.auth.admin.listUsers();
//     // if (error) throw error;
//     // res.json(users.map(u => ({ id: u.id, email: u.email, role: u.app_metadata?.role })));
//     res.status(501).json({ message: "User listing via API not implemented yet. Use Supabase dashboard." });
//   } catch (error) {
//     console.error("Erro ao buscar usuários:", error);
//     res.status(500).json({ message: "Erro ao buscar usuários" });
//   }
// };

// createUser is handled by Supabase client-side signup.
// deleteUser is handled by Supabase client-side or Supabase dashboard/Admin API.


// MÉTODOS PARA GESTÃO DE PROFESSORES (Users with 'professor' role)
// Professors are still managed via these backend endpoints, potentially by an admin.
// The concept of "professor" might mean a user with a specific role in Supabase.

// Listar todos os professores (users with role 'professor')
export const getAllProfessors = async (_req: Request, res: Response) => {
  try {
    // This will now fetch users from Supabase who have the 'professor' role.
    // This requires adjusting storage.getAllProfessors() or implementing a new Supabase query.
    // For now, assuming storage.getAllProfessors will be adapted.
    const professors = await storage.getAllProfessors();
    // Password hash is not an issue as Supabase user objects don't expose it directly.
    res.json(professors);
  } catch (error) {
    console.error("Erro ao buscar professores:", error);
    res.status(500).json({ message: "Erro ao buscar professores" });
  }
};

// Criar novo professor
export const createProfessor = async (req: Request, res: Response) => {
  try {
    // Validar dados com Zod
    const validatedData = professorValidationSchema.parse(req.body);

    // With Supabase, user creation (signup) is typically done on the client-side.
    // This backend endpoint would now be for an Admin to create a user with 'professor' role.
    // This requires using Supabase Admin API.
    // For now, this will rely on storage.createProfessor which needs to be adapted for Supabase.

    // Password handling is done by Supabase. We send the plain password to Supabase Admin API.
    // The `hashPassword` utility is no longer used here.

    // Example of how it might work with Supabase Admin API (conceptual)
    /*
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password, // Send plain password
      email_confirm: true, // Or false, depending on your flow
      app_metadata: {
        role: 'professor',
        // other custom fields like name, phone from validatedData
        name: validatedData.name,
        phone: validatedData.phone,
        // ... any other fields from professorValidationSchema
      },
      user_metadata: {
        // any user-specific non-security related metadata
      }
    });

    if (createError) {
      console.error("Supabase admin createUser error:", createError);
      return res.status(400).json({ message: createError.message || "Erro ao criar professor no Supabase." });
    }
    // Assuming 'newUser' contains the created user object from Supabase.
    // It will not contain the password.
    res.status(201).json(newUser);
    return;
    */

    // For now, we'll assume storage.createProfessor is adapted or will be.
    // It should internally handle interaction with Supabase if it's creating a Supabase user.
    // Or, it might be creating a profile in a separate 'professors' table linked to a Supabase auth user.
    
    // If storage.createProfessor still expects a hashed password (which it shouldn't with Supabase),
    // that part of storage.createProfessor needs to change.
    // We are removing the hashing step here.

    const professor = await storage.createProfessor({
      ...validatedData,
      // password: validatedData.password, // Pass plain password if storage.createProfessor calls Supabase admin
      role: "professor" as const, // This role should be set in Supabase app_metadata
    });

    // Supabase user objects don't expose password hash.
    res.status(201).json(professor);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message
        }))
      });
    }
    console.error("Erro ao criar professor:", error);
    res.status(500).json({ message: "Erro ao criar professor" });
  }
};

// Atualizar professor
export const updateProfessor = async (req: Request, res: Response) => {
  try {
    const professorId = parseInt(req.params.id);
    if (isNaN(professorId)) {
      return res.status(400).json({ message: "ID do professor inválido" });
    }

    // Validar dados (sem senha obrigatória na validação inicial)
    // Password update is a special case for Supabase.
    const updateSchema = professorValidationSchema.partial().omit({ password: true, username: true }); // Username (email for Supabase) is not typically changed this way.
    const validatedData = updateSchema.parse(req.body);

    // Prepare updates for Supabase Admin API or storage method
    const updatesForSupabase: any = { app_metadata: {}, user_metadata: {} };

    if (validatedData.name) updatesForSupabase.user_metadata.name = validatedData.name; // Example: store name in user_metadata
    if (validatedData.phone) updatesForSupabase.user_metadata.phone = validatedData.phone; // Example
    // Add other validated fields to app_metadata or user_metadata as appropriate
    // e.g., updatesForSupabase.app_metadata.specialties = validatedData.specialties;

    // Password update: If a new password is provided, it should be handled via Supabase.
    // This usually happens client-side or requires Admin API for direct update.
    if (req.body.password) {
      updatesForSupabase.password = req.body.password; // Send plain password to Supabase Admin
    }

    // Email update: Also a special case, often involves re-verification.
    if (validatedData.email) {
        // supabase.auth.admin.updateUserById(userId, { email: newEmail })
        // This is complex due to email change confirmations.
        // For now, we might disallow email changes here or require storage.updateProfessor to handle it.
        // updatesForSupabase.email = validatedData.email; // If storage.updateProfessor handles it.
    }

    // The storage.updateProfessor method needs to be adapted to use Supabase Admin API
    // or update a local profile table linked to the Supabase user.
    // It should take professorId (which is the Supabase user UUID string) and the updates.
    const updatedProfessor = await storage.updateProfessor(professorId, updatesForSupabase);

    if (!updatedProfessor) {
      return res.status(404).json({ message: "Professor não encontrado ou falha na atualização." });
    }

    // Supabase user objects don't expose password.
    res.json(updatedProfessor);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message
        }))
      });
    }
    console.error("Erro ao atualizar professor:", error);
    res.status(500).json({ message: "Erro ao atualizar professor" });
  }
};

// Excluir professor
export const deleteProfessor = async (req: Request, res: Response) => {
  try {
    const professorIdString = req.params.id; // Supabase user ID is a UUID string, not an integer

    // It's good practice to validate if professorIdString is a valid UUID if possible,
    // but for now, we'll assume it's correctly passed.

    // Prevent self-deletion if req.user.id is available and matches
    if (req.user && professorIdString === req.user.id) {
      return res.status(400).json({ message: "Não é possível excluir o próprio usuário." });
    }

    // Deleting a user in Supabase is an admin action.
    // storage.deleteProfessor needs to be adapted to use supabase.auth.admin.deleteUser(userId)
    // It should also handle cascading deletes or checks for related data (like classes) if necessary.

    // The check for scheduled classes should ideally be done before calling Supabase admin delete.
    // storage.hasScheduledClasses will need to work with Supabase user IDs (UUIDs).
    const hasScheduledClasses = await storage.hasScheduledClasses(professorIdString);
    if (hasScheduledClasses) {
      return res.status(400).json({ 
        message: "Não é possível excluir professor com aulas agendadas. Cancele ou reagende as aulas primeiro." 
      });
    }

    const success = await storage.deleteProfessor(professorIdString);
    if (success) {
      res.status(200).json({ message: "Professor excluído com sucesso." });
    } else {
      res.status(404).json({ message: "Professor não encontrado ou falha ao excluir." });
    }
  } catch (error) {
    console.error("Erro ao excluir professor:", error);
    res.status(500).json({ message: "Erro ao excluir professor" });
  }
}; 