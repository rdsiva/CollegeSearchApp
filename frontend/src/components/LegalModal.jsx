import { X, ExternalLink } from 'lucide-react';

const CONTACT_EMAIL = 'contact@tncollegeapp.com';
const APP_NAME = 'TN College Research Assistant';
const LAST_UPDATED = 'April 2026';

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
      <div className="text-sm text-gray-600 space-y-2">{children}</div>
    </div>
  );
}

function TermsContent() {
  return (
    <>
      <p className="text-sm text-gray-500 mb-6">Last updated: {LAST_UPDATED}</p>

      <p className="text-sm text-gray-600 mb-6">
        By using <strong>{APP_NAME}</strong> ("the Service"), you agree to these Terms and Conditions.
        Please read them carefully before using the Service.
      </p>

      <Section title="1. Purpose and Scope">
        <p>
          This Service is an independent educational tool designed to assist students in researching
          Tamil Nadu engineering colleges and TNEA (Tamil Nadu Engineering Admissions) cutoff data.
          It is not affiliated with, endorsed by, or associated with Anna University, TNEA, or any
          government body.
        </p>
      </Section>

      <Section title="2. Data Accuracy Disclaimer">
        <p>
          All cutoff marks, fees, placement statistics, and college information presented on this
          platform are <strong>estimates and approximations</strong> compiled from publicly available
          sources including official TNEA publications, college websites, and third-party review
          platforms.
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Cutoff marks for 2025 (expected) and 2026 (predicted) are projections based on
              historical trends and AI analysis — <strong>they are not official figures</strong>.</li>
          <li>Actual cutoffs are determined solely by TNEA after each academic year's results.</li>
          <li>Fee structures are indicative and may be revised by the college or regulatory bodies
              at any time.</li>
          <li>Placement statistics are sourced from available public data and may not reflect the
              most recent academic year.</li>
        </ul>
      </Section>

      <Section title="3. No Warranty">
        <p>
          The Service is provided <strong>"as is"</strong> without warranty of any kind, express or
          implied. We do not guarantee the accuracy, completeness, timeliness, or suitability of
          any information for any particular purpose. You should always verify critical information
          directly with the respective college and the official{' '}
          <strong>TNEA website (tnea.ac.in)</strong> before making any admissions decisions.
        </p>
      </Section>

      <Section title="4. AI-Generated Content">
        <p>
          This Service uses AI (Claude by Anthropic) to generate summaries, predict cutoffs, and
          answer questions. AI-generated content may contain inaccuracies and should be treated as
          a starting point for research, not as definitive advice. Do not base any academic or
          financial decisions solely on AI-generated content from this platform.
        </p>
      </Section>

      <Section title="5. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, the developers of this Service shall not be
          liable for any direct, indirect, incidental, or consequential damages arising from your
          use of, or reliance on, any information provided — including but not limited to incorrect
          cutoff predictions, fee estimates, or college rankings.
        </p>
      </Section>

      <Section title="6. Third-Party Services">
        <p>
          This Service integrates with Google Places API, YouTube Data API, and Anthropic Claude API
          to enrich college information. Use of these integrations is subject to the respective
          providers' terms of service. We are not responsible for data accuracy from third-party
          sources.
        </p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          All original content, UI design, and code in this Service are the intellectual property
          of the developer. TNEA cutoff data is sourced from public government records.
        </p>
      </Section>

      <Section title="8. Changes to Terms">
        <p>
          These Terms may be updated periodically. Continued use of the Service after changes are
          posted constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          For questions, corrections, or concerns regarding these Terms, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline font-medium">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </Section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="text-sm text-gray-500 mb-6">Last updated: {LAST_UPDATED}</p>

      <p className="text-sm text-gray-600 mb-6">
        Your privacy is important to us. This Privacy Policy explains what information is collected
        when you use <strong>{APP_NAME}</strong> and how it is handled.
      </p>

      <Section title="1. Information We Do Not Collect">
        <p>
          We do not collect, store, or process any personally identifiable information (PII).
          Specifically:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>No account registration or login is required.</li>
          <li>No name, email, phone number, or contact details are collected.</li>
          <li>No payment information is collected — the Service is free to use.</li>
          <li>Your favorites and search history exist only in your browser's session memory and
              are erased when you close the tab.</li>
        </ul>
      </Section>

      <Section title="2. Session Data">
        <p>
          All data you interact with (favorites, comparisons, search results) is held exclusively
          in your browser's in-memory state (React Context). <strong>Nothing is sent to or stored
          on our servers</strong> between sessions. Refreshing or closing the page clears all
          session data permanently.
        </p>
      </Section>

      <Section title="3. Automatically Collected Data">
        <p>
          When you use the Service, our backend server may log standard technical information
          including:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>IP address (for rate limiting and abuse prevention)</li>
          <li>Search queries submitted to the API</li>
          <li>Timestamp and endpoint accessed</li>
        </ul>
        <p className="mt-2">
          These logs are used solely for debugging and security purposes and are not shared with
          third parties.
        </p>
      </Section>

      <Section title="4. Third-Party APIs">
        <p>
          To enrich college data, this Service makes server-side calls to the following third-party
          APIs. Your browser does not communicate directly with these services:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Google Places API</strong> — retrieves college ratings and public reviews</li>
          <li><strong>YouTube Data API</strong> — retrieves publicly available video information</li>
          <li><strong>Anthropic Claude API</strong> — processes review text to generate summaries
              and answer chat questions</li>
        </ul>
        <p className="mt-2">
          Search queries (college names/codes) may be transmitted to these APIs as part of normal
          operation. No personal data about you is transmitted.
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          This Service does not use cookies, tracking pixels, or any persistent client-side storage
          (localStorage, IndexedDB). No tracking or analytics scripts are loaded.
        </p>
      </Section>

      <Section title="6. Children's Privacy">
        <p>
          This Service does not knowingly collect data from users under the age of 13. If you
          believe a child has submitted personal data, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline font-medium">
            {CONTACT_EMAIL}
          </a>{' '}
          and we will promptly address it.
        </p>
      </Section>

      <Section title="7. Changes to This Policy">
        <p>
          This Privacy Policy may be updated periodically. The "Last updated" date at the top of
          this page reflects the most recent revision.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          For privacy-related questions or requests, reach us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline font-medium">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </Section>
    </>
  );
}

export default function LegalModal({ type, onClose }) {
  if (!type) return null;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms & Conditions' : 'Privacy Policy';

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400">{APP_NAME}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {isTerms ? <TermsContent /> : <PrivacyContent />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            Questions? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
