import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Search, X, ChevronDown, Check, PlusCircle } from "lucide-react";
import {
  fetchCutoffData,
  getAllColleges,
  getAllCourses,
  compareColleges,
  getCategoryMark
} from "../services/cutoffService";
import type { College, Course, CutoffData as ServiceCutoffData } from "../services/cutoffService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface CutoffData {
  year: string;
  college: string;
  collegeId: number;
  course: string;
  category: string;
  cutoff: number;
}

export default function TrendsPage() {
  const [searchParams] = useSearchParams();
  const collegeIds = searchParams.get('colleges')?.split(',').map(Number) || [];
  const courseParam = searchParams.get('course') || '';
  const categoryParam = searchParams.get('category') || 'OC';

  const [loading, setLoading] = React.useState(true);
  const [cutoffData, setCutoffData] = React.useState<CutoffData[]>([]);
  const [colleges, setColleges] = React.useState<{id: number, name: string}[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = React.useState(courseParam);
  const [selectedCategory, setSelectedCategory] = React.useState(categoryParam);
  const [selectedColleges, setSelectedColleges] = React.useState<number[]>(collegeIds);
  const [error, setError] = React.useState<string | null>(null);
  const [collegeSearchTerm, setCollegeSearchTerm] = React.useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = React.useState(false);

  // Fetch real data from JSON
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load colleges, courses, and data for all years
        const years = ["2022", "2023", "2024"] as const;
        const [collegesData, coursesData, ...yearData] = await Promise.all([
          getAllColleges("2024"),
          getAllCourses("2024"),
          ...years.map(year => fetchCutoffData(year))
        ]);
        
        setColleges(collegesData);
        setCourses(coursesData);
        
        // Set default selected course if not provided in URL
        if (!courseParam && coursesData.length > 0) {
          setSelectedCourse(coursesData[0].code);
        } else if (courseParam) {
          // Ensure courseParam is set to a valid course code, not name
          const course = coursesData.find(c => 
            c.name.toUpperCase() === courseParam.toUpperCase() || 
            c.code.toUpperCase() === courseParam.toUpperCase()
          );
          if (course) {
            setSelectedCourse(course.code);
          } else if (coursesData.length > 0) {
            setSelectedCourse(coursesData[0].code);
          }
        }
        
        // Process data into required format
        const processedData: CutoffData[] = [];
        
        // Process each year's data
        years.forEach((year, index) => {
          const yearCutoffData = yearData[index];
          
          collegesData.forEach(college => {
            // For each course
            coursesData.forEach(course => {
              // Find all entries for this college and course
              const collegeData = yearCutoffData.filter(item => 
                item.coc === college.id && 
                item.brc.toUpperCase() === course.code.toUpperCase()
              );
              
              if (collegeData.length > 0) {
                // Process each category
                ["OC", "BC", "MBC", "SC"].forEach(category => {
                  // Find the first entry with this category data
                  for (const data of collegeData) {
                    const mark = getCategoryMark(data, category);
                    
                    if (mark !== undefined) {
                      processedData.push({
                        year,
                        college: college.name,
                        collegeId: college.id,
                        course: course.code,
                        category,
                        cutoff: mark
                      });
                      break; // Found a valid mark, no need to check other entries
                    }
                  }
                });
              }
            });
          });
        });
        
        console.log("Processed cutoff data:", processedData.length, "entries");
        setCutoffData(processedData);
        
        // If no colleges were selected but we have IDs in the URL, select them
        if (selectedColleges.length === 0 && collegeIds.length > 0) {
          setSelectedColleges(collegeIds);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load cutoff data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Filter cutoff data based on selections
  const filteredData = React.useMemo(() => {
    return cutoffData.filter(data => 
      (selectedColleges.length === 0 || selectedColleges.includes(data.collegeId)) &&
      data.course === selectedCourse &&
      data.category === selectedCategory
    );
  }, [cutoffData, selectedColleges, selectedCourse, selectedCategory]);

  // Create data for line chart visualization
  const chartData = React.useMemo(() => {
    const years = ["2022", "2023", "2024"];
    const collegeData: Record<string, {name: string, data: number[]}> = {};
    
    // Initialize collegeData
    colleges.forEach(college => {
      if (selectedColleges.includes(college.id)) {
        collegeData[college.id] = {
          name: college.name.split(',')[0],
          data: []
        };
      }
    });
    
    // Fill in data
    years.forEach(year => {
      selectedColleges.forEach(collegeId => {
        const dataPoint = filteredData.find(d => 
          d.collegeId === collegeId && 
          d.year === year
        );
        
        if (collegeData[collegeId]) {
          collegeData[collegeId].data.push(dataPoint?.cutoff || 0);
        }
      });
    });
    
    return {
      labels: years,
      datasets: Object.values(collegeData)
    };
  }, [filteredData, selectedColleges, colleges]);

  // Get average cutoff by year
  const averageCutoffByYear = React.useMemo(() => {
    const result: Record<string, number> = {};
    const years = ["2022", "2023", "2024"];
    
    years.forEach(year => {
      const yearData = filteredData.filter(d => d.year === year);
      if (yearData.length > 0) {
        const sum = yearData.reduce((acc, curr) => acc + curr.cutoff, 0);
        result[year] = parseFloat((sum / yearData.length).toFixed(2));
      } else {
        result[year] = 0;
      }
    });
    
    return result;
  }, [filteredData]);

  // Get highest cutoff college for current selections
  const highestCutoffCollege = React.useMemo(() => {
    if (filteredData.length === 0) return null;
    
    // Get latest year data
    const latestYearData = filteredData.filter(d => d.year === "2024");
    
    if (latestYearData.length === 0) return null;
    
    // Find highest cutoff
    return latestYearData.reduce((prev, curr) => 
      prev.cutoff > curr.cutoff ? prev : curr
    );
  }, [filteredData]);

  // Get cutoff trend by year (increasing, decreasing, stable)
  const cutoffTrend = React.useMemo(() => {
    if (!averageCutoffByYear["2022"] || !averageCutoffByYear["2024"]) {
      return "unknown";
    }
    
    const difference = averageCutoffByYear["2024"] - averageCutoffByYear["2022"];
    
    if (difference > 1) return "increasing";
    if (difference < -1) return "decreasing";
    return "stable";
  }, [averageCutoffByYear]);

  // Filter colleges based on search term
  const filteredColleges = React.useMemo(() => {
    if (!collegeSearchTerm.trim()) return colleges;
    
    return colleges.filter(college => 
      college.name.toLowerCase().includes(collegeSearchTerm.toLowerCase())
    );
  }, [colleges, collegeSearchTerm]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleAddCollege = (collegeId: number) => {
    if (selectedColleges.includes(collegeId)) return; // Already added
    setSelectedColleges(prev => [...prev, collegeId]);
    setCollegeSearchTerm("");
  };

  const handleRemoveCollege = (collegeId: number) => {
    setSelectedColleges(prev => prev.filter(id => id !== collegeId));
  };

  const getColumnColors = () => {
    return {
      "2022": "bg-blue-500",
      "2023": "bg-indigo-500",
      "2024": "bg-purple-500"
    };
  };
  
  const colors = getColumnColors();
  const courseDisplay = courses.find(c => c.code === selectedCourse)?.name || selectedCourse;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Cutoff Trends Analysis</h1>
            <p className="text-lg opacity-90">
              Analyze Anna University cutoff trends from 2022-2024
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-lg border p-6 -mt-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 md:items-end">
              <div className="space-y-2 flex-1">
                <label htmlFor="courseSelect" className="text-sm font-medium">Select Course</label>
                <select 
                  id="courseSelect"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedCourse}
                  onChange={handleCourseChange}
                  disabled={loading}
                >
                  {courses.map(course => (
                    <option key={course.code} value={course.code}>{course.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Select Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OC">OC</SelectItem>
                    <SelectItem value="BC">BC</SelectItem>
                    <SelectItem value="MBC">MBC</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Button asChild className="w-full">
                  <Link to={`/compare?colleges=${selectedColleges.join(',')}&course=${selectedCourse}&category=${selectedCategory}`}>
                    Compare Selected
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trend data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center py-20">
          <div className="text-center max-w-lg">
            <div className="text-destructive text-4xl mb-4">⚠️</div>
            <p className="text-destructive font-medium mb-2">{error}</p>
            <p className="text-muted-foreground mb-4">Please try refreshing the page or come back later.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6">Summary Stats - {courseDisplay} ({selectedCategory})</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Current Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <span className={`text-2xl font-bold ${
                        cutoffTrend === 'increasing' 
                          ? 'text-green-600 dark:text-green-400' 
                          : cutoffTrend === 'decreasing'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {cutoffTrend === 'increasing' 
                          ? '↑ Rising' 
                          : cutoffTrend === 'decreasing'
                            ? '↓ Falling'
                            : '→ Stable'}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">Over the past 3 years</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Highest Cutoff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {highestCutoffCollege?.cutoff.toFixed(2) || 'N/A'}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {highestCutoffCollege?.college.split(',')[0] || 'N/A'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">2022 vs 2024</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {averageCutoffByYear["2022"] && averageCutoffByYear["2024"] ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="text-2xl font-bold">
                            {(averageCutoffByYear["2024"] - averageCutoffByYear["2022"]).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ({((averageCutoffByYear["2024"] - averageCutoffByYear["2022"]) / averageCutoffByYear["2022"] * 100).toFixed(2)}%)
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">Average cutoff change</p>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Insufficient data</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Average 2024</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {averageCutoffByYear["2024"] ? averageCutoffByYear["2024"].toFixed(2) : 'N/A'}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">Across selected colleges</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Chart Visualization */}
          <section className="py-8 bg-muted/30 border-y">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Bar Chart */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Cutoff Comparison by Year</h3>
                  <div className="bg-card border rounded-lg p-6">
                    <div className="h-80 flex items-end space-x-2">
                      {selectedColleges.length > 0 ? (
                        chartData.datasets.map((dataset, i) => (
                          <div key={i} className="flex-1 min-w-0 flex flex-col items-center">
                            <div className="w-full space-y-2 flex flex-col items-center">
                              {dataset.data.map((value, j) => (
                                <div key={j} className="relative w-full flex flex-col items-center">
                                  <div 
                                    className={`${colors[chartData.labels[j] as keyof typeof colors]} rounded-t w-full max-w-[60px]`} 
                                    style={{
                                      height: `${Math.max(0, (value - 180) * 10)}px`,
                                      minHeight: value > 0 ? '8px' : '0',
                                      transition: 'height 0.3s ease'
                                    }}
                                  ></div>
                                  <div className="text-xs font-medium text-center mt-1">{value > 0 ? value.toFixed(2) : 'N/A'}</div>
                                </div>
                              ))}
                            </div>
                            <div className="text-center text-sm font-medium mt-4 break-words max-w-[120px] truncate">
                              {dataset.name}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-muted-foreground">Select colleges to view comparison</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedColleges.length > 0 && (
                      <div className="flex justify-center mt-6 space-x-4">
                        {chartData.labels.map((year, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`w-3 h-3 ${colors[year as keyof typeof colors]} rounded-full mr-1`}></div>
                            <span className="text-sm">{year}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* College Selection */}
                <div className="md:w-72">
                  <h3 className="text-xl font-semibold mb-4">Select Colleges</h3>
                  <div className="bg-card border rounded-lg p-4 h-80 overflow-hidden flex flex-col">
                    {/* Selected colleges */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedColleges.length > 0 ? (
                        selectedColleges.map(collegeId => {
                          const college = colleges.find(c => c.id === collegeId);
                          if (!college) return null;
                          return (
                            <div key={collegeId} className="flex items-center bg-primary text-primary-foreground text-xs rounded-full px-3 py-1.5">
                              <span className="truncate max-w-[150px]">{college.name.split(',')[0]}</span>
                              <button
                                className="ml-2 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                                onClick={() => handleRemoveCollege(collegeId)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground text-sm">No colleges selected</div>
                      )}
                    </div>
                    
                    {/* College search dropdown */}
                    <div className="relative">
                      <div className="flex gap-2">
                        <div
                          className="flex-1 flex items-center border rounded-md px-3 py-2 bg-background cursor-pointer"
                          onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
                        >
                          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search colleges..."
                            className="flex-1 bg-transparent border-none outline-none text-sm"
                            value={collegeSearchTerm}
                            onChange={(e) => setCollegeSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      {showCollegeDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 border rounded-md bg-background shadow-md z-10 max-h-48 overflow-auto">
                          {filteredColleges.length > 0 ? (
                            filteredColleges
                              .filter(college => !selectedColleges.includes(college.id))
                              .map(college => (
                                <div
                                  key={college.id}
                                  className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center text-sm"
                                  onClick={() => {
                                    handleAddCollege(college.id);
                                    setShowCollegeDropdown(false);
                                  }}
                                >
                                  <PlusCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="truncate">{college.name}</span>
                                </div>
                              ))
                          ) : (
                            <div className="px-3 py-2 text-muted-foreground text-sm">No matching colleges</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Table */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <h3 className="text-xl font-semibold mb-4">Detailed Cutoff Data</h3>
              
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-4 font-medium">College</th>
                        <th className="text-left p-4 font-medium">2022</th>
                        <th className="text-left p-4 font-medium">2023</th>
                        <th className="text-left p-4 font-medium">2024</th>
                        <th className="text-left p-4 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedColleges.length > 0 ? (
                        selectedColleges.map(collegeId => {
                          const college = colleges.find(c => c.id === collegeId);
                          if (!college) return null;
                          
                          console.log("Finding data for college:", college.name, "course:", selectedCourse, "category:", selectedCategory);
                          
                          const collegeData = cutoffData.filter(d => 
                            d.collegeId === collegeId && 
                            d.course === selectedCourse && 
                            d.category === selectedCategory
                          );
                          
                          console.log("Found college data entries:", collegeData.length);
                          
                          const data2022 = collegeData.find(d => d.year === "2022")?.cutoff;
                          const data2023 = collegeData.find(d => d.year === "2023")?.cutoff;
                          const data2024 = collegeData.find(d => d.year === "2024")?.cutoff;
                          
                          const trendValue = data2022 && data2024 
                            ? ((data2024 - data2022) / data2022 * 100).toFixed(2)
                            : null;
                            
                          let trendClass = '';
                          if (trendValue) {
                            const value = parseFloat(trendValue);
                            trendClass = value > 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : value < 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : '';
                          }
                          
                          return (
                            <tr key={collegeId} className="border-t">
                              <td className="p-4">{college.name}</td>
                              <td className="p-4">{data2022 ? data2022.toFixed(2) : 'N/A'}</td>
                              <td className="p-4">{data2023 ? data2023.toFixed(2) : 'N/A'}</td>
                              <td className="p-4 font-medium">{data2024 ? data2024.toFixed(2) : 'N/A'}</td>
                              <td className={`p-4 font-medium ${trendClass}`}>
                                {trendValue ? `${trendValue}%` : 'N/A'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No colleges selected. Select colleges from the list above to view data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-12 bg-muted/30 text-center border-t">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-4">Ready to make your decision?</h2>
              <p className="mb-6 text-muted-foreground max-w-2xl mx-auto">
                Use our college finder to discover which colleges you can apply to based on your expected cutoff marks
              </p>
              <div className="flex justify-center space-x-4">
                <Button asChild>
                  <Link to="/find-colleges">Find Colleges</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
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