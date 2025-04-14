import type { DisplayCollege } from "../types/college";

const BOOKMARK_KEY = "cutoffiq-bookmarked-colleges";

/**
 * Get all bookmarked colleges from localStorage
 */
export function getBookmarkedColleges(): DisplayCollege[] {
  if (typeof window === "undefined") return [];
  
  const bookmarked = localStorage.getItem(BOOKMARK_KEY);
  if (!bookmarked) return [];
  
  try {
    return JSON.parse(bookmarked);
  } catch (error) {
    console.error("Error parsing bookmarked colleges:", error);
    return [];
  }
}

/**
 * Add a college to bookmarks
 */
export function addBookmark(college: DisplayCollege): void {
  const bookmarked = getBookmarkedColleges();
  
  // Check if already bookmarked
  if (bookmarked.some(item => 
    item.id === college.id && 
    item.courseCode === college.courseCode &&
    item.cutoff === college.cutoff
  )) {
    return; // Already bookmarked
  }
  
  // Add to bookmarks
  const updatedBookmarks = [...bookmarked, college];
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updatedBookmarks));
}

/**
 * Remove a college from bookmarks
 */
export function removeBookmark(collegeId: number, courseCode: string): void {
  const bookmarked = getBookmarkedColleges();
  
  const updatedBookmarks = bookmarked.filter(
    item => !(item.id === collegeId && item.courseCode === courseCode)
  );
  
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updatedBookmarks));
}

/**
 * Check if a college is bookmarked
 */
export function isBookmarked(collegeId: number, courseCode: string): boolean {
  const bookmarked = getBookmarkedColleges();
  return bookmarked.some(
    item => item.id === collegeId && item.courseCode === courseCode
  );
}

/**
 * Toggle bookmark status for a college
 */
export function toggleBookmark(college: DisplayCollege): boolean {
  if (isBookmarked(college.id, college.courseCode)) {
    removeBookmark(college.id, college.courseCode);
    return false;
  } else {
    addBookmark(college);
    return true;
  }
}

/**
 * Update the order of bookmarked colleges
 */
export function updateBookmarkedCollegesOrder(colleges: DisplayCollege[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(colleges));
} 