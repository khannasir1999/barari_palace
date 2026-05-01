const fmt = (n) => Math.round(n).toLocaleString('en-AE');
const SUPPORT_CAP = 10;

const Footer = ({
  dark = false,
  downPayPct = 15,
  discPct = 0,
  dldPct = 4,
  immDue = 0,
  preHandoverAmt = 0,
  postHandoverAmt = 0,
  onReset = () => {},
}) => {
  const D = dark;
  const txt    = D ? 'text-white'          : 'text-[#1a1629]';
  const muted  = D ? 'text-[#6b7a8d]'      : 'text-[#888]';
  const border = D ? 'border-[#1f2d44]'    : 'border-[#e5e0d5]';
  const btn    = D
    ? 'bg-[#0a1020] border-[#1f2d44] text-[#ccc] hover:bg-[#1f2d44]'
    : 'bg-white border-[#ddd] text-[#444] hover:bg-[#f5f3ee]';

  const discountUsed = discPct;
  const dldUsed      = dldPct;
  const remaining    = +(SUPPORT_CAP - discountUsed - dldUsed).toFixed(1);
  const withinPolicy = remaining >= 0;

  const handleWhatsApp = () => window.open('https://wa.me/', '_blank');
  const handleEmail    = () => window.open(`mailto:?subject=Payment%20Schedule`, '_blank');
  const handlePrint    = () => window.print();
  const handleExport   = () => {
    const data = { downPayPct, discPct, dldPct, immDue, preHandoverAmt, postHandoverAmt };
    const url  = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: 'payment-schedule.json' }).click();
  };
//   const handleImport = () => document.getElementById('footer-import-input')?.click();

  return (
    <div className={`rounded-2xl border ${border} ${D ? 'bg-[#111827]' : 'bg-white'} p-5 shadow-sm space-y-5`}
         style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm">🤝</span>
        <span className={`text-xs font-bold uppercase tracking-widest ${txt}`}>Support policy &amp; comparison</span>
      </div>

      {/* Two-column info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Left: Support cap */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-sm bg-red-400 shrink-0" />
            <span className={`text-xs font-bold ${txt}`}>Support cap</span>
          </div>
          {[
            { label: 'Total cap',     val: SUPPORT_CAP.toFixed(1) + '%' },
            { label: 'Discount used', val: discountUsed.toFixed(1) + '%' },
            { label: 'DLD/Oqood',     val: dldUsed.toFixed(1) + '%' },
            { label: 'Remaining',     val: remaining.toFixed(1) + '%' },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between items-center">
              <span className={`text-xs ${muted}`}>{label}</span>
              <span className={`text-xs font-semibold ${txt}`}>{val}</span>
            </div>
          ))}
          <div className="pt-1">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              withinPolicy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${withinPolicy ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {withinPolicy ? 'Within policy' : 'Exceeds policy, Approval required'}
            </span>
          </div>
        </div>

        {/* Right: Comparison */}
        <div className="space-y-2.5">
          {[
            { label: 'Standard down',     std: '15%', cur: downPayPct.toFixed(1) + '%' },
            { label: 'Standard discount', std: '0%',  cur: discPct.toFixed(1) + '%'    },
            { label: 'Standard DLD',      std: '4%',  cur: dldPct.toFixed(1) + '%'     },
          ].map(({ label, std, cur }) => (
            <div key={label} className="flex items-center justify-between">
              <span className={`text-xs ${muted}`}>{label}</span>
              <div className="flex gap-5">
                <span className={`text-xs ${muted}`}>{std}</span>
                <span className={`text-xs font-semibold ${txt} w-12 text-right`}>{cur}</span>
              </div>
            </div>
          ))}
          <div className={`border-t ${border} pt-2.5 space-y-2`}>
            {[
              { label: 'Due today',           val: fmt(immDue)          },
              { label: 'Pre-handover total',  val: fmt(preHandoverAmt)  },
              { label: 'Post-handover total', val: fmt(postHandoverAmt) },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <span className={`text-xs ${muted}`}>{label}</span>
                <span className={`text-xs font-semibold ${txt}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={`border-t ${border} pt-4 flex flex-wrap gap-2`}>
        {[
          { label: 'WhatsApp', icon: '📱', action: handleWhatsApp },
          { label: 'Email',    icon: '✉️',  action: handleEmail    },
          { label: 'Print',    icon: '🖨️',  action: handlePrint    },
          { label: 'Export',   icon: '⬆️',  action: handleExport   },
        //   { label: 'Import',   icon: '⬇️',  action: handleImport   },
          { label: 'Reset',    icon: '↺',   action: onReset        },
        ].map(({ label, icon, action }) => (
          <button key={label} onClick={action}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${btn}`}>
            <span className="text-sm leading-none">{icon}</span>
            {label}
          </button>
        ))}
        {/* <input id="footer-import-input" type="file" accept=".json" className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { try { console.log('Imported:', JSON.parse(ev.target.result)); } catch { console.error('Invalid file'); } };
            reader.readAsText(file);
            e.target.value = '';
          }} /> */}
      </div>
    </div>
  );
};

export default Footer;