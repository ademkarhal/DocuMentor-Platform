import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import Dashboard from "@/pages/Dashboard";
import CourseDetail from "@/pages/CourseDetail";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useStore } from "@/hooks/use-store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:slug" component={CourseDetail} />
      <Route path="/categories/:slug">
        {(params) => <Courses categorySlug={params.slug} />} 
      </Route> 
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { theme, sidebarOpen } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen w-full bg-background overflow-hidden">
          <Sidebar className={cn(
            "hidden lg:flex shrink-0 transition-all duration-300",
            sidebarOpen ? "w-72" : "w-16"
          )} />
          
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
