
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
      
      if (profile.isBanned) {
          await logout();
          return;
      }

      let activePlan = profile.plan;
      let planExpiry = profile.planExpiry || 0;
      let currentFeatures = profile.features || [];
      let updates: any = {};

      if (activePlan !== 'free' && planExpiry > 0 && now > planExpiry) {
          activePlan = 'free';
          updates.plan = 'free';
          updates.planExpiry = 0;
          updates.credits = 10;
          updates.sourceCodeCredits = 0;
          
          try {
             const freePlanSnap = await get(ref(db, `system_settings/plans/free`));
             if(freePlanSnap.exists()) {
                 currentFeatures = freePlanSnap.val().features || [];
             } else {
                 currentFeatures = [];
             }
          } catch(e) { currentFeatures = []; }
      } else {
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

      let newCredits = profile.credits;
      if (profile.lastLoginDate !== today) {
          if (newCredits < 10) {
              newCredits = 10;
          }
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
      
      if (profileUnsubscribe) {
          off(ref(db, `users/${currentUser?.uid || 'unknown'}/profile`));
          profileUnsubscribe = null;
      }

      if (currentUser) {
        const profileRef = ref(db, `users/${currentUser.uid}/profile`);
        
        profileUnsubscribe = onValue(profileRef, async (snapshot) => {
            if (snapshot.exists()) {
                const profile = snapshot.val();
                if (profile.isBanned) {
                    await signOut(auth);
                    setUser(null);
                    setUserProfile(null);
                    setLoading(false);
                    return;
                }
                setUserProfile(profile);
            } else {
                const newProfile: UserProfile = {
                    id: currentUser.uid,
                    name: currentUser.displayName || 'Developer',
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
    const { email, password, username, phone, referredBy } = data;
    const res = await createUserWithEmailAndPassword(auth, email, password);
    
    let bonusCredits = 0;
    if (referredBy) {
         bonusCredits = 10; 
    }

    const newProfile: UserProfile = {
      id: res.user.uid,
      name: username || 'Developer',
      email: email,
      phone: phone || '',
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
