import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  expanded?: boolean;
}

export default function Sidebar({ open, setOpen, expanded = true }: SidebarProps) {
  const [location] = useLocation();
  const { theme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Verificar se é mobile ao inicializar
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Itens de navegação padrão
  let navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/leads", label: "Leads", icon: "people" },
    { path: "/agendamentos", label: "Agendamentos", icon: "calendar_today" },
    { path: "/calendario", label: "Calendário", icon: "event" },
    { path: "/professores", label: "Professores", icon: "school" },
    { path: "/tarefas", label: "Tarefas", icon: "assignment" },
    { path: "/whatsapp", label: "WhatsApp", icon: "chat" },
    { path: "/favale-ia", label: "FavaleIA", icon: "psychology" },
    { path: "/config", label: "Configurações", icon: "settings" },
  ];
  
  
  const getNavClasses = (path: string) => {
    const isActive = location === path;
    // Using text-primary-foreground for active/hover states on dark sidebar (bg-neutral-dark-gray)
    // Using text-neutral-dark-gray for active/hover states on light sidebar (bg-neutral-white or light-gray)
    const baseClasses = `flex items-center transition-all duration-300 rounded-md my-1 group`;
    const textClasses = `text-sm font-medium ${isActive ? 'text-primary-combinat-red dark:text-secondary-combinat-orange' : 'text-neutral-dark-gray/70 dark:text-neutral-light-gray/70 group-hover:text-neutral-dark-gray dark:group-hover:text-neutral-light-gray'}`;
    const iconClasses = `material-icons text-base transition-all duration-300 ${isActive ? 'text-primary-combinat-red dark:text-secondary-combinat-orange' : 'text-neutral-dark-gray/60 dark:text-neutral-light-gray/60 group-hover:text-neutral-dark-gray/90 dark:group-hover:text-neutral-light-gray/90'}`;
    
    return isActive 
      ? `${baseClasses} bg-primary-combinat-red/10 dark:bg-secondary-combinat-orange/10 ${expanded ? 'px-3 py-2.5 mx-2' : 'justify-center mx-1.5 w-10 h-10'} `
      : `${baseClasses} hover:bg-neutral-dark-gray/5 dark:hover:bg-neutral-light-gray/5 ${expanded ? 'px-3 py-2.5 mx-2' : 'justify-center mx-1.5 w-10 h-10'} `;
  };
  
  return (
    <>
      {/* Mobile/Desktop sidebar */}
      <aside 
        className={`${expanded ? 'w-60' : 'w-[72px]'} bg-neutral-white dark:bg-neutral-dark-gray text-neutral-dark-gray dark:text-neutral-light-gray lg:block flex-shrink-0 fixed lg:relative inset-y-0 left-0 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-all duration-300 ease-in-out z-30 h-full flex flex-col overflow-hidden shadow-md border-r border-neutral-light-gray dark:border-neutral-dark-gray/50`}
      >
        <div className={`p-4 flex items-center ${expanded ? 'justify-start' : 'justify-center'} border-b border-neutral-light-gray dark:border-neutral-dark-gray/50 relative h-16`}>
          {expanded ? (
            <div className="font-heading text-xl font-bold text-primary-combinat-red">
              Combinat
            </div>
          ) : (
            <div className="font-heading text-xl font-bold text-center w-full text-primary-combinat-red">
              C
            </div>
          )}
        </div>
        
        {expanded && (
          <div className="px-4 pt-4 pb-1 text-xs font-semibold text-neutral-dark-gray/50 dark:text-neutral-light-gray/50 uppercase tracking-wider">
            Menu Principal
          </div>
        )}
        
        <nav className="py-2 overflow-y-auto flex-grow px-1">
          <ul className={`space-y-0.5 ${!expanded ? 'flex flex-col items-center' : ''}`}>
            {navItems.map((item) => (
              <li key={item.path} className={!expanded ? 'w-full flex justify-center' : ''}>
                <Link 
                  href={item.path}
                  onClick={() => isMobile && setOpen(false)}
                  className={getNavClasses(item.path)}
                  title={!expanded ? item.label : undefined}
                >
                  <span className={`${expanded ? 'mr-3' : ''} ${getNavClasses(item.path).includes('text-primary-combinat-red') || getNavClasses(item.path).includes('text-secondary-combinat-orange') ? '' : 'text-neutral-dark-gray/60 dark:text-neutral-light-gray/60 group-hover:text-neutral-dark-gray/90 dark:group-hover:text-neutral-light-gray/90'}`}>{item.icon}</span>
                  {expanded && <span className={`${getNavClasses(item.path).includes('text-primary-combinat-red') || getNavClasses(item.path).includes('text-secondary-combinat-orange') ? 'text-primary-combinat-red dark:text-secondary-combinat-orange' : 'text-neutral-dark-gray/80 dark:text-neutral-light-gray/80 group-hover:text-neutral-dark-gray dark:group-hover:text-neutral-light-gray'}`}>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile Section */}
        {user && (
          <div className="mt-auto border-t border-neutral-light-gray dark:border-neutral-dark-gray/50 p-3 sticky bottom-0 bg-neutral-white dark:bg-neutral-dark-gray">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`flex items-center w-full ${expanded ? 'justify-between' : 'justify-center'} text-neutral-dark-gray dark:text-neutral-light-gray hover:bg-neutral-light-gray/50 dark:hover:bg-neutral-dark-gray/50 rounded-md p-2 transition-all duration-200 group`}
                  title={!expanded ? "Perfil de usuário" : undefined}
                >
                  <div className="flex items-center">
                    <Avatar className={`${expanded ? 'h-8 w-8' : 'h-9 w-9'} bg-primary-combinat-red text-neutral-white transition-all duration-200`}>
                      <AvatarFallback className="text-sm font-medium">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {expanded && (
                      <div className="ml-3 flex flex-col items-start">
                        <span className="text-sm font-medium">{user.username}</span>
                        <span className="text-xs text-neutral-dark-gray/60 dark:text-neutral-light-gray/60">{user.role === 'admin' ? 'Admin' : 'Usuário'}</span>
                      </div>
                    )}
                  </div>
                  {expanded && (
                    <span className="material-icons text-sm text-neutral-dark-gray/50 dark:text-neutral-light-gray/50 group-hover:text-neutral-dark-gray dark:group-hover:text-neutral-light-gray transition-all">expand_more</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={5} className="w-56 bg-popover text-popover-foreground border-border animate-in slide-in-from-bottom-5 duration-200">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <Link href="/config" onClick={() => isMobile && setOpen(false)}>
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted focus:bg-muted">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Perfil e Configurações</span>
                  </DropdownMenuItem>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/config" onClick={() => { // Assuming security settings are part of general config or a dedicated page
                    isMobile && setOpen(false);
                  }}>
                    <DropdownMenuItem className="cursor-pointer hover:bg-muted focus:bg-muted">
                      <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Segurança</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator className="bg-border"/>
                <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-sm">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
      
      {/* Background overlay for mobile sidebar */}
      {open && isMobile && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
