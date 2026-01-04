import { Link, useLocation } from "wouter";
import { BookOpen, Compass, FileText, Home, MonitorPlay, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useCategories } from "@/hooks/use-api";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { t, getLocalized } = useTranslation();
  const { data: categories } = useCategories();

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

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">EduPlatform</span>
        </div>

        <nav className="space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.explore}</p>
            <NavItem href="/" icon={Home} label={t.home} active={isActive("/")} />
            <NavItem href="/courses" icon={Compass} label={t.courses} active={isActive("/courses")} />
          </div>

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.categories}</p>
            {categories?.map((cat) => (
              <NavItem 
                key={cat.id} 
                href={`/categories/${cat.slug}`} 
                icon={MonitorPlay} // In real app, parse cat.icon string to component or use dynamic icon
                label={getLocalized(cat.title)} 
                active={isActive(`/categories/${cat.slug}`)} 
              />
            ))}
          </div>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-md">
            G
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Guest User</p>
            <p className="text-xs text-muted-foreground truncate">Public Access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
