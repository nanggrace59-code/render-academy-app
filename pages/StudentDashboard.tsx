import React, { useEffect, useState, useContext } from 'react';
import { Profile, Submission } from '../types';
import { getStudentSubmissions, submitAssignment, getAcademyGallery, saveStudentReferences } from '../services/api';
import { ImageSlider } from '../components/ImageSlider';
import { AuthContext } from '../App';
import { 
  CheckCircle, Clock, 
  Upload, Loader2, AlertCircle, MessageSquare, History, Globe, X, User, Image, Home, Building,
  ChevronRight, Circle, PenTool, Calendar, Quote
} from 'lucide-react';

interface StudentDashboardProps {
    user: Profile;
    viewMode: 'workspace' | 'gallery';
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, viewMode }) => {
  const { setUser } = useContext(AuthContext); 
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [allMySubmissions, setAllMySubmissions] = useState<Submission[]>([]); // Store raw data for filtering

  // History State for Current Level (Workspace)
  const [currentLevelHistory, setCurrentLevelHistory] = useState<Submission[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | 'new_draft'>('new_draft');

  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  const [gallerySubmissions, setGallerySubmissions] = useState<Submission[]>([]);
  
  // Modal State
  const [modalSubmission, setModalSubmission] = useState<Submission | null>(null); // The specific version being viewed
  const [modalHistory, setModalHistory] = useState<Submission[]>([]); // The timeline for the modal assignment
  
  const [loading, setLoading] = useState(true);
  
  // --- PROJECT SETUP STATE ---
  const [interiorRefFile, setInteriorRefFile] = useState<File | null>(null);
  const [exteriorRefFile, setExteriorRefFile] = useState<File | null>(null);
  const [interiorPreview, setInteriorPreview] = useState<string>('');
  const [exteriorPreview, setExteriorPreview] = useState<string>('');
  const [isSavingRefs, setIsSavingRefs] = useState(false);

  // --- SUBMISSION STATE ---
  const [viewContext, setViewContext] = useState<'interior' | 'exterior'>('interior');
  const [renderFile, setRenderFile] = useState<File | null>(null);
  const [renderPreview, setRenderPreview] = useState<string>('');
  const [studentMessage, setStudentMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch Data
  const loadData = async () => {
    setLoading(true);
    
    if (viewMode === 'workspace') {
        const allSubs = await getStudentSubmissions(user.id);
        setAllMySubmissions(allSubs); // Store all for later use in modal
        
        // Filter for current level (Active Protocol)
        // Sort by Created At Ascending (Oldest -> Newest)
        const currentLevelSubs = allSubs
            .filter(s => s.assignment_number === user.current_level)
            .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        
        setCurrentLevelHistory(currentLevelSubs);

        // Active submission is the LATEST one
        const latest = currentLevelSubs.length > 0 ? currentLevelSubs[currentLevelSubs.length - 1] : null;
        setActiveSubmission(latest);
        
        // Find past approved submissions (Completed Levels)
        const past = allSubs
            .filter(s => s.assignment_number < user.current_level && s.status === 'approved')
            .sort((a, b) => b.assignment_number - a.assignment_number);

        // DEDUPLICATE: Ensure only one card per assignment number (the latest approved one)
        const uniqueMap = new Map<number, Submission>();
        past.forEach(sub => {
            if (!uniqueMap.has(sub.assignment_number)) {
                uniqueMap.set(sub.assignment_number, sub);
            }
        });
        const uniquePast = Array.from(uniqueMap.values()).sort((a, b) => b.assignment_number - a.assignment_number);

        setPastSubmissions(uniquePast);
        
        // Initial Logic for View State
        if (latest) {
          setViewingHistoryId(latest.id); 
          
          if (latest.status === 'rejected') {
             if (latest.student_message) setStudentMessage(latest.student_message);
             // Guess context
             if (user.references && latest.reference_image_url === user.references.exterior) {
                 setViewContext('exterior');
             } else {
                 setViewContext('interior');
             }
             setViewingHistoryId('new_draft');
          }
        } else {
            setViewingHistoryId('new_draft');
            setRenderPreview('');
            setStudentMessage('');
            setRenderFile(null);
        }
    } else {
        const gallerySubs = await getAcademyGallery();
        setGallerySubmissions(gallerySubs);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user.id, user.current_level, viewMode]);

  // Handle Opening Modal for Past Assignments
  const openAssignmentModal = (sub: Submission) => {
      // Find full history for this assignment number
      const history = allMySubmissions
        .filter(s => s.assignment_number === sub.assignment_number)
        .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      
      setModalHistory(history);
      // Default to the one clicked (usually the approved one), or the latest in history
      setModalSubmission(sub);
  };

  const closeAssignmentModal = () => {
      setModalSubmission(null);
      setModalHistory([]);
  };

  // Handle Project Setup Files
  const handleSetupFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      if (type === 'interior') {
        setInteriorRefFile(file);
        setInteriorPreview(preview);
      } else {
        setExteriorRefFile(file);
        setExteriorPreview(preview);
      }
    }
  };

  // Handle Save References
  const handleSaveReferences = async () => {
      if (!interiorRefFile || !exteriorRefFile) return;
      setIsSavingRefs(true);
      const updatedProfile = await saveStudentReferences(user.id, interiorRefFile, exteriorRefFile);
      if (updatedProfile) {
          setUser(updatedProfile);
      }
      setIsSavingRefs(false);
  };

  // Handle Render File Select
  const handleRenderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRenderFile(file);
      setRenderPreview(URL.createObjectURL(file));
      setViewingHistoryId('new_draft');
    }
  };

  // Handle Submit Assignment
  const handleSubmit = async () => {
    if (!renderPreview || !user.references) return;
    
    const refUrl = viewContext === 'interior' ? user.references.interior : user.references.exterior;

    setIsSubmitting(true);
    await submitAssignment(user.id, user.current_level, refUrl, renderFile, studentMessage);
    await loadData();
    setIsSubmitting(false);
    setRenderFile(null);
  };

  if (loading) return <div className="p-10 text-neutral-500 font-mono text-xs">Synchronizing Academy Data...</div>;

  // --- CONDITIONAL RENDER: PROJECT SETUP ---
  if (viewMode === 'workspace' && !user.references) {
      return (
        <div className="max-w-4xl mx-auto flex flex-col min-h-[80vh] justify-center items-center">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-4xl font-bold text-white mb-4">Project Initialization</h1>
                <p className="text-neutral-400 max-w-lg mx-auto">
                    Upload your master reference images. These will serve as the ground truth for all future assignments in this course.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-10 animate-in fade-in slide-in-from-bottom-8 delay-100">
                {/* Interior Upload */}
                <div className="bg-[#0f0f0f] border border-neutral-800 p-6 rounded-sm hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400"><Home size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Interior Reference</h3>
                            <p className="text-[10px] text-neutral-500 font-mono">LIVING ROOM / BEDROOM</p>
                        </div>
                    </div>
                    
                    <div className="relative h-64 border-2 border-dashed border-neutral-800 rounded-sm overflow-hidden group hover:border-red-600 transition-colors bg-black">
                        <input type="file" accept="image/*" onChange={(e) => handleSetupFileChange(e, 'interior')} className="absolute inset-0 opacity-0 z-20 cursor-pointer" />
                        {interiorPreview ? (
                            <img src={interiorPreview} className="w-full h-full object-cover" alt="Interior Ref" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600">
                                <Upload size={24} className="mb-2 group-hover:text-red-500 transition-colors" />
                                <span className="text-xs font-bold uppercase">Upload Image</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Exterior Upload */}
                <div className="bg-[#0f0f0f] border border-neutral-800 p-6 rounded-sm hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400"><Building size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Exterior Reference</h3>
                            <p className="text-[10px] text-neutral-500 font-mono">FACADE / LANDSCAPE</p>
                        </div>
                    </div>
                    
                    <div className="relative h-64 border-2 border-dashed border-neutral-800 rounded-sm overflow-hidden group hover:border-red-600 transition-colors bg-black">
                        <input type="file" accept="image/*" onChange={(e) => handleSetupFileChange(e, 'exterior')} className="absolute inset-0 opacity-0 z-20 cursor-pointer" />
                         {exteriorPreview ? (
                            <img src={exteriorPreview} className="w-full h-full object-cover" alt="Exterior Ref" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600">
                                <Upload size={24} className="mb-2 group-hover:text-red-500 transition-colors" />
                                <span className="text-xs font-bold uppercase">Upload Image</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSaveReferences}
                disabled={!interiorPreview || !exteriorPreview || isSavingRefs}
                className={`w-full max-w-md py-4 font-bold uppercase tracking-widest text-sm rounded-sm transition-all shadow-xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-8 delay-200 ${
                    (!interiorPreview || !exteriorPreview) 
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-red-900/20'
                }`}
            >
                {isSavingRefs ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                Initialize Project References
            </button>
        </div>
      );
  }

  // --- MAIN WORKSPACE ---
  
  const isPending = activeSubmission?.status === 'pending';
  const isRejected = activeSubmission?.status === 'rejected';
  
  // DETERMINE WHAT TO SHOW IN WORKSPACE SLIDER
  let displayRender = '';
  let displayRef = '';
  
  if (viewingHistoryId === 'new_draft') {
      displayRender = renderPreview;
      displayRef = viewContext === 'interior' ? user.references?.interior || '' : user.references?.exterior || '';
  } else {
      const histItem = currentLevelHistory.find(h => h.id === viewingHistoryId);
      if (histItem) {
          displayRender = histItem.render_image_url;
          displayRef = histItem.reference_image_url;
      }
  }

  const canUpload = !activeSubmission || activeSubmission.status === 'rejected';

  return (
    <div className="max-w-7xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col relative pb-20">
      
      {/* Top Header Row */}
      <div className="flex justify-between items-end mb-8 border-b border-neutral-800 pb-6">
        <div>
           {viewMode === 'workspace' ? (
             <>
               <div className="flex items-center gap-3 mb-2">
                 <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"/>
                 <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest">Active Protocol</h2>
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tight">Assignment {String(user.current_level).padStart(2, '0')}</h1>
             </>
           ) : (
             <>
               <div className="flex items-center gap-3 mb-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"/>
                 <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Academy Gallery</h2>
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tight">All Student Works</h1>
             </>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'workspace' ? (
        // --- WORKSPACE VIEW (Uploads + History) ---
        <div className="flex-1 flex flex-col mb-20 animate-in fade-in slide-in-from-left-4 duration-300">
          
          {/* Status Banners (Based on LATEST active submission) */}
          {isPending && (
             <div className="bg-[#0f0f0f] border border-neutral-800 p-6 mb-8 text-center rounded-sm animate-in fade-in">
               <div className="w-12 h-12 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Clock className="text-amber-500" size={24} />
               </div>
               <h3 className="text-white font-bold text-lg mb-1">Submission Under Review</h3>
               <p className="text-neutral-500 text-sm">Instructor evaluation in progress. Access is locked.</p>
             </div>
          )}

          {isRejected && (
             <div className="bg-red-900/10 border-l-4 border-red-600 p-6 mb-8 flex gap-4 animate-in fade-in">
                <AlertCircle className="text-red-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-sm uppercase mb-1 text-red-500 tracking-wide">Revision Required</h4>
                  <p className="text-neutral-300 text-sm leading-relaxed">{activeSubmission?.teacher_comment}</p>
                </div>
             </div>
          )}

          {/* Context Switcher & Comparison */}
          {(canUpload || currentLevelHistory.length > 0) && (
              <div className="mb-8 animate-in fade-in duration-500">
                  {/* Context Toggle (Only for New Drafts - History has fixed context) */}
                  {viewingHistoryId === 'new_draft' && (
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex bg-neutral-900 p-1 rounded-sm border border-neutral-800">
                            <button 
                                onClick={() => setViewContext('interior')}
                                className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewContext === 'interior' ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                <Home size={14} /> Interior Context
                            </button>
                            <button 
                                onClick={() => setViewContext('exterior')}
                                className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewContext === 'exterior' ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                            >
                                <Building size={14} /> Exterior Context
                            </button>
                        </div>
                    </div>
                  )}

                  {/* Main Slider Area */}
                  <div className="w-full h-[600px] border border-neutral-800 bg-black rounded-sm overflow-hidden shadow-2xl flex flex-col shrink-0">
                    <div className="bg-neutral-900/80 backdrop-blur-sm z-20 px-4 py-2 border-b border-neutral-800 flex justify-between items-center shrink-0 h-10">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                             {viewingHistoryId === 'new_draft' ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  <span>Current Workstation (Draft)</span>
                                </>
                             ) : (
                                <>
                                   <History size={12} className="text-neutral-500" />
                                   <span className="text-neutral-400">Viewing History:</span>
                                   <span className="text-white">Attempt Record</span>
                                </>
                             )}
                        </span>
                        <span className="text-[10px] text-neutral-500 flex items-center gap-2">
                             {viewingHistoryId !== 'new_draft' ? (
                                 <span className="text-neutral-400">Context Locked</span>
                             ) : (
                                 <>Master Reference: <span className="text-emerald-500">{viewContext.toUpperCase()}</span></>
                             )}
                        </span>
                    </div>
                    <div className="flex-1 relative min-h-0 bg-black">
                        {displayRender && displayRef ? (
                            <ImageSlider referenceImage={displayRef} renderImage={displayRender} className="h-full border-0 rounded-none bg-black" />
                        ) : (
                            <div className="w-full h-full flex flex-col md:flex-row">
                                {/* Left: Reference Preview (Static) */}
                                <div className="flex-1 bg-black border-r border-neutral-800 relative group">
                                    <img src={displayRef || (viewContext === 'interior' ? user.references?.interior : user.references?.exterior)} className="w-full h-full object-contain opacity-50" alt="Master Ref" />
                                    <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-bold px-2 py-1 border border-neutral-700">MASTER REFERENCE</div>
                                </div>
                                {/* Right: Placeholder for Render */}
                                <div className="flex-1 bg-[#050505] flex flex-col items-center justify-center text-neutral-600">
                                    <Image size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-mono uppercase">Upload Render to Compare</p>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* --- HISTORY TIMELINE CONTROLS (Active Assignment) --- */}
                  <div className="flex justify-center mt-6">
                     <div className="flex items-center gap-4 bg-neutral-900/50 p-3 rounded-full border border-neutral-800/50 backdrop-blur-sm">
                        
                        {/* 1. Historical Nodes */}
                        {currentLevelHistory.map((sub, idx) => (
                            <div key={sub.id} className="relative group">
                                <button
                                    onClick={() => setViewingHistoryId(sub.id)}
                                    className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                                        viewingHistoryId === sub.id 
                                        ? 'w-5 h-5 ring-2 ring-white ring-offset-2 ring-offset-black z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                                        : 'w-3 h-3 hover:scale-150 z-0'
                                    } ${
                                        sub.status === 'rejected' ? 'bg-red-600' :
                                        sub.status === 'pending' ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                    }`}
                                >
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black border border-neutral-800 px-2 py-1 rounded-sm z-50">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white">Attempt {idx + 1}</div>
                                        <div className={`text-[9px] font-mono ${sub.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`}>{sub.status.toUpperCase()}</div>
                                    </div>
                                </button>
                                <div className="absolute top-1/2 left-full w-4 h-px bg-neutral-800 -translate-y-1/2 -z-10" />
                            </div>
                        ))}

                        {/* 2. Current/Draft Node */}
                        {canUpload && (
                            <div className="relative group pl-4 border-l border-neutral-800">
                                <button
                                    onClick={() => setViewingHistoryId('new_draft')}
                                    className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 border ${
                                        viewingHistoryId === 'new_draft'
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700 hover:text-white'
                                    }`}
                                >
                                    <PenTool size={10} />
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black border border-neutral-800 px-2 py-1 rounded-sm z-50">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-white">New Submission</div>
                                        <div className="text-[9px] font-mono text-blue-400">DRAFT</div>
                                    </div>
                                </button>
                            </div>
                        )}
                     </div>
                  </div>
              </div>
          )}

          {/* Upload Interface */}
          {canUpload && viewingHistoryId === 'new_draft' && (
             <div className="animate-in slide-in-from-bottom-8 duration-500 bg-[#0a0a0a] p-6 border border-neutral-900 rounded-sm">
                 <div className="mb-6">
                     <div className="relative group">
                       <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-wider flex justify-between">
                          <span>Student Render Upload</span>
                          {renderFile && <span className="text-emerald-500">Selected</span>}
                       </label>
                       <div className={`relative h-32 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer rounded-sm overflow-hidden ${renderPreview ? 'border-neutral-800' : 'border-neutral-800 hover:border-red-600 bg-neutral-900/50'}`}>
                          <input type="file" accept="image/*" onChange={handleRenderFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                           {renderPreview ? (
                              <div className="flex items-center gap-3 z-10 bg-black/80 px-4 py-2 rounded-full border border-neutral-800">
                                  <CheckCircle size={16} className="text-emerald-500" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">File Ready for Submission</span>
                              </div>
                          ) : (
                              <div className="relative z-10 flex flex-col items-center"><Upload size={20} className="text-neutral-500 mb-2 group-hover:text-red-500" /><span className="text-xs text-neutral-400 font-bold uppercase">Click to Select Render</span></div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 items-start">
                     <div className="flex-1">
                         <div className="relative">
                             <MessageSquare className="absolute top-3 left-3 text-neutral-600" size={16} />
                             <input type="text" value={studentMessage} onChange={(e) => setStudentMessage(e.target.value)} className="w-full bg-[#0f0f0f] border border-neutral-800 rounded-sm py-3 pl-10 pr-4 text-sm text-neutral-200 focus:outline-none focus:border-red-600 placeholder-neutral-700 font-sans" placeholder="Add a brief note to the instructor (optional)..." />
                         </div>
                     </div>
                     <button onClick={handleSubmit} disabled={!renderPreview || isSubmitting} className={`px-8 py-3 font-bold uppercase tracking-wider text-xs rounded-sm shadow-xl transition-all flex items-center gap-2 ${(!renderPreview) ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]'}`}>
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Submit Revision
                     </button>
                 </div>
             </div>
          )}

          {/* If viewing history item (Rejected one), show the teacher feedback specifically for THAT item */}
          {viewingHistoryId !== 'new_draft' && (
              <div className="mt-4 bg-red-900/10 border border-red-900/30 p-4 rounded-sm animate-in fade-in">
                  <div className="flex items-start gap-3">
                      <MessageSquare className="text-red-500 mt-1" size={16} />
                      <div>
                          <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Historical Feedback</h4>
                          <p className="text-neutral-300 text-sm italic">
                            "{currentLevelHistory.find(h => h.id === viewingHistoryId)?.teacher_comment || 'No feedback recorded.'}"
                          </p>
                      </div>
                  </div>
              </div>
          )}

          {/* History Section (Only visible in Workspace mode) */}
          {pastSubmissions.length > 0 && (
             <div className="border-t border-neutral-800 pt-10 mt-10 animate-in fade-in">
                <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <History size={16} /> Mission History
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {pastSubmissions.map(sub => (
                        <div 
                           key={sub.id} 
                           onClick={() => openAssignmentModal(sub)}
                           className="block border border-neutral-800 bg-[#0f0f0f] rounded-sm hover:border-neutral-600 cursor-pointer transition-all group overflow-hidden hover:transform hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="h-40 w-full bg-black relative overflow-hidden">
                                <img src={sub.render_image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Past work" />
                                <div className="absolute top-2 right-2 bg-emerald-900/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-sm border border-emerald-800 backdrop-blur-sm">APPROVED</div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-bold text-sm">Assignment {String(sub.assignment_number).padStart(2,'0')}</span>
                                    <CheckCircle size={14} className="text-emerald-500" />
                                </div>
                                <p className="text-[10px] text-neutral-500 font-mono mt-1">Click to Inspect</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}
        </div>
      ) : (
        // --- GALLERY VIEW (All Students) ---
        <div className="animate-in fade-in zoom-in-95 duration-300">
           {gallerySubmissions.length === 0 ? (
               <div className="text-center py-20 text-neutral-600">
                   <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                   <p className="text-sm">No public works available in the academy gallery yet.</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {gallerySubmissions.map(sub => (
                       <div 
                           key={sub.id} 
                           onClick={() => openAssignmentModal(sub)}
                           className="group relative aspect-square bg-black border border-neutral-800 overflow-hidden rounded-sm hover:border-neutral-600 cursor-pointer transition-all"
                       >
                           <img src={sub.render_image_url} alt="Gallery" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                           <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                               <p className="text-white font-bold text-sm">Assignment {String(sub.assignment_number).padStart(2,'0')}</p>
                               <p className="text-[10px] text-neutral-400 font-mono mt-1">Rendered by Agent {sub.student_id.substring(0,4)}</p>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </div>
      )}

      {/* --- REFACTORED MODAL: SPOTS UNDER IMAGE, FEEDBACK BESIDE --- */}
      {modalSubmission && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-900 bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-800 rounded-sm flex items-center justify-center text-white font-bold border border-neutral-700">
                        {String(modalSubmission.assignment_number).padStart(2, '0')}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Protocol Inspection</h2>
                        <p className="text-[10px] text-neutral-500 font-mono">
                            AGENT ID: {modalSubmission.student_id} • STATUS: <span className={modalSubmission.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}>{modalSubmission.status.toUpperCase()}</span>
                        </p>
                    </div>
                </div>
                <button 
                    onClick={closeAssignmentModal}
                    className="group bg-neutral-900 hover:bg-red-600 border border-neutral-800 hover:border-red-500 text-white p-2 rounded-sm transition-all"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            {/* Modal Body: Flex Layout */}
            <div className="flex-1 flex min-h-0 bg-[#000000]">
                
                {/* COL 1: Main Image Area */}
                <div className="flex-1 flex flex-col relative min-w-0">
                    {/* Image Slider (Takes available height) */}
                    <div className="flex-1 relative w-full bg-black overflow-hidden">
                        <ImageSlider 
                            referenceImage={modalSubmission.reference_image_url} 
                            renderImage={modalSubmission.render_image_url} 
                            className="h-full border-0 rounded-none w-full" 
                            isModalView={true}
                        />
                    </div>
                    
                    {/* Compact Footer: History Spots */}
                    <div className="shrink-0 h-12 bg-[#0a0a0a] border-t border-neutral-900 flex items-center justify-center relative">
                        {/* Connecting Line */}
                        <div className="absolute h-px bg-neutral-800 w-1/3 left-1/2 -translate-x-1/2 top-1/2"></div>
                        
                        <div className="flex items-center gap-6 z-10 bg-[#0a0a0a] px-4">
                            {modalHistory.map((histItem, idx) => (
                                <div key={histItem.id} className="relative group">
                                     <button 
                                        onClick={() => setModalSubmission(histItem)}
                                        className={`rounded-full transition-all duration-300 ${
                                            modalSubmission?.id === histItem.id 
                                            ? 'w-3 h-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110'
                                            : histItem.status === 'rejected' ? 'w-2 h-2 bg-neutral-700 hover:bg-red-500' 
                                            : histItem.status === 'pending' ? 'w-2 h-2 bg-neutral-700 hover:bg-amber-500' 
                                            : 'w-2 h-2 bg-neutral-700 hover:bg-emerald-500'
                                        }`}
                                     >
                                     </button>
                                     {/* Simple Tooltip */}
                                     <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-neutral-800 px-2 py-1 rounded-sm pointer-events-none whitespace-nowrap">
                                        <div className="text-[9px] font-mono text-neutral-400">V{idx + 1}</div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COL 2: Sidebar (Feedback) */}
                <div className="w-80 shrink-0 bg-[#0a0a0a] border-l border-neutral-900 flex flex-col overflow-y-auto">
                    <div className="p-6 border-b border-neutral-900">
                         <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Quote size={12} /> Instructor Evaluation
                         </h3>
                         
                         <div className="bg-[#111] border border-neutral-800 p-5 rounded-sm relative">
                             {/* Decorative Quote Mark */}
                             <span className="absolute top-2 left-2 text-neutral-800 text-4xl font-serif leading-none opacity-50">"</span>
                             
                             {modalSubmission.teacher_comment ? (
                                 <p className="text-neutral-300 text-sm italic leading-relaxed relative z-10 pt-2">
                                     {modalSubmission.teacher_comment}
                                 </p>
                             ) : (
                                 <p className="text-neutral-600 text-xs italic relative z-10 pt-2">
                                     No feedback recorded for this version.
                                 </p>
                             )}
                         </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Submission Details</h3>
                        <div className="space-y-3">
                             <div className="flex justify-between items-center text-xs">
                                 <span className="text-neutral-600">Status</span>
                                 <span className={`uppercase font-bold ${
                                     modalSubmission.status === 'approved' ? 'text-emerald-500' : 
                                     modalSubmission.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                                 }`}>{modalSubmission.status}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs">
                                 <span className="text-neutral-600">Date</span>
                                 <span className="text-neutral-400 font-mono">
                                     {modalSubmission.created_at ? new Date(modalSubmission.created_at).toLocaleDateString() : 'N/A'}
                                 </span>
                             </div>
                             <div className="flex justify-between items-center text-xs">
                                 <span className="text-neutral-600">Version ID</span>
                                 <span className="text-neutral-500 font-mono">{modalSubmission.id.substring(0,8)}</span>
                             </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};