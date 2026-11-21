import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GLAZING_OPTIONS, HOUSE_AGE, normalizeHouseAge } from '@/lib/house-details';

export default function HouseDetails({ exterior }: { exterior: boolean }) {
  const [age, setAge] = useState(0);
  const [glazing, setGlazing] = useState('double');
  const [residents, setResidents] = useState('');
  return <div className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-3">
    <div className="col-span-2 min-w-0 sm:col-span-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label htmlFor="house-age" className="text-xs">Hausalter</Label>
        <output className="text-xs tabular-nums" htmlFor="house-age">{age} {age === 1 ? 'Jahr' : 'Jahre'}</output>
      </div>
      <Slider id="house-age" aria-label="Hausalter" min={HOUSE_AGE.min} max={HOUSE_AGE.max} step={HOUSE_AGE.step} value={[age]} onValueChange={values => setAge(normalizeHouseAge(values[0] ?? 0))} className="h-5" />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>0</span><span>2026 Jahre</span></div>
    </div>
    <div className="min-w-0 space-y-2">
      <Label htmlFor="house-glazing" className="text-xs">Verglasung</Label>
      <Select value={glazing} onValueChange={setGlazing}>
        <SelectTrigger id="house-glazing" aria-label="Verglasung" className="text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{GLAZING_OPTIONS.map(option => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    {exterior && <div className="min-w-0 space-y-2">
      <Label htmlFor="house-residents" className="text-xs">Bewohnerzahl</Label>
      <Input id="house-residents" aria-label="Bewohnerzahl" type="number" min={0} step={1} inputMode="numeric" placeholder="Anzahl Personen" value={residents} onChange={event => {
        const value = event.target.value;
        if (value === '' || /^\d+$/.test(value)) setResidents(value);
      }} className="text-xs" />
    </div>}
  </div>;
}