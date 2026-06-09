'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  pdfUrl: string | null;
  videoUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function LearningResources() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  
  // Admin modes
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('TLC Renewal Guide');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const categories = [
    'TLC Renewal Guide',
    'Drug Test Guide',
    'Ticket Dispute Guide',
    'Compliance Guide',
    'FAQs'
  ];

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const token = getCookie('jni_access_token');
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
      
      // If admin, we fetch all (active and inactive), otherwise only active
      const url = `${API_URL}/resources?all=${isAdmin ? 'true' : 'false'}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load articles');
      const data = await res.json();
      if (Array.isArray(data)) {
        setArticles(data);
        if (data.length > 0 && !selectedArticle) {
          setSelectedArticle(data[0]);
        }
      }
    } catch (err: any) {
      toast.error('Could not fetch articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user]);

  const handleOpenCreate = () => {
    setCrudMode('CREATE');
    setEditId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('TLC Renewal Guide');
    setFormPdfUrl('');
    setFormVideoUrl('');
    setFormIsActive(true);
    setIsCrudModalOpen(true);
  };

  const handleOpenEdit = (article: Article) => {
    setCrudMode('EDIT');
    setEditId(article.id);
    setFormTitle(article.title);
    setFormContent(article.content);
    setFormCategory(article.category);
    setFormPdfUrl(article.pdfUrl || '');
    setFormVideoUrl(article.videoUrl || '');
    setFormIsActive(article.isActive);
    setIsCrudModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Please enter title and content');
      return;
    }

    const payload = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      pdfUrl: formPdfUrl || undefined,
      videoUrl: formVideoUrl || undefined,
      isActive: formIsActive
    };

    try {
      const token = getCookie('jni_access_token');
      let res;
      if (crudMode === 'CREATE') {
        res = await fetch(`${API_URL}/resources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/resources/${editId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Request failed');
      const savedArticle = await res.json();
      
      toast.success(crudMode === 'CREATE' ? 'Article published.' : 'Article updated.');
      setIsCrudModalOpen(false);
      fetchArticles();
      setSelectedArticle(savedArticle);
    } catch (err: any) {
      toast.error('Could not save resource article.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource article?')) return;
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/resources/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Deletion failed');
      toast.success('Article deleted.');
      fetchArticles();
      if (selectedArticle?.id === id) {
        setSelectedArticle(null);
      }
    } catch (err: any) {
      toast.error('Could not delete resource article.');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const filteredArticles = articles.filter(a => activeCategory === 'ALL' || a.category === activeCategory);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-gold-primary" />
            <span>Driver Learning & Resources</span>
          </h1>
          <p className="text-muted text-sm font-medium font-heading">
            TLC Renewal Guides, compliance procedures, FAQs, and video walkthroughs.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-gold-primary text-black hover:bg-gold-hover border-0 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Article</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border p-2 rounded-2xl flex gap-1.5 overflow-x-auto select-none no-scrollbar max-w-4xl">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-colors shrink-0 ${
            activeCategory === 'ALL' 
              ? 'bg-gold-primary text-black' 
              : 'text-muted hover:bg-muted-background hover:text-foreground'
          }`}
        >
          All Resources
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-colors shrink-0 ${
              activeCategory === cat 
                ? 'bg-gold-primary text-black' 
                : 'text-muted hover:bg-muted-background hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: List */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          <div className="p-4 bg-muted-background/25">
            <h3 className="text-xs font-bold text-foreground">Guides & Tutorials</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-xs text-muted">Loading guides...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No guides available.</div>
          ) : (
            filteredArticles.map((article) => {
              const isSelected = selectedArticle?.id === article.id;
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`p-4 cursor-pointer transition-colors flex items-start gap-3 relative ${
                    isSelected ? 'bg-gold-glow/5 border-r-3 border-[#F5C400]' : 'hover:bg-muted-background'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gold-primary font-bold">{article.category}</span>
                      {!article.isActive && (
                        <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.2 rounded font-bold">Draft</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-2">{article.title}</h4>
                    <span className="text-[9px] text-muted block">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted self-center shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detail Reader */}
        <div className="lg:col-span-2 space-y-6">
          {selectedArticle ? (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-md">
              
              {/* Header inside detail */}
              <div className="flex justify-between items-start gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold-primary bg-gold-glow/10 px-2.5 py-1 rounded-md border border-gold-primary/20">
                    {selectedArticle.category}
                  </span>
                  <h2 className="text-lg font-bold text-foreground pt-1.5">{selectedArticle.title}</h2>
                  <p className="text-[10px] text-muted font-medium">Published on {new Date(selectedArticle.createdAt).toLocaleDateString()}</p>
                </div>

                {isAdmin && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(selectedArticle)}
                      className="p-2 border border-border hover:bg-muted-background rounded-lg text-foreground transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedArticle.id)}
                      className="p-2 border border-border hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="text-xs leading-relaxed text-slate-500 whitespace-pre-line border-b border-border pb-6 font-semibold">
                {selectedArticle.content}
              </div>

              {/* Attachments Section */}
              {(selectedArticle.pdfUrl || selectedArticle.videoUrl) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-foreground">Reference Attachments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {selectedArticle.pdfUrl && (
                      <a
                        href={selectedArticle.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted-background/30 hover:bg-muted-background transition-colors group cursor-pointer text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-500" />
                          <div>
                            <span className="font-bold block text-foreground">Official PDF Guide</span>
                            <span className="text-[8px] text-muted uppercase font-bold">AWS S3 Vault</span>
                          </div>
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted group-hover:text-foreground" />
                      </a>
                    )}

                    {selectedArticle.videoUrl && (
                      <a
                        href={selectedArticle.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted-background/30 hover:bg-muted-background transition-colors group cursor-pointer text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-gold-primary" />
                          <div>
                            <span className="font-bold block text-foreground">Video Walkthrough</span>
                            <span className="text-[8px] text-muted uppercase font-bold">Training Video</span>
                          </div>
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted group-hover:text-foreground" />
                      </a>
                    )}

                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl py-24 text-center text-muted space-y-3">
              <FolderOpen className="w-10 h-10 mx-auto text-muted/50" />
              <p className="text-xs font-semibold">No resource selected. Click a guide on the left to start reading.</p>
            </div>
          )}
        </div>

      </div>

      {/* CRUD Publishing Modal */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-heading font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-gold-primary" />
                <span>{crudMode === 'CREATE' ? 'Publish Educational Resource' : 'Modify Resource Article'}</span>
              </h3>
              <button onClick={() => setIsCrudModalOpen(false)} className="text-muted hover:text-foreground text-sm font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted uppercase text-[9px]">Article Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. TLC Anniversary Drug Screening Procedures"
                  className="w-full bg-muted-background border border-border text-xs rounded-xl px-3 py-2 text-foreground outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase text-[9px]">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-muted-background border border-border text-xs rounded-xl px-3 py-2 text-foreground outline-none"
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1 flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-gold-primary bg-muted-background border-border"
                  />
                  <label htmlFor="isActive" className="font-bold text-foreground cursor-pointer">Visible to Drivers (Publish)</label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted uppercase text-[9px]">Markdown/Text Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter detailed compliance/learning guidelines..."
                  rows={6}
                  className="w-full bg-muted-background border border-border text-xs rounded-xl px-3 py-2 text-foreground outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase text-[9px]">S3 PDF Link (Optional)</label>
                  <input
                    type="text"
                    value={formPdfUrl}
                    onChange={(e) => setFormPdfUrl(e.target.value)}
                    placeholder="https://s3.aws.com/..."
                    className="w-full bg-muted-background border border-border text-xs rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted uppercase text-[9px]">Video Walkthrough Link (Optional)</label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://vimeo.com/..."
                    className="w-full bg-muted-background border border-border text-xs rounded-xl px-3 py-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase hover:bg-muted-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gold-primary text-black hover:bg-gold-hover border-0 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  {crudMode === 'CREATE' ? 'Publish Article' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
