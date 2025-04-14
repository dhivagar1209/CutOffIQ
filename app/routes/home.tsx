import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Search, School, BookOpen, BookmarkCheck, TrendingUp, Filter } from "lucide-react";

export function meta() {
  return [
    { title: "CutoffIQ - Anna University College Explorer" },
    { name: "description", content: "Find the best colleges based on your expected marks for Anna University counselling" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div className="bg-primary text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Find Your Perfect Engineering College
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Explore Anna University affiliated colleges based on your expected cutoff marks, compare options, and make informed decisions for your future.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/find-colleges">
                    <Search className="mr-2 h-5 w-5" />
                    Find Colleges by Marks
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-primary-foreground" asChild>
                  <Link to="/bookmarked-colleges">
                    <BookmarkCheck className="mr-2 h-5 w-5" />
                    View Bookmarked Colleges
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card">
              <CardHeader>
                <Filter className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Filter by Cutoff Marks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enter your expected marks and category to find colleges you're eligible for based on previous year cutoffs.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/find-colleges">Try It Now</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-card">
              <CardHeader>
                <TrendingUp className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Analyze Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View historical cutoff trends to identify colleges with rising or falling demand across different courses.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/find-colleges">Explore Trends</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-card">
              <CardHeader>
                <BookmarkCheck className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Save & Compare</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bookmark colleges you're interested in, export your selections, and compare them side by side.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/bookmarked-colleges">View Bookmarks</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Filters Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Quick College Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Browse by College Type</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?collegeType=Government">Government</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?collegeType=Government%20Aided">Government Aided</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?collegeType=Private">Private</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?collegeType=Autonomous">Autonomous</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Browse by Popular Courses</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?course=COMPUTER%20SCIENCE%20AND%20ENGINEERING">CSE</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?course=INFORMATION%20TECHNOLOGY">IT</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?course=ELECTRONICS%20AND%20COMMUNICATION%20ENGINEERING">ECE</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/find-colleges?course=MECHANICAL%20ENGINEERING">Mechanical</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cutoff Range Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Find by Mark Range</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
              <Link to="/find-colleges?mark=190-200">
                <span className="text-2xl font-bold mb-1">190-200</span>
                <span className="text-xs text-muted-foreground">Top Tier</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
              <Link to="/find-colleges?mark=180-190">
                <span className="text-2xl font-bold mb-1">180-190</span>
                <span className="text-xs text-muted-foreground">Premier</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
              <Link to="/find-colleges?mark=170-180">
                <span className="text-2xl font-bold mb-1">170-180</span>
                <span className="text-xs text-muted-foreground">Excellent</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
              <Link to="/find-colleges?mark=150-170">
                <span className="text-2xl font-bold mb-1">150-170</span>
                <span className="text-xs text-muted-foreground">Very Good</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col" asChild>
              <Link to="/find-colleges?mark=100-150">
                <span className="text-2xl font-bold mb-1">100-150</span>
                <span className="text-xs text-muted-foreground">Good</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your dream college?</h2>
          <p className="text-xl mb-8 max-w-xl mx-auto opacity-90">
            Start exploring colleges based on your expected marks and make your engineering journey successful.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/find-colleges">
              <Search className="mr-2 h-5 w-5" />
              Get Started Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2025 CutoffIQ - Anna University College Explorer. All cutoff data sourced from Anna University.</p>
        </div>
      </footer>
    </div>
  );
}
