/**
 * CutoffIQ Data Service
 * Handles fetching and processing Anna University cutoff data
 */

// Types
export interface CutoffData {
  _id: string;
  coc: number;
  con: string;
  brc: string;
  brn: string;
  code: string;
  octl?: number;
  ocal?: number;
  bctl?: number;
  bcal?: number;
  bcmtl?: number;
  bcmal?: number;
  mbctl?: number;
  mbcal?: number;
  sctl?: number;
  scal?: number;
  scatl?: number;
  scaal?: number;
  OC?: string;
  BC?: string;
  BCM?: string;
  MBC?: string;
  SC?: string;
  SCA?: string;
  ST?: string;
  // Add any other properties from the data
}

export interface College {
  id: number;
  name: string;
  location: string;
}

export interface Course {
  code: string;
  name: string;
}

export interface FilterOptions {
  year: "2022" | "2023" | "2024";
  markRange?: { min: number; max: number };
  course?: string;
  category?: string;
  district?: string;
  collegeType?: string;
  page?: number;
  pageSize?: number;
}

// Cache for data
let dataCache: {
  "2022"?: CutoffData[];
  "2023"?: CutoffData[];
  "2024"?: CutoffData[];
} = {};

// Additional caches for derived data to reduce processing
const collegeCache: Record<string, College[]> = {};
const courseCache: Record<string, Course[]> = {};
const compareResultCache: Record<string, Record<number, Record<string, number | undefined>>> = {};

/**
 * Fetch cutoff data for a specific year
 */
export async function fetchCutoffData(year: "2022" | "2023" | "2024"): Promise<CutoffData[]> {
  // Return cached data if available
  if (dataCache[year]) {
    return dataCache[year]!;
  }

  try {
    const response = await fetch(`/data/${year}_cutoff.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${year} data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    dataCache[year] = data;
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${year} cutoff data:`, error);
    throw error;
  }
}

/**
 * Filter cutoff data based on provided criteria
 */
