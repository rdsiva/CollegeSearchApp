/**
 * Tests for src/api/client.ts
 *
 * Covers: searchColleges, researchColleges, sendChat, exportCsv, exportWord
 */

import { BASE_URL, REQUEST_TIMEOUT_MS } from '@/constants/api';

// ---------- module mocks (must be before any import of the module under test) ----------

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// ---------- imports after mocks ----------

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  searchColleges,
  researchColleges,
  sendChat,
  exportCsv,
  exportWord,
} from '@/api/client';
import type { CollegeDetail, CollegeMatch, SearchResult } from '@/types';

// ---------- helpers ----------

/** Build a minimal mock Response */
function mockResponse(
  body: unknown,
  status = 200,
  opts: { isArrayBuffer?: boolean } = {}
): Response {
  const ok = status >= 200 && status < 300;
  const response = {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    arrayBuffer: opts.isArrayBuffer
      ? jest.fn().mockResolvedValue(new ArrayBuffer(4))
      : jest.fn(),
  } as unknown as Response;
  return response;
}

const sampleCollegeMatch: CollegeMatch = {
  code: 'CE001',
  name: 'Anna University',
  city: 'Chennai',
  district: 'Chennai',
  affiliation: 'Anna University',
  courses: ['CSE'],
};

const sampleCollegeDetail: CollegeDetail = {
  name: 'Anna University',
  code: 'CE001',
  anna_university_code: '4658',
  city: 'Chennai',
  district: 'Chennai',
  affiliation: 'Anna University',
  approved_by: ['AICTE'],
  courses: [],
};

// ---------- setup / teardown ----------

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  jest.clearAllMocks();
});

// ============================================================
// searchColleges
// ============================================================

describe('searchColleges', () => {
  it('builds a correct URL for a name search', async () => {
    const result: SearchResult = { exact: false, matches: [sampleCollegeMatch] };
    fetchMock.mockResolvedValueOnce(mockResponse(result));

    await searchColleges({ type: 'name', q: 'anna' });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain(`${BASE_URL}/search`);
    expect(calledUrl).toContain('type=name');
    expect(calledUrl).toContain('q=anna');
  });

  it('includes mark, category, course, year params when provided', async () => {
    const result: SearchResult = { exact: false, matches: [sampleCollegeMatch] };
    fetchMock.mockResolvedValueOnce(mockResponse(result));

    await searchColleges({
      type: 'cutoff',
      mark: 185.5,
      category: 'OC',
      course: 'CSE',
      year: '2025',
    });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('type=cutoff');
    expect(calledUrl).toContain('mark=185.5');
    expect(calledUrl).toContain('category=OC');
    expect(calledUrl).toContain('course=CSE');
    expect(calledUrl).toContain('year=2025');
  });

  it('does not add undefined optional params to the URL', async () => {
    const result: SearchResult = { exact: true, matches: [sampleCollegeMatch] };
    fetchMock.mockResolvedValueOnce(mockResponse(result));

    await searchColleges({ type: 'code', q: 'CE001' });

    const calledUrl: string = fetchMock.mock.calls[0][0];
    expect(calledUrl).not.toContain('mark=');
    expect(calledUrl).not.toContain('category=');
    expect(calledUrl).not.toContain('course=');
    expect(calledUrl).not.toContain('year=');
  });

  it('returns parsed SearchResult on success', async () => {
    const result: SearchResult = { exact: true, matches: [sampleCollegeMatch] };
    fetchMock.mockResolvedValueOnce(mockResponse(result));

    const data = await searchColleges({ type: 'name', q: 'anna' });

    expect(data.exact).toBe(true);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].code).toBe('CE001');
  });

  it('throws on a 4xx response', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ detail: 'Bad Request' }, 400));

    await expect(searchColleges({ type: 'name', q: 'anna' })).rejects.toThrow(
      'Search failed: 400'
    );
  });

  it('throws on a 5xx response', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ detail: 'Internal Server Error' }, 500));

    await expect(searchColleges({ type: 'name', q: 'anna' })).rejects.toThrow(
      'Search failed: 500'
    );
  });

  it('passes an AbortSignal to fetch', async () => {
    const result: SearchResult = { exact: false, matches: [sampleCollegeMatch] };
    fetchMock.mockResolvedValueOnce(mockResponse(result));

    await searchColleges({ type: 'name', q: 'test' });

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions.signal).toBeDefined();
    expect(fetchOptions.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects when AbortController fires (timeout simulation)', async () => {
    fetchMock.mockImplementationOnce((_url: string, opts: RequestInit) => {
      return new Promise((_resolve, reject) => {
        // Abort the request immediately via the signal
        const signal = opts.signal as AbortSignal;
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        // Trigger abort right away
        (signal as AbortSignal & { dispatchEvent: (e: Event) => void }).dispatchEvent(
          new Event('abort')
        );
      });
    });

    await expect(searchColleges({ type: 'name', q: 'test' })).rejects.toThrow();
  });
});

