import {
  ChevronLeft, ChevronRight, Plus, Trash2,
  LayoutGrid, Image as ImageIcon
} from 'lucide-react';
import { PagePreview } from './PagePreview';
import { LAYOUTS, MIN_PAGES, getPageImageCount } from './constants';

export function PagesEditor({
  pages, currentPage, setCurrentPage,
  changeLayout, addPages, removePage,
  handleUpload, handleRemoveImage, handleCaptionChange,
}) {
  const currentPageData = pages[currentPage];

  return (
    <>
      {/* Page navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border p-3">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
          data-testid="prev-page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="text-lg font-bold text-slate-800" data-testid="page-indicator">Sida {currentPage + 1}</span>
          <span className="text-slate-400 text-sm ml-1">av {pages.length}</span>
        </div>
        <button
          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
          disabled={currentPage === pages.length - 1}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
          data-testid="next-page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Layout selector */}
      <div className="bg-white rounded-xl border p-3" data-testid="layout-selector">
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Sidlayout</span>
        </div>
        <div className="flex gap-2">
          {LAYOUTS.map(lo => {
            const Icon = lo.icon;
            return (
              <button
                key={lo.id}
                onClick={() => changeLayout(lo.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 transition-all text-xs font-medium ${
                  currentPageData?.layout === lo.id
                    ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 text-[#2a9d8f]'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
                data-testid={`layout-${lo.id}`}
              >
                <Icon className="w-5 h-5" />
                {lo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main page preview */}
      <div className="bg-white rounded-xl border overflow-hidden" data-testid="page-preview">
        <div className="aspect-[4/3] bg-white">
          <PagePreview
            page={currentPageData}
            pageIndex={currentPage}
            onUpload={handleUpload}
            onRemove={handleRemoveImage}
            onCaptionChange={handleCaptionChange}
          />
        </div>
        <div className="px-4 py-2 border-t bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Sida {currentPage + 1} — {getPageImageCount(currentPageData)} / {currentPageData.images.length} bilder
          </span>
          <span className="text-xs text-slate-400">
            Layout: {LAYOUTS.find(l => l.id === currentPageData.layout)?.label}
          </span>
        </div>
      </div>

      {/* Page thumbnails */}
      <div className="bg-white rounded-xl border p-4" data-testid="page-thumbnails">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Alla sidor ({pages.length})</h3>
          <div className="flex gap-2">
            <button onClick={() => addPages(2)} className="flex items-center gap-1 text-xs font-medium text-[#2a9d8f] hover:text-[#238b7e] transition-colors bg-[#2a9d8f]/5 px-2.5 py-1.5 rounded-lg" data-testid="add-2-pages">
              <Plus className="w-3 h-3" />+2 sidor
            </button>
            <button onClick={() => addPages(10)} className="flex items-center gap-1 text-xs font-medium text-[#2a9d8f] hover:text-[#238b7e] transition-colors bg-[#2a9d8f]/5 px-2.5 py-1.5 rounded-lg" data-testid="add-10-pages">
              <Plus className="w-3 h-3" />+10 sidor
            </button>
          </div>
        </div>
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
          {pages.map((page, index) => {
            const imgCount = getPageImageCount(page);
            return (
              <div
                key={page.id}
                onClick={() => setCurrentPage(index)}
                className={`group relative aspect-[3/4] rounded-md border-2 overflow-hidden transition-all cursor-pointer ${
                  currentPage === index ? 'border-[#2a9d8f] ring-2 ring-[#2a9d8f]/20' : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`page-thumb-${index}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentPage(index); }}
              >
                {imgCount > 0 ? (
                  <div className="w-full h-full">
                    <img src={page.images.find(Boolean)} alt="" className="w-full h-full object-cover" />
                    {imgCount > 1 && (
                      <div className="absolute top-0.5 left-0.5 bg-[#2a9d8f] text-white rounded px-1" style={{ fontSize: '7px' }}>{imgCount}</div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-slate-300" />
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center leading-tight" style={{ fontSize: '8px' }}>{index + 1}</span>
                {pages.length > MIN_PAGES && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removePage(index); }}
                    className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontSize: '8px' }}
                    data-testid={`remove-page-${index}`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
