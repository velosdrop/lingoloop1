import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getProfile, subscribeJobs } from './lib/firebase';
import { Profile, Job } from './types';

// Page components
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import TranslatorDashboard from './components/TranslatorDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import JobDetailModal from './components/JobDetailModal';

import { Loader2, Globe2, Sparkles, LogOut, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'translator-dashboard' | 'company-dashboard'>('landing');
  const [initialAuthUserType, setInitialAuthUserType] = useState<'translator' | 'company'>('translator');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Real-time landing/global jobs
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  // 1. Subscribe to Auth changes and restore session
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom firestore profile
        const userProfile = await getProfile(firebaseUser.uid);
        if (userProfile) {
          setCurrentUser(userProfile);
          if (userProfile.role === 'translator') {
            setCurrentView('translator-dashboard');
          } else {
            setCurrentView('company-dashboard');
          }
        } else {
          // If profile does not exist somehow (maybe deleted or partially registered), clear state
          setCurrentUser(null);
          setCurrentView('landing');
        }
      } else {
        setCurrentUser(null);
        setCurrentView('landing');
      }
      setAuthChecked(true);
    });

    // 2. Subscribe to landing page jobs feed
    const unsubscribeJobs = subscribeJobs((jobs) => {
      setAllJobs(jobs);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeJobs();
    };
  }, []);

  const handleNavigate = (view: typeof currentView, params?: { userType?: 'company' | 'translator' }) => {
    if (params?.userType) {
      setInitialAuthUserType(params.userType);
    }
    setCurrentView(view);
  };

  const handleAuthSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    if (profile.role === 'translator') {
      setCurrentView('translator-dashboard');
    } else {
      setCurrentView('company-dashboard');
    }
  };

  // Loader screen before app boots
  if (!authChecked) {
    return (
      <div className="bg-brand-light min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand bg-white flex items-center justify-center p-1 shadow-md animate-bounce">
            <img 
              src="/src/assets/images/lingoloop_logo_1781791670180.jpg" 
              alt="LingoLoop Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display text-center flex items-center gap-1">
              Lingo<span className="text-brand">Loop</span>
            </h1>
            <p className="text-[10px] text-brand/80 font-mono text-center block mt-0.5 tracking-widest font-extrabold uppercase">Chinese Translation</p>
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-medium text-xs font-mono mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span>Establishing cloud session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative antialiased selection:bg-brand selection:text-white">
      {/* View routing router switch */}
      <main className="w-full h-full">
        {currentView === 'landing' && (
          <LandingPage 
            onNavigate={handleNavigate} 
            featuredJobs={allJobs} 
            onViewJob={(id) => setSelectedJobId(id)}
          />
        )}

        {currentView === 'auth' && (
          <AuthScreen 
            initialUserType={initialAuthUserType} 
            onBack={() => handleNavigate('landing')} 
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {currentView === 'translator-dashboard' && currentUser && (
          <TranslatorDashboard 
            translatorProfile={currentUser} 
            onViewJob={(id) => setSelectedJobId(id)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'company-dashboard' && currentUser && (
          <CompanyDashboard 
            companyProfile={currentUser} 
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Global Job Detail Overlay Drawer */}
      {selectedJobId && (
        <JobDetailModal 
          jobId={selectedJobId} 
          currentUser={currentUser} 
          onClose={() => setSelectedJobId(null)}
          onNavigateToAuth={(roleType) => {
            setSelectedJobId(null);
            handleNavigate('auth', { userType: roleType });
          }}
        />
      )}
    </div>
  );
}