// ============================================================
// researchColleges
// ============================================================

describe('researchColleges', () => {
  it('sends a POST with correct JSON body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([sampleCollegeDetail]));

    await researchColleges(['CE001', 'CE002']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/colleges/research`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ college_codes: ['CE001', 'CE002'] });
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('returns a parsed array of CollegeDetail', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([sampleCollegeDetail]));

    const result = await researchColleges(['CE001']);

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].code).toBe('CE001');
    expect(result[0].name).toBe('Anna University');
  });

  it('throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 503));

    await expect(researchColleges(['CE001'])).rejects.toThrow('Research failed: 503');
  });
});

// ============================================================
// sendChat
// ============================================================

describe('sendChat', () => {
  it('sends message, college_code, and history in POST body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ reply: 'Hello', suggestions: [] }));

    const history = [{ role: 'user' as const, content: 'Hi' }];
    await sendChat('What are the fees?', 'CE001', history);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/chat`);
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body.message).toBe('What are the fees?');
    expect(body.college_code).toBe('CE001');
    expect(body.history).toEqual(history);
  });

  it('accepts null college_code', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ reply: 'General reply' }));

    await sendChat('Hello', null, []);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.college_code).toBeNull();
  });

  it('returns parsed ChatResponse on success', async () => {
    const chatResp = { reply: 'The fees are 50000', suggestions: ['Tell me more'] };
    fetchMock.mockResolvedValueOnce(mockResponse(chatResp));

    const result = await sendChat('Fees?', 'CE001', []);

    expect(result.reply).toBe('The fees are 50000');
    expect(result.suggestions).toEqual(['Tell me more']);
  });

  it('throws on API error', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ detail: 'Forbidden' }, 403));

    await expect(sendChat('Test', 'CE001', [])).rejects.toThrow('Chat failed: 403');
  });
});

// ============================================================
// exportCsv
// ============================================================

describe('exportCsv', () => {
  it('POSTs to the csv endpoint with colleges array in body', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 200, { isArrayBuffer: true }));

    await exportCsv([sampleCollegeDetail]);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/export/csv`);
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body.colleges).toHaveLength(1);
    expect(body.colleges[0].code).toBe('CE001');
  });

  it('writes base64-encoded content to cacheDirectory with .csv filename', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 200, { isArrayBuffer: true }));

    await exportCsv([sampleCollegeDetail]);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/college_research.csv',
      expect.any(String),
      { encoding: 'base64' }
    );
  });

  it('calls Sharing.shareAsync with text/csv mime type', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 200, { isArrayBuffer: true }));

    await exportCsv([sampleCollegeDetail]);

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/college_research.csv',
      expect.objectContaining({ mimeType: 'text/csv' })
    );
  });

  it('throws on non-ok response without writing any file', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 422));

    await expect(exportCsv([sampleCollegeDetail])).rejects.toThrow('Export failed: 422');
    expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});

// ============================================================
// exportWord
// ============================================================

describe('exportWord', () => {
  it('POSTs to the word endpoint', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 200, { isArrayBuffer: true }));

    await exportWord([sampleCollegeDetail]);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/export/word`);
  });

  it('writes base64 content to cacheDirectory with .docx filename', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 200, { isArrayBuffer: true }));

    await exportWord([sampleCollegeDetail]);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/college_research.docx',
      expect.any(String),
      { encoding: 'base64' }
    );
  });

  it('calls Sharing.shareAsync with the docx mime type', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 200, { isArrayBuffer: true }));

    await exportWord([sampleCollegeDetail]);

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/college_research.docx',
      expect.objectContaining({
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    );
  });

  it('throws on non-ok response without writing any file', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, 500));

    await expect(exportWord([sampleCollegeDetail])).rejects.toThrow('Export failed: 500');
    expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
