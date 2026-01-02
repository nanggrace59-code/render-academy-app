(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[709],{1727:function(e,t,r){Promise.resolve().then(r.bind(r,2684))},2684:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return m}});var s=r(3827),a=r(4090),n=r(7907),i=r(7014),l=r(4051),d=r(8994),c=r(3879),o=r(1213),u=r(7461);/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let x=(0,u.Z)("MessageSquareQuote",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}],["path",{d:"M8 12a2 2 0 0 0 2-2V8H8",key:"1jfesj"}],["path",{d:"M14 12a2 2 0 0 0 2-2V8h-2",key:"1dq9mh"}]]),h=(0,u.Z)("PenTool",[["path",{d:"m12 19 7-7 3 3-7 7-3-3z",key:"rklqx2"}],["path",{d:"m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z",key:"1et58u"}],["path",{d:"m2 2 7.586 7.586",key:"etlp93"}],["circle",{cx:"11",cy:"11",r:"2",key:"xmgehs"}]]);var p=r(2235);/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let f=(0,u.Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);function m(e){let{params:t}=e,r=(0,n.useRouter)(),[u,m]=(0,a.useState)(null),[b,y]=(0,a.useState)(null),[g,k]=(0,a.useState)(""),[v,j]=(0,a.useState)(!0);(0,a.useEffect)(()=>{(async()=>{let{data:e,error:s}=await i.O.from("submissions").select("*").eq("id",t.id).single();if(s||!e){r.push("/teacher/dashboard");return}m(e),e.teacher_comment&&k(e.teacher_comment);let{data:a}=await i.O.from("profiles").select("*").eq("id",e.user_id).single();y(a),j(!1)})()},[t.id,r]);let w=async()=>{if(!u)return;let e=g.trim()||"Excellent execution. Progression approved.";await i.O.from("submissions").update({status:"approved",teacher_comment:e,updated_at:new Date().toISOString()}).eq("id",u.id),b&&await i.O.from("profiles").update({current_level:(b.current_level||1)+1}).eq("id",b.id),r.push("/teacher/dashboard")},N=async()=>{if(u){if(!g.trim()){alert("Please provide specific feedback before rejecting.");return}await i.O.from("submissions").update({status:"rejected",teacher_comment:g,updated_at:new Date().toISOString()}).eq("id",u.id),r.push("/teacher/dashboard")}};return v||!u?(0,s.jsx)("div",{className:"h-screen bg-[#050505] flex items-center justify-center",children:(0,s.jsx)(d.Z,{className:"animate-spin text-[#d90238]"})}):(0,s.jsxs)("div",{className:"absolute inset-4 md:inset-6 flex flex-col bg-[#050505] rounded-lg border border-neutral-800 shadow-2xl overflow-hidden font-sans",children:[(0,s.jsxs)("div",{className:"h-14 bg-[#0a0a0a] border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-20",children:[(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsxs)("button",{onClick:()=>r.push("/teacher/dashboard"),className:"flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest group",children:[(0,s.jsx)(c.Z,{size:14,className:"group-hover:-translate-x-1 transition-transform"})," Back"]}),(0,s.jsx)("div",{className:"h-4 w-px bg-neutral-800"}),(0,s.jsx)("h1",{className:"text-sm font-bold text-white tracking-wide uppercase",children:"Grading Console"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[(0,s.jsxs)("div",{className:"text-[10px] text-neutral-600 font-mono hidden md:block",children:["ID: ",u.id.substring(0,8).toUpperCase()]}),(0,s.jsxs)("div",{className:"px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-2 ".concat("pending"===u.status?"border-amber-500/20 text-amber-500 bg-amber-500/5":"approved"===u.status?"border-emerald-500/20 text-emerald-500 bg-emerald-500/5":"border-red-500/20 text-red-500 bg-red-500/5"),children:[(0,s.jsx)("div",{className:"w-1.5 h-1.5 rounded-full ".concat("pending"===u.status?"bg-amber-500 animate-pulse":"approved"===u.status?"bg-emerald-500":"bg-red-500")}),u.status]})]})]}),(0,s.jsxs)("div",{className:"flex-1 flex min-h-0",children:[(0,s.jsx)("div",{className:"flex-1 relative bg-black min-w-0",children:(0,s.jsx)(l.x,{referenceImage:u.reference_image_url,renderImage:u.render_image_url,className:"h-full w-full border-0 rounded-none"})}),(0,s.jsxs)("div",{className:"w-[380px] bg-[#0a0a0a] border-l border-neutral-800 flex flex-col shrink-0 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]",children:[(0,s.jsxs)("div",{className:"p-6 border-b border-neutral-800",children:[(0,s.jsxs)("div",{className:"flex items-start justify-between mb-4",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-lg font-bold text-white mb-1",children:(null==b?void 0:b.full_name)||"Student"}),(0,s.jsxs)("div",{className:"flex items-center gap-2 text-xs text-neutral-500 font-mono",children:[(0,s.jsxs)("span",{className:"bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]",children:["LVL ",u.assignment_number]}),(0,s.jsx)("span",{children:null==b?void 0:b.email})]})]}),(0,s.jsx)("div",{className:"w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-500",children:(0,s.jsx)(o.Z,{size:20})})]}),(0,s.jsxs)("div",{className:"bg-[#111] border border-neutral-800 rounded-lg p-4 relative",children:[(0,s.jsxs)("div",{className:"absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1",children:[(0,s.jsx)(x,{size:10})," Student Note"]}),(0,s.jsxs)("p",{className:"text-sm text-neutral-300 italic font-serif leading-relaxed",children:['"',u.student_message||"No message.",'"']})]})]}),(0,s.jsxs)("div",{className:"flex-1 flex flex-col p-6 bg-gradient-to-b from-[#0a0a0a] to-[#050505]",children:[(0,s.jsx)("div",{className:"flex items-center justify-between mb-3",children:(0,s.jsxs)("h3",{className:"text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2",children:[(0,s.jsx)(h,{size:12})," Instructor Feedback"]})}),(0,s.jsx)("textarea",{value:g,onChange:e=>k(e.target.value),placeholder:"Feedback required for rejection...",className:"flex-1 w-full bg-[#0f0f0f] border border-neutral-800 rounded-lg p-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 resize-none mb-6 transition-all"}),(0,s.jsxs)("div",{className:"grid grid-cols-2 gap-3 mt-auto",children:[(0,s.jsxs)("button",{onClick:N,className:"h-12 rounded-sm border border-red-900/30 bg-red-950/5 hover:bg-red-900/20 text-red-600 hover:text-red-500 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2",children:[(0,s.jsx)(p.Z,{size:16})," Reject"]}),(0,s.jsxs)("button",{onClick:w,className:"h-12 rounded-sm bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-900/30 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2",children:[(0,s.jsx)(f,{size:16})," Approve"]})]})]})]})]})]})}},3879:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]])},1828:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Box",[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]])},4220:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Columns2",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M12 3v18",key:"108xh3"}]])},4067:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]])},7898:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]])},9783:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Maximize",[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3",key:"1dcmit"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3",key:"1e4gt3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3",key:"wsl5sc"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3",key:"18trek"}]])},4325:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Minimize",[["path",{d:"M8 3v3a2 2 0 0 1-2 2H3",key:"hohbtr"}],["path",{d:"M21 8h-3a2 2 0 0 1-2-2V3",key:"5jw1f3"}],["path",{d:"M3 16h3a2 2 0 0 1 2 2v3",key:"198tvr"}],["path",{d:"M16 21v-3a2 2 0 0 1 2-2h3",key:"ph8mxp"}]])},2437:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("MoveHorizontal",[["polyline",{points:"18 8 22 12 18 16",key:"1hqrds"}],["polyline",{points:"6 8 2 12 6 16",key:"f0ernq"}],["line",{x1:"2",x2:"22",y1:"12",y2:"12",key:"1dnqot"}]])},5751:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Move",[["polyline",{points:"5 9 2 12 5 15",key:"1r5uj5"}],["polyline",{points:"9 5 12 2 15 5",key:"5v383o"}],["polyline",{points:"15 19 12 22 9 19",key:"g7qi8m"}],["polyline",{points:"19 9 22 12 19 15",key:"tpp73q"}],["line",{x1:"2",x2:"22",y1:"12",y2:"12",key:"1dnqot"}],["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}]])},3348:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]])},6548:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("Rows2",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 12h18",key:"1i2n21"}]])},1213:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]])},2235:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});/**
 * @license lucide-react v0.316.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(7461).Z)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])}},function(e){e.O(0,[655,331,971,69,744],function(){return e(e.s=1727)}),_N_E=e.O()}]);