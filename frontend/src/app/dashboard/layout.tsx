import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-76px)] bg-bgbase flex flex-col relative">
      <main className="flex-1 overflow-y-auto animate-fade-in relative flex flex-col pt-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent pointer-events-none -z-10"></div>
        {children}
      </main>
    </div>
  );
}
