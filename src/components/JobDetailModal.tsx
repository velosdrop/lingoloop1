import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, JobApplication, Profile } from '../types';
import { getJobById, submitApplication, subscribeJobApplications, subscribeTranslatorJobApplication } from '../lib/firebase';
import { 
  X, 
  MapPin, 
  Clock, 
  DollarSign, 
  Globe2, 
  Building, 
  Sparkles, 
  Info, 
  ChevronsRight, 
  CheckCircle2, 
  Loader2,
  FileText
} from 'lucide-react';

interface JobDetailModalProps {
  jobId: string;
  currentUser: Profile | null;
  onClose: () => void;
  onNavigateToAuth: (role: 'translator' | 'company') => void;
}

export default function JobDetailModal({ jobId, currentUser, onClose, onNavigateToAuth }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  
  // Application fields
  const [coverLetter, setCoverLetter] = useState('');
  const [rateProposal, setRateProposal] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Confetti particles generator on success
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number; angle: number; speed: number }[]>([]);

  useEffect(() => {
    if (successMsg) {
      const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#10B981', '#3B82F6', '#8B5CF6'];
      const particles = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        x: 0,
        y: 0,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 8 + 6,
        delay: Math.random() * 0.25,
        angle: Math.random() * 360,
        speed: Math.random() * 6 + 5,
      }));
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [successMsg]);

  // Fetch Job details on Mount
  useEffect(() => {
    let active = true;
    const fetchJob = async () => {
      try {
        const j = await getJobById(jobId);
        if (active) {
          setJob(j);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchJob();

    // Subscribe specifically to the current translator's application for this job (respects security rules & limits access)
    let unsubscribe = () => {};
    if (currentUser && currentUser.role === 'translator') {
      unsubscribe = subscribeTranslatorJobApplication(jobId, currentUser.uid, (apps) => {
        if (active) {
          setApplications(apps);
        }
      });
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [jobId, currentUser]);

  // Check if current user is a translator and has already applied
  const hasApplied = currentUser 
    ? applications.some((app) => app.translatorId === currentUser.uid)
    : false;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (currentUser.role !== 'translator') return;
    
    setErrorMsg('');
    if (!coverLetter.trim() || !rateProposal.trim()) {
      setErrorMsg('Please specify both rate and professional cover statement.');
      return;
    }

    setSubmitLoading(true);
    try {
      await submitApplication({
        jobId,
        jobTitle: job?.title || 'Translation Brief',
        translatorId: currentUser.uid,
        translatorName: currentUser.name,
        translatorEmail: currentUser.email,
        translatorLanguages: currentUser.languages || [],
        translatorRate: currentUser.rate || '',
        coverLetter,
        rateProposal,
        companyId: job?.companyId || ''
      });
      setSuccessMsg(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not post candidate application document.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in fade-in zoom-in duration-200">
        
        {/* Navigation Modal Close Topbar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-brand bg-white flex items-center justify-center p-0.5">
              <img 
                src="/src/assets/images/lingoloop_logo_1781791670180.jpg" 
                alt="LingoLoop Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-bold text-gray-500 font-display">LingoLoop translation Details</span>
          </div>
          <button 
            id="close-job-detail-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOADING STATE VIEW */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
            <p className="text-gray-500 text-xs font-mono">Fetching translation specification...</p>
          </div>
        ) : !job ? (
          <div className="py-20 text-center space-y-3">
            <Info className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-gray-700 font-bold">Translation job missing</p>
            <p className="text-gray-400 text-xs">This briefing may have been deleted or archived.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Identity Board */}
            <div className="pb-6 border-b border-gray-100 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-orange-50 text-brand-dark px-3 py-1 rounded-xl text-xs font-black font-mono uppercase inline-flex items-center gap-1 border border-brand/5">
                  <Globe2 className="w-3.5 h-3.5" />
                  {job.languagePair}
                </span>
                <span className="bg-orange-100/50 text-gray-600 px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {job.location}
                </span>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 font-display tracking-tight leading-[1.2]">
                  {job.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-orange-200">
                    <img 
                      src={job.companyLogoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.companyName)}`}
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    Sourced by <span className="font-extrabold text-gray-700">{job.companyName}</span>
                  </span>
                </div>
              </div>

              {/* Tag information cards */}
              <div className="grid grid-cols-2 gap-4 bg-orange-50/40 p-4 rounded-2xl border border-orange-100/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand border border-orange-100/50 shadow-sm shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Payout Value</span>
                    <span className="text-sm font-extrabold text-brand-dark font-mono">{job.budget}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand border border-orange-100/50 shadow-sm shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Deliverable</span>
                    <span className="text-sm font-bold text-gray-700">{job.deadline}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description details body lines */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 mb-2">Scope of translation work</h4>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  {job.description}
                </p>
              </div>

              {job.requirements && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 mb-1.55">Prerequisites & context details</h4>
                  <div className="p-4 bg-brand-light/30 border border-brand/5 text-gray-700 rounded-xl text-xs flex gap-2">
                    <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <span>{job.requirements}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CANDIDATE APPLY WORKSPACE FOOTER SECTION */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              {!currentUser ? (
                // 1. Unauthenticated users banner options
                <div className="bg-orange-50/50 border border-orange-200/60 p-5 rounded-2xl text-center space-y-4">
                  <p className="text-sm text-gray-650 font-medium">
                    You must possess a certified translator profile to apply for this translation job.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      id="detail-login-transl-btn"
                      onClick={() => onNavigateToAuth('translator')}
                      className="bg-brand hover:bg-brand-dark text-white rounded-xl px-4 py-2 text-xs font-bold shadow transition-all cursor-pointer"
                    >
                      Login as Translator
                    </button>
                    <button
                      id="detail-register-transl-btn"
                      onClick={() => onNavigateToAuth('translator')}
                      className="bg-white border border-brand text-brand rounded-xl px-4 py-2 text-xs font-bold hover:bg-brand-light transition-all cursor-pointer"
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              ) : currentUser.role === 'company' ? (
                // 2. Company warning banner
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs text-gray-500 flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    Your profile is categorized as a **Company**. Translators Dashboard members only are allowed to submit applications for localization tasks.
                  </span>
                </div>
              ) : hasApplied ? (
                // 3. User already applied success banner
                <div className="bg-green-50 border border-green-200 p-5 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                  <h4 className="font-bold text-green-800 text-sm">Application already submitted</h4>
                  <p className="text-green-600 text-xs leading-relaxed max-w-sm mx-auto">
                    You have successfully submitted your localization proposal. The company team can inspect your portfolio credentials and launch contacts.
                  </p>
                </div>
              ) : successMsg ? (
                // 4. Submission complete positive success visual with confetti & checkmark animation
                <div className="relative overflow-visible bg-green-50/70 border border-green-200 p-8 rounded-3xl text-center space-y-4">
                  {/* Confetti Explosion Area */}
                  <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {confetti.map((p) => (
                      <motion.div
                        key={p.id}
                        className="absolute rounded-full"
                        style={{
                          backgroundColor: p.color,
                          width: p.size,
                          height: p.size,
                          left: '50%',
                          top: '30%',
                        }}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                          x: [
                            0, 
                            Math.cos(p.angle * Math.PI / 180) * p.speed * 20, 
                            Math.cos(p.angle * Math.PI / 180) * p.speed * 24
                          ],
                          y: [
                            0, 
                            Math.sin(p.angle * Math.PI / 180) * p.speed * 20 - 40, 
                            Math.sin(p.angle * Math.PI / 180) * p.speed * 24 + 100
                          ],
                          scale: [0, 1.2, 1, 0],
                          opacity: [1, 1, 0.8, 0],
                          rotate: [0, Math.random() * 360],
                        }}
                        transition={{
                          duration: 1.8,
                          delay: p.delay,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>

                  {/* Pulsing ring background & scale in checkmark */}
                  <div className="relative flex justify-center">
                    <motion.div
                      className="absolute w-16 h-16 bg-green-100 rounded-full"
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.15, 0.6] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: 'spring', 
                        damping: 12, 
                        stiffness: 150, 
                        delay: 0.1 
                      }}
                      className="relative w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg"
                    >
                      <svg 
                        className="w-9 h-9 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={3}
                      >
                        <motion.path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="space-y-2 relative z-10"
                  >
                    <h4 className="font-extrabold text-green-900 text-lg font-display">
                      Application Sent Successfully!
                    </h4>
                    <p className="text-green-700 text-xs leading-relaxed max-w-sm mx-auto">
                      Your bid was safely transmitted. Monitor the status of your translation proposals anytime on your Translator dashboard in real-time!
                    </p>
                  </motion.div>
                </div>
              ) : (
                // 5. Eligible Apply Form panel interface
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                  <h3 className="font-bold text-gray-900 font-display text-sm flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-brand" />
                    <span>Submit Translation Proposal</span>
                  </h3>

                  {errorMsg && (
                    <div className="bg-red-50 text-red-700 border border-red-200 text-xs font-semibold p-3.5 rounded-xl flex gap-1.5 shrink-0">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 font-bold text-xs mb-1">My Proposed Rate ($)*</label>
                        <input
                          id="calc-proposal-rate"
                          type="text"
                          required
                          placeholder="e.g. $45/hour or $350 flat"
                          value={rateProposal}
                          onChange={(e) => setRateProposal(e.target.value)}
                          className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-bold text-xs mb-1">My Native Target Language</label>
                        <input
                          type="text"
                          disabled
                          className="w-full bg-gray-100 text-gray-500 px-3 py-2 border border-gray-150 rounded-xl text-xs font-medium cursor-not-allowed"
                          value={currentUser.languages?.join(', ') || ''}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-600 font-bold text-xs mb-1">Pitch / cover Letter Notes*</label>
                      <textarea
                        id="calc-proposal-cover"
                        rows={3}
                        required
                        placeholder="State why you are qualified for this translation task (mention expertise, industry jargon, and speed)..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      />
                    </div>

                    <button
                      id="apply-brief-submit-btn"
                      type="submit"
                      disabled={submitLoading}
                      className="w-full bg-brand hover:bg-brand-dark disabled:bg-orange-300 text-white rounded-xl py-3 font-bold text-xs shadow-md shadow-brand/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {submitLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transmitting application...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Proposal Bid</span>
                          <ChevronsRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
