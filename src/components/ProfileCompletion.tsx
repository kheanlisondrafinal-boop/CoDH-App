import React, { useState, useRef } from 'react';
import { Camera, User, Phone, CheckCircle2, RotateCcw } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

const ProfileCompletion: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.displayName || '');
  const [contactNumber, setContactNumber] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Photo

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        
        // Stop stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user || !fullName || !contactNumber || !photo) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: fullName,
        phoneNumber: contactNumber,
        photoURL: photo,
        profileCompleted: true,
        updatedAt: serverTimestamp()
      });
      // The auth observer will pick up the changes if it was a real-time listener, 
      // but AuthContext currently only fetches on mount or trigger.
      // We might need to refresh the page or manually update local state if we want instant change.
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/[0.03] dark:from-emerald-500/5 via-transparent to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10 transition-colors"
      >
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-6 shadow-2xl shadow-emerald-500/20 text-slate-950">
              <CheckCircle2 size={32} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter mb-2 italic">Initialize Profile</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Medical Staff Onboarding</p>
          </div>

          <div className="space-y-6">
            {step === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Official Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="e.g. Dra. Maria Santos"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Active Contact Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="e.g. +63 912 345 6789"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName || !contactNumber}
                  className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black shadow-xl shadow-black/10 dark:shadow-white/5 hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none text-xs uppercase tracking-widest"
                >
                  Continue to Identity Photo
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  {photo ? (
                    <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                  ) : isCapturing ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-300 dark:text-slate-700">
                      <Camera size={48} strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">ID Photo Required</p>
                    </div>
                  )}
                  
                  {isCapturing && (
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none rounded-3xl" />
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex gap-3">
                  {!photo && !isCapturing && (
                    <button
                      onClick={startCamera}
                      className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                      <Camera size={16} /> Open Camera
                    </button>
                  )}
                  {isCapturing && (
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                      <CheckCircle2 size={16} /> Capture Now
                    </button>
                  )}
                  {photo && (
                    <div className="flex w-full gap-3">
                      <button
                        onClick={() => { setPhoto(null); startCamera(); }}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                      >
                        <RotateCcw size={16} /> Retake
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!photo || loading}
                    className="flex-[2] py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black shadow-xl shadow-black/10 dark:shadow-white/5 hover:bg-emerald-500 transition-all disabled:opacity-30 flex items-center justify-center text-xs uppercase tracking-widest"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-500 border-t-emerald-500 rounded-full animate-spin" />
                    ) : 'Finalize Registration'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 text-center border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={() => signOut()}
            className="text-[10px] font-black text-slate-400 dark:text-slate-600 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
          >
            Cancel and Logout &bull; CoDH
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileCompletion;
