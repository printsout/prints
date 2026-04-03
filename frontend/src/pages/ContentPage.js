import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const ContentPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await api.get(`/pages/${slug}`);
        setPage(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2a9d8f]" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Sidan hittades inte</h1>
          <p className="text-slate-500">Denna sida finns inte eller har inte publicerats ännu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]" data-testid="content-page">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8" data-testid="content-page-title">
          {page.title}
        </h1>
        <div
          className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')) }}
          data-testid="content-page-body"
        />
      </div>
    </div>
  );
};

export default ContentPage;
