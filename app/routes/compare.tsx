import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Search, ArrowUpDown, X, TrendingUp, Check } from "lucide-react";
import { 
  fetchCutoffData, 
  getAllColleges, 
  getAllCourses, 
  compareColleges,
  getCategoryMark
} from "../services/cutoffService";
import type { College, Course, CutoffData } from "../services/cutoffService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Extended college type for our comparison view
interface ExtendedCollege extends College {
  type: string;
  courses?: {
    name: string;
    code: string;
  }[];
}

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const collegeIds = searchParams.get('colleges')?.split(',').map(Number) || [];
  
  const [loading, setLoading] = React.useState(true);
  const [selectedColleges, setSelectedColleges] = React.useState<ExtendedCollege[]>([]);
  const [availableColleges, setAvailableColleges] = React.useState<College[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState("OC");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [cutoffData, setCutoffData] = React.useState<Record<number, Record<string, number | undefined>>>({});
  const [error, setError] = React.useState<string | null>(null);
  
  // Load initial data - colleges and courses
  React.useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Fetch colleges and courses
        const [collegesData, coursesData] = await Promise.all([
          getAllColleges("2024"),
          getAllCourses("2024")
        ]);
        
        setAvailableColleges(collegesData);
        setCourses(coursesData);
        
        // Set default selected course if available
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].name);
        }
        
        if (collegeIds.length > 0) {
          await loadSelectedColleges(collegeIds);
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to load college data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, []);
  
  // Load college data when IDs change
  React.useEffect(() => {
    if (collegeIds.length > 0) {
      loadSelectedColleges(collegeIds);
    }
  }, [collegeIds]);
  
  // Load detailed information for selected colleges
  async function loadSelectedColleges(ids: number[]) {
    try {
      setLoading(true);
      
      // Get all colleges data
      const allColleges = await getAllColleges("2024");
      
      // Filter to get just the selected colleges
      const selected = allColleges.filter(college => ids.includes(college.id));
      
      // Get college types by checking the college name/description text
      const enhancedColleges: ExtendedCollege[] = selected.map(college => {
        const collegeName = college.name.toLowerCase();
        
        let type = "Private"; // Default type
        if (collegeName.includes("government") && collegeName.includes("aided")) {
          type = "Government Aided";
        } else if (collegeName.includes("government") || collegeName.includes("govt")) {
          type = "Government";
        } else if (collegeName.includes("autonomous")) {
          type = "Autonomous";
        }
        
        return {
          ...college,
          type
        };
      });
      
      setSelectedColleges(enhancedColleges);
    } catch (err) {
      console.error("Error loading selected colleges:", err);
      setError("Failed to load selected college data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }
  
  // Get the best common courses among selected colleges - optimize with better caching and promise handling
  const getCommonCourses = React.useMemo(() => {
    if (selectedColleges.length === 0 || courses.length === 0) return [];
    
    // If only one college is selected, just sort alphabetically (fast path)
    if (selectedColleges.length === 1) {
      return [...courses].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // For multiple colleges, return college IDs to be used for data fetching
    return selectedColleges.map(college => college.id);
  }, [selectedColleges.length, courses.length]); // Simplified dependencies 
  
  // Track loading state for courses
  const [coursesLoading, setCoursesLoading] = React.useState(false);
  const [commonCoursesResult, setCommonCoursesResult] = React.useState<Course[]>([]);
  
  // Effect to handle data fetching - with performance optimizations
  React.useEffect(() => {
    if (!Array.isArray(getCommonCourses) || getCommonCourses.length === 0) {
      setCommonCoursesResult([]);
      return;
    }
    
    // If we only have a single college, use simple approach
    if (selectedColleges.length === 1) {
      // No need to refetch/reprocess if already done
      if (commonCoursesResult.length === 0) {
        setCommonCoursesResult([...courses].sort((a, b) => a.name.localeCompare(b.name)));
      }
      return;
    }
    
    // Performance optimization: Only fetch if we have a new set of colleges
    const collegeIdsString = getCommonCourses.join('_');
    const prevCollegeIdsRef = React.useRef('');
    
    if (prevCollegeIdsRef.current === collegeIdsString) {
      return; // Skip if same colleges
    }
    
    setCoursesLoading(true);
    prevCollegeIdsRef.current = collegeIdsString;
    
    // We need to fetch data only once instead of for each college
    fetchCutoffData("2024")
      .then(data => {
        // Create sets of course codes for each college
        const collegeCourseSets = getCommonCourses.map(collegeId => {
          const collegeData = data.filter(item => item.coc === collegeId);
          return new Set(collegeData.map(item => item.brc));
        });
        
        // Only keep courses that appear in all colleges (using Set operations)
        let commonCourseCodes: Set<string>;
        
        // Optimize set operations for better performance
        if (collegeCourseSets.length > 0) {
          // Start with the first set
          commonCourseCodes = new Set(collegeCourseSets[0]);
          
          // Intersect with other sets
          for (let i = 1; i < collegeCourseSets.length; i++) {
            const currentSet = collegeCourseSets[i];
            commonCourseCodes = new Set(
              [...commonCourseCodes].filter(code => currentSet.has(code))
            );
          }
        } else {
          commonCourseCodes = new Set();
        }
        
        // Filter and sort the common courses
        const result = courses
          .filter(course => commonCourseCodes.has(course.code))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setCommonCoursesResult(result);
        
        // Update selected course if needed
        if (result.length > 0 && (!selectedCourse || 
            !result.some(c => c.name.toUpperCase() === selectedCourse.toUpperCase()))) {
          setSelectedCourse(result[0].name);
        }
      })
      .catch(err => {
        console.error("Error finding common courses:", err);
        setCommonCoursesResult([]);
      })
      .finally(() => {
        setCoursesLoading(false);
      });
  }, [getCommonCourses, selectedColleges.length, courses]);
  
  // Optimize cutoff data fetching - using refs to prevent unnecessary fetches
  const previousFetchParamsRef = React.useRef('');
  
  React.useEffect(() => {
    if (selectedColleges.length === 0 || !selectedCourse || !selectedCategory) return;
    
    const fetchParams = `${selectedColleges.map(c => c.id).join('_')}_${selectedCourse}_${selectedCategory}`;
    
    // Skip if we've already fetched this exact data combination
    if (previousFetchParamsRef.current === fetchParams && Object.keys(cutoffData).length > 0) {
      return;
    }
    
    previousFetchParamsRef.current = fetchParams;
    
    // Only fetch if we couldn't use cache
    updateCutoffData();
  }, [selectedColleges, selectedCourse, selectedCategory]);

  // Update cutoff data based on current selection - optimized for performance
  async function updateCutoffData(colleges = selectedColleges) {
    if (colleges.length === 0 || !selectedCourse || !selectedCategory) return;
    
    try {
      setLoading(true);
      
      // Find course code for selected course
      const courseObj = courses.find(c => c.name.toUpperCase() === selectedCourse.toUpperCase());
      
      if (!courseObj) {
        console.error("Selected course not found:", selectedCourse);
        return;
      }
      
      // Get cutoff data for all selected colleges and this course
      const cutoffs = await compareColleges(
        colleges.map(college => college.id),
        courseObj.code,
        selectedCategory,
        ["2022", "2023", "2024"]
      );
      
      setCutoffData(cutoffs);
    } catch (err) {
      console.error("Error updating cutoff data:", err);
      setError("Failed to load cutoff data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }
  
  // Handle adding a college to comparison
  const handleAddCollege = (collegeId: number) => {
    if (selectedColleges.length >= 4) return; // Maximum 4 colleges
    
    if (selectedColleges.some(c => c.id === collegeId)) return; // Already added
    
    const college = availableColleges.find(c => c.id === collegeId);
    if (!college) return;
    
    // Get college type
    const collegeName = college.name.toLowerCase();
    let type = "Private"; // Default type
    
    if (collegeName.includes("government") && collegeName.includes("aided")) {
      type = "Government Aided";
    } else if (collegeName.includes("government") || collegeName.includes("govt")) {
      type = "Government";
    } else if (collegeName.includes("autonomous")) {
      type = "Autonomous";
    }
    
    const enhancedCollege: ExtendedCollege = {
      ...college,
      type
    };
    
    setSelectedColleges(prev => [...prev, enhancedCollege]);
    setSearchTerm("");
    
    // Update cutoff data to include the new college
    updateCutoffData([...selectedColleges, enhancedCollege]);
  };
  
  // Handle removing a college from comparison
  const handleRemoveCollege = (collegeId: number) => {
    setSelectedColleges(prev => prev.filter(college => college.id !== collegeId));
  };
  
  // Filter colleges based on search term
  const filteredColleges = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return availableColleges.filter(college => 
      college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableColleges, searchTerm]);
  
  // Get cutoff mark for a specific college and year
  const getCollegeYearData = (collegeId: number, year: string) => {
    const value = cutoffData[collegeId]?.[year];
    // Return numeric value with one decimal place if available
    return value !== undefined ? Number(value).toFixed(1) : 'N/A';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Compare Colleges</h1>
            <p className="text-lg opacity-90">
              Compare cutoff trends of Anna University colleges side-by-side
            </p>
          </div>
        </div>
      </section>

      {/* Compare Controls */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-lg border p-6 -mt-20 relative z-10 shadow-md">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="space-y-2 flex-1">
                <label htmlFor="courseSelect" className="text-sm font-medium">Select Course</label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                  disabled={loading || coursesLoading || selectedColleges.length === 0 || commonCoursesResult.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {commonCoursesResult.map(course => (
                      <SelectItem key={course.code} value={course.name}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex-1">
                <label htmlFor="categorySelect" className="text-sm font-medium">Select Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={loading || selectedColleges.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OC">OC</SelectItem>
                    <SelectItem value="BC">BC</SelectItem>
                    <SelectItem value="MBC">MBC</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Selected Colleges Display */}
            {selectedColleges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedColleges.map(college => (
                  <div 
                    key={college.id} 
                    className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    <span className="truncate max-w-[200px]">{college.name.split(',')[0]}</span>
                    <button 
                      onClick={() => handleRemoveCollege(college.id)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                      title="Remove from comparison"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* College Search and Add */}
            <div className="mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between items-center">
                  <span>Add College to Compare ({selectedColleges.length}/4)</span>
                  {selectedColleges.length >= 4 && (
                    <span className="text-xs text-muted-foreground">Maximum 4 colleges</span>
                  )}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search colleges by name or location..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    disabled={loading || selectedColleges.length >= 4}
                  />
                </div>
                
                {searchTerm && (
                  <div className="mt-1 border rounded-md overflow-hidden max-h-60 overflow-y-auto bg-background shadow-md">
                    {filteredColleges.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">No colleges found</div>
                    ) : (
                      filteredColleges
                        .filter(college => !selectedColleges.some(c => c.id === college.id))
                        .slice(0, 6)
                        .map(college => (
                          <button
                            key={college.id}
                            className="w-full text-left px-3 py-2 hover:bg-muted flex justify-between items-center transition-colors"
                            onClick={() => handleAddCollege(college.id)}
                            disabled={selectedColleges.length >= 4}
                          >
                            <div>
                              <div>{college.name}</div>
                              <div className="text-xs text-muted-foreground">{college.location}</div>
                            </div>
                            <div className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                              Add
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {selectedColleges.length === 0 && !loading && (
              <div className="mt-6 p-4 bg-muted/50 rounded-md text-center">
                <p className="text-muted-foreground">Select colleges to compare cutoff trends</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  asChild
                >
                  <Link to="/find-colleges">Browse Colleges</Link>
                </Button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading college data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          {selectedColleges.length > 0 && (
            <section className="py-12">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-semibold mb-8">
                  College Comparison - {selectedCourse} ({selectedCategory})
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-4 bg-muted font-medium">College</th>
                        {selectedColleges.map(college => (
                          <th key={college.id} className="p-4 bg-muted font-medium min-w-[200px]">
                            <div className="flex justify-between items-center">
                              <span>{college.name.split(',')[0]}</span>
                              <button 
                                onClick={() => handleRemoveCollege(college.id)}
                                className="text-muted-foreground hover:text-destructive ml-2"
                                title="Remove from comparison"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-4 font-medium">Location</td>
                        {selectedColleges.map(college => (
                          <td key={college.id} className="border p-4">{college.location}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-4 font-medium">Type</td>
                        {selectedColleges.map(college => (
                          <td key={college.id} className="border p-4">{college.type}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-4 font-medium">2022 Cutoff</td>
                        {selectedColleges.map(college => (
                          <td key={college.id} className="border p-4 font-bold">
                            {getCollegeYearData(college.id, "2022")}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-4 font-medium">2023 Cutoff</td>
                        {selectedColleges.map(college => (
                          <td key={college.id} className="border p-4 font-bold">
                            {getCollegeYearData(college.id, "2023")}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-4 font-medium">2024 Cutoff</td>
                        {selectedColleges.map(college => (
                          <td key={college.id} className="border p-4 font-bold">
                            {getCollegeYearData(college.id, "2024")}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border p-4 font-medium">3-Year Trend</td>
                        {selectedColleges.map(college => {
                          const data2022 = getCollegeYearData(college.id, "2022");
                          const data2024 = getCollegeYearData(college.id, "2024");
                          
                          // Calculate trend only if both values are available and are numbers
                          const trend = (typeof data2022 === 'number' && typeof data2024 === 'number')
                            ? ((data2024 - data2022) / data2022 * 100).toFixed(2)
                            : 'N/A';
                          
                          const trendValue = trend !== 'N/A' ? parseFloat(trend) : 0;
                          const trendClass = trendValue > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : trendValue < 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : '';
                          
                          return (
                            <td key={college.id} className={`border p-4 font-bold ${trendClass}`}>
                              {trend !== 'N/A' ? `${trend}%` : trend}
                              {trend !== 'N/A' && (
                                <span className="ml-1">
                                  {trendValue > 0 ? '↑' : trendValue < 0 ? '↓' : '→'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button asChild>
                    <Link to={`/trends?colleges=${selectedColleges.map(c => c.id).join(',')}&course=${selectedCourse}&category=${selectedCategory}`}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Detailed Trends
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    Export Comparison
                  </Button>
                </div>
              </div>
            </section>
          )}
          
          {/* Popular Comparisons - Based on actual college data */}
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6">Popular Comparisons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Chennai Colleges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Compare the best engineering colleges in Chennai</p>
                    <ul className="space-y-2">
                      <li>• Anna University, Chennai</li>
                      <li>• College of Engineering, Guindy</li>
                      <li>• SSN College of Engineering</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/compare?colleges=1,2,3">Compare These</Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top CS Programs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Compare top Computer Science programs</p>
                    <ul className="space-y-2">
                      <li>• Anna University, Chennai</li>
                      <li>• PSG College of Technology</li>
                      <li>• VIT University</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/compare?colleges=1,4,5">Compare These</Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Government vs Private</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Compare government and private institutions</p>
                    <ul className="space-y-2">
                      <li>• Anna University, Chennai</li>
                      <li>• PSG College of Technology</li>
                      <li>• SSN College of Engineering</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/compare?colleges=1,4,3">Compare These</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="py-8 bg-card border-t text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2025 CutoffIQ - Anna University College Explorer. All cutoff data sourced from Anna University.</p>
        </div>
      </footer>
    </div>
  );
} 