
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Code2, Loader2, User, Mail, Lock, ArrowRight, Gift, Phone } from 'lucide-react';

interface Props {
    onSuccess?: () => void;
}

const AuthScreen: React.FC<Props> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Register Extra Fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        await register({
          email,
          password,
          username,
          phone,
          referredBy: referralCode 
        });
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#16181D] border border-white/5 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Code2 className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-gray-400 text-sm mb-8">
            {isLogin ? 'Enter your credentials to access WAI IDE.' : 'Join the Wajid Ali IDE community today.'}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-[#0F1117] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#0F1117] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0F1117] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {!isLogin && (
              <>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Referral Code (Optional)"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  className="w-full bg-[#0F1117] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
    </div>
  );
};

export default AuthScreen;
