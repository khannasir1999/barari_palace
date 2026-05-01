import { useState } from 'react';
import Footer from './footer.jsx';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const VIEWS  = ['Community','Pool','Garden','Skyline','Golf Course'];
const fmt    = (n: number) => Math.round(n).toLocaleString('en-AE');
const pct    = (n: number, d = 1) => n.toFixed(d) + '%';

interface Row { date: string; label: string; pPct: number; amount: number; cum: number }

const TOTAL_MONTHS        = 75;
const POST_HANDOVER_MONTHS = 24;

function buildSchedule(
  price: number,
  downPct: number,
  monthlyPct: number,
  postHandoverPct: number,
  bookingDay: number,
  bookingMoIdx: number,
  bookingYear: number,
  handoverMonth: number
): Row[] {
  const rows: Row[] = [];
  let cum = 0;
  const dateAt = (n: number): string => {
    const base = bookingYear * 12 + bookingMoIdx + n;
    return `${bookingDay} ${MONTHS[base % 12]} ${Math.floor(base / 12)}`;
  };
  const bookingLabel = `${bookingDay} ${MONTHS[bookingMoIdx]} ${bookingYear}`;
  const add = (date: string, label: string, p: number) => {
    const r = Math.round(p * 10000) / 10000;
    if (r <= 0) return;
    cum = Math.round((cum + r) * 10000) / 10000;
    rows.push({ date, label, pPct: r, amount: price * r / 100, cum });
  };
  // Month 0: booking / down payment
  add(bookingLabel, 'Booking', downPct);
  // Months 1–11: construction (before milestone)
  for (let m = 1; m <= 11; m++) add(dateAt(m), 'Construction', monthlyPct);
  // Month 12: exactly 12 months after booking = milestone + 10%
  add(dateAt(12), 'Milestone', monthlyPct + 10);
  // Months 13 to handoverMonth-1: construction
  for (let m = 13; m < handoverMonth; m++) add(dateAt(m), 'Construction', monthlyPct);
  // handoverMonth: handover
  add(dateAt(handoverMonth), 'Handover', monthlyPct);
  // Post-handover: months handoverMonth+1 to TOTAL_MONTHS (fits within 75-month window)
  if (postHandoverPct > 0) {
    const ph = postHandoverPct / POST_HANDOVER_MONTHS;
    for (let m = handoverMonth + 1; m <= TOTAL_MONTHS; m++) add(dateAt(m), 'Post-Handover', ph);
  }
  return rows;
}

function buildAnnual(rows: Row[]) {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const yr = r.date.split(' ').at(-1)!;
    map[yr] = (map[yr] || 0) + r.amount;
  });
  let cum = 0;
  return Object.entries(map).map(([year, amount]) => {
    cum += amount;
    return { year, amount, cum };
  });
}

const labelColors: Record<string, string> = {
  Booking:           'bg-[#c9a227]/20 text-[#c9a227]',
  Milestone:         'bg-purple-500/20 text-purple-400',
  Handover:          'bg-emerald-500/20 text-emerald-400',
  'Post-Handover':   'bg-blue-500/20 text-blue-400',
  Construction:      '',
};