export async function filterCutoffData(options: FilterOptions): Promise<{data: CutoffData[], total: number}> {
  const { year, markRange, course, category, district, collegeType, page = 1, pageSize = 20 } = options;
  
  // Fetch the data for the specified year
  const data = await fetchCutoffData(year);
  
  // Apply filters
  const filteredData = data.filter(item => {
    // Filter by mark range if specified
    if (markRange) {
      const relevantMark = getCategoryMark(item, category || "oc"); // Default to OC category
      if (relevantMark === undefined || relevantMark < markRange.min || relevantMark > markRange.max) {
        return false;
      }
    }
    
    // Filter by course if specified - filter by course name (brn) instead of code
    if (course && course.trim() !== "") {
      // Clean up the branch name from the data to match our cleaned course names
      const itemCourseName = item.brn.split('(')[0].trim().toUpperCase();
      // Compare cleaned course names instead of codes
      if (itemCourseName !== course.toUpperCase()) {
        return false;
      }
    }
    
    // Filter by district if specified - check in full college address text
    if (district && district.trim() !== "") {
      if (!item.con.toLowerCase().includes(district.toLowerCase())) {
        return false;
      }
    }
    
    // Filter by college type if specified (govt, aided, etc.)
    if (collegeType) {
      const collegeText = item.con.toLowerCase();
      if (collegeType.toLowerCase() === "government") {
        if (!collegeText.includes("government") && !collegeText.includes("govt")) {
          return false;
        }
      } else if (collegeType.toLowerCase() === "government aided") {
        if (!collegeText.includes("aided")) {
          return false;
        }
      } else if (collegeType.toLowerCase() === "private") {
        if (collegeText.includes("government") || collegeText.includes("govt") || collegeText.includes("aided")) {
          return false;
        }
      } else if (collegeType.toLowerCase() === "autonomous") {
        if (!collegeText.includes("autonomous")) {
          return false;
        }
      } else if (!collegeText.includes(collegeType.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
  
  // Calculate pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Return paginated results and total count
  return {
    data: filteredData.slice(startIndex, endIndex),
    total: filteredData.length
  };
}

/**
 * Get the mark for a specific category from a cutoff record
 */
export function getCategoryMark(data: CutoffData, category: string): number | undefined {
  // Normalize category to lowercase for case-insensitive comparison
  const normalizedCategory = category.toLowerCase();
  
  // Enhanced debugging
  const availableCategories = Object.keys(data).filter(key => 
    ["OC", "BC", "BCM", "MBC", "SC", "SCA", "ST"].includes(key.toUpperCase())
  );
  
  console.log(
    `Getting mark for category ${category} from data with available categories: ${availableCategories.join(', ')}`
  );
  
  // First try direct property access with normalized case
  switch (normalizedCategory) {
    case "oc":
      return parseMarkValue(data.OC);
    case "bc":
      return parseMarkValue(data.BC);
    case "bcm":
      return parseMarkValue(data.BCM);
    case "mbc":
      return parseMarkValue(data.MBC);
    case "sc":
      return parseMarkValue(data.SC);
    case "sca":
      return parseMarkValue(data.SCA);
    case "st":
      return parseMarkValue(data.ST);
    default:
      // If no direct match, try case-insensitive search through all properties
      for (const key of Object.keys(data)) {
        if (key.toLowerCase() === normalizedCategory) {
          return parseMarkValue(data[key as keyof CutoffData]);
        }
      }
      
      // Handle fallbacks for popular category aliases
      if (normalizedCategory === "oc") {
        // Try other common OC representations using type-safe access
        return parseMarkValue((data as any)['OPEN']) || 
               parseMarkValue((data as any)['GEN']) || 
               parseMarkValue((data as any)['GENERAL']);
      }
      
      console.log(`No matching category found for ${category}`);
      return undefined;
  }
}

/**
 * Helper function to parse mark values from various formats
 */
function parseMarkValue(value: any): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  
  // If it's already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // If it's a string that can be parsed as a number
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed.toLowerCase() === "na" || trimmed.toLowerCase() === "n/a") {
      return undefined;
    }
    
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  // For other types, try toString() and parse
  try {
    const stringVal = value.toString().trim();
    const parsed = parseFloat(stringVal);
    if (!isNaN(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error("Error parsing mark value:", e);
  }
  
  return undefined;
}

/**
 * Extract all unique colleges from the data
 */
export async function getAllColleges(year: "2022" | "2023" | "2024"): Promise<College[]> {
  // Use cache if available
  const cacheKey = `colleges_${year}`;
  if (collegeCache[cacheKey]) {
    return collegeCache[cacheKey];
  }
  
  const data = await fetchCutoffData(year);
  
  // Create a map to extract unique colleges by code
  const collegeMap = new Map<number, College>();
  
  data.forEach(item => {
    if (!collegeMap.has(item.coc)) {
      collegeMap.set(item.coc, {
        id: item.coc,
        name: extractCollegeName(item.con),
        location: extractLocation(item.con)
      });
    }
  });
  
  const result = Array.from(collegeMap.values());
  
  // Cache the result
  collegeCache[cacheKey] = result;
  
  return result;
}

/**
 * Extract all unique courses from the data
 */
export async function getAllCourses(year: "2022" | "2023" | "2024"): Promise<Course[]> {
  // Use cache if available
  const cacheKey = `courses_${year}`;
  if (courseCache[cacheKey]) {
    return courseCache[cacheKey];
  }
  
  const data = await fetchCutoffData(year);
  
  // Create a map to extract unique courses by name (not code)
  const courseMap = new Map<string, Course>();
  
  data.forEach(item => {
    // Clean the course name by removing any parenthetical information
    const cleanName = item.brn.split('(')[0].trim();
    const upperName = cleanName.toUpperCase();
    
    // Use the cleaned name as the key for deduplication
    if (!courseMap.has(upperName)) {
      courseMap.set(upperName, {
        code: item.brc,
        name: cleanName
      });
    }
  });
  
  const result = Array.from(courseMap.values());
  
  // Cache the result
  courseCache[cacheKey] = result;
  
  return result;
}

/**
 * Compare colleges based on cutoffs for a specific course
 */
export async function compareColleges(
  collegeIds: number[],
  courseCode: string,
  category: string,
  years: ("2022" | "2023" | "2024")[] = ["2022", "2023", "2024"]
): Promise<Record<number, Record<string, number | undefined>>> {
  // Use cache if available - create a cache key from params
  const cacheKey = `compare_${collegeIds.join('_')}_${courseCode}_${category}_${years.join('_')}`;
  if (compareResultCache[cacheKey]) {
    return compareResultCache[cacheKey];
  }
  
  const result: Record<number, Record<string, number | undefined>> = {};
  
  try {
    // Initialize the result structure
    for (const collegeId of collegeIds) {
      result[collegeId] = {};
      for (const year of years) {
        result[collegeId][year] = undefined;
      }
    }
    
    // Fetch data for all years - use Promise.all for parallel fetching
    const allData = await Promise.all(years.map(year => fetchCutoffData(year)));
    
    // Process data for each college, year, and course
    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const yearData = allData[i];
      
      for (const collegeId of collegeIds) {
        // Find matching college data for this year
        const collegeData = yearData.filter(data => data.coc === collegeId);
        
        // Find cutoff for the specified course and category
        for (const data of collegeData) {
          if (data.brc.toUpperCase() === courseCode.toUpperCase()) {
            const mark = getCategoryMark(data, category);
            result[collegeId][year] = mark;
            break;
          }
        }
      }
    }
    
    // Cache the result
    compareResultCache[cacheKey] = result;
  } catch (error) {
    console.error("Error in compareColleges:", error);
  }
  
  return result;
}

/**
 * Helper function to extract college name from the full text
 */
function extractCollegeName(collegeText: string): string {
  // This is a simplification - might need refinement based on actual data format
  return collegeText.split('\n')[0].trim();
}

/**
 * Helper function to extract location from the full text
 */
function extractLocation(collegeText: string): string {
  // This is a simplification - might need refinement based on actual data format
  const lines = collegeText.split('\n');
  return lines.length > 1 ? lines[lines.length - 1].trim() : '';
}

/**
 * Extract common districts from college names/addresses
 */
export async function extractDistricts(year: "2022" | "2023" | "2024"): Promise<string[]> {
  const data = await fetchCutoffData(year);
  
  // Common TN districts to look for in the address
  const commonDistricts = [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Trichy", "Salem", 
    "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thanjavur", "Dindigul", 
    "Kancheepuram", "Cuddalore", "Thoothukudi", "Tiruvallur", "Namakkal", 
    "Nagapattinam", "Pudukkottai", "Sivaganga", "Krishnagiri", "Kanyakumari",
    "Virudhunagar", "Theni", "Karur", "Ariyalur", "Perambalur", "Dharmapuri",
    "Villupuram", "Ramanathapuram", "Nilgiris"
  ];
  
  // Find districts in college addresses
  const foundDistricts = new Set<string>();
  
  data.forEach(item => {
    const collegeText = item.con.toLowerCase();
    commonDistricts.forEach(district => {
      if (collegeText.includes(district.toLowerCase())) {
        foundDistricts.add(district);
      }
    });
  });
  
  return Array.from(foundDistricts).sort();
} 