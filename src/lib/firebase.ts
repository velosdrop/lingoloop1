import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Profile, Job, JobApplication, TriggerNotification, Review } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);

// Use the database name from the config if available, fallback to default
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Authentication and Profiles API
 */
export async function getProfile(uid: string): Promise<Profile | null> {
  const path = `profiles/${uid}`;
  try {
    const docRef = doc(db, 'profiles', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Profile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createProfile(uid: string, profile: Omit<Profile, 'uid' | 'createdAt'>): Promise<Profile> {
  const path = `profiles/${uid}`;
  try {
    const newProfile: Profile = {
      ...profile,
      uid,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'profiles', uid), newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProfile(uid: string, data: Partial<Profile>): Promise<void> {
  const path = `profiles/${uid}`;
  try {
    const docRef = doc(db, 'profiles', uid);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Jobs Board API
 */
export async function postJob(jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'applicantsCount'>): Promise<string> {
  const path = 'jobs';
  try {
    const jobsRef = collection(db, 'jobs');
    const newJob: Omit<Job, 'id'> = {
      ...jobData,
      status: 'open',
      applicantsCount: 0,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(jobsRef, newJob);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Fetch all jobs or optionally filter by status or language pair
export function subscribeJobs(callback: (jobs: Job[]) => void, companyId?: string) {
  const path = 'jobs';
  const jobsRef = collection(db, 'jobs');
  let q = query(jobsRef);
  
  if (companyId) {
    q = query(jobsRef, where('companyId', '==', companyId));
  }

  return onSnapshot(q, (snapshot) => {
    const jobsList: Job[] = [];
    snapshot.forEach((doc) => {
      jobsList.push({ id: doc.id, ...doc.data() } as Job);
    });
    // Sort in memory safely to prevent missing composite index errors
    jobsList.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    callback(jobsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const path = `jobs/${jobId}`;
  try {
    const docRef = doc(db, 'jobs', jobId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Applications API
 */
export async function submitApplication(
  applicationData: Omit<JobApplication, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const path = 'applications';
  try {
    const appsRef = collection(db, 'applications');
    const newApp: Omit<JobApplication, 'id'> = {
      ...applicationData,
      status: 'submitted',
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(appsRef, newApp);
    
    const jobRef = doc(db, 'jobs', applicationData.jobId);
    await updateDoc(jobRef, {
      applicantsCount: increment(1)
    });

    try {
      let companyEmail = 'partner-relations@lingoloop.com';
      let companyName = 'Hired Localization Director';
      
      const companySnap = await getDoc(doc(db, 'profiles', applicationData.companyId));
      if (companySnap.exists()) {
        const cd = companySnap.data() as Profile;
        companyEmail = cd.email || companyEmail;
        companyName = cd.companyName || cd.name || companyName;
      }

      const languagesList = applicationData.translatorLanguages?.join(', ') || 'Global pairs';
      const summaryText = `• Native Translation Alignment: Candidate is fully capable in ${languagesList} with a proposed rate of ${applicationData.rateProposal}.
• Portfolio Specialization: Experience matches job specs for "${applicationData.jobTitle}".
• Candidate Context & Objectives: "${applicationData.coverLetter.length > 150 ? applicationData.coverLetter.substring(0, 150) + '...' : applicationData.coverLetter}"`;

      const subject = `[LingoLoop Alert] New Application from ${applicationData.translatorName} for: "${applicationData.jobTitle}"`;

      const htmlContent = `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f6f6f6;">
            <span style="font-size: 24px; font-weight: 800; color: #ff6b35; letter-spacing: -0.5px;">LingoLoop</span>
            <div style="font-size: 11px; color: #a0a0a0; margin-top: 4px; font-weight: 500; text-transform: uppercase;">Enterprise Localization Dispatch</div>
          </div>
          
          <h2 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-top: 0; line-height: 1.4;">
            Hi ${companyName},
          </h2>
          
          <p style="font-size: 14px; color: #4a4a4a; line-height: 1.6; margin-bottom: 20px;">
            A translator has successfully applied to your localization brief <strong>"${applicationData.jobTitle}"</strong>.
          </p>

          <div style="background-color: #fffaf7; border: 1px solid #ffe8dd; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <h3 style="font-size: 11px; font-weight: 800; color: #e0531c; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 0.5px;">
              AI Candidate Evaluation Summary
            </h3>
            <div style="font-size: 13px; color: #2d2d2d; line-height: 1.65; padding-left: 12px; border-left: 3px solid #ff6b35; white-space: pre-line;">
              ${summaryText}
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f3f3f3;">
              <td style="padding: 10px 0; color: #7a7a7a; font-weight: 500;">Translator Name</td>
              <td style="padding: 10px 0; font-weight: 700; color: #1a1a1a; text-align: right;">${applicationData.translatorName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f3f3;">
              <td style="padding: 10px 0; color: #7a7a7a; font-weight: 500;">Contact Email</td>
              <td style="padding: 10px 0; font-weight: 700; color: #1a1a1a; text-align: right;">
                <a href="mailto:${applicationData.translatorEmail}" style="color: #ff6b35; text-decoration: none;">${applicationData.translatorEmail}</a>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f3f3;">
              <td style="padding: 10px 0; color: #7a7a7a; font-weight: 500;">Rate Proposal</td>
              <td style="padding: 10px 0; font-weight: 850; color: #ff6b35; text-align: right;">${applicationData.rateProposal}</td>
            </tr>
          </table>
        </div>
      `;

      await addDoc(collection(db, 'notifications'), {
        companyId: applicationData.companyId,
        applicationId: docRef.id,
        translatorName: applicationData.translatorName,
        jobTitle: applicationData.jobTitle,
        subject,
        summaryText,
        htmlContent,
        sentAt: serverTimestamp(),
        toEmail: companyEmail
      });

    } catch (triggerErr) {
      console.error('Trigger Email Simulation Error: ', triggerErr);
    }
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to applications submitted by a translator
export function subscribeTranslatorApplications(translatorId: string, callback: (apps: JobApplication[]) => void) {
  const path = 'applications';
  const appsRef = collection(db, 'applications');
  const q = query(
    appsRef, 
    where('translatorId', '==', translatorId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const appsList: JobApplication[] = [];
    snapshot.forEach((doc) => {
      appsList.push({ id: doc.id, ...doc.data() } as JobApplication);
    });
    appsList.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    callback(appsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Subscribe to applications for a company's jobs or a specific job
export function subscribeJobApplications(jobId: string, callback: (apps: JobApplication[]) => void) {
  const path = 'applications';
  const appsRef = collection(db, 'applications');
  const q = query(
    appsRef,
    where('jobId', '==', jobId)
  );

  return onSnapshot(q, (snapshot) => {
    const appsList: JobApplication[] = [];
    snapshot.forEach((doc) => {
      appsList.push({ id: doc.id, ...doc.data() } as JobApplication);
    });
    appsList.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    callback(appsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Subscribe specifically to a single translator's application for a specific job (respects strict security constraints)
export function subscribeTranslatorJobApplication(jobId: string, translatorId: string, callback: (apps: JobApplication[]) => void) {
  const path = 'applications';
  const appsRef = collection(db, 'applications');
  const q = query(
    appsRef,
    where('jobId', '==', jobId),
    where('translatorId', '==', translatorId)
  );

  return onSnapshot(q, (snapshot) => {
    const appsList: JobApplication[] = [];
    snapshot.forEach((doc) => {
      appsList.push({ id: doc.id, ...doc.data() } as JobApplication);
    });
    callback(appsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Update application status (accepted / declined / reviewed)
export async function updateApplicationStatus(
  appId: string, 
  status: JobApplication['status']
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    const docRef = doc(db, 'applications', appId);
    await updateDoc(docRef, { status });

    // Send email notification to translator on Accept / Decline!
    try {
      const appSnap = await getDoc(docRef);
      if (appSnap.exists()) {
        const appData = appSnap.data() as JobApplication;
        
        let translatorEmail = appData.translatorEmail || '';
        let companyName = 'Hired Recruiters';
        
        const companySnap = await getDoc(doc(db, 'profiles', appData.companyId));
        if (companySnap.exists()) {
          const cd = companySnap.data() as Profile;
          companyName = cd.companyName || cd.name || companyName;
        }

        const subject = `[LingoLoop Alert] Application ${status.toUpperCase()} for "${appData.jobTitle}"`;
        const summaryText = `• Application Status Update: Your translation proposal for "${appData.jobTitle}" has been marked as ${status}.
• Sponsoring Enterprise: ${companyName}.
• Sourcing Location: Remote localization portal.`;

        const htmlContent = `
          <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f6f6f6;">
              <span style="font-size: 24px; font-weight: 800; color: #ff6b35; letter-spacing: -0.5px;">LingoLoop</span>
              <div style="font-size: 11px; color: #a0a0a0; margin-top: 4px; font-weight: 500; text-transform: uppercase;">Real-time Localization Alert</div>
            </div>
            
            <h2 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-top: 0; line-height: 1.4;">
              Hi ${appData.translatorName},
            </h2>
            
            <p style="font-size: 14px; color: #4a4a4a; line-height: 1.6; margin-bottom: 20px;">
              Your application for <strong>"${appData.jobTitle}"</strong> has been reviewed by <strong>${companyName}</strong>.
            </p>

            <div style="background-color: ${status === 'accepted' ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${status === 'accepted' ? '#bbf7d0' : '#fecaca'}; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <h3 style="font-size: 12px; font-weight: 800; color: ${status === 'accepted' ? '#15803d' : '#b91c1c'}; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.5px;">
                Status: ${status.toUpperCase()}
              </h3>
              <p style="font-size: 13px; color: #2d2d2d; margin: 0; line-height: 1.5;">
                ${status === 'accepted' 
                  ? 'Congratulations! The company has authorized your proposal. You are officially approved to start working on this localization assignment.' 
                  : 'The team has opted for another profile/candidate for this specific contract. Thank you for your interest, and keep seeking open bids!'}
              </p>
            </div>
          </div>
        `;

        await addDoc(collection(db, 'notifications'), {
          translatorId: appData.translatorId, // Key so translator can read too!
          applicationId: appId,
          translatorName: appData.translatorName,
          jobTitle: appData.jobTitle,
          subject,
          summaryText,
          htmlContent,
          sentAt: serverTimestamp(),
          toEmail: translatorEmail,
          statusUpdate: status
        });
      }
    } catch (notifErr) {
      console.error('Error triggering translator application update email:', notifErr);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Subscribe to triggered email alerts sent by the serverless Functions or system updates
export function subscribeTriggerNotifications(
  roleId: string, 
  callback: (notifications: TriggerNotification[]) => void
) {
  // Pull all notifications to safely filter in-memory to prevent composite index errors
  const q = query(collection(db, 'notifications'));
  const path = 'notifications';
  return onSnapshot(q, (snapshot) => {
    const list: TriggerNotification[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.companyId === roleId || data.translatorId === roleId) {
        list.push({ id: doc.id, ...data } as TriggerNotification);
      }
    });
    list.sort((a, b) => {
      const tA = a.sentAt?.seconds || 0;
      const tB = b.sentAt?.seconds || 0;
      return tB - tA;
    });
    callback(list);
  }, (error) => {
    console.warn('Notification query issue: ', error);
    callback([]);
  });
}

// Submit a translator review from a company recruiter
export async function submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const path = 'reviews';
  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to reviews received by a translator
export function subscribeTranslatorReviews(translatorId: string, callback: (reviews: Review[]) => void) {
  const path = 'reviews';
  const reviewsRef = collection(db, 'reviews');
  const q = query(
    reviewsRef,
    where('translatorId', '==', translatorId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: Review[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Review);
    });
    list.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    callback(list);
  }, (error) => {
    console.warn('Review query issue: ', error);
    callback([]);
  });
}

// Subscribe to reviews written by a company
export function subscribeCompanyReviews(companyId: string, callback: (reviews: Review[]) => void) {
  const path = 'reviews';
  const reviewsRef = collection(db, 'reviews');
  const q = query(
    reviewsRef,
    where('companyId', '==', companyId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: Review[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Review);
    });
    list.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    callback(list);
  }, (error) => {
    console.warn('Review query issue: ', error);
    callback([]);
  });
}



