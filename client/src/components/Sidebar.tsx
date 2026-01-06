import { Link, useLocation } from "wouter";
import { Compass, Home, MonitorPlay, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useCategories } from "@/hooks/use-api";
import logoLight from "@assets/generated_images/technotrade_academy_corporate_logo.png";
import logoDark from "@assets/generated_images/technotrade_academy_white_logo.png";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { t, getLocalized, lang } = useTranslation();
  const { theme } = useStore();
  const { data: categories } = useCategories();
  
  const logoImage = theme === 'dark' ? logoDark : logoLight;

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
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src={logoImage} alt="Technotrade Academy" className="w-full max-w-[140px] h-auto" />
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
            {lang === 'tr' ? 'M' : 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{lang === 'tr' ? 'Misafir Kullanıcı' : 'Guest User'}</p>
            <p className="text-xs text-muted-foreground truncate">{lang === 'tr' ? 'Genel Erişim' : 'Public Access'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
