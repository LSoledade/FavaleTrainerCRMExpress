import { Router, Request, Response } from "express";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js"; // .js for ES modules
import { 
  getAllProfessors, 
  createProfessor, 
  updateProfessor, 
  deleteProfessor,
  // getAllUsers, // We might not need this if Supabase handles user listing directly
  // createUser, // Supabase handles user creation
  // deleteUser // Supabase handles user deletion, or we implement it carefully
} from "../controllers/user.controller.js"; // .js for ES modules

const router = Router();

// Helper to wrap async route handlers and forward errors to Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Rota para obter informações do usuário autenticado (substitui /api/user)
console.log('Registering route: GET /me');
router.get("/me", isAuthenticated, (req: Request, res: Response) => {
  if (req.user) {
    // O middleware jwtAuthMiddlewareGlobal já populou req.user com dados do Supabase
    // Retornar os dados do usuário, excluindo informações sensíveis se houver
    const { id, email, role, app_metadata, user_metadata } = req.user;
    res.json({ id, email, role, app_metadata, user_metadata });
  } else {
    // Isso não deve acontecer se isAuthenticated funcionar corretamente
    res.status(401).json({ message: "Não autenticado" });
  }
});

// ROTAS PARA GESTÃO DE PROFESSORES (geralmente requerem privilégios de admin)
// Aplicar middleware de autenticação e isAdmin para rotas de professores
console.log('Registering route: GET /professors');
router.get("/professors", isAuthenticated, isAdmin, asyncHandler(getAllProfessors));
console.log('Registering route: POST /professors');
router.post("/professors", isAuthenticated, isAdmin, asyncHandler(createProfessor));
console.log('Registering route: PUT /professors/:id');
router.put("/professors/:id", isAuthenticated, isAdmin, asyncHandler(updateProfessor));
console.log('Registering route: DELETE /professors/:id');
router.delete("/professors/:id", isAuthenticated, isAdmin, asyncHandler(deleteProfessor));

// TODO: Avaliar a necessidade das rotas /api/users, /api/users/:id (delete), /api/register
// A listagem geral de usuários, criação e deleção direta de usuários agora é
// primariamente gerenciada pelo Supabase Auth.
// Se precisarmos de endpoints para administradores gerenciarem usuários via API,
// eles devem ser protegidos por isAdmin e interagir com a API de Admin do Supabase.

// Exemplo: Listar todos os usuários (apenas admin)
// router.get("/", isAuthenticated, isAdmin, getAllUsers);

// A rota /api/register foi removida pois o registro é feito via cliente Supabase.
// A rota /api/login foi removida pois o login é feito via cliente Supabase.
// A rota /api/logout foi removida pois o logout é feito via cliente Supabase.

export default router;