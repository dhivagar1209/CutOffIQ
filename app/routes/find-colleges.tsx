import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { 
  fetchCutoffData, 
  filterCutoffData, 
  getAllColleges, 
  getAllCourses,
  compareColleges,
  extractDistricts
} from "../services/cutoffService";
import { 
  isBookmarked, 
  toggleBookmark 
} from "../services/bookmarkService";
import type { 
  CutoffData, 
  College as CollegeType,
  Course as CourseType 
} from "../services/cutoffService";
import type { DisplayCollege } from "../types/college";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Check, ChevronsUpDown, Bookmark, BookmarkX, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";

// Create a cached data context
interface CachedDataContextType {
  colleges: CollegeType[];
  courses: CourseType[];
  districts: string[];
  collegeTypes: string[];
  isLoading: boolean;
  error: string | null;
}

const CachedDataContext = React.createContext<CachedDataContextType>({
  colleges: [],
  courses: [],
  districts: [],
  collegeTypes: [],
  isLoading: true,
  error: null
});

// Provider component to load and cache data
export function CachedDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<CachedDataContextType>({
    colleges: [],
    courses: [],
    districts: [],
    collegeTypes: [],
    isLoading: true,
    error: null
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading data from cache provider...");
        // Fetch colleges and courses
        const colleges = await getAllColleges("2024");
        const courses = await getAllCourses("2024");
        
        // Sort courses alphabetically by name
        const sortedCourses = [...courses].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        // Fetch districts using the improved extraction method
        const districts = await extractDistricts("2024");
        
        // Sort districts alphabetically
        const sortedDistricts = [...districts].sort((a, b) => 
          a.localeCompare(b)
        );
        
        console.log("Data loaded:", { 
          colleges: colleges.length, 
          courses: sortedCourses.length,
          districts: sortedDistricts.length
        });
        
        // For demonstration, we're using hard-coded college types
        // In a real app, this would be extracted from data
        const collegeTypes = ["Government", "Government Aided", "Private", "Autonomous"];
        
        setData({
          colleges,
          courses: sortedCourses,
          districts: sortedDistricts,
          collegeTypes,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error("Error loading cached data:", error);
        setData(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load data"
        }));
      }
    };
    
    loadData();
  }, []);
  
  return (
    <CachedDataContext.Provider value={data}>
      {children}
    </CachedDataContext.Provider>
  );
}

// Custom hook to use the cached data
export const useCachedData = () => {
  const context = React.useContext(CachedDataContext);
  if (!context) {
    throw new Error("useCachedData must be used within a CachedDataProvider");
  }
  return context;
}

