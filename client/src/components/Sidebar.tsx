import { Link, useLocation } from "wouter";
import { Compass, Home, ChevronRight, Monitor, Code, Users, Settings, Smartphone, Lock, ChevronLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useCategories } from "@/hooks/use-api";
import logoImage from "@assets/generated_images/technotrade_academy_corporate_logo.png";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, any> = {
  monitor: Monitor,
  code: Code,
  users: Users,
  settings: Settings,
  smartphone: Smartphone,
};

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { t, getLocalized, lang } = useTranslation();
  const { data: categories } = useCategories();
  const { sidebarOpen, toggleSidebar, isAuthenticated, logout } = useStore();

  const isActive = (path: string) => location === path;
  
  const NavItem = ({ href, icon: Icon, label, active }: any) => (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
      active 
        ? "bg-primary/10 text-primary shadow-sm" 
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}>
      <Icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
    </Link>
  );

  if (!sidebarOpen) {
    return (
      <div className={cn("flex flex-col h-full w-16 bg-card border-r border-border", className)}>
        <div className="p-2 flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mb-4"
            data-testid="button-sidebar-expand"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <img 
            src={logoImage} 
            alt="Technotrade Academy" 
            className="w-10 h-10 object-contain mix-blend-multiply dark:mix-blend-screen dark:[filter:invert(1)_brightness(1.5)]" 
          />
        </div>
        <nav className="flex-1 flex flex-col items-center gap-2 p-2 mt-4">
          <Link href="/" className={cn("p-2 rounded-lg", isActive("/") ? "bg-primary/10" : "hover:bg-muted/50")} data-testid="link-home-collapsed">
            <Home className={cn("w-5 h-5", isActive("/") ? "text-primary" : "text-muted-foreground")} />
          </Link>
          <Link href="/courses" className={cn("p-2 rounded-lg", isActive("/courses") ? "bg-primary/10" : "hover:bg-muted/50")} data-testid="link-courses-collapsed">
            <Compass className={cn("w-5 h-5", isActive("/courses") ? "text-primary" : "text-muted-foreground")} />
          </Link>
        </nav>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            data-testid="button-sidebar-collapse"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2 mb-8">
          <img 
            src={logoImage} 
            alt="Technotrade Academy" 
            className="w-full max-w-[140px] h-auto mix-blend-multiply dark:mix-blend-screen dark:[filter:invert(1)_brightness(1.5)]" 
          />
          <span className="font-display font-bold text-sm tracking-tight text-center text-slate-700 dark:text-slate-300">
            {lang === 'tr' ? 'Technotrade Akademi' : 'Technotrade Academy'}
          </span>
        </div>

        <nav className="space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.explore}</p>
            <NavItem href="/" icon={Home} label={t.home} active={isActive("/")} />
            <NavItem href="/courses" icon={Compass} label={t.courses} active={isActive("/courses")} />
          </div>

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.categories}</p>
            {categories?.filter(cat => !cat.parentId).map((parentCat) => {
              const childCategories = categories?.filter(c => c.parentId === parentCat.id) || [];
              const ParentIcon = iconMap[parentCat.icon] || Monitor;
              
              return (
                <div key={parentCat.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <ParentIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {getLocalized(parentCat.title as { en: string; tr: string })}
                    </span>
                  </div>
                  <div className="space-y-0.5 ml-2">
                    {childCategories.map((childCat) => {
                      const ChildIcon = iconMap[childCat.icon] || Code;
                      const active = isActive(`/categories/${childCat.slug}`);
                      const isProtected = (childCat as any).protected && !isAuthenticated;
                      const categoryTitle = getLocalized(childCat.title as { en: string; tr: string });
                      
                      return (
                        <Tooltip key={childCat.id}>
                          <TooltipTrigger asChild>
                            <Link 
                              href={`/categories/${childCat.slug}`} 
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                active
                                  ? "bg-primary/10 text-primary shadow-sm font-medium" 
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <ChildIcon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                              <span className="flex-1 truncate">{categoryTitle}</span>
                              {isProtected && <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
                              {active && <ChevronRight className="w-4 h-4 shrink-0 text-primary" />}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {categoryTitle}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-md">
            {isAuthenticated ? 'A' : (lang === 'tr' ? 'M' : 'G')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {isAuthenticated ? 'Admin' : (lang === 'tr' ? 'Misafir Kullanıcı' : 'Guest User')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isAuthenticated 
                ? (lang === 'tr' ? 'Tam Erişim' : 'Full Access')
                : (lang === 'tr' ? 'Genel Erişim' : 'Public Access')}
            </p>
          </div>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
