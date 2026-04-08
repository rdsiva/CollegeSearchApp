export interface CollegeMatch {
  code: string;
  name: string;
  city: string;
  district: string;
  affiliation: string;
  courses: string[];
  nirf_rank?: number | null;
}

export interface SearchResult {
  exact: boolean;
  matches: CollegeMatch[];
}

export type CutoffMap = {
  OC?: number | null;
  BC?: number | null;
  BCM?: number | null;
  MBC?: number | null;
  SC?: number | null;
  ST?: number | null;
  SCA?: number | null;
};

export interface CourseDetail {
  branch_code: string;
  branch_name: string;
  cutoffs?: CutoffMap;
  cutoffs_2025?: CutoffMap;
  cutoffs_2026_predicted?: CutoffMap;
  historical_cutoffs?: Record<string, CutoffMap>;
}

export interface Fees {
  tnea?: number | null;
  management?: number | null;
  hostel?: number | null;
  transport?: number | null;
}

export interface Placement {
  avg_lpa?: number | null;
  highest_lpa?: number | null;
  placement_percentage?: number | null;
  top_companies?: string[];
}

export interface Reviews {
  sentiment_score?: number | null;
  google_rating?: number | null;
  pros?: string[];
  cons?: string[];
  common_complaints?: string[];
  summary?: string | null;
  review_texts?: string[];
}

export interface ScoreBreakdown {
  placement: number;
  fees_affordability: number;
  reviews_sentiment: number;
  infrastructure: number;
  location: number;
  total: number;
}

export interface YouTubeVideo {
  title: string;
  url: string;
  description?: string | null;
}

export interface CollegeDetail {
  name: string;
  code: string;
  anna_university_code: string;
  city: string;
  district: string;
  affiliation: string;
  approved_by: string[];
  nirf_rank?: number | null;
  courses: CourseDetail[];
  fees?: Fees | null;
  placement?: Placement | null;
  reviews?: Reviews | null;
  score?: number | null;
  score_breakdown?: ScoreBreakdown | null;
  youtube_videos?: YouTubeVideo[];
  selectedCourses?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
}

export type SearchMode = 'name' | 'code' | 'cutoff';

export interface SearchParams {
  type: SearchMode;
  q?: string;
  mark?: number;
  category?: string;
  course?: string;
  courses?: string[];
  year?: string;
  district?: string;
}
