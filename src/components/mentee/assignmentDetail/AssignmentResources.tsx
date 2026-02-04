import { BookOpen, Download, FileText } from 'lucide-react';

export default function AssignmentResources() {
  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900">학습 자료</h3>
        </div>
        <div className="space-y-3">
          {[
            { title: '2025 수능특강 비문학.pdf', size: '2.4 MB' },
            { title: '과학지문 핵심개념.pdf', size: '1.8 MB' },
          ].map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0E9ABE]/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0E9ABE]/10 transition-colors">
                  <FileText className="w-5 h-5 text-slate-500 group-hover:text-[#0E9ABE] transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{file.title}</p>
                  <p className="text-xs text-slate-400">{file.size} · 멘토 업로드</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-[#0E9ABE] transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