export default function FindCollegesPage() {
  const { colleges, courses, districts, collegeTypes, isLoading: isCacheLoading, error: cacheError } = useCachedData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [displayColleges, setDisplayColleges] = React.useState<DisplayCollege[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalColleges, setTotalColleges] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const pageSize = 20;
  
  // Add a new state for sorting
  const [sortOption, setSortOption] = React.useState<string>("cutoff");
  
  // Add debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Modify the filters state to use full course names instead of codes
  const [filters, setFilters] = React.useState({
    mark: searchParams.get("mark") || "",
    course: searchParams.get("course") || "ALL_COURSES",
    category: searchParams.get("category") || "OC",
    district: searchParams.get("district") || "all_districts"
  });

  // Sort function that will be applied to the college data
  const sortColleges = (colleges: DisplayCollege[], option: string): DisplayCollege[] => {
    const sortedColleges = [...colleges];
    
    switch (option) {
      case "cutoff":
        // Sort by cutoff (high to low)
        return sortedColleges.sort((a, b) => b.cutoff - a.cutoff);
      case "cutoff-asc":
        // Sort by cutoff (low to high)
        return sortedColleges.sort((a, b) => a.cutoff - b.cutoff);
      case "name":
        // Sort by college name
        return sortedColleges.sort((a, b) => a.name.localeCompare(b.name));
      case "trend":
        // Sort by trend (increasing, stable, decreasing)
        return sortedColleges.sort((a, b) => {
          const trendValue = {
            "increasing": 2,
            "stable": 1,
            "decreasing": 0
          };
          return trendValue[b.trend] - trendValue[a.trend];
        });
      default:
        return sortedColleges;
    }
  };

  // Update the URL parameters logic for course names
  React.useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (filters.mark) newParams.set("mark", filters.mark);
    if (filters.course && filters.course !== "ALL_COURSES") newParams.set("course", filters.course);
    if (filters.category && filters.category !== "OC") newParams.set("category", filters.category);
    if (filters.district && filters.district !== "all_districts") newParams.set("district", filters.district);
    
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  // Process raw data into displayable format
  const processData = async (page = 1, append = false) => {
    if (isCacheLoading) {
      console.log("Cache still loading, skipping process data");
      return;
    }
    
    try {
      if (!append) {
        setError(null);
        setLoading(true);
        // Make sure we explicitly set displayColleges to empty when not appending
        setDisplayColleges([]);
      }
      
      // Create normalized filters for API calls
      const normalizedFilters = {
        mark: filters.mark,
        course: filters.course === "ALL_COURSES" ? "" : filters.course,
        category: filters.category,
        district: filters.district === "all_districts" ? "" : filters.district
      };
      
      console.log("Processing data with filters:", normalizedFilters, "page:", page);
      
      // Parse mark range if provided
      let markRange: { min: number; max: number } | undefined = undefined;
      if (normalizedFilters.mark) {
        if (normalizedFilters.mark.includes("-")) {
          const [minStr, maxStr] = normalizedFilters.mark.split("-").map(s => s.trim());
          markRange = { 
            min: parseFloat(minStr), 
            max: parseFloat(maxStr) 
          };
        } else {
          const mark = parseFloat(normalizedFilters.mark);
          markRange = { min: mark, max: 200 }; // Assuming max is 200
        }
      }
      
      // Get filtered data from service
      const { data: filteredData, total } = await filterCutoffData({
        year: "2024",
        markRange,
        course: normalizedFilters.course ? normalizedFilters.course : "",
        category: normalizedFilters.category,
        district: normalizedFilters.district,
        page,
        pageSize
      });
      
      console.log(`Filtered data count: ${filteredData.length}, total: ${total}`);
      setTotalColleges(total);
      setHasMore(total > page * pageSize);
      
      // Handle case when no results are found
      if (filteredData.length === 0) {
        console.log("No results found for the given filters");
        setDisplayColleges([]);
        setCurrentPage(page);
        return;
      }
      
      // Get college IDs to compare trends
      const collegeIds = filteredData.map(item => item.coc);
      
      // Fetch historical cutoff data for trend calculation
      const historicalData = await compareColleges(
        collegeIds,
        normalizedFilters.course || "",
        normalizedFilters.category,
        ["2023", "2024"]
      );
      
      // Transform to display format
      const newColleges: DisplayCollege[] = filteredData.map(item => {
        // Find the college from our cached data
        const college = colleges.find(c => c.id === item.coc) || {
          id: item.coc,
          name: item.con.split('\n')[0].trim(),
          location: item.con.split('\n').pop()?.trim() || ""
        };
        
        // Get cutoff mark based on selected category
        const getCutoffForCategory = (data: any, category: string): number => {
          switch (category.toUpperCase()) {
            case "OC": return data.OC ? parseFloat(data.OC.toString()) : 0;
            case "BC": return data.BC ? parseFloat(data.BC.toString()) : 0;
            case "BCM": return data.BCM ? parseFloat(data.BCM.toString()) : 0;
            case "MBC": return data.MBC ? parseFloat(data.MBC.toString()) : 0;
            case "SC": return data.SC ? parseFloat(data.SC.toString()) : 0;
            case "SCA": return data.SCA ? parseFloat(data.SCA.toString()) : 0;
            default: return data.OC ? parseFloat(data.OC.toString()) : 0;
          }
        };
        
        // Get total and filled seats based on selected category
        const getSeatsForCategory = (data: any, category: string): {total: number, filled: number} => {
          switch (category.toUpperCase()) {
            case "OC": return {total: data.octl || 0, filled: data.ocal || 0};
            case "BC": return {total: data.bctl || 0, filled: data.bcal || 0};
            case "BCM": return {total: data.bcmtl || 0, filled: data.bcmal || 0};
            case "MBC": return {total: data.mbctl || 0, filled: data.mbcal || 0};
            case "SC": return {total: data.sctl || 0, filled: data.scal || 0};
            case "SCA": return {total: data.scatl || 0, filled: data.scaal || 0};
            default: return {total: data.octl || 0, filled: data.ocal || 0};
          }
        };
        
        const cutoffMark = getCutoffForCategory(item, normalizedFilters.category);
        const seats = getSeatsForCategory(item, normalizedFilters.category);
        
        // Calculate actual trend based on historical data
        let trend: "stable" | "increasing" | "decreasing" = "stable";
        let previousCutoff: number | undefined = undefined;
        let cutoffDifference: number | undefined = undefined;
        
        if (historicalData[item.coc]) {
          const currentCutoff = historicalData[item.coc]["2024"];
          previousCutoff = historicalData[item.coc]["2023"];
          
          if (currentCutoff !== undefined && previousCutoff !== undefined) {
            cutoffDifference = currentCutoff - previousCutoff;
            if (cutoffDifference > 1) {
              trend = "increasing";
            } else if (cutoffDifference < -1) {
              trend = "decreasing";
            }
          }
        }
        
        return {
          id: college.id,
          name: college.name,
          location: college.location,
          course: item.brn.split('(')[0].trim(),
          courseCode: item.brc,
          cutoff: cutoffMark,
          previousCutoff,
          cutoffDifference,
          totalSeats: seats.total,
          filledSeats: seats.filled,
          trend,
          district: college.location,
          collegeType: item.con.includes("Government") 
            ? "Government" 
            : item.con.includes("Aided") 
              ? "Government Aided" 
              : "Private",
          category: normalizedFilters.category
        };
      });
      
      console.log("Display colleges processed:", newColleges.length);
      
      // Apply sorting
      if (append) {
        setDisplayColleges(prev => sortColleges([...prev, ...newColleges], sortOption));
      } else {
        setDisplayColleges(sortColleges(newColleges, sortOption));
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error("Error processing data:", error);
      setError(error instanceof Error ? error.message : "Failed to process data");
      // Always clear the display colleges on error when not appending
      if (!append) {
        setDisplayColleges([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Process data when filters change or cache is loaded
  React.useEffect(() => {
    if (!isCacheLoading) {
      // Reset to page 1 when filters change
      setDisplayColleges([]); // Clear existing results first
      console.log("Filters changed, processing data with new filters", filters);
      processData(1, false);
    }
  }, [
    filters.mark, 
    filters.course, 
    filters.category, 
    filters.district,
    isCacheLoading
  ]); // List all filter fields explicitly

  const loadMore = () => {
    processData(currentPage + 1, true);
  };

  // Add debounced filter change handler
  const handleFilterChange = (name: string, value: string) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to update filters after 500ms
    debounceTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, [name]: value }));
    }, 500);
  };

  const resetFilters = () => {
    // Reset all filters to default values
    setFilters({
      mark: "",
      course: "ALL_COURSES",
      category: "OC",
      district: "all_districts"
    });
    
    // Clear URL parameters
    setSearchParams({}, { replace: true });
    
    // Clear current results and reset to first page
    setDisplayColleges([]);
    setCurrentPage(1);
    processData(1, false);
  };

  // Inside the component, before the return statement, add code to remove duplicate course names
  React.useEffect(() => {
    if (!isCacheLoading && courses.length > 0) {
      // Remove duplicate course names by creating a map with uppercase names as keys
      const uniqueCoursesMap = new Map();
      
      courses.forEach(course => {
        // Clean the course name by removing any trailing spaces and parentheses text
        const cleanName = course.name.split('(')[0].trim().toUpperCase();
        
        // Only add if this course name doesn't exist yet (case insensitive)
        if (!uniqueCoursesMap.has(cleanName)) {
          uniqueCoursesMap.set(cleanName, {
            ...course,
            name: cleanName // Store the cleaned name
          });
        }
      });
      
      // Convert back to array
      const uniqueCourses = Array.from(uniqueCoursesMap.values());
      
      // Sort alphabetically
      uniqueCourses.sort((a, b) => a.name.localeCompare(b.name));
      
      // Replace the courses array with the deduplicated one
      courses.splice(0, courses.length, ...uniqueCourses);
    }
  }, [courses, isCacheLoading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Colleges by Cutoff Marks</h1>
            <p className="text-lg opacity-90">
              Discover which Anna University colleges you can apply to based on your expected marks
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <form onSubmit={(e) => e.preventDefault()} className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Filter Options</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Expected Mark filter */}
              <div className="space-y-2">
                <label htmlFor="mark" className="text-sm font-medium flex justify-between">
                  <span>Expected Mark</span>
                  {filters.mark && (
                    <button 
                      type="button" 
                      className="text-xs text-muted-foreground hover:text-foreground" 
                      onClick={() => setFilters(prev => ({ ...prev, mark: "" }))}
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{filters.mark || "Drag the slider"}</span>
                    {filters.mark && (
                      <span className="text-xs text-muted-foreground">
                        {filters.mark.includes("-") 
                          ? `Range: ${filters.mark}` 
                          : `Exact: ${filters.mark}`}
                      </span>
                    )}
                  </div>
                  <Slider 
                    id="mark"
                    name="mark"
                    min={100}
                    max={200}
                    step={1}
                    defaultValue={[
                      filters.mark 
                        ? parseInt(filters.mark.split('-')[0]) || 175 
                        : 175, 
                      filters.mark 
                        ? parseInt(filters.mark.split('-')[1]) || 185 
                        : 185
                    ]}
                    onValueChange={(values) => {
                      if (values.length === 2) {
                        // Use the debounced handler
                        if (debounceTimerRef.current) {
                          clearTimeout(debounceTimerRef.current);
                        }
                        
                        debounceTimerRef.current = setTimeout(() => {
                          setFilters(prev => ({ 
                            ...prev, 
                            mark: `${values[0]}-${values[1]}` 
                          }));
                        }, 500);
                      }
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>100</span>
                    <span>200</span>
                  </div>
                </div>
              </div>
              
              {/* Course filter */}
              <div className="space-y-2">
                <label htmlFor="course" className="text-sm font-medium flex justify-between">
                  <span>Course</span>
                  {filters.course !== "ALL_COURSES" && (
                    <button 
                      type="button" 
                      className="text-xs text-muted-foreground hover:text-foreground" 
                      onClick={() => setFilters(prev => ({ ...prev, course: "ALL_COURSES" }))}
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select
                  value={filters.course}
                  onValueChange={(value) => handleFilterChange("course", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any Course">
                      <span className="truncate block">
                        {filters.course !== "ALL_COURSES"
                          ? filters.course 
                          : "Any Course"}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ALL_COURSES">ANY COURSE</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.code} value={course.name.toUpperCase()}>
                          <span className="truncate block">{course.name.toUpperCase()}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category filter */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium flex justify-between">
                  <span>Category</span>
                  {filters.category !== "OC" && (
                    <button 
                      type="button" 
                      className="text-xs text-muted-foreground hover:text-foreground" 
                      onClick={() => setFilters(prev => ({ ...prev, category: "OC" }))}
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange("category", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="OC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="OC">OC</SelectItem>
                      <SelectItem value="BC">BC</SelectItem>
                      <SelectItem value="MBC">MBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="SCA">SCA</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              {/* District filter */}
              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-medium flex justify-between">
                  <span>District</span>
                  {filters.district !== "all_districts" && (
                    <button 
                      type="button" 
                      className="text-xs text-muted-foreground hover:text-foreground" 
                      onClick={() => setFilters(prev => ({ ...prev, district: "all_districts" }))}
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select
                  value={filters.district || "all_districts"}
                  onValueChange={(value) => handleFilterChange("district", value === "all_districts" ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any District">
                      <span className="truncate block">
                        {filters.district && filters.district !== "all_districts" 
                          ? filters.district 
                          : "Any District"}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all_districts">Any District</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          <span className="truncate block">{district}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={resetFilters}>
                Reset All Filters
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {cacheError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-800">
              <h3 className="font-medium">Error loading data</h3>
              <p>{cacheError}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-800">
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
            </div>
          )}
        
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">
              {loading || isCacheLoading ? "Searching colleges..." : 
                totalColleges > 0 ? 
                  `Showing ${displayColleges.length} of ${totalColleges} Colleges` : 
                  "No Colleges Found"
              }
            </h2>
            {displayColleges.length > 0 && (
              <div className="flex items-center space-x-3">
                <label htmlFor="sort" className="text-sm whitespace-nowrap">Sort by:</label>
                <select 
                  id="sort" 
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sortOption}
                  onChange={(e) => {
                    const newSortOption = e.target.value;
                    setSortOption(newSortOption);
                    // Apply sorting to the current displayColleges
                    setDisplayColleges(colleges => sortColleges([...colleges], newSortOption));
                  }}
                >
                  <option value="cutoff">Cutoff (High to Low)</option>
                  <option value="cutoff-asc">Cutoff (Low to High)</option>
                  <option value="name">College Name</option>
                  <option value="trend">Trend</option>
                </select>
              </div>
            )}
          </div>

          {(loading || isCacheLoading) ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {isCacheLoading ? "Loading initial data..." : "Filtering colleges..."}
                </p>
              </div>
            </div>
          ) : displayColleges.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <div className="bg-card">
                <div className="hidden md:grid md:grid-cols-[1fr,1fr,150px,100px,180px] border-b px-4 py-3 font-medium text-sm">
                  <div>College & Location</div>
                  <div>Course</div>
                  <div className="text-center">Cutoff</div>
                  <div className="text-center">Seats</div>
                  <div className="text-center">Actions</div>
                </div>
                
                <div className="divide-y">
                  {displayColleges.map(college => (
                    <div key={`${college.id}-${college.courseCode}`} className="group px-4 py-4 hover:bg-muted/50 transition-colors">
                      {/* Mobile view - stacked layout */}
                      <div className="md:hidden">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-lg flex-1">{college.name}</h3>
                          <div className="flex gap-2 items-center ml-2">
                            <button 
                              className="p-1 rounded-full hover:bg-muted transition-colors"
                              onClick={() => {
                                const isNowBookmarked = toggleBookmark(college);
                                setDisplayColleges(prev => [...prev]);
                              }}
                            >
                              {isBookmarked(college.id, college.courseCode) ? (
                                <Bookmark className="h-5 w-5 text-primary fill-primary" />
                              ) : (
                                <Bookmark className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{college.location}</div>
                        <div className="grid grid-cols-2 gap-y-2 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Course</div>
                            <div className="text-sm truncate">{college.course.toUpperCase()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Cutoff</div>
                            <div className="text-lg font-bold text-primary">{college.cutoff}
                              {college.previousCutoff && (
                                <span className="text-xs font-normal ml-1 text-muted-foreground whitespace-nowrap">
                                  vs {college.previousCutoff} (2023)
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Seats</div>
                            <div className="text-sm">{college.filledSeats}/{college.totalSeats}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Trend</div>
                            <div>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${
                                college.trend === 'increasing' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : college.trend === 'decreasing'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {college.trend === 'increasing' 
                                  ? '↑ Rising' 
                                  : college.trend === 'decreasing'
                                    ? '↓ Falling'
                                    : '→ Stable'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                            const searchQuery = encodeURIComponent(college.name);
                            window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                          }}>
                            Details
                          </Button>
                        </div>
                      </div>

                      {/* Desktop view - table row layout */}
                      <div className="hidden md:grid md:grid-cols-[1fr,1fr,150px,100px,180px] md:items-center">
                        <div>
                          <div className="font-medium">{college.name}</div>
                          <div className="text-sm text-muted-foreground">{college.location}</div>
                        </div>
                        <div>
                          <div>{college.course.toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">Code: {college.courseCode}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">{college.cutoff}</div>
                          {college.previousCutoff && (
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              vs {college.previousCutoff}
                              {college.cutoffDifference && college.cutoffDifference !== 0 && (
                                <span className={college.cutoffDifference > 0 ? "text-green-600" : "text-red-600"}>
                                  {college.cutoffDifference > 0 ? "+" : ""}{college.cutoffDifference.toFixed(2)}
                                </span>
                              )}
                              <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${
                                college.trend === 'increasing' 
                                  ? 'bg-green-100 text-green-800' 
                                  : college.trend === 'decreasing'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {college.trend === 'increasing' 
                                  ? '↑' 
                                  : college.trend === 'decreasing'
                                    ? '↓'
                                    : '→'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div>{college.filledSeats}/{college.totalSeats}</div>
                          <div className="text-xs text-muted-foreground">{filters.category}</div>
                        </div>
                        <div className="flex justify-center items-center gap-1">
                          <button 
                            className="p-1 rounded-full hover:bg-muted transition-colors"
                            onClick={() => {
                              const isNowBookmarked = toggleBookmark(college);
                              setDisplayColleges(prev => [...prev]);
                            }}
                            title={isBookmarked(college.id, college.courseCode) ? "Remove bookmark" : "Bookmark this college"}
                          >
                            {isBookmarked(college.id, college.courseCode) ? (
                              <Bookmark className="h-4 w-4 text-primary fill-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="px-2 py-1 h-7 text-xs" onClick={() => {
                              const searchQuery = encodeURIComponent(college.name);
                              window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                            }}>
                              Details
                            </Button>
                           
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (!error && !cacheError) ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No colleges match your criteria</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters to see more results</p>
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : null}

          {!loading && !isCacheLoading && displayColleges.length > 0 && hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : `Load More (${displayColleges.length} of ${totalColleges})`}
              </Button>
            </div>
          )}
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