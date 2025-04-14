import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Search, BookmarkCheck, Home, Menu, X, Github } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const routes = [
    { path: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
    { path: "/find-colleges", label: "Find Colleges", icon: <Search className="h-4 w-4 mr-2" /> },
    { path: "/bookmarked-colleges", label: "Bookmarked", icon: <BookmarkCheck className="h-4 w-4 mr-2" /> }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="flex mr-4 font-bold text-xl">
          <Link to="/" className="flex items-center text-primary">
            CutoffIQ
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-2">
            {routes.map((route) => (
              <Button
                key={route.path}
                variant={isActive(route.path) ? "default" : "ghost"}
                asChild
              >
                <Link to={route.path} className="flex items-center">
                  {route.icon}
                  {route.label}
                </Link>
              </Button>
            ))}
          </div>
          
          {/* Developer Credit */}
          <div className="flex items-center">
            <a 
              href="https://github.com/dhivagar1209/CutOffIQ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center"
            >
              <Github className="h-3 w-3 mr-1" />
              <span className="hidden lg:inline-block">Developed by Dhivagar K.V.</span>
              <span className="lg:hidden">By Dhivagar</span>
            </a>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden flex-1 justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col space-y-2 p-4 border-t">
            {routes.map((route) => (
              <Button
                key={route.path}
                variant={isActive(route.path) ? "default" : "ghost"}
                className="justify-start"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={route.path} className="flex items-center">
                  {route.icon}
                  {route.label}
                </Link>
              </Button>
            ))}
            
            {/* Developer Credit in Mobile Menu */}
            <a 
              href="https://github.com/dhivagar1209/CutOffIQ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center p-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Github className="h-4 w-4 mr-2" />
              Developed by Dhivagar K.V.
            </a>
          </div>
        </div>
      )}
    </header>
  );
} 