import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Job } from '../types';
import { 
  Globe2, 
  ArrowRight, 
  Sparkles, 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  HeartHandshake,
  Search,
  Filter
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'auth', params?: { userType?: 'company' | 'translator' }) => void;
  featuredJobs: Job[];
  onViewJob: (jobId: string) => void;
}

export default function LandingPage({ onNavigate, featuredJobs, onViewJob }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguagePair, setSelectedLanguagePair] = useState('All');

  const LANGUAGES = [
    "English ⇄ Simplified Chinese",
    "English ⇄ Traditional Chinese",
    "English ⇄ Cantonese",
    "Spanish ⇄ Simplified Chinese",
    "French ⇄ Simplified Chinese",
    "German ⇄ Simplified Chinese",
    "Japanese ⇄ Traditional Chinese"
  ];

  // Filter jobs based on landing page inputs
  const filteredJobs = featuredJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = selectedLanguagePair === 'All' || job.languagePair === selectedLanguagePair;
    
    return matchesSearch && matchesLang;
  });

  // Use the logo we generated!
  const logoUrl = '/src/assets/images/lingoloop_logo_1781791670180.jpg';

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans select-none overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-brand bg-white flex items-center justify-center p-0.5 shadow-sm">
              <img 
                src={logoUrl} 
                alt="LingoLoop Logo" 
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight font-display flex items-center gap-1.5">
                Lingo<span className="text-brand">Loop</span>
              </span>
              <span className="text-[10px] text-brand/80 font-mono block -mt-1 font-semibold tracking-wider">CHINESE TRANSLATION</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              id="nav-sign-in-btn"
              onClick={() => onNavigate('auth', { userType: 'translator' })}
              className="text-gray-700 hover:text-brand font-medium text-sm transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              id="get-started-btn"
              onClick={() => onNavigate('auth', { userType: 'company' })}
              className="bg-brand hover:bg-brand-dark text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-md shadow-brand/10 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              Post a Job
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 bg-gradient-to-b from-brand-light/40 to-white overflow-hidden">
        {/* Playful background blob shapes and circles */}
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-brand/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-orange-300/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 bg-brand-accent/50 text-brand-dark border border-brand/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Chinese Traditional & Simplified Translation Marketplace</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight font-display leading-[1.1] mb-6">
              Translation, <span className="text-brand inline-block relative">
                Untangled
                <svg className="absolute left-0 bottom-1 w-full h-2 text-brand-accent -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              Connecting Top Firms with Native Pros.
            </h1>

            <p className="text-gray-600 text-lg md:text-xl font-normal leading-relaxed mb-8 max-w-xl">
              LingoLoop is the ultimate playground matching businesses with vetted bilingual specialists. Stop wrestling with translation loops—get pristine localizations in record time.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button
                id="cta-join-company"
                onClick={() => onNavigate('auth', { userType: 'company' })}
                className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-6 py-4 text-base font-bold shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-2px]"
              >
                I Need Translations <ArrowRight className="w-5 h-5" />
              </button>
              <button
                id="cta-join-translator"
                onClick={() => onNavigate('auth', { userType: 'translator' })}
                className="bg-white border-2 border-brand text-brand hover:bg-brand-light rounded-2xl px-6 py-4 text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-2px]"
              >
                I Am a Translator <Globe2 className="w-5 h-5" />
              </button>
            </div>

            {/* Quick stats items */}
            <div className="grid grid-cols-3 gap-6 md:gap-8 mt-12 pt-8 border-t border-orange-100/80 w-full max-w-lg">
              <div>
                <span className="block text-2xl md:text-3xl font-bold text-gray-900 font-display">0%</span>
                <span className="text-xs text-gray-500 font-medium">Posting Commission</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-bold text-gray-900 font-display">24h</span>
                <span className="text-xs text-gray-500 font-medium">Average Apply Time</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-bold text-gray-900 font-display">100%</span>
                <span className="text-xs text-gray-500 font-medium">Native Vetted Pros</span>
              </div>
            </div>
          </div>

          {/* Right Column Visual Mockup */}
          <div className="lg:col-span-5 flex justify-center relative mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 to-orange-400/5 rounded-full blur-2xl -z-10" />
            <div className="relative bg-white border border-orange-100 p-6 rounded-3xl shadow-2xl max-w-sm w-full">
              {/* Floating cute badge */}
              <div className="absolute -top-4 -right-4 bg-orange-400 text-white font-bold text-xs p-2.5 rounded-2xl rotate-6 shadow-md flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5" />
                <span>中文 ⇄ English</span>
              </div>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                <img 
                  src={logoUrl} 
                  alt="Playful Mascot logo decoration" 
                  className="w-14 h-14 object-cover rounded-xl border border-orange-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-gray-900 font-display text-base">Funny Loop Mascot</h4>
                  <p className="text-xs text-gray-500 font-mono">Our tongue-tied companion</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-brand-light p-3.5 rounded-2xl border border-brand/5 text-sm text-gray-700">
                  <span className="font-bold text-brand font-display block mb-1">Translators:</span>
                  Unlock top-tier freelance jobs in game localization, legal contracts and technical documents. Keep 100% of your earnings.
                </div>
                <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-200/50 text-sm text-gray-700">
                  <span className="font-bold text-orange-600 font-display block mb-1">Companies:</span>
                  Post completely free, access immediate translation applications, read verified translator credentials, and work directly.
                </div>
              </div>

              {/* Decorative graphic loops */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Direct Chat ready</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Secure platform</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Selling Points */}
      <section className="py-16 bg-brand-light/20 border-y border-orange-100/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 font-display mb-4">
              Designed For Seamless Chinese Localizations
            </h2>
            <p className="text-gray-600 font-normal">
              Translating nuance isn't about word substitution—it's about culture context. LingoLoop bridges the loop cleanly and playfully.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-brand mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">Zero Translation Agency Markup</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Intermediaries charge outrageous fees. LingoLoop is free for companies to post, and translators keep every cent of their budget.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-brand mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">Tailored Language Specs</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Filter profiles and jobs specifically by regional variants: Simplified/Traditional Chinese, Mandarin vs. Cantonese, and technical skills.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-brand mb-6">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">Freelancer Friendly Model</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Build beautiful translation portfolios, state your rate expectations transparently, and claim ownership of your developer and enterprise clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Showcase */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 font-display mb-3">
                Latest Translation Briefs
              </h2>
              <p className="text-gray-600">
                Browse open tasks from forward-thinking companies. Log in or create an account to view and apply.
              </p>
            </div>
            <button
              onClick={() => onNavigate('auth', { userType: 'translator' })}
              className="group inline-flex items-center gap-2 text-brand font-bold text-sm hover:text-brand-dark transition-colors"
            >
              <span>Explore all active translation jobs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Dynamic Search & Filter Bar */}
          {featuredJobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 bg-brand-light/20 p-4 rounded-2xl border border-orange-100">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  id="landing-job-search"
                  type="text"
                  placeholder="Search title, keywords, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white pl-10 pr-4 py-2 bg-white border border-orange-200/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <select
                  id="landing-job-lang-filter"
                  value={selectedLanguagePair}
                  onChange={(e) => setSelectedLanguagePair(e.target.value)}
                  className="w-full bg-white pl-4 pr-10 py-2 border border-orange-200/60 rounded-xl text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Language Pairs</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

          {featuredJobs.length === 0 ? (
            <div className="bg-brand-light/30 border border-dashed border-orange-200 rounded-2xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-brand/40 mx-auto mb-4" />
              <p className="text-gray-700 font-bold mb-1">No active jobs yet</p>
              <p className="text-gray-500 text-sm mb-4">Be the first to post a localized Chinese translation job!</p>
              <button
                id="post-first-job-btn"
                onClick={() => onNavigate('auth', { userType: 'company' })}
                className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-brand-dark cursor-pointer transition-colors"
              >
                Post Translation Job for Free
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-brand-light/10 border border-dashed border-orange-200/50 rounded-2xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-brand/35 mx-auto mb-4" />
              <p className="text-gray-700 font-bold mb-1">No briefs found matching your filter</p>
              <p className="text-gray-500 text-xs mt-1 mb-6">Try resetting search query or switching language pair.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLanguagePair('All');
                }}
                className="bg-brand text-white rounded-xl px-5 py-2 text-xs font-bold hover:bg-brand-dark cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.slice(0, 6).map((job) => (
                <div 
                  key={job.id}
                  className="bg-white border border-gray-100 hover:border-orange-200 hover:shadow-lg rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group h-full cursor-pointer"
                  onClick={() => onViewJob(job.id)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-orange-50 text-brand-dark font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                        {job.languagePair}
                      </div>
                      <span className="text-gray-400 font-medium text-xs font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {job.deadline ? `Due: ${job.deadline}` : 'No deadline'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 font-display group-hover:text-brand transition-colors mb-2 line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-gray-500 text-xs font-medium font-display mb-3">
                      Posted by <span className="font-bold text-gray-700">{job.companyName}</span>
                    </p>

                    <p className="text-gray-650 text-sm line-clamp-3 mb-6">
                      {job.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Budget</span>
                      <span className="text-brand-dark font-extrabold text-sm flex items-center">
                        <DollarSign className="w-4 h-4 -mr-0.5" /> {job.budget}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="line-clamp-1 max-w-[120px]">{job.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-brand bg-white flex items-center justify-center p-0.5 shadow-sm">
                <img 
                  src={logoUrl} 
                  alt="LingoLoop Logo Small" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-lg font-bold tracking-tight">Lingo<span className="text-brand">Loop</span></span>
            </div>
            <p className="text-gray-400 text-xs max-w-sm">
              Your elite, agency-free Chinese ⇄ English translator connector platform. Work directly, earn fully, translate beautifully.
            </p>
          </div>
          <div className="md:col-span-6 flex flex-wrap justify-start md:justify-end gap-x-8 gap-y-4 text-xs font-medium text-gray-400">
            <span className="hover:text-brand cursor-pointer">Terms of Service</span>
            <span className="hover:text-brand cursor-pointer">Privacy Framework</span>
            <span className="hover:text-brand cursor-pointer">Contact Assistance</span>
            <span className="text-gray-600 block w-full md:w-auto md:inline mt-4 md:mt-0 font-mono text-[10px]">
              &copy; {new Date().getFullYear()} LingoLoop. Chinese Freelance Connector.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
