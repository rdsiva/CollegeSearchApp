import { Loader2, CheckCircle2, AlertTriangle, X, FlaskConical } from 'lucide-react';

/**
 * Renders the in-flight + recently-completed research jobs. Driven entirely
 * by `jobs` props; polling lives in the parent so the queue stays a pure view.
 *
 * Each job: { id, codes, status, completed: string[], errors: {code: msg},
 *             progress: { done, total }, finished_at, started_at }
 */
export default function ResearchQueue({ jobs, onDismiss, codeToName = {} }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="space-y-2 no-print">
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className="text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-700">Research Queue</h2>
        <span className="text-xs text-gray-400">{jobs.length} active</span>
      </div>
      <ul className="space-y-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobCard job={job} onDismiss={onDismiss} codeToName={codeToName} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function JobCard({ job, onDismiss, codeToName }) {
  const isDone = job.status === 'completed' || job.status === 'failed';
  const hasErrors = Object.keys(job.errors || {}).length > 0;
  const pct = job.progress.total > 0
    ? Math.round((job.progress.done / job.progress.total) * 100)
    : 0;

  const collegeLabel = (code) => codeToName[code] || `College ${code}`;

  let icon, color, label;
  if (job.status === 'queued' || job.status === 'running') {
    icon = <Loader2 size={16} className="animate-spin text-blue-600" />;
    color = 'bg-blue-50 border-blue-200';
    label = 'In progress';
  } else if (job.status === 'failed' || (isDone && hasErrors && job.results.length === 0)) {
    icon = <AlertTriangle size={16} className="text-red-600" />;
    color = 'bg-red-50 border-red-200';
    label = 'Failed';
  } else {
    icon = <CheckCircle2 size={16} className="text-emerald-600" />;
    color = 'bg-emerald-50 border-emerald-200';
    label = hasErrors ? 'Completed with issues' : 'Completed';
  }

  return (
    <div className={`flex items-start gap-3 p-3 border rounded-xl ${color}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">
            {label} — {job.progress.done}/{job.progress.total}
          </span>
          {isDone && (
            <button
              onClick={() => onDismiss(job.id)}
              className="text-gray-400 hover:text-gray-700"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-600 truncate">
          {job.codes.map(collegeLabel).join(', ')}
        </p>
        {!isDone && (
          <div className="mt-2 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {hasErrors && (
          <ul className="mt-1 text-xs text-red-700">
            {Object.entries(job.errors).slice(0, 3).map(([code, msg]) => (
              <li key={code} className="truncate">
                <span className="font-medium">{collegeLabel(code)}:</span> {String(msg).slice(0, 120)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
