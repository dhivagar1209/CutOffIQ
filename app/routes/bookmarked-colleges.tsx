import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { 
  getBookmarkedColleges, 
  removeBookmark,
  updateBookmarkedCollegesOrder
} from "../services/bookmarkService";
import type { DisplayCollege } from "../types/college";
import { Bookmark, BookmarkX, ExternalLink, MoveUp, MoveDown, Download, GripVertical } from "lucide-react";

export default function BookmarkedCollegesPage() {
  const [bookmarkedColleges, setBookmarkedColleges] = React.useState<DisplayCollege[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load bookmarked colleges on mount
  React.useEffect(() => {
    const loadBookmarks = () => {
      try {
        const colleges = getBookmarkedColleges();
        setBookmarkedColleges(colleges);
      } catch (error) {
        console.error("Error loading bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  // Handle removing a bookmark
  const handleRemoveBookmark = (collegeId: number, courseCode: string) => {
    removeBookmark(collegeId, courseCode);
    setBookmarkedColleges(prev => 
      prev.filter(college => !(college.id === collegeId && college.courseCode === courseCode))
    );
  };

  // Handle moving a college up in the list
  const handleMoveUp = (index: number) => {
    if (index === 0) return; // Already at the top

    const newColleges = [...bookmarkedColleges];
    const temp = newColleges[index];
    newColleges[index] = newColleges[index - 1];
    newColleges[index - 1] = temp;
    
    setBookmarkedColleges(newColleges);
    updateBookmarkedCollegesOrder(newColleges);
  };

  // Handle moving a college down in the list
  const handleMoveDown = (index: number) => {
    if (index === bookmarkedColleges.length - 1) return; // Already at the bottom

    const newColleges = [...bookmarkedColleges];
    const temp = newColleges[index];
    newColleges[index] = newColleges[index + 1];
    newColleges[index + 1] = temp;
    
    setBookmarkedColleges(newColleges);
    updateBookmarkedCollegesOrder(newColleges);
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Format the data for CSV
    const headers = [
      "College Name",
      "Location",
      "Course",
      "Course Code",
      "Cutoff Mark",
      "Previous Cutoff",
      "Difference",
      "Trend",
      "Seats Filled",
      "Total Seats",
      "Category",
      "College Type"
    ];

    // Create the CSV rows
    const rows = bookmarkedColleges.map(college => [
      college.name,
      college.location,
      college.course.toUpperCase(),
      college.courseCode,
      college.cutoff,
      college.previousCutoff || "N/A",
      college.cutoffDifference ? college.cutoffDifference.toFixed(2) : "N/A",
      college.trend === 'increasing' ? "Rising" : (college.trend === 'decreasing' ? "Falling" : "Stable"),
      college.filledSeats,
      college.totalSeats,
      college.category || "OC",
      college.collegeType
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        // Handle strings with commas by wrapping in quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(","))
    ].join("\n");

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bookmarked_colleges.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Bookmarked Colleges</h1>
            <p className="text-lg opacity-90">
              View and manage your saved colleges
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              {bookmarkedColleges.length} Bookmarked Colleges
            </h2>
            <div className="flex gap-2">
              {bookmarkedColleges.length > 0 && (
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/find-colleges">Find More Colleges</Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading bookmarks...</p>
              </div>
            </div>
          ) : bookmarkedColleges.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-lg border">
              <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No bookmarked colleges</h3>
              <p className="text-muted-foreground mb-6">
                You haven't bookmarked any colleges yet. Start by exploring and bookmarking colleges you're interested in.
              </p>
              <Button asChild>
                <Link to="/find-colleges">Find Colleges</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookmarkedColleges.map((college, index) => (
                <Card key={`${college.id}-${college.courseCode}`} className="relative">
                  <div className="absolute left-2 top-0 bottom-0 flex items-center text-muted-foreground pr-2">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <CardHeader className="pl-10 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{college.name}</CardTitle>
                        <div className="text-muted-foreground text-sm mt-1">{college.location}</div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {index > 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleMoveUp(index)}
                            className="h-8 w-8"
                            title="Move up"
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < bookmarkedColleges.length - 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleMoveDown(index)}
                            className="h-8 w-8"
                            title="Move down"
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        <button 
                          className="p-1 rounded-full hover:bg-muted transition-colors"
                          onClick={() => handleRemoveBookmark(college.id, college.courseCode)}
                          title="Remove bookmark"
                        >
                          <BookmarkX className="h-5 w-5 text-destructive" />
                        </button>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          college.trend === 'increasing' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : college.trend === 'decreasing'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {college.trend === 'increasing' 
                            ? '↑ Rising Cutoff' 
                            : college.trend === 'decreasing'
                              ? '↓ Falling Cutoff'
                              : '→ Stable Cutoff'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-10 pb-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">Course</div>
                        <div className="text-lg">{college.course.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Code: {college.courseCode}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">Cutoff Mark</div>
                        <div className="text-2xl font-bold text-primary">
                          {college.cutoff}
                          {college.previousCutoff && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              vs {college.previousCutoff} (2023)
                              {college.cutoffDifference && college.cutoffDifference !== 0 && (
                                <span className={`ml-1 ${
                                  college.cutoffDifference > 0 
                                    ? "text-green-600 dark:text-green-400" 
                                    : "text-red-600 dark:text-red-400"
                                }`}>
                                  {college.cutoffDifference > 0 ? "+" : ""}{college.cutoffDifference.toFixed(2)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Category: </span>
                        <span className="font-medium">{college.category || "OC"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Seats: </span>
                        <span className="font-medium">{college.filledSeats}/{college.totalSeats}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">College Type: </span>
                        <span className="font-medium">{college.collegeType}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/30 pt-4 flex justify-between pl-10">
                    <Button variant="outline" onClick={() => {
                      const searchQuery = encodeURIComponent(college.name);
                      window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                    }}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      College Details
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => 
                      handleRemoveBookmark(college.id, college.courseCode)
                    }>
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
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