export default function RevenueManagementForm() {
  const [dark,           setDark]           = useState(false);
  const [sqft,           setSqft]           = useState(2100);
  const [basePrice,      setBasePrice]      = useState(1524);
  const [floor,          setFloor]          = useState(10);
  const [view,           setView]           = useState('Community');
  const [bookingDate,    setBookingDate]    = useState('2026-01-01');
  const [discPct,        setDiscPct]        = useState(0);
  const [dldPct,         setDldPct]         = useState(4);
  const [adminFee,       setAdminFee]       = useState(5000);
  const [downPayPct,     setDownPayPct]     = useState(15);
  const [preHandoverPct, setPreHandoverPct] = useState(60);
  const [tab,            setTab]            = useState<'plan'|'annual'|'monthly'>('plan');
  const [customPayments, setCustomPayments] = useState<{id: number; label: string; date: string; pct: number}[]>([]);

  const handleReset = () => {
    setSqft(2100); setBasePrice(1524); setFloor(10); setView('Community');
    setBookingDate('2026-01-01'); setDiscPct(0); setDldPct(4); setAdminFee(5000);
    setDownPayPct(15); setPreHandoverPct(60); setCustomPayments([]);
  };

  const addCustomPayment = () => setCustomPayments(p => [...p, { id: Date.now(), label: '', date: bookingDate, pct: 0 }]);
  const updateCustom     = (id: number, field: string, value: string | number) =>
    setCustomPayments(p => p.map(c => c.id === id ? { ...c, [field]: value } : c));
  const removeCustom     = (id: number) => setCustomPayments(p => p.filter(c => c.id !== id));

  const netPrice         = sqft * basePrice;
  const discAmt          = netPrice * discPct / 100;
  const salePrice        = netPrice - discAmt;
  const dldFee           = salePrice * dldPct   / 100;
  const totalFees        = dldFee + adminFee;
  const postHandoverPct  = 100 - preHandoverPct;
  // handover at month 51 when post-handover exists (51 + 24 = 75 total), else month 75
  const handoverMonth    = postHandoverPct > 0 ? TOTAL_MONTHS - POST_HANDOVER_MONTHS : TOTAL_MONTHS;
  const monthlyConstrPct = Math.max(0, (preHandoverPct - downPayPct - 10) / handoverMonth);
  const preHandoverAmt   = salePrice * preHandoverPct  / 100;
  const postHandoverAmt  = salePrice * postHandoverPct / 100;
  const downPay          = salePrice * downPayPct / 100;
  const immDue           = downPay + totalFees;
  const outflow          = salePrice + totalFees;
  const customTotal      = customPayments.reduce((s, c) => s + salePrice * c.pct / 100, 0);
  const totalWithCustom  = outflow + customTotal;
  const _bd          = new Date(bookingDate + 'T00:00:00');
  const bookingDay   = _bd.getDate();
  const bookingMoIdx = _bd.getMonth();       // 0-indexed
  const bookingYear  = _bd.getFullYear();
  const bookingLabel = `${bookingDay} ${MONTHS[bookingMoIdx]} ${bookingYear}`;
  const dateAt = (n: number): string => {
    const base = bookingYear * 12 + bookingMoIdx + n;
    return `${bookingDay} ${MONTHS[base % 12]} ${Math.floor(base / 12)}`;
  };

  const schedule   = buildSchedule(salePrice, downPayPct, monthlyConstrPct, postHandoverPct, bookingDay, bookingMoIdx, bookingYear, handoverMonth);
  const annual     = buildAnnual(schedule);
  const maxAnnual  = Math.max(...annual.map(a => a.amount));

  /* ── Theme tokens ── */
  const D = dark;
  const bg      = D ? 'bg-[#06090f]'              : 'bg-[#f2efe8]';
  const surface = D ? 'bg-[#0e1420]'              : 'bg-white';
  const card    = D ? 'bg-[#111827] border-[#1f2d44]' : 'bg-white border-[#e5e0d5]';
  const inp     = D ? 'bg-[#0a1020] border-[#1f2d44] text-white focus:border-[#c9a227]'
                    : 'bg-[#faf8f3] border-[#d8d3c9] text-[#1a1629] focus:border-[#c9a227]';
  const txt     = D ? 'text-white'       : 'text-[#1a1629]';
  const muted   = D ? 'text-slate-500'   : 'text-[#857e95]';
  const lbl     = D ? 'text-slate-300'   : 'text-[#4a4462]';
  const divider = D ? 'border-[#1f2d44]' : 'border-[#e5e0d5]';
  const rowHov  = D ? 'hover:bg-[#172036]' : 'hover:bg-[#faf8f3]';
  const trackBg = D ? 'bg-[#1f2d44]'    : 'bg-[#e8e3d8]';
  const goldGrad = 'bg-gradient-to-r from-[#f7df72] to-[#b8860b]';

  const SliderRow = ({ label, value, set, max, min = 0, step = 0.5, suffix = '%' }:
    { label: string; value: number; set: (v: number) => void; max: number; min?: number; step?: number; suffix?: string }) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className={`text-xs font-medium ${lbl}`}>{label}</span>
        <span className="text-xs font-bold text-[#c9a227]">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => set(+e.target.value)}
        className="w-full h-1.5 rounded cursor-pointer accent-[#c9a227]" />
    </div>
  );

  const InputField = ({ label, value, set, type = 'number' }:
    { label: string; value: number | string; set: (v: number) => void; type?: string }) => (
    <label className={`block text-xs font-medium ${lbl}`}>
      {label}
      <input type={type} value={value} onChange={e => set(+e.target.value)}
        className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${inp}`} />
    </label>
  );

  return (
    <div className={`min-h-screen ${bg} ${txt} transition-colors duration-300`}
      style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── STICKY HEADER ── */}
      <header className={`sticky top-0 z-40 ${surface} border-b ${divider} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo mark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-9 h-9 rounded-xl ${goldGrad} flex items-center justify-center shadow-lg shadow-[#c9a227]/30`}>
              <span className="text-black font-black text-[11px] tracking-tight">RM</span>
            </div>
            <div>
              <div className={`font-bold text-sm leading-tight ${txt}`}>Revenue Management</div>
              <div className={`text-[10px] ${muted}`}>Barari Palace · Dubai</div>
            </div>
          </div>

          {/* Hero price — hidden on mobile */}
          <div className="hidden sm:flex flex-col items-center">
            <div className="text-[10px] text-[#c9a227] font-semibold uppercase tracking-widest mb-0.5">Net Sale Price</div>
            <div className={`text-xl font-black text-[#c9a227] leading-none`}>AED {fmt(salePrice)}</div>
            <div className={`text-[10px] mt-0.5 ${muted}`}>AED {fmt(salePrice / sqft)} / sqft</div>
          </div>

          {/* Dark mode toggle */}
          <button onClick={() => setDark(!D)} aria-label="Toggle dark mode"
            className={`relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 ${D ? 'bg-[#c9a227]' : 'bg-[#c8c2b8]'}`}>
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-xs transition-all duration-300 ${D ? 'left-8' : 'left-1'}`}>
              {D ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ══ LEFT COLUMN ══ */}
        <div className="space-y-5">

          {/* Parameters */}
          <div className={`rounded-2xl border ${card} p-5 shadow-sm`}>
            <div className="flex items-center gap-2 mb-5">
              <span className={`w-1 h-6 rounded-full ${goldGrad}`} />
              <h2 className={`text-xs font-bold uppercase tracking-widest ${txt}`}>Parameters</h2>
              <span className={`ml-auto text-[10px] ${muted}`}>Base unit config</span>
            </div>
            <div className="space-y-4">
              <InputField label="Unit Size (sqft)" value={sqft} set={setSqft} />
              <InputField label="Base Price (AED / sqft)" value={basePrice} set={setBasePrice} />
              <InputField label="Floor" value={floor} set={setFloor} />
              <label className={`block text-xs font-medium ${lbl}`}>
                View
                <select value={view} onChange={e => setView(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${inp}`}>
                  {VIEWS.map(v => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label className={`block text-xs font-medium ${lbl}`}>
                Booking Date
                <input type="date" value={bookingDate}
                  onChange={e => e.target.value && setBookingDate(e.target.value)}
                  style={D ? { colorScheme: 'dark' } : undefined}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${inp}`} />
              </label>
            </div>
          </div>

          {/* Financial Controls */}
          <div className={`rounded-2xl border ${card} p-5 shadow-sm`}>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-[#e0e0e0] to-[#888]" />
              <h2 className={`text-xs font-bold uppercase tracking-widest ${txt}`}>Financial Controls</h2>
            </div>
            <div className="space-y-4">
              <SliderRow label="Discount" value={discPct} set={setDiscPct} max={10} />
              <SliderRow label="DLD Fee"   value={dldPct}  set={setDldPct}  max={4}  />
              <InputField label="Admin Fee (AED)" value={adminFee} set={setAdminFee} />
              <div className={`h-px ${trackBg}`} />
              <SliderRow label="Down Payment"
                value={downPayPct}
                set={v => setDownPayPct(Math.min(v, preHandoverPct - 10))}
                min={15} max={50} step={1} />
              <SliderRow label="Pre-Handover"
                value={preHandoverPct}
                set={v => setPreHandoverPct(Math.max(v, downPayPct + 10))}
                min={40} max={100} step={5} />
              {/* pre/post summary chip */}
              <div className={`rounded-xl p-3 ${trackBg} grid grid-cols-3 text-center gap-1`}>
                <div>
                  <div className={`text-[9px] uppercase tracking-wider ${muted}`}>Pre-Handover</div>
                  <div className="text-sm font-black text-[#c9a227]">{preHandoverPct}%</div>
                  <div className={`text-[9px] ${muted}`}>AED {fmt(preHandoverAmt)}</div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className={`w-px flex-1 ${D ? 'bg-[#2d3f5c]' : 'bg-[#ccc8be]'}`} />
                  <div className={`text-[9px] font-bold ${muted} my-1`}>vs</div>
                  <div className={`w-px flex-1 ${D ? 'bg-[#2d3f5c]' : 'bg-[#ccc8be]'}`} />
                </div>
                <div>
                  <div className={`text-[9px] uppercase tracking-wider ${muted}`}>Post-Handover</div>
                  <div className={`text-sm font-black text-blue-400`}>{postHandoverPct}%</div>
                  <div className={`text-[9px] ${muted}`}>AED {fmt(postHandoverAmt)}</div>
                </div>
              </div>
              {monthlyConstrPct > 0 && (
                <div className={`text-[10px] ${muted} text-center`}>
                  Monthly construction: <span className="font-bold text-[#c9a227]">{monthlyConstrPct.toFixed(3)}%</span> · AED {fmt(salePrice * monthlyConstrPct / 100)} / mo.
                </div>
              )}
            </div>
          </div>

          {/* Fees breakdown mini-chart */}
          <div className={`rounded-2xl border ${card} p-5 shadow-sm`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${muted}`}>Fees Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'DLD/Oqood Fee',   amt: dldFee   },
                { label: 'Admin Fee', amt: adminFee },
              ].map(({ label, amt }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`text-[11px] w-20 shrink-0 ${lbl}`}>{label}</span>
                  <div className={`flex-1 h-1.5 rounded-full ${trackBg}`}>
                    <div className={`h-full rounded-full ${goldGrad} transition-all duration-300`}
                      style={{ width: `${Math.min((amt / totalFees) * 100, 100)}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-[#c9a227] w-24 text-right">{fmt(amt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              { label: 'Total Discount',  val: fmt(discAmt),        sub: pct(discPct, 0) + ' overall',                                              accent: false },
              { label: 'Total Outflow',   val: fmt(outflow),        sub: fmt(Math.round(outflow / sqft)) + ' / sqft',                              accent: true  },
              { label: 'Immediate Due',   val: fmt(immDue),         sub: 'Down payment + Fees',                                                     accent: true  },
              { label: 'Down Payment',    val: fmt(downPay),        sub: pct(downPayPct, 0) + ' of net price',                                      accent: false },
              { label: 'Pre-Handover',    val: fmt(preHandoverAmt), sub: `${pct(preHandoverPct, 0)} · ${bookingLabel} – ${dateAt(handoverMonth)}`,                accent: true  },
              { label: 'Post-Handover',   val: fmt(postHandoverAmt),sub: postHandoverPct > 0 ? `${pct(postHandoverPct, 0)} · ${dateAt(handoverMonth + 1)} – ${dateAt(TOTAL_MONTHS)}` : 'Fully paid at handover', accent: false },
            ]).map(({ label, val, sub, accent }) => (
              <div key={label}
                className={`rounded-2xl border ${card} p-4 shadow-sm relative overflow-hidden ${accent ? 'border-l-[3px] border-l-[#c9a227]' : ''}`}>
                {accent && <div className="absolute inset-0 bg-gradient-to-br from-[#c9a227]/5 to-transparent pointer-events-none" />}
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${accent ? 'text-[#c9a227]' : muted}`}>{label}</div>
                <div className={`text-xl font-black leading-tight ${txt}`}>AED {val}</div>
                <div className={`text-[11px] mt-1 ${muted}`}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Support cap info */}
          <div className={`rounded-2xl border ${card} p-5 shadow-sm`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${goldGrad} flex items-center justify-center shrink-0 mt-0.5 shadow shadow-[#c9a227]/30`}>
                <span className="text-black text-xs font-black">i</span>
              </div>
              <p className={`text-xs leading-relaxed ${muted}`}>
                <span className="text-[#c9a227] font-bold">{downPayPct}% down payment</span> on {bookingLabel} +{' '}
                <span className="text-[#c9a227] font-bold">{monthlyConstrPct.toFixed(3)}% / mo.</span> across{' '}
                <span className={`font-semibold ${txt}`}>{handoverMonth} months</span> ({dateAt(1)} – {dateAt(handoverMonth)}) +{' '}
                <span className="text-[#c9a227] font-bold">10% milestone</span> {dateAt(12)} (12 mo. after booking) ={' '}
                <span className={`font-semibold ${txt}`}>{preHandoverPct}% pre-handover</span>.{' '}
                {postHandoverPct > 0 && <>
                  Remaining <span className="text-blue-400 font-bold">{postHandoverPct}%</span> post-handover in{' '}
                  <span className={`font-semibold ${txt}`}>{POST_HANDOVER_MONTHS} installments</span> ({dateAt(handoverMonth + 1)} – {dateAt(TOTAL_MONTHS)}).
                  {' '}<span className={`font-semibold ${txt}`}>Total plan: {TOTAL_MONTHS} months.</span>
                </>}
              </p>
            </div>
          </div>

          {/* Tabbed: Plan / Annual / Monthly */}
          <div className={`rounded-2xl border ${card} shadow-sm overflow-hidden`}>
            {/* Tab bar */}
            <div className={`flex border-b ${divider}`}>
              {(['plan','annual','monthly'] as const).map(t2 => (
                <button key={t2} onClick={() => setTab(t2)}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors ${tab === t2 ? `text-[#c9a227] border-b-2 border-[#c9a227] -mb-px` : muted}`}>
                  {t2 === 'plan' ? 'Payment Plan' : t2 === 'annual' ? 'Annual Outflow' : 'Month-by-Month'}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── Payment Plan ── */}
              {tab === 'plan' && (
                <div className="space-y-3">
                  {([
                    { date: dateAt(0),                                        label: 'Booking',                                           p: downPayPct,                          color: goldGrad },
                    { date: `${dateAt(1)} – ${dateAt(11)}`,                   label: 'Construction (×11 mo.)',                             p: monthlyConstrPct * 11,               color: goldGrad },
                    { date: dateAt(12),                                        label: 'Constr. + Milestone',                               p: monthlyConstrPct + 10,               color: goldGrad },
                    ...(handoverMonth > 13 ? [{ date: `${dateAt(13)} – ${dateAt(handoverMonth - 1)}`, label: `Construction (×${handoverMonth - 13} mo.)`, p: monthlyConstrPct * (handoverMonth - 13), color: goldGrad }] : []),
                    { date: dateAt(handoverMonth),                             label: 'Handover',                                          p: monthlyConstrPct,                    color: 'bg-gradient-to-r from-emerald-400 to-emerald-600' },
                    ...(postHandoverPct > 0 ? [{ date: `${dateAt(handoverMonth + 1)} – ${dateAt(TOTAL_MONTHS)}`, label: `Post-Handover (×${POST_HANDOVER_MONTHS} mo.)`, p: postHandoverPct, color: 'bg-gradient-to-r from-blue-400 to-blue-600' }] : []),
                  ].filter(r => r.p > 0).map(row => {
                    const maxP = Math.max(downPayPct, postHandoverPct, monthlyConstrPct * (handoverMonth - 13), 1);
                    return (
                    <div key={row.date}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-[11px] font-medium ${txt}`}>{row.date}</span>
                        <span className={`text-[11px] ${muted}`}>{row.label}</span>
                        <span className="text-[11px] font-bold text-[#c9a227]">{row.p.toFixed(1)}% · AED {fmt(salePrice * row.p / 100)}</span>
                      </div>
                      <div className={`h-2 rounded-full ${trackBg}`}>
                        <div className={`h-full rounded-full ${row.color} transition-all duration-500`}
                          style={{ width: `${Math.min((row.p / maxP) * 100, 100)}%` }} />
                      </div>
                    </div>
                  );}))}

                  {/* Custom payment rows */}
                  {customPayments.length > 0 && (
                    <div className={`border-t ${divider} pt-3 space-y-2`}>
                      {customPayments.map(cp => (
                        <div key={cp.id} className="flex items-center gap-2 flex-wrap">
                          <input type="text" value={cp.label} placeholder="Stage name"
                            onChange={e => updateCustom(cp.id, 'label', e.target.value)}
                            className={`flex-1 min-w-[100px] rounded-lg border px-2 py-1.5 text-xs outline-none transition-colors ${inp}`} />
                          <input type="date" value={cp.date}
                            onChange={e => e.target.value && updateCustom(cp.id, 'date', e.target.value)}
                            style={D ? { colorScheme: 'dark' } : undefined}
                            className={`rounded-lg border px-2 py-1.5 text-xs outline-none transition-colors ${inp}`} />
                          <div className="flex items-center gap-1">
                            <input type="number" value={cp.pct} min={0} max={100} step={0.1}
                              onChange={e => updateCustom(cp.id, 'pct', +e.target.value)}
                              className={`w-16 rounded-lg border px-2 py-1.5 text-xs text-right outline-none transition-colors ${inp}`} />
                            <span className={`text-xs ${muted}`}>%</span>
                          </div>
                          <span className="text-xs font-bold text-[#c9a227] w-28 text-right">AED {fmt(salePrice * cp.pct / 100)}</span>
                          <button onClick={() => removeCustom(cp.id)} className="text-red-400 hover:text-red-300 text-sm font-bold px-1 transition-colors">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fees rows */}
                  <div className={`border-t ${divider} pt-3 space-y-1.5`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>DLD / Oqood fee</span>
                      <span className={`text-xs ${muted}`}>Booking</span>
                      <span className={`text-xs font-semibold ${txt}`}>AED {fmt(dldFee)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>Admin fee</span>
                      <span className={`text-xs ${muted}`}>Booking</span>
                      <span className={`text-xs font-semibold ${txt}`}>AED {fmt(adminFee)}</span>
                    </div>
                  </div>

                  {/* Net price total + Total outflow */}
                  <div className={`border-t ${divider} pt-3 space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-black ${txt}`}>Net price total</span>
                      <span className="text-xs font-bold text-[#c9a227]">100.0%</span>
                      <span className={`text-sm font-black ${txt}`}>AED {fmt(salePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-black ${txt}`}>Total outflow</span>
                      <span />
                      <span className="text-sm font-black text-[#c9a227]">AED {fmt(totalWithCustom)}</span>
                    </div>
                  </div>

                  {/* Add custom payment button */}
                  <div className="pt-2">
                    <button onClick={addCustomPayment}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${D ? 'border-[#1f2d44] text-[#c9a227] hover:bg-[#c9a227]/10' : 'border-[#d8d3c9] text-[#c9a227] hover:bg-[#c9a227]/10'}`}>
                      <span className="text-base leading-none font-bold">+</span>
                      Add custom payment
                    </button>
                  </div>
                </div>
              )}

              {/* ── Annual Outflow ── */}
              {tab === 'annual' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b ${divider}`}>
                        <th className={`text-left py-2 pr-4 font-semibold ${muted}`}>Year</th>
                        <th className={`text-right py-2 pr-4 font-semibold ${muted}`}>% of Outflow</th>
                        <th className={`text-right py-2 pr-4 font-semibold ${muted}`}>Total (AED)</th>
                        <th className={`text-right py-2 font-semibold ${muted}`}>Cumulative (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annual.map(({ year, amount, cum }) => (
                        <tr key={year} className={`border-b ${divider} last:border-0 hover:bg-[#c9a227]/5 transition-colors`}>
                          <td className={`py-2.5 pr-4 font-bold ${txt}`}>{year}</td>
                          <td className={`py-2.5 pr-4 text-right ${muted}`}>{pct((amount / outflow) * 100, 1)}</td>
                          <td className="py-2.5 pr-4 text-right font-semibold text-[#c9a227]">{fmt(amount)}</td>
                          <td className={`py-2.5 text-right ${muted}`}>{fmt(cum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Month-by-Month ── */}
              {tab === 'monthly' && (
                <div className="overflow-auto max-h-[360px] -mx-5 px-5">
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="sticky top-0">
                      <tr className={`${D ? 'bg-[#111827]' : 'bg-white'} border-b ${divider}`}>
                        {['Date','Type','%','Amount (AED)','Cum. %'].map(h => (
                          <th key={h} className={`py-2 text-left first:pl-0 last:text-right font-semibold ${muted} whitespace-nowrap pr-4`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, i) => (
                        <tr key={i} className={`border-b ${divider} ${rowHov} transition-colors`}>
                          <td className={`py-2 font-semibold ${txt} pr-4 whitespace-nowrap`}>{row.date}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${labelColors[row.label] || (D ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500')}`}>
                              {row.label}
                            </span>
                          </td>
                          <td className={`py-2 font-bold pr-4 ${txt}`}>{row.pPct.toFixed(row.pPct % 1 === 0 ? 0 : 3)}%</td>
                          <td className="py-2 font-bold text-[#c9a227] pr-4">{fmt(row.amount)}</td>
                          <td className={`py-2 text-right ${muted}`}>{row.cum.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer: Support policy & action buttons */}
      <Footer
        dark={dark}
        downPayPct={downPayPct}
        discPct={discPct}
        dldPct={dldPct}
        immDue={immDue}
        preHandoverAmt={preHandoverAmt}
        postHandoverAmt={postHandoverAmt}
        onReset={handleReset}
      />
    </div>
  );
}