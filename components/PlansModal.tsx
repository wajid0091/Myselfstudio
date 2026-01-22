import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { push, ref, onValue } from 'firebase/database';
import { X, Check, Upload, Loader2, Zap, Copy, ArrowLeft, Image as ImageIcon, Clock, Star } from 'lucide-react';
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
                  basic: { name: 'Basic', price: 3, duration: 1, dailyCredits: 120, copyCredits: 5, features: ['enableTailwind'] }
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

      await push(ref(db, 'pending_approvals'), transaction);
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
                      Your request to upgrade to <span className="text-blue-400 font-bold uppercase">{pendingRequest.plan}</span> is being reviewed.
                  </p>
                  <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 inline-block text-left text-sm">
                      <p className="text-gray-500">Transaction ID: <span className="text-white">{pendingRequest.transactionId}</span></p>
                      <p className="text-gray-500">Method: <span className="text-white">{pendingRequest.method}</span></p>
                      <p className="text-gray-500">Amount: <span className="text-green-500 font-bold">{pendingRequest.amount}</span></p>
                  </div>
              </div>
          );
      }

      if (step === 3) {
          return (
              <div className="text-center py-10">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                  <p className="text-gray-400 mb-6">We will verify your transaction shortly. Your plan will be updated automatically upon approval.</p>
                  <button onClick={onClose} className="bg-[#1A1D24] hover:bg-[#20232b] text-white px-6 py-2 rounded-lg border border-white/10 transition-colors">Close</button>
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
                      <button onClick={() => setStep(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white"><ArrowLeft className="w-4 h-4" /></button>
                      <h3 className="text-lg font-bold text-white">Payment Details</h3>
                  </div>

                  <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex justify-between items-center">
                      <div>
                          <p className="text-xs text-blue-300 uppercase font-bold">Selected Plan</p>
                          <p className="text-lg font-bold text-white uppercase">{plan?.name}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-blue-300 uppercase font-bold">Total Amount</p>
                          <p className="text-xl font-bold text-white">{priceDisplay}</p>
                      </div>
                  </div>

                  {/* Region Toggle */}
                  <div className="flex bg-[#1A1D24] p-1 rounded-lg">
                      <button onClick={() => { setRegion('PK'); setSelectedMethodId(''); }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${region === 'PK' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>PKR (Pakistan)</button>
                      <button onClick={() => { setRegion('INTL'); setSelectedMethodId(''); }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${region === 'INTL' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Crypto / International</button>
                  </div>

                  {/* Method Selection */}
                  <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">Select Payment Method</label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {paymentMethods.filter(m => m.region === region).map(method => (
                              <button 
                                key={method.id}
                                onClick={() => setSelectedMethodId(method.id)}
                                className={`p-3 rounded-lg border text-left flex flex-col transition-all ${selectedMethodId === method.id ? 'bg-blue-600/20 border-blue-500' : 'bg-[#1A1D24] border-white/5 hover:border-white/20'}`}
                              >
                                  <span className="text-sm font-bold text-white">{method.name}</span>
                                  <span className="text-xs text-gray-400">{method.title}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Method Details & Input */}
                  {activeMethod && (
                      <div className="animate-in fade-in slide-in-from-bottom-2">
                          <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/10 mb-4">
                              <p className="text-xs text-gray-500 mb-1">Account Title / Network</p>
                              <p className="text-sm text-white font-bold mb-3">{activeMethod.title}</p>
                              
                              <p className="text-xs text-gray-500 mb-1">Account Number / Address</p>
                              <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
                                  <code className="text-xs text-blue-400 flex-1 break-all">{activeMethod.details}</code>
                                  <button onClick={() => handleCopy(activeMethod.details)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                              </div>
                          </div>

                          <div className="space-y-3">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Transaction ID (TID)</label>
                                  <input 
                                    type="text" 
                                    value={trxId}
                                    onChange={e => setTrxId(e.target.value)}
                                    placeholder="Enter Trx ID..."
                                    className="w-full bg-[#1A1D24] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none"
                                  />
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Screenshot (Optional)</label>
                                  <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    className="hidden" 
                                    accept="image/*"
                                  />
                                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#1A1D24] border border-white/10 border-dashed rounded-lg p-3 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center gap-2">
                                      {screenshot ? <span className="text-green-500 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Attached</span> : <><Upload className="w-4 h-4" /> Upload Proof</>}
                                  </button>
                              </div>

                              <button 
                                onClick={handleSubmit}
                                disabled={submitting || !trxId}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Approval'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          );
      }

      // Step 1: List Plans
      return (
          <div className="space-y-6">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
                  <p className="text-sm text-gray-400">Unlock more credits and advanced features</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(Object.entries(plans) as [string, PlanConfig][]).filter(([k]) => k !== 'free').map(([key, plan]) => (
                       <div key={key} className={`border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between ${selectedPlanId === key ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/10' : 'bg-[#1A1D24] border-white/5 hover:border-blue-500/30'}`} onClick={() => setSelectedPlanId(key)}>
                           <div>
                               <div className="flex justify-between items-start mb-2">
                                   <h3 className="text-lg font-bold text-white uppercase">{plan.name}</h3>
                                   {selectedPlanId === key && <div className="bg-blue-500 text-white rounded-full p-1"><Check className="w-3 h-3" /></div>}
                               </div>
                               <div className="text-2xl font-bold text-blue-400 mb-4">${plan.price}<span className="text-sm text-gray-500 font-normal"> / {plan.duration === 0 ? 'life' : 'mo'}</span></div>
                               
                               <ul className="space-y-2 mb-4">
                                   <li className="flex items-center gap-2 text-sm text-gray-300"><Zap className="w-4 h-4 text-yellow-400" /> {plan.dailyCredits} Daily Credits</li>
                                   <li className="flex items-center gap-2 text-sm text-gray-300"><Copy className="w-4 h-4 text-purple-400" /> {plan.copyCredits} Copy Credits</li>
                                   
                                   {/* FEATURES LIST FIX: Map internal keys to readable labels */}
                                   {(plan.features || []).map((f, i) => (
                                       <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                            <Star className="w-3 h-3 text-green-400 fill-green-400/20" /> 
                                            {FEATURE_LABELS[f] || f}
                                       </li>
                                   ))}
                               </ul>
                           </div>
                           <button onClick={() => { setSelectedPlanId(key); setStep(2); }} className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${selectedPlanId === key ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                               Choose {plan.name}
                           </button>
                       </div>
                   ))}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e2025] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
         <div className="flex justify-between items-center p-4 border-b border-white/5 shrink-0">
             <div className="flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-400" />
                 <span className="font-bold text-white">Pro Plans</span>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
         </div>
         <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
             {renderContent()}
         </div>
      </div>
    </div>
  );
};

export default PlansModal;