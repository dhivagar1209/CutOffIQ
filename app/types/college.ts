export interface DisplayCollege {
  id: number;
  name: string;
  location: string;
  course: string;
  courseCode: string;
  cutoff: number;
  previousCutoff?: number;
  cutoffDifference?: number;
  totalSeats: number;
  filledSeats: number;
  trend: "stable" | "increasing" | "decreasing";
  district: string;
  collegeType: string;
  category?: string;
} 