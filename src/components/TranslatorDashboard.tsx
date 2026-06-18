import React, { useState, useEffect } from 'react';
import { Job, JobApplication, Profile, Review } from '../types';
import { 
  subscribeJobs, 
  subscribeTranslatorApplications, 
  updateProfile,
  subscribeTranslatorReviews,
  subscribeTriggerNotifications,
  auth
} from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Search, 
  Filter, 
  Briefcase, 
  CheckCircle2, 
  FileCheck, 
  User, 
  Globe2, 
  LogOut, 
  DollarSign, 
  MapPin, 
  Clock, 
  Edit2, 
  X, 
  Save,
  Grid,
  FileText,
  BadgeAlert,
  Star,
  Mail,
  RefreshCw,
  Check,
  Settings
} from 'lucide-react';

interface TranslatorDashboardProps {
  translatorProfile: Profile;
  onViewJob: (jobId: string) => void;
  onNavigate: (view: 'landing' | 'auth') => void;
}

const LANGUAGES = [
  "English ⇄ Simplified Chinese",
  "English ⇄ Traditional Chinese",
  "English ⇄ Cantonese",
  "Spanish ⇄ Simplified Chinese",
  "French ⇄ Simplified Chinese",
  "German ⇄ Simplified Chinese",
  "Japanese ⇄ Traditional Chinese"
];

