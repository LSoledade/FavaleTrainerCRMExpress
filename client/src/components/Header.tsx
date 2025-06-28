import { useLocation, Link } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const getThemeIcon = () => {
    return theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };
  
  const getThemeTitle = () => {
    return theme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro";
  };
  
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/leads":
        return "Leads";
      case "/agendamentos":
        return "Agendamentos";
      case "/calendario":
        return "Calendário";
      case "/professores":
        return "Professores";
      case "/tarefas":
        return "Tarefas";
      case "/whatsapp":
        return "WhatsApp";
      case "/whatsapp/config":
        return "Configurações do WhatsApp";
      case "/favale-ia":
        return "FavaleIA"; // Assuming this is a specific feature name
      case "/config":
        return "Configurações";
      case "/auth":
        return "Autenticação";
      case "/politica-de-privacidade":
        return "Política de Privacidade";
      default:
        if (location.startsWith("/tarefas/")) {
          return "Detalhes da Tarefa";
        }
        return "Combinat CRM"; // Changed from FavaleTrainer
    }
  };
  
  return (
    <header className="h-16 flex items-center justify-between z-10 mb-2 bg-background text-foreground">
      <div className="flex items-center">
        <button 
          className="lg:hidden mr-2 p-1.5 rounded-md hover:bg-muted"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="material-icons text-foreground/80">menu</span>
        </button>
        <h1 className="text-xl font-semibold text-foreground">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={toggleTheme}
          className="font-normal text-muted-foreground border-border flex items-center gap-1 h-9"
          title={getThemeTitle()}
        >
          {getThemeIcon()}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer ml-2">
              <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-border">
                <AvatarFallback className="text-sm font-medium text-primary-foreground bg-primary">
                  {user?.username.substring(0, 2).toUpperCase() || "CB"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium text-foreground">{user?.username || "Usuário Combinat"}</div>
                <div className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Admin' : 'Usuário'}</div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover text-popover-foreground border-border">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <Link href="/config">
              <DropdownMenuItem className="hover:bg-muted focus:bg-muted">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Perfil e Configurações</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-border"/>
            <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
