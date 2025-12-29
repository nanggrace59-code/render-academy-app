'use client';
import React from 'react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    // h-screen နှင့် overflow-hidden သုံးထားသဖြင့် Scrollbar နှစ်ထပ်မဖြစ်အောင် ကာကွယ်ပေးပါတယ်
    <div className="h-screen bg-[#050505] text-neutral-200 flex flex-col font-sans overflow-hidden">
      {/* padding (p-6) ကို ဖယ်လိုက်ပါပြီ */}
      <main className="flex-1 w-full h-full relative bg-[#050505]">
         {children}
      </main>
    </div>
  );
}