export default function TranslatorDashboard({ translatorProfile, onViewJob, onNavigate }: TranslatorDashboardProps) {
  const [profile, setProfile] = useState<Profile>(translatorProfile);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangPair, setSelectedLangPair] = useState<string>('All');
  const [selectedLocFilter, setSelectedLocFilter] = useState<'All' | 'Remote' | 'On-site'>('All');
  
  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [editRate, setEditRate] = useState(profile.rate || '');
  const [editLoc, setEditLoc] = useState(profile.location || '');
  const [editLangs, setEditLangs] = useState<string[]>(profile.languages || []);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatarUrl || '');
  const [editEmailNotifications, setEditEmailNotifications] = useState(profile.emailNotificationsEnabled !== false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Notifications alerts & tray state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Sync edit fields whenever the editing modal is toggled
  useEffect(() => {
    if (isEditingProfile) {
      setEditName(profile.name);
      setEditBio(profile.bio || '');
      setEditRate(profile.rate || '');
      setEditLoc(profile.location || '');
      setEditLangs(profile.languages || []);
      setEditAvatarUrl(profile.avatarUrl || '');
      setEditEmailNotifications(profile.emailNotificationsEnabled !== false);
    }
  }, [isEditingProfile, profile]);

  useEffect(() => {
    // 1. Subscribe to all open jobs
    const unsubscribeJobs = subscribeJobs((allJobs) => {
      // Show open jobs
      setJobs(allJobs.filter(j => j.status === 'open'));
    });

    // 2. Subscribe to this translator's applications
    const unsubscribeApps = subscribeTranslatorApplications(profile.uid, (apps) => {
      setMyApplications(apps);
    });

    // 3. Subscribe to received performance reviews
    const unsubscribeReviews = subscribeTranslatorReviews(profile.uid, (revs) => {
      setReviews(revs);
    });

    // 4. Subscribe to triggered email notifications log matching this translator
    const unsubscribeNotifs = subscribeTriggerNotifications(profile.uid, (data) => {
      setNotifications(data);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApps();
      unsubscribeReviews();
      unsubscribeNotifs();
    };
  }, [profile.uid]);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('lingoloop_demo_user');
      await signOut(auth);
      onNavigate('landing');
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const updatedData = {
        name: editName,
        bio: editBio,
        rate: editRate,
        location: editLoc,
        languages: editLangs,
        avatarUrl: editAvatarUrl,
        emailNotificationsEnabled: editEmailNotifications
      };
      await updateProfile(profile.uid, updatedData);
      setProfile(prev => ({ ...prev, ...updatedData }));
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleLanguageOption = (lang: string) => {
    if (editLangs.includes(lang)) {
      setEditLangs(editLangs.filter(l => l !== lang));
    } else {
      setEditLangs([...editLangs, lang]);
    }
  };

  // Filter Jobs list
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = selectedLangPair === 'All' || job.languagePair === selectedLangPair;
    
    let matchesLoc = true;
    if (selectedLocFilter === 'Remote') {
      matchesLoc = job.location.toLowerCase().includes('remote');
    } else if (selectedLocFilter === 'On-site') {
      matchesLoc = !job.location.toLowerCase().includes('remote');
    }

    return matchesSearch && matchesLang && matchesLoc;
  });

  const getStatusBadge = (status: JobApplication['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span>Accepted</span>
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <BadgeAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Declined</span>
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Reviewed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Submitted</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans flex flex-col">
      {/* Dashboard Topbar */}
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
            <span className="bg-orange-100 text-brand-dark px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase font-mono ml-2 tracking-wider">Translator Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="translator-notifications-btn"
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

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingProfile(true)}>
              <img 
                src={profile.avatarUrl} 
                alt="User Avatar" 
                className="w-8 h-8 rounded-full border border-orange-200 object-cover bg-brand-light"
              />
              <span className="text-sm font-bold text-gray-700 hidden sm:inline max-w-[120px] truncate">{profile.name}</span>
            </div>
            <button
              id="dash-transl-logout-btn"
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-500 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full flex-grow">
        
        {/* LEFT COLUMN: Profile info & stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl -z-10" />
            
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <div className="relative">
                <img 
                  src={profile.avatarUrl} 
                  alt="User avatar large" 
                  className="w-20 h-20 rounded-full border-4 border-brand-light bg-brand-light object-cover mb-3"
                />
                <button 
                  id="dashboard-edit-prof-circle-btn"
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute bottom-2.5 right-0.5 bg-brand text-white p-1.5 rounded-full border-2 border-white shadow hover:scale-105 cursor-pointer transition-transform"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h2 className="text-xl font-bold font-display text-gray-900">{profile.name}</h2>
              <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {profile.location || 'Remote'}
              </p>
              
              {averageRating !== null && (
                <div className="flex items-center gap-1 mt-2 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{averageRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
              
              <div className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-dark px-3 py-1 rounded-xl text-xs font-extrabold font-mono mt-3">
                <DollarSign className="w-3.5 h-3.5 -mr-1" />
                <span>Rate Target: {profile.rate || '$30/hr'}</span>
              </div>
            </div>

            {/* Profile Brief specifications */}
            <div className="space-y-4 pt-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Expert Languages</span>
                <div className="flex flex-wrap gap-1">
                  {profile.languages?.map((lang) => (
                    <span key={lang} className="bg-orange-50/75 text-brand-dark text-[11px] font-bold px-2 rounded-lg border border-brand/10">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">About Bio</span>
                <p className="text-gray-600 text-xs leading-relaxed italic">
                  "{profile.bio}"
                </p>
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Specializations</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick interactive widget statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm text-center">
              <span className="text-gray-400 font-bold block text-xs uppercase tracking-wider mb-1">Submissions</span>
              <span className="text-3xl font-extrabold text-gray-900 font-display">{myApplications.length}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm text-center">
              <span className="text-gray-400 font-bold block text-xs uppercase tracking-wider mb-1">Approved</span>
              <span className="text-3xl font-extrabold text-green-600 font-display">
                {myApplications.filter(a => a.status === 'accepted').length}
              </span>
            </div>
          </div>

          {/* Client Reviews received */}
          <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-brand fill-brand" />
                <h3 className="font-bold text-gray-900 font-display text-sm">Client Reviews</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-orange-100/60 text-brand-dark px-2 py-0.5 rounded-md">
                {reviews.length} total
              </span>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-xs font-bold leading-normal">No reviews yet</p>
                <p className="text-[10px] mt-0.5">Reviews will appear here once job contracts are completed.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-gray-150 pb-3 last:border-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-800">{rev.companyName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((sVal) => (
                          <Star
                            key={sVal}
                            className={`w-3 h-3 ${
                              sVal <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="block text-[10px] font-medium text-orange-600 font-mono">
                      For: {rev.jobTitle}
                    </span>
                    <p className="text-xs text-gray-600 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Jobs feed & Applications manager */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Applications list section */}
          {myApplications.length > 0 && (
            <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 font-display text-lg">My Applications Tracker</h3>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {myApplications.map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border border-gray-150 bg-gray-50/30 rounded-2xl gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 font-display text-sm">{app.jobTitle}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 flex shadow-none items-center gap-4">
                        <span>Submitted rate: <span className="font-extrabold text-orange-600">{app.rateProposal}</span></span>
                        <span>•</span>
                        <span>Pending response</span>
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jobs Discovery Feed search bar & list */}
          <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 font-display text-lg">Discover Chinese translation Jobs</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500 font-bold bg-orange-50 px-2.5 py-1 rounded">
                  {filteredJobs.length} Open briefs found
                </span>
              </div>
            </div>

            {/* Live Filter Workspace */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  id="job-search-input"
                  type="text"
                  placeholder="Titles, Keywords, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <select
                  id="job-lang-filter-select"
                  value={selectedLangPair}
                  onChange={(e) => setSelectedLangPair(e.target.value)}
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium"
                >
                  <option value="All">All Language Pairs</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  id="job-loc-filter-select"
                  value={selectedLocFilter}
                  onChange={(e) => setSelectedLocFilter(e.target.value)}
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium"
                >
                  <option value="All">All Locations</option>
                  <option value="Remote">Remote Only</option>
                  <option value="On-site">On-site / Hybrid</option>
                </select>
              </div>
            </div>

            {/* List of match jobs */}
            {filteredJobs.length === 0 ? (
              <div className="bg-brand-light/20 border border-dashed border-orange-200 rounded-2xl p-12 text-center">
                <Briefcase className="w-10 h-10 text-brand/30 mx-auto mb-3" />
                <p className="text-gray-700 font-bold text-sm">No Matching Translation jobs</p>
                <p className="text-gray-500 text-xs mt-1">Try resetting your filters or search terms.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const alreadyApplied = myApplications.some((app) => app.jobId === job.id);
                  return (
                    <div 
                      key={job.id}
                      className="border border-gray-150 hover:border-orange-200 hover:shadow-md rounded-2xl p-5 md:p-6 transition-all duration-200 bg-white group flex flex-col md:flex-row items-start md:items-stretch justify-between gap-4"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="bg-orange-50 text-brand-dark px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono border border-brand/5">
                              {job.languagePair}
                            </span>
                            {alreadyApplied && (
                              <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-150">
                                Already Applied
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-extrabold text-gray-900 font-display group-hover:text-brand transition-colors">
                            {job.title}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Posted by <span className="font-extrabold text-gray-700">{job.companyName}</span>
                          </p>

                          <p className="text-gray-600 text-sm mt-3 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        </div>

                        {/* metadata tag parameters */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-brand" /> {job.budget}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" /> Due: {job.deadline}
                          </span>
                        </div>
                      </div>

                      <div className="self-stretch flex items-end justify-start md:justify-end shrink-0">
                        <button
                          id={`view-brief-${job.id}`}
                          onClick={() => onViewJob(job.id)}
                          className="w-full md:w-auto bg-brand hover:bg-brand-dark text-white text-xs font-bold px-5 py-3 rounded-xl transition-all hover:translate-y-[-1px]"
                        >
                          {alreadyApplied ? 'View Brief Details' : 'Apply For Brief'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DETAILED TRANSLATOR PROFILE EDITING MODAL DRAWER */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 font-display text-lg">Modify Translator Profile</h3>
              </div>
              <button 
                id="close-profile-modal"
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Display Name</label>
                <input
                  id="edit-profile-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">Profile Photo / Avatar Image URL</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="edit-profile-avatar"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="flex-grow px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setEditAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=transl-${Math.floor(Math.random() * 100000)}`)}
                    className="px-3 py-2 bg-orange-50 border border-orange-200 text-brand rounded-xl font-bold text-xs hover:bg-orange-100 flex items-center gap-1 cursor-pointer transition-colors justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Random</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/60">
                <input
                  type="checkbox"
                  id="edit-profile-notifications"
                  checked={editEmailNotifications}
                  onChange={(e) => setEditEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand cursor-pointer"
                />
                <label htmlFor="edit-profile-notifications" className="text-xs text-gray-700 font-bold cursor-pointer selection:bg-transparent">
                  Enable Simulated Email Notifications for Translation Bids
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Standard Rate</label>
                  <input
                    id="edit-profile-rate"
                    type="text"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold text-xs mb-1">Base Location</label>
                  <input
                    id="edit-profile-loc"
                    type="text"
                    required
                    value={editLoc}
                    onChange={(e) => setEditLoc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-2">My Target Language Pairs</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map(lang => {
                    const isSelected = editLangs.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguageOption(lang)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand/10 border border-brand text-brand-dark'
                            : 'bg-white border border-gray-150 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold text-xs mb-1">About Bio Summary</label>
                <textarea
                  id="edit-profile-bio"
                  rows={4}
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-xl cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-profile-properties-btn"
                  type="submit"
                  disabled={saveLoading}
                  className="bg-brand hover:bg-brand-dark text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud-Triggered Email Dispatch Monitor Panel for Translators */}
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
                  Automated translation alert & application updates dispatches triggered via Firestore database mutations.
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

            {/* Content Section */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-55">
              {/* Left pane: email logs list */}
              <div className="w-full md:w-2/5 border-r border-gray-100 overflow-y-auto bg-white p-4 space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block mb-2 px-1 text-left">
                  Active Dispatch Queue
                </span>
                {notifications.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
                    <Mail className="w-6 h-6 text-gray-300 mb-2" />
                    <span className="text-xs font-bold text-gray-400">Queue is currently empty</span>
                    <span className="text-[10px] text-gray-450 mt-0.5">Dispatches appear when company changes application status.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => setSelectedNotification(notif)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                        selectedNotification?.id === notif.id
                          ? 'bg-orange-50/50 border-brand/50 shadow-xs'
                          : 'bg-white border-gray-150 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono font-medium mb-1.5">
                        <span>TO: {notif.toEmail}</span>
                        <span>
                          {notif.sentAt
                            ? new Date(notif.sentAt.seconds * 1000).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Sending...'}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-gray-900 truncate">
                        {notif.subject}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 whitespace-pre-line leading-relaxed">
                        {notif.summaryText}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Right pane: email HTML preview */}
              <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-gray-55">
                {selectedNotification ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Toolbar */}
                    <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase text-brand tracking-widest">
                          Simulated HTML Body
                        </span>
                        <span className="text-xs font-extrabold text-gray-900 truncate mt-0.5">
                          {selectedNotification.subject}
                        </span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                        STATUS: DISPATCHED
                      </span>
                    </div>

                    {/* Simulation frame */}
                    <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
                      <div
                        className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200/80 shadow-sm p-6 text-left"
                        dangerouslySetInnerHTML={{ __html: selectedNotification.htmlContent }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-orange-105 p-4 rounded-full mb-3 border border-orange-100">
                      <Mail className="w-8 h-8 text-brand" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 font-display">
                      Select a triggered notice
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 max-w-xs">
                      Click any active dispatch item on the left column to view the raw generated HTML output sent to translators.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
