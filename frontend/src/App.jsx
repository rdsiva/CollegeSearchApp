import { useState } from 'react';
import { SessionProvider } from './context/SessionContext';
import { ChatProvider } from './context/ChatContext';
import { CompareProvider } from './context/CompareContext';
import Home from './pages/Home';
import ChatWidget from './components/ChatWidget';
import CompareBar from './components/CompareBar';
import CompareModal from './components/CompareModal';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import './index.css';

export default function App() {
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

  return (
    <SessionProvider>
      <ChatProvider>
        <CompareProvider>
          <Home />
          <Footer
            onOpenTerms={() => setLegalModal('terms')}
            onOpenPrivacy={() => setLegalModal('privacy')}
          />
          <ChatWidget />
          <CompareBar />
          <CompareModal />
          <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
        </CompareProvider>
      </ChatProvider>
    </SessionProvider>
  );
}
