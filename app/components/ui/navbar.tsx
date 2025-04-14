import { Link, useLocation } from "react-router-dom";
import { Bookmark, Home, Search, BarChart2, TrendingUp } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  
  // Check if route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="border-b bg-background sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl text-primary">CutoffIQ</Link>
          </div>
          
          <div className="flex space-x-1">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            
            <Link 
              to="/find-colleges" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                isActive('/find-colleges') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Find Colleges</span>
            </Link>
            
            <Link 
              to="/bookmarked-colleges" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                isActive('/bookmarked-colleges') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Bookmarks</span>
            </Link>
            
            <Link 
              to="/compare" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                isActive('/compare') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </Link>
            
            <Link 
              to="/trends" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                isActive('/trends') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 