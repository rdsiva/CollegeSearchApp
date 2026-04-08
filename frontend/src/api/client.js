import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
});

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
  const res = await api.post('/colleges/research', { college_codes: collegeCodes });
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
  });
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
