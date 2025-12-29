'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  login, saveStudentReferences, getStudentSubmissions, submitAssignment, getAcademyGallery 
} from '@/services/api';
import { ImageSlider } from '@/components/ImageSlider';
import { Profile, Submission } from '@/types';
import { 
  Loader2, Home, Building, History, 
  Upload, CheckCircle, AlertCircle, Clock, 
  ChevronRight, Send, RefreshCw, X,
  LayoutGrid, MonitorPlay, LogOut
} from 'lucide-react';

/* ================= WRAPPER ================= */

export default function StudentDashboardWrapper() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('activeUserEmail');
    if (!email) {
      router.push('/login');
      return;
    }
    login(email).then(profile => {
      if (!profile) router.push('/login');
      else setUser(profile);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d90238]" size={32} />
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans flex overflow-hidden">
      <StudentWorkspace user={user} setUser={setUser} />
    </div>
  );
}

/* ================= MAIN WORKSPACE ================= */

function StudentWorkspace({
  user,
  setUser,
}: {
  user: Profile;
  setUser: (u: Profile) => void;
}) {
  const router = useRouter();

  const [history, setHistory] = useState<Submission[]>([]);
  const [gallerySubmissions, setGallerySubmissions] = useState<Submission[]>([]);
  const [viewMode, setViewMode] = useState<'workspace' | 'gallery'>('workspace');
  const [context, setContext] = useState<'interior' | 'exterior'>('interior');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const [renderFile, setRenderFile] = useState<File | null>(null);
  const [renderPreview, setRenderPreview] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (viewMode === 'workspace') {
        const all = await getStudentSubmissions(user.id);
        const current = all
          .filter(s => s.assignment_number === user.current_level)
          .sort(
            (a, b) =>
              new Date(a.created_at || 0).getTime() -
              new Date(b.created_at || 0).getTime()
          );
        setHistory(current);
        setSelectedHistoryId(current.at(-1)?.id ?? null);
      } else {
        setGallerySubmissions(await getAcademyGallery());
      }
    };
    load();
  }, [viewMode, user.id, user.current_level]);

  const latest = history.at(-1);
  const canUpload = !latest || latest.status === 'rejected';

  const currentRefImage =
    context === 'interior' ? user.references?.interior : user.references?.exterior;

  const currentRenderImage =
    selectedHistoryId
      ? history.find(h => h.id === selectedHistoryId)?.render_image_url
      : renderPreview;

  const viewStatus = selectedHistoryId
    ? history.find(h => h.id === selectedHistoryId)?.status.toUpperCase()
    : 'DRAFT';

  return (
    <div className="flex w-full h-screen overflow-hidden">

      {/* ================= LEFT COMMAND RAIL ================= */}
      <div className="w-[72px] bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-6 shrink-0 z-50">

        {/* BRAND */}
        <div className="mb-10">
          <div className="w-10 h-10 rounded-lg bg-[#d90238] flex items-center justify-center font-black text-white">
            RTA
          </div>
        </div>

        {/* MAIN ACTIONS */}
        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => setViewMode('workspace')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
              ${viewMode === 'workspace'
                ? 'bg-white text-black shadow-lg'
                : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`}
            title="Workspace"
          >
            <MonitorPlay size={18} />
          </button>

          <button
            onClick={() => setViewMode('gallery')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
              ${viewMode === 'gallery'
                ? 'bg-white text-black shadow-lg'
                : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`}
            title="Gallery"
          >
            <LayoutGrid size={18} />
          </button>

          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white/5 hover:text-white transition-all mt-6"
            title="Back"
          >
            <ChevronRight className="rotate-180" size={18} />
          </button>
        </div>

        {/* USER */}
        <div className="flex flex-col gap-4">
          <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:bg-white/5 transition-all">
            <Home size={16} />
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('activeUserEmail');
              window.location.href = '/login';
            }}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#d90238] hover:border-[#d90238] hover:text-white transition-all text-neutral-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* CONTEXT BAR */}
        <header className="h-14 border-b border-white/5 bg-[#050505] flex items-center px-8">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400">
              Master Class
            </span>
            <span className="text-sm text-white">
              Architecture Modeling
            </span>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'workspace' ? (
            <>
              {/* CENTER */}
              <div className="flex-1 flex items-center justify-center bg-black p-8">
                <div className="w-full max-w-[1600px] aspect-video bg-black border border-white/5 rounded-2xl overflow-hidden">
                  {currentRefImage && currentRenderImage ? (
                    <ImageSlider
                      referenceImage={currentRefImage}
                      renderImage={currentRenderImage}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={currentRefImage}
                      className="w-full h-full object-contain opacity-40"
                    />
                  )}
                </div>
              </div>

              {/* RIGHT PANEL (UNCHANGED LOGIC) */}
              {/* ⬇️ YOUR EXISTING RIGHT SIDEBAR CODE CONTINUES HERE WITHOUT CHANGE */}
            </>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto">
              <h1 className="text-3xl font-black text-white">Academy Gallery</h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
