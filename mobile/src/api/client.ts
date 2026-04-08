import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BASE_URL, REQUEST_TIMEOUT_MS } from '@/constants/api';
import type { SearchResult, CollegeDetail, ChatMessage, ChatResponse, SearchParams } from '@/types';

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function searchColleges(params: SearchParams): Promise<SearchResult> {
  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('type', params.type);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.mark !== undefined) url.searchParams.set('mark', String(params.mark));
  if (params.category) url.searchParams.set('category', params.category);
  if (params.course) url.searchParams.set('course', params.course);
  if (params.year) url.searchParams.set('year', params.year);
  if (params.district) url.searchParams.set('district', params.district);

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<SearchResult>;
}

export async function researchColleges(college_codes: string[]): Promise<CollegeDetail[]> {
  const res = await fetchWithTimeout(`${BASE_URL}/colleges/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ college_codes }),
  });
  if (!res.ok) throw new Error(`Research failed: ${res.status}`);
  return res.json() as Promise<CollegeDetail[]>;
}

export async function sendChat(
  message: string,
  college_code: string | null,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const res = await fetchWithTimeout(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, college_code, history }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}

async function exportFile(
  endpoint: 'csv' | 'word',
  colleges: CollegeDetail[],
  filename: string,
  mimeType: string
): Promise<void> {
  const res = await fetchWithTimeout(`${BASE_URL}/export/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colleges }),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // M4: chunk conversion to avoid OOM on large exports (Word docs can be several MB)
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
  }
  const base64 = btoa(binary);

  const fileUri = (FileSystem.cacheDirectory ?? '') + filename;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: 'Save or Share' });
}

export const exportCsv = (colleges: CollegeDetail[]): Promise<void> =>
  exportFile('csv', colleges, 'college_research.csv', 'text/csv');

export const exportWord = (colleges: CollegeDetail[]): Promise<void> =>
  exportFile(
    'word',
    colleges,
    'college_research.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
