import { useState } from 'react';
import { FileText, Image, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AdminContent = () => {
  const [pages] = useState([
    { id: 1, title: 'Om oss', slug: '/om-oss', status: 'published' },
    { id: 2, title: 'Kontakt', slug: '/kontakt', status: 'published' },
    { id: 3, title: 'Leveransvillkor', slug: '/leverans', status: 'draft' },
    { id: 4, title: 'Integritetspolicy', slug: '/integritet', status: 'published' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Innehåll</h1>
          <p className="text-slate-500">Hantera sidor och innehåll på din webbplats</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ny sida
        </Button>
      </div>

      {/* Content Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Innehållshantering</h3>
            <p className="text-sm text-blue-700 mt-1">
              Här kan du hantera statiska sidor som "Om oss", "Kontakt" och villkorssidor. 
              Klicka på "Ny sida" för att skapa nytt innehåll.
            </p>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Sidor</h2>
        </div>
        
        <div className="divide-y divide-slate-200">
          {pages.map((page) => (
            <div key={page.id} className="p-6 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{page.title}</h3>
                  <p className="text-sm text-slate-500">{page.slug}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  page.status === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {page.status === 'published' ? 'Publicerad' : 'Utkast'}
                </span>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media Library */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Mediabibliotek</h2>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ladda upp
          </Button>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12 text-slate-500">
            <Image className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>Inga uppladdade bilder ännu</p>
            <p className="text-sm mt-1">Ladda upp bilder för att använda på din webbplats</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
