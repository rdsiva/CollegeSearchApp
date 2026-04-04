import { AlertTriangle } from 'lucide-react';

export default function Footer({ onOpenTerms, onOpenPrivacy }) {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white no-print">
      {/* Disclaimer banner */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> Cutoff marks, fees, and placement data shown on this
            platform are estimates compiled from publicly available sources. 2025 (expected) and
            2026 (predicted) cutoffs are AI-generated projections based on historical TNEA trends —
            they are <strong>not official figures</strong>. Actual values may vary each year based on
            seat availability, reservation policies, and applicant demand. Always verify with the
            official <strong>TNEA portal (tnea.ac.in)</strong> and the respective college before
            making any admission decisions.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} TN College Research Assistant. For educational purposes only.</p>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenTerms}
            className="hover:text-gray-700 hover:underline transition-colors"
          >
            Terms &amp; Conditions
          </button>
          <span>·</span>
          <button
            onClick={onOpenPrivacy}
            className="hover:text-gray-700 hover:underline transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </footer>
  );
}
