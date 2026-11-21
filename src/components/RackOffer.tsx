import { useState } from 'react';
import { ArrowUpRight, Check, Pencil, Ruler, Server, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_RACK_OFFER, formatOfferNumber, normalizeOfferNumber, type RackOffer } from '@/lib/rack-offer';

export default function RackOffer({ visible }: { visible: boolean }) {
  const [offer, setOffer] = useState<RackOffer>({ ...DEFAULT_RACK_OFFER });
  const [editing, setEditing] = useState(false);
  const updateNumber = (field: 'width' | 'depth' | 'height' | 'coverage' | 'price', value: string) => {
    setOffer(previous => ({ ...previous, [field]: normalizeOfferNumber(field, Number(value)) }));
  };
  return <aside hidden={!visible} aria-label="Serverrack-Angebot" className="result-offer min-h-0 overflow-y-auto border-border bg-card text-card-foreground">
    <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
      <span className="text-xs font-semibold uppercase text-muted-foreground">Dein Wärmeangebot</span>
      <Button size="icon" variant="ghost" aria-label={editing ? 'Angebot übernehmen' : 'Angebot bearbeiten'} title={editing ? 'Angebot übernehmen' : 'Angebot bearbeiten'} onClick={() => setEditing(value => !value)}>{editing ? <Check /> : <Pencil />}</Button>
    </div>
    <div className="space-y-6 p-5 sm:p-6">
      <div>
        <div className="mb-4 flex items-center gap-2 text-offer-accent"><Server size={20} /><span className="text-xs font-semibold">Rechenleistung wird Wärme</span></div>
        <h2 className="text-2xl font-semibold leading-tight">{offer.name}</h2>
      </div>
      <section className="border-y border-border py-5" aria-label="Wärmedeckung">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Thermometer size={16} />Jährlicher Wärmebedarf</div>
        <div className="flex items-baseline gap-2"><strong className="text-5xl font-semibold tabular-nums text-offer-accent">{formatOfferNumber(offer.coverage)}<span className="text-2xl"> %</span></strong><span className="text-sm text-muted-foreground">gedeckt</span></div>
        <div className="mt-4 flex h-2 overflow-hidden rounded-sm bg-muted" aria-hidden="true"><div className="bg-offer-accent" style={{ width: `${offer.coverage}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{formatOfferNumber(100 - offer.coverage)} % verbleibender Wärmebedarf</p>
      </section>
      <section aria-label="Rackgrösse">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Ruler size={16} />Rackgrösse</div>
        <p className="text-xl font-semibold tabular-nums">{formatOfferNumber(offer.width)} × {formatOfferNumber(offer.depth)} × {formatOfferNumber(offer.height)} m</p>
        <p className="mt-1 text-xs text-muted-foreground">Breite × Tiefe × Höhe</p>
      </section>
      <section className="border-t border-border pt-5" aria-label="Angebotspreis">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm text-muted-foreground">Angebotspreis</span><ArrowUpRight size={18} className="text-offer-accent" /></div>
        <p className="text-3xl font-semibold tabular-nums"><span className="mr-2 text-base font-medium">{offer.currency}</span>{formatOfferNumber(offer.price)}</p>
      </section>
      <p className="border-l-2 border-offer-accent pl-3 text-xs leading-5 text-muted-foreground">{offer.note}</p>
      {editing && <form className="space-y-4 border-t border-border pt-4" onSubmit={event => { event.preventDefault(); setEditing(false); }} aria-label="Angebot bearbeiten">
        <div className="space-y-2"><Label htmlFor="offer-name">Bezeichnung</Label><Input id="offer-name" value={offer.name} onChange={event => setOffer(previous => ({ ...previous, name: event.target.value }))} /></div>
        <div className="grid grid-cols-3 gap-2">{(['width', 'depth', 'height'] as const).map((field, index) => <div key={field} className="space-y-2"><Label htmlFor={`offer-${field}`}>{['Breite (m)', 'Tiefe (m)', 'Höhe (m)'][index]}</Label><Input id={`offer-${field}`} type="number" min={0} step="0.1" value={offer[field]} onChange={event => updateNumber(field, event.target.value)} /></div>)}</div>
        <div className="space-y-2"><Label htmlFor="offer-coverage">Wärmedeckung (%)</Label><Input id="offer-coverage" type="number" min={0} max={100} step="0.1" value={offer.coverage} onChange={event => updateNumber('coverage', event.target.value)} /></div>
        <div className="grid grid-cols-[1fr_5rem] gap-2"><div className="space-y-2"><Label htmlFor="offer-price">Preis</Label><Input id="offer-price" type="number" min={0} step="1" value={offer.price} onChange={event => updateNumber('price', event.target.value)} /></div><div className="space-y-2"><Label htmlFor="offer-currency">Währung</Label><Input id="offer-currency" value={offer.currency} onChange={event => setOffer(previous => ({ ...previous, currency: event.target.value }))} /></div></div>
        <div className="space-y-2"><Label htmlFor="offer-note">Angebotshinweis</Label><Input id="offer-note" value={offer.note} onChange={event => setOffer(previous => ({ ...previous, note: event.target.value }))} /></div>
        <Button type="submit" className="w-full"><Check />Übernehmen</Button>
      </form>}
    </div>
  </aside>;
}