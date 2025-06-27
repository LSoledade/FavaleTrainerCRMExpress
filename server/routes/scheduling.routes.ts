import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { 
  createRecurrentScheduling, 
  getClasses, 
  updateClass,
  checkConflicts
} from "../controllers/newScheduling.controller";

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(isAuthenticated);

// ROTAS PARA O NOVO SISTEMA DE AGENDAMENTO

// Criar agendamento recorrente
router.post("/recurrent", createRecurrentScheduling);

// Buscar aulas (com filtros)
router.get("/classes", getClasses);

// Atualizar aula específica
router.patch("/classes/:id", updateClass);

// Verificar conflitos de horário
router.post("/check-conflicts", checkConflicts);

export default router;