import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, Palette, ShoppingBag, Star, ChevronRight, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewPlatforms, setReviewPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, revRes, platRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/reviews'),
          api.get('/review-platforms')
        ]);
        
        setCategories(catRes.data);
        setReviews(revRes.data);
        setReviewPlatforms(platRes.data.platforms || []);
      } catch (error) {
        toast.error('Kunde inte ladda startsidan');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const steps = [
    {
      number: 1,
      icon: Upload,
      title: 'Ladda upp din bild',
      description: 'Välj en bild från din dator eller mobil. Vi stödjer JPG, PNG och GIF.'
    },
    {
      number: 2,
      icon: Palette,
      title: 'Anpassa designen',
      description: 'Placera, zooma och rotera din bild. Lägg till text och välj färger.'
    },
    {
      number: 3,
      icon: ShoppingBag,
      title: 'Beställ & få levererat',
      description: 'Betala säkert och få din unika produkt levererad hem till dig.'
    }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1646936190308-6faef1ac893c?w=1920&q=80"
            alt="Hero background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="container-main relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12">
            <div className="space-y-8 animate-slide-up">
              <div>
                <span className="text-sm text-primary uppercase tracking-widest font-medium">
                  Personliga produkter
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-slate-900">
                Skapa unika produkter med{' '}
                <span className="text-primary font-accent">dina bilder</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Förvandla dina favoritbilder till personliga presenter. Muggar, t-shirts, 
                posters och mycket mer – enkelt och snabbt med vår designverktyg.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/produkter">
                  <Button className="btn-primary text-base" data-testid="cta-design-now">
                    Designa nu
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/produkter">
                  <Button variant="outline" className="btn-outline text-base" data-testid="cta-view-products">
                    Se produkter
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block animate-float">
              <img 
                src="https://images.unsplash.com/photo-1627807461786-081fc0e1215c?w=600&q=80"
                alt="Personlig mugg"
                className="rounded-lg shadow-float w-full max-w-md mx-auto"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">500+ nöjda kunder</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-slate-50" data-testid="how-it-works-section">
        <div className="container-main">
          <div className="text-center mb-16">
            <span className="text-sm text-primary uppercase tracking-widest font-medium">
              Så fungerar det
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-4 text-slate-900">
              Tre enkla steg
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`text-center space-y-4 animate-slide-up stagger-${index + 1}`}
                data-testid={`step-${step.number}`}
              >
                <div className="step-number mx-auto">
                  {step.number}
                </div>
                <step.icon className="w-8 h-8 mx-auto text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding" data-testid="categories-section">
        <div className="container-main">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm text-primary uppercase tracking-widest font-medium">
                Våra produkter
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-4 text-slate-900">
                Populära kategorier
              </h2>
            </div>
            <Link 
              to="/produkter" 
              className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
              data-testid="view-all-products"
            >
              Visa alla
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link 
                key={category.id}
                to={`/produkter/${category.id}`}
                className={`category-card aspect-[4/5] rounded-lg animate-slide-up stagger-${index + 1}`}
                data-testid={`category-${category.id}`}
              >
                <img 
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section-padding bg-slate-50" data-testid="reviews-section">
        <div className="container-main">
          <div className="text-center mb-16">
            <span className="text-sm text-primary uppercase tracking-widest font-medium">
              Kundrecensioner
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-4 text-slate-900">
              Vad våra kunder säger
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((review, index) => (
              <div 
                key={review.review_id}
                className={`review-card animate-slide-up stagger-${index + 1}`}
                data-testid={`review-${index}`}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={`star-${i}`}
                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 italic">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{review.user_name}</p>
                  {review.source && review.source !== 'manual' && (
                    <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full capitalize">{review.source}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {reviewPlatforms.length > 0 && (
            <div className="mt-10 text-center" data-testid="review-platforms-links">
              <p className="text-sm text-slate-500 mb-4">Läs fler recensioner eller lämna ditt omdöme:</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {reviewPlatforms.map(p => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-slate-400 hover:shadow-sm transition-all"
                    data-testid={`platform-link-${p.id}`}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.icon}
                    </span>
                    {p.name}
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding" data-testid="cta-section">
        <div className="container-main">
          <div className="bg-primary rounded-2xl p-12 md:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Redo att skapa något unikt?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Börja designa din personliga produkt idag. Det tar bara några minuter!
            </p>
            <Link to="/produkter">
              <Button 
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-3 font-medium text-base"
                data-testid="cta-bottom"
              >
                Kom igång gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
