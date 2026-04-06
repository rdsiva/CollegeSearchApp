import { useState } from 'react';

const CATEGORIES = ['OC', 'BC', 'BCM', 'MBC', 'SC', 'ST', 'SCA'];
const COURSES = [
  'Computer Science and Engineering',
  'Information Technology',
  'Artificial Intelligence and Data Science',
  'Artificial Intelligence and Machine Learning',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Cyber Security',
  'Robotics and Automation',
];
const YEARS = [
  { value: '2026', label: '2026 Predicted' },
  { value: '2025', label: '2025 Expected' },
  { value: '2024', label: '2024 Actual' },
];

export default function CutoffSearchForm({ onSearch, loading }) {
  const [mark, setMark] = useState('');
  const [category, setCategory] = useState('OC');
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [year, setYear] = useState('2026');

  const allSelected = selectedCourses.size === 0;

  const toggleCourse = (course) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(course)) next.delete(course);
      else next.add(course);
      return next;
    });
  };

  const handleAllCoursesToggle = () => {
    setSelectedCourses(new Set());
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!mark) return;
    onSearch({
      type: 'cutoff',
      mark: parseFloat(mark),
      category,
      courses: selectedCourses.size > 0 ? Array.from(selectedCourses) : [],
      year,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Your Cutoff Mark</label>
        <input
          type="number"
          value={mark}
          onChange={(e) => setMark(e.target.value)}
          placeholder="e.g. 192.5"
          min="0"
          max="200"
          step="0.25"
          className="w-36 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-56">
        <label className="text-xs font-medium text-gray-600">
          Preferred Courses
          {selectedCourses.size > 0 && (
            <span className="ml-1 text-blue-600">({selectedCourses.size} selected)</span>
          )}
        </label>
        <div className="border border-gray-300 rounded-lg bg-white p-2 max-h-44 overflow-y-auto space-y-1">
          <label className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleAllCoursesToggle}
              className="accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">All Courses</span>
          </label>
          <div className="border-t border-gray-100 my-1" />
          {COURSES.map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedCourses.has(c)}
                onChange={() => toggleCourse(c)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Cutoff Year</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {YEARS.map((y) => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || !mark}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Searching...' : 'Find Colleges'}
      </button>
    </form>
  );
}
