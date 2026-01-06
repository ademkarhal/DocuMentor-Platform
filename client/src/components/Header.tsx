import { Search, Globe, Moon, Sun, Monitor, MonitorPlay, RefreshCw } from "lucide-react";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useState, useEffect } from "react";
import { useSearch, clearApiCache } from "@/hooks/use-api";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

export function Header() {
  const { t, lang, getLocalized } = useTranslation();
  const { setLanguage, toggleTheme, theme } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: searchResults } = useSearch(debouncedQuery);
  const [showResults, setShowResults] = useState(false);
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      clearApiCache();
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSelect = (url: string) => {
    setShowResults(false);
    setSearchQuery("");
    setLocation(url);
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between gap-4">
      <div className="flex-1 max-w-xl relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:outline-none transition-all placeholder:text-muted-foreground text-sm"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery.length >= 2 && searchResults && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowResults(false)}
            />
            <div className="absolute top-full mt-2 w-full bg-popover rounded-xl border border-border shadow-xl shadow-black/5 overflow-hidden z-50">
              {searchResults.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">{t.noResults}</div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto py-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSearchSelect(result.url)}
                      className={cn(
                        "w-full text-left hover:bg-muted/50 transition-colors flex items-start gap-3 group",
                        result.type === 'course' ? "px-4 py-3" : "pl-10 pr-4 py-2"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 rounded-lg flex items-center justify-center shrink-0",
                        result.type === 'course' 
                          ? "w-8 h-8 bg-primary/10 text-primary" 
                          : "w-6 h-6 bg-muted text-muted-foreground"
                      )}>
                        {result.type === 'course' ? <Monitor className="w-4 h-4" /> : <MonitorPlay className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "group-hover:text-primary transition-colors line-clamp-1",
                          result.type === 'course' ? "font-semibold text-sm" : "text-sm"
                        )}>
                          {getLocalized(result.title)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.type === 'course' 
                            ? (lang === 'tr' ? 'Kurs' : 'Course')
                            : (lang === 'tr' ? 'Video Dersi' : 'Video Lesson')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={handleRefreshData}
          disabled={isRefreshing}
          className={cn(
            "p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
            isRefreshing && "animate-spin"
          )}
          title={lang === 'tr' ? 'Verileri Yenile' : 'Refresh Data'}
          data-testid="button-refresh-data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setLanguage(lang === 'en' ? 'tr' : 'en')}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
          title={t.language}
          data-testid="button-language"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase">{lang}</span>
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={t.theme}
          data-testid="button-theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
