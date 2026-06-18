import React, { useState, useEffect } from 'react';
import { Job, JobApplication, Profile, TriggerNotification, Review } from '../types';
import { 
  postJob, 
  subscribeJobs, 
  subscribeJobApplications, 
  updateApplicationStatus,
  subscribeTriggerNotifications,
  submitReview,
  subscribeCompanyReviews,
  updateProfile,
  db,
  auth
} from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Plus, 
  Briefcase, 
  Users, 
  Check, 
  X, 
  Clock, 
  Globe2, 
  LogOut, 
  DollarSign, 
  MapPin, 
  FileText, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Search,
  Filter,
  Star,
  RefreshCw,
  Settings
} from 'lucide-react';

interface CompanyDashboardProps {
  companyProfile: Profile;
  onNavigate: (view: 'landing' | 'auth') => void;
}

const LAN_PAIRS = [
  "English ⇄ Simplified Chinese",
  "English ⇄ Traditional Chinese",
  "English ⇄ Cantonese",
  "Spanish ⇄ Simplified Chinese",
  "French ⇄ Simplified Chinese",
  "German ⇄ Simplified Chinese",
  "Japanese ⇄ Traditional Chinese"
];

export default function CompanyDashboard({ companyProfile, onNavigate }: CompanyDashboardProps) {
  const [profile, setProfile] = useState<Profile>(companyProfile);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);

  // Search & Filter posted job briefs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState('All');

  // Triggered notifications subscription and details display
  const [notifications, setNotifications] = useState<TriggerNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<TriggerNotification | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Reviews state and rating forms variables
  const [writtenReviews, setWrittenReviews] = useState<Review[]>([]);
  const [ratingAppId, setRatingAppId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string>('');

  // Company Profile Editing States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState(profile.companyName || profile.name);
  const [editWebsite, setEditWebsite] = useState(profile.website || '');
  const [editIndustry, setEditIndustry] = useState(profile.industry || '');
  const [editAbout, setEditAbout] = useState(profile.about || '');
  const [editLogoUrl, setEditLogoUrl] = useState(profile.logoUrl || '');
  const [editEmailNotifications, setEditEmailNotifications] = useState(profile.emailNotificationsEnabled !== false);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);

  // Sync edit company fields whenever the editing modal is toggled
  useEffect(() => {
    if (isEditingProfile) {
      setEditCompanyName(profile.companyName || profile.name);
      setEditWebsite(profile.website || '');
      setEditIndustry(profile.industry || '');
      setEditAbout(profile.about || '');
      setEditLogoUrl(profile.logoUrl || '');
      setEditEmailNotifications(profile.emailNotificationsEnabled !== false);
    }
  }, [isEditingProfile, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveProfileLoading(true);
    try {
      const updatedData = {
        companyName: editCompanyName,
        website: editWebsite,
        industry: editIndustry,
        about: editAbout,
        logoUrl: editLogoUrl,
        emailNotificationsEnabled: editEmailNotifications
      };
      await updateProfile(profile.uid, updatedData);
      setProfile(prev => ({ ...prev, ...updatedData }));
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error updating company profile", err);
    } finally {
      setSaveProfileLoading(false);
    }
  };


  const filteredPostedJobs = postedJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLangFilter === 'All' || job.languagePair === selectedLangFilter;
    return matchesSearch && matchesLang;
  });
  
  // Job posting states
  const [isPostingFormOpen, setIsPostingFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newLangPair, setNewLangPair] = useState(LAN_PAIRS[0]);
  const [newLoc, setNewLoc] = useState('Remote');
  const [newReq, setNewReq] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Subscribe to this company's jobs in real-time
  useEffect(() => {
    const unsubscribe = subscribeJobs((jobs) => {
      setPostedJobs(jobs);
    }, profile.uid);

    return () => unsubscribe();
  }, [profile.uid]);

  // 1b. Subscribe to Cloud Function-triggered dispatched emails
  useEffect(() => {
    if (!profile.uid) return;
    const unsubNotifs = subscribeTriggerNotifications(profile.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubNotifs();
  }, [profile.uid]);

  // 1c. Subscribe to reviews submitted by this company
  useEffect(() => {
    if (!profile.uid) return;
    const unsubReviews = subscribeCompanyReviews(profile.uid, (reviewsList) => {
      setWrittenReviews(reviewsList);
    });
    return () => unsubReviews();
  }, [profile.uid]);

  // 2. Subscribe to applicants of selected job in real-time
  useEffect(() => {
    if (!selectedJob) {
      setApplicants([]);
      return;
    }

    const unsubscribeApps = subscribeJobApplications(selectedJob.id, (appsList) => {
      setApplicants(appsList);
    });

    return () => unsubscribeApps();
  }, [selectedJob]);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('lingoloop_demo_user');
      await signOut(auth);
      onNavigate('landing');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!newTitle.trim() || !newDesc.trim() || !newBudget.trim() || !newDeadline.trim()) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    setPostLoading(true);
    try {
      const jobId = await postJob({
        title: newTitle,
        description: newDesc,
        budget: newBudget,
        deadline: newDeadline,
        languagePair: newLangPair,
        location: newLoc,
        companyId: profile.uid,
        companyName: profile.companyName || profile.name,
        companyLogoUrl: profile.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.companyName || profile.name)}`,
        requirements: newReq
      });
      
      // Reset form on success
      setNewTitle('');
      setNewDesc('');
      setNewBudget('');
      setNewDeadline('');
      setNewReq('');
      setIsPostingFormOpen(false);
    } catch (err: any) {
      console.error("Error posting job:", err);
      setErrorMsg(err.message || 'Could not post job document.');
    } finally {
      setPostLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: JobApplication['status']) => {
    try {
      await updateApplicationStatus(appId, status);
    } catch (err) {
      console.error("Error setting applicant status:", err);
    }
  };

  const submitPerformanceReview = async (app: JobApplication) => {
    if (!selectedJob) return;
    setRatingError('');
    if (!ratingComment.trim()) {
      setRatingError('Please add feedback or a comment on the translator\'s performance.');
      return;
    }
    setRatingSubmitting(true);
    try {
      await submitReview({
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        companyId: profile.uid,
        companyName: profile.companyName || profile.name,
        translatorId: app.translatorId,
        translatorName: app.translatorName,
        rating: ratingValue,
        comment: ratingComment
      });
      // Reset form variables on success
      setRatingAppId(null);
      setRatingComment('');
      setRatingValue(5);
    } catch (err: any) {
      console.error("Error submitting performance review:", err);
      setRatingError(err.message || 'Could not submit review.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const toggleJobStatus = async (job: Job) => {
    try {
      const newStatus = job.status === 'open' ? 'closed' : 'open';
      const jobRef = doc(db, 'jobs', job.id);
      await updateDoc(jobRef, { status: newStatus });
      
      // Update selected job state in sync
      if (selectedJob && selectedJob.id === job.id) {
        setSelectedJob({ ...selectedJob, status: newStatus as 'open' | 'closed' });
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // Safe totals counters helper
  const totalApplicantsCount = postedJobs.reduce((acc, curr) => acc + (curr.applicantsCount || 0), 0);

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans flex flex-col">
      {/* Dashboard Topbar header */}
      <header className="bg-white border-b border-orange-100 px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand bg-white flex items-center justify-center p-0.5">
              <img 
                src="/src/assets/images/lingoloop_logo_1781791670180.jpg" 
                alt="LingoLoop"
                className="w-full h-full object-cover rounded-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-lg font-bold text-gray-900 font-display">Lingo<span className="text-brand">Loop</span></span>
            <span className="bg-orange-100 text-brand-dark px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase font-mono ml-2 tracking-wider">Company Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Automated Dispatch Email Alerts (Firebase Functions Triggered logs) */}
            <button
              id="company-notifications-btn"
              onClick={() => setIsNotificationPanelOpen(true)}
              className="relative text-gray-500 hover:text-brand p-2.5 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all cursor-pointer flex items-center justify-center border border-gray-150 bg-white shadow-xs"
              title="Firebase Triggered Email Logs"
            >
              <Mail className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand text-[9px] font-extrabold text-white animate-pulse shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
              onClick={() => setIsEditingProfile(true)}
              title="Edit Company Profile"
            >
              <img 
                src={profile.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.companyName || profile.name)}`} 
                alt="Company logo" 
                className="w-8 h-8 rounded-full border border-orange-200 object-cover bg-brand-light"
              />
              <span className="text-sm font-bold text-gray-700 hidden sm:inline max-w-[140px] truncate">{profile.companyName || profile.name}</span>
              <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-brand transition-colors ml-0.5" />
            </div>
            <button
              id="dash-company-logout-btn"
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-500 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 flex-grow w-full space-y-8">
        
        {/* Statistics highlights widget panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block mb-1">Active Translation Briefs</span>
              <span className="text-3xl font-extrabold text-gray-900 font-display">
                {postedJobs.filter(j => j.status === 'open').length}
              </span>
            </div>
            <div className="w-12 h-12 bg-orange-100/60 rounded-2xl flex items-center justify-center text-brand">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block mb-1">Total Candidate Apps</span>
              <span className="text-3xl font-extrabold text-gray-900 font-display">{totalApplicantsCount}</span>
            </div>
            <div className="w-12 h-12 bg-orange-100/60 rounded-2xl flex items-center justify-center text-brand">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-gray-400 font-bold text-xs uppercase tracking-wider block mb-1">Matched Speed</span>
              <span className="text-3xl font-extrabold text-green-600 font-display flex items-center gap-1">
                <TrendingUp className="w-6 h-6" /> Realtime
              </span>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <Check className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action controls button bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 font-display tracking-tight">Our Localizations Briefs</h2>
            <p className="text-gray-500 text-sm">Post active tasks and evaluate applicant portfolios securely.</p>
          </div>
          <button
            id="open-post-job-form-btn"
            onClick={() => setIsPostingFormOpen(true)}
            className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-5 py-3 font-bold text-sm shadow-lg shadow-brand/15 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Translation Job</span>
          </button>
        </div>

        {/* Content body split dashboard view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Translation Briefs Lists */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Realtime Search & Filters */}
            {postedJobs.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                  <input
                    id="company-job-search"
                    type="text"
                    placeholder="Search titles or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                </div>

                <div className="relative">
                  <select
                    id="company-job-lang-filter"
                    value={selectedLangFilter}
                    onChange={(e) => setSelectedLangFilter(e.target.value)}
                    className="w-full bg-gray-50 pl-3 pr-10 py-2 border border-gray-200 rounded-xl text-xs text-gray-750 font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="All">All Language Pairs</option>
                    {LAN_PAIRS.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}

            {postedJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-orange-150 p-12 text-center shadow-sm">
                <Briefcase className="w-10 h-10 text-brand/30 mx-auto mb-3" />
                <p className="text-gray-700 font-bold text-sm">No translation Briefs posted yet</p>
                <p className="text-gray-500 text-xs mt-1 mb-6">Create your first brief to connect with translation pools.</p>
                <button
                  onClick={() => setIsPostingFormOpen(true)}
                  className="bg-orange-50 text-brand font-bold text-xs px-4 py-2 rounded-xl hover:bg-brand-light"
                >
                  Write First Brief
                </button>
              </div>
            ) : filteredPostedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-orange-100 p-8 text-center shadow-sm">
                <Briefcase className="w-8 h-8 text-brand/35 mx-auto mb-2" />
                <p className="text-gray-700 font-bold text-xs">No matching briefs found</p>
                <p className="text-gray-500 text-[11px] mt-1 mb-4">Try altering query or resetting language filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLangFilter('All');
                  }}
                  className="bg-orange-50 text-brand font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-brand-light transition-colors"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredPostedJobs.map((job) => {
                const isCurrentSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-5 rounded-2xl border transition-all duration-150 bg-white shadow-sm cursor-pointer relative overflow-hidden flex items-center justify-between group ${
                      isCurrentSelected 
                        ? 'border-brand border-2 bg-orange-50/20' 
                        : 'border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex-grow pr-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-50/80 text-brand-dark px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono">
                          {job.languagePair}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          job.status === 'open' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 font-display line-clamp-1 group-hover:text-brand transition-colors">
                        {job.title}
                      </h4>
                      
                      <p className="text-xs text-gray-450 mt-2 flex items-center gap-4">
                        <span>Due: {job.deadline}</span>
                        <span>•</span>
                        <span className="font-extrabold text-gray-700">{job.applicantsCount || 0} applicants</span>
                      </p>
                    </div>

                    <ChevronRight className={`w-5 h-5 transition-transform shrink-0 ${
                      isCurrentSelected ? 'text-brand translate-x-1' : 'text-gray-300'
                    }`} />
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: Candidate Evaluator Panel */}
          <div className="lg:col-span-7">
            {!selectedJob ? (
              <div className="bg-white rounded-3xl border border-orange-100 p-12 text-center shadow-sm">
                <Users className="w-12 h-12 text-brand/30 mx-auto mb-4 animate-bounce" />
                <h3 className="font-bold text-gray-900 font-display text-base">Select translation Brief</h3>
                <p className="text-gray-500 text-xs mt-1.5 max-w-xs mx-auto">
                  Click on one of your posted briefs on the left to evaluate all translator proposals and profiles in real-time.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-orange-100 p-6 md:p-8 shadow-sm space-y-6">
                
                {/* Header panel details */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between border-b border-gray-100 pb-5 gap-4">
                  <div>
                    <span className="bg-orange-50 text-brand-dark px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase block w-max mb-1.5">
                      {selectedJob.languagePair}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 font-display">
                      {selectedJob.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium font-mono mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Deadline: {selectedJob.deadline}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="toggle-job-status-btn"
                      onClick={() => toggleJobStatus(selectedJob)}
                      className={`text-xs px-3 py-1.5 font-bold rounded-xl border transition-all cursor-pointer ${
                        selectedJob.status === 'open'
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-150'
                      }`}
                    >
                      {selectedJob.status === 'open' ? 'Close Brief' : 'Open Brief'}
                    </button>
                  </div>
                </div>

                {/* Brief description */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 mb-1.5">Brief description</h4>
                  <p className="text-gray-650 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100/60">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Candidates List panel lists */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-t border-gray-50 pt-5">
                    <h4 className="text-xs uppercase tracking-wider font-extrabold text-gray-400">
                      Applicants ({applicants.length})
                    </h4>
                  </div>

                  {applicants.length === 0 ? (
                    <div className="bg-brand-light/30 border border-dashed border-orange-150 rounded-2xl p-8 text-center">
                      <Users className="w-8 h-8 text-brand/35 mx-auto mb-2" />
                      <p className="text-gray-600 font-bold text-xs">No pending candidates yet</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">We notify you instantly when translators apply!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applicants.map((app) => {
                        const existingReview = writtenReviews.find(
                          (r) => r.jobId === selectedJob?.id && r.translatorId === app.translatorId
                        );
                        return (
                          <div key={app.id} className="border border-orange-100 bg-white rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                            
                            {/* Translator identity header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-light border border-orange-200">
                                  <img 
                                    src={app.translatorLanguages?.[0] ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(app.translatorName)}` : ''} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-900 font-display text-sm">{app.translatorName}</h5>
                                  <p className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-3">
                                    <span className="flex items-center gap-0.5 text-orange-600"><DollarSign className="w-3.5 h-3.5" /> Proposal: {app.rateProposal}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Options accept vs decline */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {app.status === 'accepted' ? (
                                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Authorized Accept
                                  </span>
                                ) : app.status === 'declined' ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" /> Declined
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      id={`decline-app-${app.id}`}
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'declined')}
                                      className="p-1.5 font-bold border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                                      title="Decline Candidate"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <button
                                      id={`accept-app-${app.id}`}
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                                      className="p-1.5 font-bold border border-green-200 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all cursor-pointer"
                                      title="Accept & Grant Work"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Cover letter detail lines */}
                            <div className="bg-orange-50/40 border border-orange-100/50 p-4 rounded-xl text-xs text-gray-700">
                              <span className="font-bold text-gray-500 block mb-1">Statement cover Letter</span>
                              <p className="whitespace-pre-line leading-relaxed italic">
                                "{app.coverLetter}"
                              </p>
                            </div>

                            {/* Performance rating display or review feedback leaving form */}
                            {app.status === 'accepted' && (
                              <div className="border-t border-gray-100/85 pt-4 mt-3">
                                {existingReview ? (
                                  <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Rated Performance
                                      </span>
                                      <span className="text-[10px] font-mono text-gray-400">
                                        Completed
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((sVal) => (
                                        <Star
                                          key={sVal}
                                          className={`w-3.5 h-3.5 ${
                                            sVal <= existingReview.rating
                                              ? 'text-amber-500 fill-amber-500'
                                              : 'text-gray-200'
                                          }`}
                                        />
                                      ))}
                                      <span className="text-xs font-bold text-gray-700 ml-1.5">
                                        ({existingReview.rating} / 5)
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-sans italic leading-relaxed">
                                      "{existingReview.comment}"
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    {ratingAppId === app.id ? (
                                      <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100/60 space-y-4 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-extrabold text-gray-700">Write Translator Review</span>
                                          <button
                                            type="button"
                                            onClick={() => setRatingAppId(null)}
                                            className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>

                                        {/* Star rating selector */}
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-450 block mb-1.5">Rating Score</span>
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRatingValue(star)}
                                                className="hover:scale-105 transition-transform cursor-pointer focus:outline-none"
                                              >
                                                <Star
                                                  className={`w-6 h-6 transition-colors ${
                                                    star <= ratingValue
                                                      ? 'text-amber-500 fill-amber-500'
                                                      : 'text-gray-300 hover:text-amber-405'
                                                  }`}
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Comment box */}
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-455 block mb-1">Written Feedback on Performance</span>
                                          <textarea
                                            rows={2}
                                            value={ratingComment}
                                            onChange={(e) => setRatingComment(e.target.value)}
                                            placeholder="Leave feedback explaining translator response times, quality of deliverables, and subject mastery..."
                                            className="w-full text-xs text-gray-750 bg-white border border-gray-200 focus:border-brand rounded-lg p-2.5 outline-none resize-none"
                                          />
                                        </div>

                                        {ratingError && (
                                          <p className="text-xs text-red-500 font-medium">{ratingError}</p>
                                        )}

                                        <button
                                          type="button"
                                          disabled={ratingSubmitting}
                                          onClick={() => submitPerformanceReview(app)}
                                          className="w-full inline-flex items-center justify-center bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                                        >
                                          {ratingSubmitting ? 'Saving Review...' : 'Post Star Rating & Comment'}
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRatingAppId(app.id);
                                          setRatingValue(5);
                                          setRatingComment('');
                                          setRatingError('');
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 text-xs font-bold text-gray-800 rounded-xl cursor-pointer shadow-xs transition-colors"
                                      >
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        <span>Leave Star Rating & Comment</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Contact communication link */}
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 border-t border-gray-50 pt-3">
                              <span className="flex items-center gap-1"><Mail className="w-4 h-4 text-gray-400" /> {app.translatorEmail}</span>
                              <a 
                                href={`mailto:${app.translatorEmail}?subject=LingoLoop Inquiry: ${encodeURIComponent(selectedJob.title)}`}
                                className="text-brand hover:text-brand-dark flex items-center gap-1 hover:underline"
                              >
                                <span>Launch Chat Email</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DETAILED NEW BRIEF WRITER MODAL DRAWER */}
      {isPostingFormOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 font-display text-lg">Write Translation Brief</h3>
              </div>
              <button
                id="close-post-job-modal"
                onClick={() => setIsPostingFormOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-xs font-semibold mb-4 flex items-start gap-2 shrink-0">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostJobSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Job Title / task Name*</label>
                <input
                  id="post-job-title"
                  type="text"
                  required
                  placeholder="e.g. Traditional Chinese Subtitling for Indie Game"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Base Target Language*</label>
                  <select
                    id="post-job-lang"
                    value={newLangPair}
                    onChange={(e) => setNewLangPair(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium"
                  >
                    {LAN_PAIRS.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Location Details*</label>
                  <input
                    id="post-job-location"
                    type="text"
                    required
                    placeholder="e.g. Remote or Beijing (On-site)"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Max Budget Context*</label>
                  <input
                    id="post-job-budget"
                    type="text"
                    required
                    placeholder="e.g. $800 flat or $45/hour"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Completion Deadline*</label>
                  <input
                    id="post-job-deadline"
                    type="text"
                    required
                    placeholder="e.g. July 15, 2026"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Work Description & Scope*</label>
                <textarea
                  id="post-job-desc"
                  rows={4}
                  required
                  placeholder="Detail the localized tasks, files format, context information, and expectations of vocabulary..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Special requirements (Optional)</label>
                <input
                  id="post-job-requirements"
                  type="text"
                  placeholder="e.g. Prior localization of RPG games or certification from ATA"
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3 font-semibold font-sans">
                <button
                  type="button"
                  onClick={() => setIsPostingFormOpen(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="post-job-submit"
                  type="submit"
                  disabled={postLoading}
                  className="bg-brand hover:bg-brand-dark text-white text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  {postLoading ? 'Posting...' : 'Save & Publish Brief'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud-Triggered Email Dispatch Monitor Panel */}
      {isNotificationPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-gray-55 border border-gray-200 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Header section */}
            <div className="bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-lg font-black text-gray-900 font-display tracking-tight">
                    Firebase Cloud Triggers
                  </h3>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  Automated candidate application digest dispatches compiled and sent via active Firestore Functions triggers.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNotificationPanelOpen(false);
                  setSelectedNotification(null);
                }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split layout: List on left, HTML preview on right */}
            <div className="flex-grow flex overflow-hidden min-h-0 bg-gray-50">
              {notifications.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-white">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-brand/60 mb-4 border border-orange-100/50">
                    <Mail className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-gray-800 text-base font-display">No triggered alerts dispatched yet</h4>
                  <p className="text-gray-400 text-xs max-w-sm mt-1 leading-relaxed">
                    Whenever a translator uploads a bid/proposal matching your translation briefs, our Firebase Cloud Function will summarize and dispatch a digest email here in real-time.
                  </p>
                </div>
              ) : (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                  {/* Left panel: trigger logs catalog */}
                  <div className="md:col-span-5 border-r border-gray-150 overflow-y-auto p-4 space-y-3 bg-white">
                    <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider text-gray-400 block mb-1">
                      Event Dispatch Logs ({notifications.length})
                    </span>
                    {notifications.map((notif) => {
                      const isSelected = selectedNotification?.id === notif.id;
                      const formattedDate = notif.sentAt ? new Date(notif.sentAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now';
                      
                      return (
                        <div
                          key={notif.id}
                          onClick={() => setSelectedNotification(notif)}
                          className={`group p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-brand/40 bg-brand-light/20' 
                              : 'border-gray-100 hover:border-orange-100 hover:bg-orange-50/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <span className="bg-orange-100/60 text-brand-dark px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                              TRIG_OK
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono font-medium">{formattedDate}</span>
                          </div>

                          <h5 className="font-bold text-gray-800 text-xs mt-2 line-clamp-1 group-hover:text-brand transition-colors">
                            {notif.translatorName} applied
                          </h5>
                          <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">
                            Brief: {notif.jobTitle}
                          </p>

                          <div className="mt-3 text-[10.5px] text-gray-400 font-mono truncate bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white transition-colors">
                            To: {notif.toEmail}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right panel: real email layout viewport */}
                  <div className="md:col-span-7 flex flex-col overflow-y-auto p-6 md:p-8 justify-start">
                    {selectedNotification ? (
                      <div className="space-y-4 w-full">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-2">
                          <div>
                            <span className="text-[10px] uppercase font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Dispatched via Firebase Trigger
                            </span>
                            <h4 className="font-extrabold text-gray-800 text-sm mt-2 font-display">
                              {selectedNotification.subject}
                            </h4>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">
                            {selectedNotification.sentAt ? new Date(selectedNotification.sentAt.seconds * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Now'}
                          </span>
                        </div>

                        {/* Sandboxed rendering of the actual HTML sent */}
                        <div 
                          className="bg-white rounded-2xl border border-gray-150 p-3 md:p-6 shadow-sm overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: selectedNotification.htmlContent }}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                          <ExternalLink className="w-6 h-6" />
                        </div>
                        <h4 className="font-black text-gray-700 text-sm font-display">No dispatcher selected</h4>
                        <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">
                          Click on any triggered event log on the left side to preview the exact summary notification layout as delivered to the client inbox.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer console note */}
            <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Status: <strong className="text-emerald-500">Live Listening</strong></span>
              <span>Functions Source: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">functions/src/index.ts</code></span>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED COMPANY PROFILE EDITING MODAL DRAWER */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 font-display text-lg">Modify Corporate Profile</h3>
              </div>
              <button 
                id="close-company-profile-modal"
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Company Legal / Trading Name</label>
                <input
                  id="edit-company-name"
                  type="text"
                  required
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Company Logo / Brand Vector URL</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="edit-company-logo"
                    type="url"
                    placeholder="https://example.com/logo.jpg"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setEditLogoUrl(`https://api.dicebear.com/7.x/initials/svg?seed=corp-${Math.floor(Math.random() * 100000)}`)}
                    className="px-3 py-2 bg-orange-50 border border-orange-200 text-brand rounded-xl font-bold text-xs hover:bg-orange-100 flex items-center gap-1 cursor-pointer transition-colors justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Logo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Operating Website</label>
                  <input
                    id="edit-company-website"
                    type="url"
                    placeholder="https://company.com"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Industry Vertical</label>
                  <input
                    id="edit-company-industry"
                    type="text"
                    required
                    placeholder="e.g. Media or Tech"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">About Company Summary</label>
                <textarea
                  id="edit-company-about"
                  rows={3}
                  required
                  placeholder="Enterprise brief..."
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/60">
                <input
                  type="checkbox"
                  id="edit-company-notifications"
                  checked={editEmailNotifications}
                  onChange={(e) => setEditEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand cursor-pointer"
                />
                <label htmlFor="edit-company-notifications" className="text-xs text-gray-700 font-bold cursor-pointer selection:bg-transparent">
                  Enable Simulated Email Notifications for Candidate Bids
                </label>
              </div>

              <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-company-properties-btn"
                  type="submit"
                  disabled={saveProfileLoading}
                  className="bg-brand hover:bg-brand-dark text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{saveProfileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
