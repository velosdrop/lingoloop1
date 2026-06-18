import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, createProfile, getProfile } from '../lib/firebase';
import { Profile } from '../types';
import { 
  Briefcase, 
  Globe2, 
  ArrowLeft, 
  Info, 
  Check, 
  Loader2, 
  User, 
  Lock, 
  Mail, 
  Building, 
  FileText, 
  BadgeDollarSign
} from 'lucide-react';

interface AuthScreenProps {
  initialUserType?: 'company' | 'translator';
  onBack: () => void;
  onAuthSuccess: (profile: Profile) => void;
}

const LAN_PAIR_OPTIONS = [
  "English ⇄ Simplified Chinese",
  "English ⇄ Traditional Chinese",
  "English ⇄ Cantonese",
  "Spanish ⇄ Simplified Chinese",
  "French ⇄ Simplified Chinese",
  "German ⇄ Simplified Chinese",
  "Japanese ⇄ Traditional Chinese"
];

const SKILL_OPTIONS = [
  "Technical Manuals",
  "Legal & Contracts",
  "Website Localization",
  "App & Software UI",
  "Simultaneous Interpretation",
  "Subtitling & Dubbing",
  "Literary Translation",
  "Marketing & Creative Copy"
];

export default function AuthScreen({ initialUserType = 'translator', onBack, onAuthSuccess }: AuthScreenProps) {
  // Roles list
  const [role, setRole] = useState<'company' | 'translator'>(initialUserType);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Translator Extra Fields
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['English ⇄ Simplified Chinese']);
  const [rate, setRate] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('0-2 years');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [translatorLocation, setTranslatorLocation] = useState('Remote');

  // Company Extra Fields
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');

  const logoUrl = '/src/assets/images/lingoloop_logo_1781791670180.jpg';

  const toggleLanguage = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(selectedLangs.filter((l) => l !== lang));
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }

        if (role === 'translator' && selectedLangs.length === 0) {
          throw new Error('Please select at least one language pair you translate');
        }

        if (role === 'company' && !companyName.trim()) {
          throw new Error('Please enter your company name');
        }

        // Firebase Auth User Creation
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Custom Profile Structure
        let profileData: Omit<Profile, 'uid' | 'createdAt'> = {
          role,
          email,
          name,
        };

        if (role === 'translator') {
          profileData = {
            ...profileData,
            languages: selectedLangs,
            rate: rate || '$30/hour',
            bio: bio || 'Professional translator ready to match with projects.',
            experience,
            skills: selectedSkills,
            location: translatorLocation,
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
          };
        } else {
          profileData = {
            ...profileData,
            companyName,
            website: website || '',
            industry: industry || 'Tech & Globalization',
            about: aboutCompany || 'Growing enterprise needing continuous localization.',
            logoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(companyName)}`,
          };
        }

        // Save Profile to Firestore
        const savedProfile = await createProfile(uid, profileData);
        onAuthSuccess(savedProfile);
      } else {
        // Sign In Flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        const profile = await getProfile(uid);
        if (!profile) {
          throw new Error('We logged you in, but could not load your profile. Please complete setting up your account.');
        }

        // Inform if they log in as the wrong role (though we still let them proceed with their real profile role)
        if (profile.role !== role) {
          console.warn(`User profile is registered as ${profile.role}, but signed in with role selector set to ${role}. Switching view...`);
        }
        onAuthSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      let standardMsg = err.message || 'An error occurred during authentication';
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
        standardMsg = 'Firebase Operation Not Allowed: "Email/Password" sign-in has not been enabled in your Firebase console. Please go to your Firebase Console -> Authentication -> Sign-in Method and enable "Email/Password" to try logging in.';
      } else if (err.code === 'auth/email-already-in-use') {
        standardMsg = 'This email address is already in use.';
      } else if (err.code === 'auth/invalid-credential') {
        standardMsg = 'Incorrect email or password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        standardMsg = 'Password must be at least 6 characters long.';
      }
      setErrorMsg(standardMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-light/30 min-h-screen py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full">
        {/* Back Link */}
        <button
          id="auth-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-brand font-semibold text-sm mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to lingo home
        </button>

        {/* Auth Box Container */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl p-6 md:p-10">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-brand bg-white flex items-center justify-center p-0.5 shadow-md mb-3">
              <img 
                src={logoUrl} 
                alt="LingoLoop Logo" 
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-black text-gray-900 font-display">
              Join LingoLoop
            </h1>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">
              Connecting professional Chinese localizers with progressive global companies.
            </p>
          </div>

          {/* User Type Tab Switcher */}
          <div className="bg-orange-50/70 p-1.5 rounded-2xl grid grid-cols-2 gap-2 mb-8 border border-orange-100">
            <button
              id="set-translator-role-btn"
              type="button"
              onClick={() => { setRole('translator'); setErrorMsg(''); }}
              className={`py-3 rounded-xl font-bold font-display text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                role === 'translator'
                  ? 'bg-brand text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-100/40'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              <span>Translator</span>
            </button>
            <button
              id="set-company-role-btn"
              type="button"
              onClick={() => { setRole('company'); setErrorMsg(''); }}
              className={`py-3 rounded-xl font-bold font-display text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                role === 'company'
                  ? 'bg-brand text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-100/40'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Company</span>
            </button>
          </div>

          {/* Form Action Subtitle */}
          <div className="text-center mb-6">
            <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600 bg-orange-100/50 px-3 py-1 rounded-full">
              {role === 'translator' ? 'Freelancer Portal' : 'Employer Board'}
            </span>
          </div>

          {/* Display general authentication errors */}
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm font-semibold mb-6 flex items-start gap-2.5">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Auth Fields */}
            {isSignUp && (
              <div id="username-field-container">
                <label className="block text-gray-700 font-bold text-sm mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    placeholder="e.g. Sherry Zhou"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-bold text-sm mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold text-sm mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  minLength={6}
                  placeholder={isSignUp ? 'Choose a strong password (6+ chars)' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                />
              </div>
            </div>

            {/* REGISTER-ONLY SECTION */}
            {isSignUp && role === 'translator' && (
              <div className="border-t border-orange-100 pt-6 space-y-6">
                <h3 className="font-bold text-gray-900 font-display text-sm tracking-tight">Onboard Your Translator Profile</h3>
                
                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Where are you based?</label>
                  <input
                    id="transl-location"
                    type="text"
                    required
                    placeholder="e.g. Shanghai, China (On-site) or San Francisco, CA (Remote)"
                    value={translatorLocation}
                    onChange={(e) => setTranslatorLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-2.5">
                    Which Language Pairs Translate? (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LAN_PAIR_OPTIONS.map((lang) => {
                      const isSelected = selectedLangs.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-brand/10 border-brand text-brand'
                              : 'bg-white border-gray-100 text-gray-600 hover:border-orange-200'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold text-sm mb-1.5 flex items-center gap-1">
                      <BadgeDollarSign className="w-4 h-4 text-gray-400" />
                      <span>Target Rate</span>
                    </label>
                    <input
                      id="transl-rate"
                      type="text"
                      placeholder="e.g. $45/hour or $0.12/word"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold text-sm mb-1.5">Experience Level</label>
                    <select
                      id="transl-experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                    >
                      <option value="0-2 years">Entry Level (0-2 years)</option>
                      <option value="3-5 years">Midweight Pro (3-5 years)</option>
                      <option value="6-9 years">Senior Vetted Expert (6-9 years)</option>
                      <option value="10+ years">Elite Veteran Specialist (10+ years)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-2">Primary Specializations & Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-orange-100 border-2 border-brand text-brand-dark'
                              : 'bg-white border border-gray-100 text-gray-600 hover:border-orange-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>Personal Translation Bio / Summary</span>
                  </label>
                  <textarea
                    id="transl-bio"
                    rows={3}
                    placeholder="Brief summary of your translation credentials, client highlights, or localized style..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* REGISTER COMMANNY FIELD PORT */}
            {isSignUp && role === 'company' && (
              <div className="border-t border-orange-100 pt-6 space-y-6">
                <h3 className="font-bold text-gray-900 font-display text-sm tracking-tight">Onboard Your Company Info</h3>

                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">Company Name</label>
                  <input
                    id="comp-name"
                    type="text"
                    required
                    placeholder="e.g. Bamboo Softwares Inc"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold text-sm mb-1.5">Company Website ID/URL</label>
                    <input
                      id="comp-web"
                      type="text"
                      placeholder="e.g. www.bamboosoftware.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold text-sm mb-1.5">Sector Industry</label>
                    <input
                      id="comp-ind"
                      type="text"
                      placeholder="e.g. Video Games, E-Commerce, Legal"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold text-sm mb-1.5">About Corporate / Group Description</label>
                  <textarea
                    id="comp-about"
                    rows={3}
                    placeholder="Give a brief description of what your team localizes, products managed, or targets..."
                    value={aboutCompany}
                    onChange={(e) => setAboutCompany(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Submission Action Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-orange-300 text-white rounded-2xl py-4 font-bold text-sm shadow-lg shadow-brand/15 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing account portal...</span>
                </>
              ) : (
                <span>{isSignUp ? `Register as Verified ${role === 'translator' ? 'Translator' : 'Company'}` : 'Sign In To Workspace'}</span>
              )}
            </button>
          </form>

          {/* Toggle Flow Switch Link */}
          <div className="text-center mt-6 border-t border-gray-50 pt-5 text-sm text-gray-500 font-medium">
            {isSignUp ? (
              <span>
                Already registered with LingoLoop?{" "}
                <button
                  id="toggle-signin-btn"
                  onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                  className="text-brand hover:text-brand-dark font-extrabold cursor-pointer hover:underline"
                >
                  Sign In Here
                </button>
              </span>
            ) : (
              <span>
                New to the freelance loop?{" "}
                <button
                  id="toggle-signup-btn"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className="text-brand hover:text-brand-dark font-extrabold cursor-pointer hover:underline"
                >
                  Create an Account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
