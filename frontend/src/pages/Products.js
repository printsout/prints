import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter, Grid, List } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Products = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get(`/products/${category ? `?category=${category}` : ''}`),
          api.get('/products/categories')
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const currentCategory = categories.find(c => c.id === category);

  return (
    <div className="min-h-screen" data-testid="products-page">
      {/* Header */}
      <div className="bg-slate-50 py-12">
        <div className="container-main">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link to="/" className="hover:text-primary">Hem</Link>
            <span>/</span>
            <Link to="/produkter" className="hover:text-primary">Produkter</Link>
            {currentCategory && (
              <>
                <span>/</span>
                <span className="text-slate-700">{currentCategory.name}</span>
              </>
            )}
          </div>
          <h1 className="text-4xl font-bold text-slate-900">
            {currentCategory ? currentCategory.name : 'Alla produkter'}
          </h1>
        </div>
      </div>

      <div className="container-main py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Kategorier
              </h3>
              <div className="space-y-2">
                <Link
                  to="/produkter"
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    !category ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  data-testid="filter-all"
                >
                  Alla produkter
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/produkter/${cat.id}`}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      category === cat.id ? 'bg-primary text-white' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    data-testid={`filter-${cat.id}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-slate-600">
                {sortedProducts.length} produkter
              </p>
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="sort-select">
                    <SelectValue placeholder="Sortera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Namn A-Ö</SelectItem>
                    <SelectItem value="price-low">Pris: Lågt-Högt</SelectItem>
                    <SelectItem value="price-high">Pris: Högt-Lågt</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-100' : ''}`}
                    data-testid="view-grid"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-100' : ''}`}
                    data-testid="view-list"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              /* Product Grid */
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {sortedProducts.map((product) => (
                  <ProductCard 
                    key={product.product_id} 
                    product={product} 
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && sortedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 mb-4">Inga produkter hittades</p>
                <Link to="/produkter">
                  <Button variant="outline">Visa alla produkter</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Link 
        to={`/produkt/${product.product_id}`}
        className="flex items-center gap-6 p-4 border rounded-lg hover:shadow-soft transition-all"
        data-testid={`product-card-${product.product_id}`}
      >
        <div className="w-32 h-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
          <p className="text-slate-500 text-sm mb-2 line-clamp-2">{product.description}</p>
          <p className="text-primary font-semibold">{product.price} kr</p>
        </div>
        <Button className="btn-primary shrink-0" data-testid={`design-btn-${product.product_id}`}>
          Designa
        </Button>
      </Link>
    );
  }

  return (
    <Link 
      to={`/produkt/${product.product_id}`}
      className="product-card group space-y-4"
      data-testid={`product-card-${product.product_id}`}
    >
      <div className="aspect-[4/5] overflow-hidden bg-slate-100 rounded-lg relative">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="product-image w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            Visa produkt
          </span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-slate-500 text-sm mt-1">{product.description.slice(0, 60)}...</p>
        <p className="text-primary font-semibold mt-2">{product.price} kr</p>
      </div>
    </Link>
  );
};

export default Products;
