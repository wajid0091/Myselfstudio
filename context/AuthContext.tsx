import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get, child, update, onValue, off } from 'firebase/database';
import { AuthContextType, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const checkDailyCredits = async (uid: string, profile: UserProfile) => {
      const today = getTodayString();
      const now = Date.now();
      
      // Check if user is banned
      if (profile.isBanned) {
          await logout();
          alert("Your account has been suspended by the administrator.");
          return;
      }

      let activePlan = profile.plan;
      let planExpiry = profile.planExpiry || 0;
      let currentFeatures = profile.features || [];
      let updates: any = {};

      // Check Plan Expiration (Only for paid plans)
      if (activePlan !== 'free' && planExpiry > 0 && now > planExpiry) {
          activePlan = 'free';
          updates.plan = 'free';
          updates.planExpiry = 0;
          updates.credits = 10; // Reset to free daily limit immediately upon expiration
          updates.sourceCodeCredits = 0;
          
          // Revert features to basic/free defaults if expired
          // We fetch 'free' plan config to get default features
          try {
             const freePlanSnap = await get(ref(db, `system_settings/plans/free`));
             if(freePlanSnap.exists()) {
                 currentFeatures = freePlanSnap.val().features || [];
             } else {
                 currentFeatures = [];
             }
          } catch(e) { currentFeatures = []; }

          alert("Your plan has expired. You have been downgraded to the Free Plan.");
      } else {
          // If plan is active, ensure we have the latest features from the plan config
          // (In case Admin added a new feature to the existing plan)
          try {
              const planSnapshot = await get(ref(db, `system_settings/plans/${activePlan}`));
              if (planSnapshot.exists()) {
                  const planData = planSnapshot.val();
                  currentFeatures = planData.features || [];
              }
          } catch (e) {
              console.error("Error syncing plan features", e);
          }
      }

      // DAILY CREDIT LOGIC
      let newCredits = profile.credits;
      
      if (profile.lastLoginDate !== today) {
          // LOGIC:
          // 1. If user has < 10 credits, refill to 10 (Daily Minimum Floor).
          // 2. If user has >= 10 credits (e.g., has 120 from a paid plan, or didn't use yesterday's 10),
          //    DO NOT add more. DO NOT reset to 10. Keep them as is.
          // 3. This prevents accumulation for Free users (10 -> 10, not 20).
          // 4. This prevents daily 120 refills for Paid users (115 -> 115, 5 -> 10).
          
          if (newCredits < 10) {
              newCredits = 10;
          }
          // else: newCredits remains same.
      }

      updates.lastLoginDate = today;
      updates.features = currentFeatures;
      updates.credits = newCredits;
      
      await update(ref(db, `users/${uid}/profile`), updates);
  };

  useEffect(() => {
    let profileUnsubscribe: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous listener if any
      if (profileUnsubscribe) {
          off(ref(db, `users/${currentUser?.uid || 'unknown'}/profile`));
          profileUnsubscribe = null;
      }

      if (currentUser) {
        const profileRef = ref(db, `users/${currentUser.uid}/profile`);
        
        // REAL-TIME LISTENER for Profile (Credits, Plan, etc.)
        profileUnsubscribe = onValue(profileRef, async (snapshot) => {
            if (snapshot.exists()) {
                const profile = snapshot.val();
                
                // Security Check
                if (profile.isBanned) {
                    await signOut(auth);
                    setUser(null);
                    setUserProfile(null);
                    setLoading(false);
                    return;
                }

                setUserProfile(profile);
            } else {
                // Create profile if missing
                const newProfile: UserProfile = {
                    id: currentUser.uid,
                    name: currentUser.displayName || 'User',
                    email: currentUser.email || '',
                    plan: 'free',
                    credits: 10, 
                    sourceCodeCredits: 0,
                    lastLoginDate: getTodayString(),
                    projectsCreated: 0,
                    projectsPublished: 0,
                    features: [] 
                };
                await set(profileRef, newProfile);
            }
            setLoading(false);
        });

        // Run the daily check once on mount/login
        const snap = await get(profileRef);
        if(snap.exists()) {
            await checkDailyCredits(currentUser.uid, snap.val());
        }

      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (profileUnsubscribe && user) {
             off(ref(db, `users/${user.uid}/profile`));
        }
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (data: any) => {
    const { email, password, username, company, country, phone, referredBy } = data;
    const res = await createUserWithEmailAndPassword(auth, email, password);
    
    // Check referral
    let bonusCredits = 0;
    if (referredBy) {
         bonusCredits = 10; 
    }

    const newProfile: UserProfile = {
      id: res.user.uid,
      name: username,
      email: email,
      company: company,
      country: country,
      phone: phone,
      plan: 'free',
      credits: 10 + bonusCredits,
      sourceCodeCredits: 0,
      lastLoginDate: getTodayString(),
      projectsCreated: 0,
      projectsPublished: 0,
      referredBy: referredBy || null,
      isBanned: false,
      features: [] 
    };
    
    await set(ref(db, `users/${res.user.uid}/profile`), newProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        userProfile, 
        loading, 
        login, 
        register, 
        logout,
        checkDailyCredits: async () => {
             if(user && userProfile) await checkDailyCredits(user.uid, userProfile);
        }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};