
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Code2, Loader2, User, Mail, Lock, ArrowRight, Gift, Phone, CheckCircle2 } from 'lucide-react';

interface Props {
    onSuccess?: () => void;
}

const AuthScreen: React.FC<Props> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Register Extra Fields (Optional)
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const mapFirebaseError = (code: string) => {
    switch (code) {
        case 'auth/email-already-in-use': return 'This email is already registered.';
        case 'auth/invalid-email': return 'Invalid email address format.';
        case 'auth/weak-password': return 'Password should be at least 6 characters.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password. Please try again.';
        case 'auth/network-request-failed': return 'Network error. Check your connection.';
        default: return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        if (onSuccess) onSuccess();
      } else {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        
        await register({
          email,
          password,
          username: username || 'New User', // Default if empty
          phone: phone || '',
          referredBy: referralCode || null
        });

        setSuccess('Account Created Successfully! Redirecting...');
        setTimeout(() => {
            if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      const errorCode = err.code || '';
      setError(errorCode ? mapFirebaseError(errorCode) : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#16181D] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <Code2 className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-white mb-2 uppercase tracking-tighter italic">
            {isLogin ? 'Welcome Back' : 'Join Myself IDE'}
          </h2>
          <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-8 opacity-60">
            {isLogin ? 'Login to continue your projects' : 'Create an account to start building'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase tracking-wider text-center animate-in shake duration-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name (Optional)"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-[#0F1117] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="tel"
                    placeholder="Phone (Optional)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#0F1117] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
                  />
                </div>
              </>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
              />
            </div>

            {!isLogin && (
              <>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
                />
              </div>
              <div className="relative group">
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Referral Code (Optional)"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-600 focus:outline-none transition-all font-bold"
                />
              </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 uppercase text-xs tracking-widest"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In Now' : 'Create My Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
              {isLogin ? "New to the platform?" : "Already have an account?"}
              <button
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                }}
                className="ml-2 text-indigo-400 hover:text-white font-black transition-colors"
              >
                {isLogin ? 'Create Account' : 'Log In Here'}
              </button>
            </p>
          </div>
        </div>
    </div>
  );
};

export default AuthScreen;
