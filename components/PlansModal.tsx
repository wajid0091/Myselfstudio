
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { push, ref, onValue } from 'firebase/database';
import { X, Check, Upload, Loader2, Zap, Copy, ArrowLeft, Image as ImageIcon, Clock, Star, Shield, Smartphone, Globe, Search } from 'lucide-react';
import { PaymentMethod, PlanConfig, Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Map internal keys to readable labels
const FEATURE_LABELS: Record<string, string> = {
    enableTailwind: "Tailwind CSS",
    enableBootstrap: "Bootstrap 5",
    enableSEO: "SEO Optimization",
    enablePWA: "PWA (App Support)",
    enableAdminPanel: "Admin Panel Gen.",
    enableFirebaseRules: "Firebase Security",
    enableImgBB: "Image Hosting",
    enableSecureMode: "Secure/Multi-page",
    enableResponsive: "Responsive Design",
    enableCustomCursor: "Custom Cursor"
};

const PlansModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [region, setRegion] = useState<'PK' | 'INTL'>('PK');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<Transaction | null>(null);
  
  // Dynamic Data
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  
  // Payment Form
  const [trxId, setTrxId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if(!isOpen) return;

      // 1. Check for Pending Approvals for this user
      if (user) {
          const pendingRef = ref(db, 'pending_approvals');
          onValue(pendingRef, (snapshot) => {
             if (snapshot.exists()) {
                 const data = snapshot.val();
                 // Find if ANY pending transaction belongs to current user
                 const myRequest = Object.values(data).find((t: any) => t.userId === user.uid) as Transaction | undefined;
                 setPendingRequest(myRequest || null);
             } else {
                 setPendingRequest(null);
             }
          });
      }

      // 2. Fetch Plans
      const plansRef = ref(db, 'system_settings/plans');
      onValue(plansRef, (snapshot) => {
          if(snapshot.exists()) {
              setPlans(snapshot.val());
          } else {
              setPlans({
                  free: { name: 'Free', price: 0, duration: 0, dailyCredits: 10, copyCredits: 0, features: [] },
                  basic: { name: 'Basic', price: 3, duration: 30, dailyCredits: 100, copyCredits: 5, features: ['enableTailwind', 'enableResponsive'] }
              });
          }
      });

      // 3. Fetch Methods
      const methodsRef = ref(db, 'system_settings/payment_methods');
      onValue(methodsRef, (snapshot) => {
          if(snapshot.exists()) {
              const data = snapshot.val();
              const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                  ...val,
                  id: key
              })) as PaymentMethod[];
              setPaymentMethods(list.filter(m => m.isEnabled));
          }
      });
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setScreenshot(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
      if (!user || !selectedPlanId || !selectedMethodId || !trxId) return;
      setSubmitting(true);

      const method = paymentMethods.find(m => m.id === selectedMethodId);
      const planConfig = plans[selectedPlanId];

      const transaction = {
          userId: user.uid,
          userName: userProfile?.name || 'User',
          plan: selectedPlanId,
          amount: region === 'PK' ? `PKR ${planConfig.price * 280}` : `$${planConfig.price}`,
          method: method?.name || 'Unknown',
          transactionId: trxId,
          screenshot: screenshot || '',
          status: 'pending',
          timestamp: Date.now()
      };

      // 1. Submit to Firebase
      await push(ref(db, 'pending_approvals'), transaction);

      // 2. Trigger Email Notification via FormSubmit
      try {
          // This uses AJAX to send the form data to FormSubmit without redirection
          await fetch("https://formsubmit.co/ajax/mbhia78@gmail.com", {
              method: "POST",
              headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: JSON.stringify({
                  _subject: `New Plan Purchase: ${planConfig.name} (${transaction.amount})`,
                  _template: 'table',
                  User_Name: transaction.userName,
                  User_Email: user.email,
                  Plan: planConfig.name,
                  Amount: transaction.amount,
                  Method: transaction.method,
                  Transaction_ID: transaction.transactionId,
                  Timestamp: new Date().toLocaleString(),
                  _captcha: "false" // Disable captcha for cleaner API usage
              })
          });
      } catch (err) {
          console.error("Email notification failed", err);
          // Don't block the UI flow, just log it. The firebase record is the source of truth.
      }

      setSubmitting(false);
      setStep(3);
  };

  // UI Rendering Logic
  const renderContent = () => {
      if (pendingRequest) {
          return (
              <div className="text-center py-10">
                  <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">Approval Pending</h3>
                  <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                      Your request to upgrade to <span className="text-blue-400 font-bold uppercase">{pendingRequest.plan.toUpperCase()}</span> is being reviewed.
                  </p>
                  <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 inline-block text-left text-sm space-y-2">
                      <p className="text-gray-500 text-xs font-bold uppercase">Transaction ID</p>
                      <p className="text-white font-mono mb-2">{pendingRequest.transactionId}</p>
                      <p className="text-gray-500 text-xs font-bold uppercase">Amount</p>
                      <p className="text-green-500 font-bold">{pendingRequest.amount}</p>
                  </div>
              </div>
          );
      }

      if (step === 3) {
          return (
              <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Request Submitted!</h3>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">We will verify your transaction shortly. Your plan will be updated automatically upon approval.</p>
                  <button onClick={onClose} className="bg-[#1A1D24] hover:bg-[#20232b] text-white px-8 py-3 rounded-xl border border-white/10 transition-colors font-bold uppercase text-xs tracking-widest">Close</button>
              </div>
          );
      }

      if (step === 2) {
          const plan = selectedPlanId ? plans[selectedPlanId] : null;
          const priceDisplay = plan ? (region === 'PK' ? `PKR ${plan.price * 280}` : `$${plan.price}`) : '';
          const activeMethod = paymentMethods.find(m => m.id === selectedMethodId);

          return (
              <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setStep(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                      <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">Complete Payment</h3>
                          <p className="text-xs text-indigo-400 font-bold uppercase">{plan?.name} Plan • {priceDisplay}</p>
                      </div>
                  </div>

                  {!activeMethod ? (
                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase">Select Payment Method</label>
                          <div className="grid grid-cols-1 gap-3">
                              {paymentMethods.filter(m => m.region === region || m.region === 'INTL').map(method => (
                                  <button
                                    key={method.id}
                                    onClick={() => setSelectedMethodId(method.id)}
                                    className="p-4 bg-[#1A1D24] border border-white/10 rounded-xl flex items-center justify-between hover:border-indigo-500 hover:bg-white/5 transition-all text-left group"
                                  >
                                      <div>
                                          <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{method.name}</h4>
                                          <p className="text-xs text-gray-500">{method.title}</p>
                                      </div>
                                      <div className="w-5 h-5 rounded-full border border-gray-600 group-hover:border-indigo-500"></div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-in slide-in-from-right">
                          <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{activeMethod.name} Details</span>
                                  <button onClick={() => setSelectedMethodId('')} className="text-[10px] text-gray-400 underline hover:text-white">Change</button>
                              </div>
                              <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between group cursor-pointer" onClick={() => handleCopy(activeMethod.details)}>
                                  <code className="text-sm text-white font-mono break-all">{activeMethod.details}</code>
                                  <div className="p-2 text-gray-500 group-hover:text-white">
                                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                  </div>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-2 italic">Send exactly <strong className="text-white">{priceDisplay}</strong> to the account above.</p>
                          </div>

                          <div className="space-y-4">
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Transaction ID / Ref No.</label>
                                  <input 
                                      type="text" 
                                      value={trxId} 
                                      onChange={(e) => setTrxId(e.target.value)} 
                                      placeholder="e.g. 8573928192"
                                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none"
                                  />
                              </div>

                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Proof Screenshot</label>
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all text-center"
                                  >
                                      {screenshot ? (
                                          <div className="relative w-full h-32">
                                              <img src={screenshot} alt="Proof" className="w-full h-full object-contain" />
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                                                  <span className="text-xs text-white font-bold">Change Image</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <>
                                              <ImageIcon className="w-8 h-8 text-gray-600 mb-2" />
                                              <span className="text-xs text-gray-400">Click to upload screenshot</span>
                                          </>
                                      )}
                                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  </div>
                              </div>
                          </div>

                          <button 
                            onClick={handleSubmit}
                            disabled={!trxId || !screenshot || submitting}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Payment Proof'}
                          </button>
                      </div>
                  )}
              </div>
          );
      }

      // STEP 1: SELECT PLAN
      return (
          <div className="space-y-6">
              <div className="flex justify-center gap-2 p-1 bg-black/40 rounded-xl w-max mx-auto border border-white/5">
                  <button onClick={() => setRegion('PK')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${region === 'PK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>PKR (Pakistan)</button>
                  <button onClick={() => setRegion('INTL')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${region === 'INTL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>USD (International)</button>
              </div>

              <div className="grid grid-cols-1 gap-6 pb-10">
                  {Object.entries(plans).filter(([id]) => id !== 'free').map(([id, plan]: [string, PlanConfig]) => {
                      const isCurrent = userProfile?.plan === id;
                      return (
                        <div 
                            key={id} 
                            onClick={() => !isCurrent && setSelectedPlanId(id)}
                            className={`relative p-6 rounded-3xl border transition-all cursor-pointer flex flex-col ${
                                selectedPlanId === id 
                                ? 'bg-[#1A1D24] border-indigo-500 shadow-2xl shadow-indigo-900/20 scale-[1.01]' 
                                : isCurrent 
                                    ? 'bg-[#1A1D24]/50 border-green-500/50 cursor-default'
                                    : 'bg-[#1A1D24] border-white/5 hover:border-white/20'
                            }`}
                        >
                            {isCurrent && (
                                <div className="absolute top-4 right-4 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-green-500/20">
                                    Active
                                </div>
                            )}
                            <div className="mb-4">
                                <h3 className="text-xl font-black text-white uppercase italic">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-bold text-indigo-400">
                                        {region === 'PK' ? `Rs ${plan.price * 280}` : `$${plan.price}`}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold uppercase">/ month</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6 flex-1">
                                <li className="flex items-center gap-2 text-xs text-gray-300">
                                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                    <span className="font-bold">{plan.dailyCredits} Daily Credits</span>
                                </li>
                                <li className="flex items-center gap-2 text-xs text-gray-300">
                                    <Copy className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="font-bold">{plan.copyCredits} Code Unlocks</span>
                                </li>
                                {plan.features && plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                                        <Check className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{FEATURE_LABELS[f] || f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => {
                                    if(!isCurrent) {
                                        setSelectedPlanId(id);
                                        setStep(2);
                                    }
                                }}
                                disabled={isCurrent}
                                className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                                    isCurrent 
                                    ? 'bg-white/5 text-gray-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                                }`}
                            >
                                {isCurrent ? 'Current Plan' : 'Select Plan'}
                            </button>
                        </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-[#16181D] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row">
          {/* Decorative Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex w-full md:w-1/3 bg-gradient-to-br from-indigo-900/40 to-[#0F1117] p-8 flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10 backdrop-blur-sm">
                      <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">Upgrade<br/>Your Power.</h2>
                  <p className="text-sm text-indigo-200 font-medium leading-relaxed">
                      Unlock advanced AI capabilities, responsive tools, and cloud features to build faster than ever.
                  </p>
              </div>
              <div className="relative z-10 mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-gray-300 font-bold uppercase tracking-wide">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center"><Shield className="w-4 h-4 text-indigo-400" /></div>
                      Secure & Private
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-300 font-bold uppercase tracking-wide">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><Zap className="w-4 h-4 text-green-400" /></div>
                      Instant Activation
                  </div>
              </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-[#16181D] h-full overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-[#16181D] z-10">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Pricing & Billing</span>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-20 md:pb-6">
                  {renderContent()}
              </div>
          </div>
      </div>
    </div>
  );
};

export default PlansModal;
