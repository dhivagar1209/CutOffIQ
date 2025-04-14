import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bookmark, Search, BarChart2, TrendingUp } from "lucide-react";
import { CachedDataProvider, useCachedData } from "./find-colleges";
import type { Course as CourseType } from "../services/cutoffService";

export default function HomePage() {
  const { courses, isLoading } = useCachedData();
  const navigate = useNavigate();
  const [expectedMark, setExpectedMark] = React.useState("");
  const [selectedCourse, setSelectedCourse] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("OC");

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (expectedMark) {
      params.append("mark", expectedMark);
    }
    
    if (selectedCourse) {
      // Find the course name using the selected code
      const selectedCourseObj = courses.find((course) => course.code === selectedCourse);
      if (selectedCourseObj) {
        params.append("course", selectedCourseObj.name);
      }
    }
    
    if (selectedCategory) {
      params.append("category", selectedCategory);
    }
    
    navigate(`/find-colleges?${params.toString()}`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              CutoffIQ
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Make informed Anna University college decisions with cutoff analytics from 2022-2024
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                <Link to="/find-colleges">Find Colleges</Link>
              </Button>
              <Button size="lg" asChild  className="bg-white text-primary hover:bg-white/90">
                <Link to="/compare">Compare Cutoffs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-card shadow-lg rounded-lg p-6 -mt-20 relative z-10 border">
            <h2 className="text-2xl font-semibold mb-6 text-center">Find Colleges by Expected Mark</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Mark</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="190-200"
                  value={expectedMark}
                  onChange={(e) => setExpectedMark(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Any Course</option>
                  {!isLoading && courses.map((course: CourseType) => (
                    <option key={course.code} value={course.code}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="OC">OC</option>
                  <option value="BC">BC</option>
                  <option value="MBC">MBC</option>
                  <option value="SC">SC</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Explore Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-12">
            <Link
              to="/find-colleges"
              className="flex flex-col items-center gap-3 p-4 bg-card text-card-foreground hover:bg-accent rounded-lg border border-border transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Find Colleges</h3>
                <p className="text-sm text-muted-foreground">Search by cutoff marks</p>
              </div>
            </Link>
            
            <Link
              to="/compare"
              className="flex flex-col items-center gap-3 p-4 bg-card text-card-foreground hover:bg-accent rounded-lg border border-border transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Compare Colleges</h3>
                <p className="text-sm text-muted-foreground">Side-by-side comparison</p>
              </div>
            </Link>
            
            <Link
              to="/bookmarked-colleges"
              className="flex flex-col items-center gap-3 p-4 bg-card text-card-foreground hover:bg-accent rounded-lg border border-border transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Bookmarked Colleges</h3>
                <p className="text-sm text-muted-foreground">View your saved colleges</p>
              </div>
            </Link>
            
            <Link
              to="/trends"
              className="flex flex-col items-center gap-3 p-4 bg-card text-card-foreground hover:bg-accent rounded-lg border border-border transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Cutoff Trends</h3>
                <p className="text-sm text-muted-foreground">Historical data analysis</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Anna University By Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Engineering Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">60+</div>
              <div className="text-muted-foreground">Courses Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">3</div>
              <div className="text-muted-foreground">Years of Cutoff Data</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Annual Admissions</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Helps Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-card border rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">How CutoffIQ Helps You</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">For Students</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Find colleges that match your expected marks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Compare colleges based on cutoff trends</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Discover the popularity and demand for specific courses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Make informed decisions about your engineering future</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">For Parents</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Understand the competitive landscape of college admissions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Explore colleges by location and reputation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Help your children make practical college choices</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Plan ahead for education expenses based on likely admissions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Perfect College?</h2>
          <p className="mb-8 text-lg max-w-2xl mx-auto">
            Use our tools to navigate the Anna University 2025 admissions with confidence
          </p>
          <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/find-colleges">Get Started Now</Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-card border-t text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p className="mb-2">© 2025 CutoffIQ - Anna University College Explorer. All cutoff data sourced from Anna University.</p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <p>Developed by Dhivagar K.V.</p>
            <a 
              href="https://github.com/dhivagar1209" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://github.com/dhivagar1209/CutOffIQ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Repository
            </a>
            <a 
              href="https://www.linkedin.com/in/dhivagar-k-v-733477289/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
} 