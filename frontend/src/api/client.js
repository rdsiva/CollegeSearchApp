import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
});

export default api;

export async function searchColleges({ q, type, mark, category, course, year, district }) {
  const params = { type };
  if (q) params.q = q;
  if (mark !== undefined) params.mark = mark;
  if (category) params.category = category;
  if (course) params.course = course;
  if (year) params.year = year;
  if (district) params.district = district;
  const res = await api.get('/search', { params });
  return res.data;
}

export async function researchColleges(collegeCodes) {
  // LLM summarization + per-course cutoff prediction can take 30-60s per college,
  // and the call runs all colleges in parallel server-side — give it generous headroom.
  const timeout = Math.max(120000, (collegeCodes?.length || 1) * 60000);
  const res = await api.post('/colleges/research', { college_codes: collegeCodes }, { timeout });
  return res.data;
}

// Async queue: start a job, then poll for state.
export async function startResearchJob(collegeCodes) {
  const res = await api.post(
    '/colleges/research/start',
    { college_codes: collegeCodes },
    { timeout: 10000 },
  );
  return res.data; // { id, codes, status, results, errors, completed, progress, ... }
}

export async function getResearchJob(jobId) {
  const res = await api.get(`/colleges/research/job/${jobId}`, { timeout: 10000 });
  return res.data;
}

export async function exportCsv(colleges) {
  const res = await api.post('/export/csv', { colleges }, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'college_research.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function sendChat({ message, collegeCode, history }) {
  const res = await api.post('/chat', {
    message,
    college_code: collegeCode || null,
    history: history || [],
  }, { timeout: 90000 });  // local LLM can be slower than Anthropic
  return res.data;
}

export async function exportWord(colleges) {
  const res = await api.post('/export/word', { colleges }, { responseType: 'blob' });
  const url = URL.createObjectURL(
    new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'college_research.docx';
  a.click();
  URL.revokeObjectURL(url);
}
