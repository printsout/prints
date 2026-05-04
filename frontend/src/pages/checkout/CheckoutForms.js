import { Truck, CreditCard } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export const CheckoutShippingForm = ({ formData, handleChange }) => (
  <>
    {/* Contact */}
    <div className="bg-white rounded-xl p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Kontaktuppgifter</h2>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="email">E-post *</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required data-testid="input-email" />
        </div>
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} data-testid="input-phone" />
        </div>
      </div>
    </div>

    {/* Shipping address */}
    <div className="bg-white rounded-xl p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Truck className="w-5 h-5" />
        Leveransadress
      </h2>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Förnamn *</Label>
            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required data-testid="input-firstname" />
          </div>
          <div>
            <Label htmlFor="lastName">Efternamn *</Label>
            <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required data-testid="input-lastname" />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Adress *</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} required data-testid="input-address" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode">Postnummer *</Label>
            <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} required data-testid="input-postalcode" />
          </div>
          <div>
            <Label htmlFor="city">Stad *</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleChange} required data-testid="input-city" />
          </div>
        </div>
      </div>
    </div>
  </>
);

export const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => (
  <div className="bg-white rounded-xl p-6 shadow-soft">
    <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
      <CreditCard className="w-5 h-5" />
      Betalningsmetod
    </h2>
    <div className="space-y-3">
      <label
        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
        data-testid="payment-card"
      >
        <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-primary" />
        <div className="flex-1">
          <p className="font-medium">Kort (Visa/Mastercard)</p>
          <p className="text-sm text-slate-500">Säker betalning via Stripe</p>
        </div>
        <span className="text-xs font-bold text-[#1A1F71] border border-[#1A1F71] rounded px-1.5 py-0.5">VISA</span>
        <span className="text-xs font-bold text-white bg-[#EB001B] rounded px-1.5 py-0.5">MC</span>
      </label>

      <label
        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'klarna' ? 'border-[#FFB3C7] bg-[#FFB3C7]/5' : 'border-slate-200 hover:border-slate-300'}`}
        data-testid="payment-klarna"
      >
        <input type="radio" name="payment" value="klarna" checked={paymentMethod === 'klarna'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-[#FFB3C7]" />
        <div className="flex-1">
          <p className="font-medium">Klarna</p>
          <p className="text-sm text-slate-500">Betala senare eller delbetala</p>
        </div>
        <span className="text-xs font-bold text-white bg-[#FFB3C7] rounded px-1.5 py-0.5">Klarna</span>
      </label>

      <label
        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'swish' ? 'border-[#1F8FFF] bg-[#1F8FFF]/5' : 'border-slate-200 hover:border-slate-300'}`}
        data-testid="payment-swish"
      >
        <input type="radio" name="payment" value="swish" checked={paymentMethod === 'swish'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-[#1F8FFF]" />
        <div className="flex-1">
          <p className="font-medium">Swish</p>
          <p className="text-sm text-slate-500">Betala direkt med mobil-BankID</p>
        </div>
        <span className="text-xs font-bold text-white bg-[#1F8FFF] rounded px-1.5 py-0.5">Swish</span>
      </label>
    </div>
  </div>
);
