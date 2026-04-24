import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Lock, ShieldCheck, AlertCircle, RotateCcw } from "lucide-react";
import { Card } from "./ui/Card";
import { PhotographerSettingsTab } from "./PhotographerSettingsTab";
import { ColorsTab } from "./settings/ColorsTab";
import { CardsTab } from "./settings/CardsTab";
import { JobDetailsTab } from "./settings/JobDetailsTab";
import { TypographyTab } from "./settings/TypographyTab";
import { ThemePreviewPanel } from "./settings/ThemePreviewPanel";

// ─── Design constants ────────────────────────────────────────────────────────
const SIDE  = '#2a251c';
const ACCENT = '#d97757';
const MONO  = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';
const SANS  = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const S_INK  = '#efece4';
const S_DIM  = 'rgba(239,236,228,0.55)';
const S_RULE = 'rgba(239,236,228,0.15)';

type SettingsSection = 'utseende' | 'varsler' | 'tastatur' | 'konto' | 'integrasjoner' | 'om';

const SECTIONS: { key: SettingsSection; k: string; label: string }[] = [
  { key: 'utseende',      k: 'U', label: 'Utseende'      },
  { key: 'varsler',       k: 'V', label: 'Varsler'        },
  { key: 'tastatur',      k: 'T', label: 'Tastatur'       },
  { key: 'konto',         k: 'K', label: 'Konto'          },
  { key: 'integrasjoner', k: 'I', label: 'Integrasjoner'  },
  { key: 'om',            k: 'O', label: 'Om'             },
];

const KEYBOARD_SHORTCUTS = [
  ['Åpne kommandopalett', '⌘ K'],
  ['Gå til Oversikt',     '⌘ 1'],
  ['Gå til Bestillinger', '⌘ 2'],
  ['Gå til Kalender',     '⌘ 3'],
  ['Gå til Arkiv',        '⌘ 4'],
  ['Gå til Innstillinger','⌘ ,'],
  ['Ny ordre',            'N'   ],
  ['Neste rad',           'J'   ],
  ['Forrige rad',         'K'   ],
  ['Åpne valgt',          '↩'   ],
  ['Merk ferdig',         '⌘ ↩' ],
  ['Lukk modal',          'ESC' ],
];

const INTEGRATIONS = [
  { abbr: 'MP', label: 'MUSEUMPLUS',          hint: 'Synkroniser ordre og verk',      ok: true  },
  { abbr: 'DB', label: 'DROPBOX',             hint: 'Opplasting av råfiler',          ok: true  },
  { abbr: 'NB', label: 'NASJONALBIBLIOTEKET', hint: 'Send ferdige leveranser',        ok: true  },
  { abbr: 'C1', label: 'CAPTURE ONE',         hint: 'Session-sync (lokal)',           ok: false },
  { abbr: 'SL', label: 'SLACK',               hint: 'Varsler til #foto-kanalen',      ok: false },
];

const NOTIFICATIONS = [
  { label: 'Kritisk over frist',          hint: 'E-post + push umiddelbart',        def: true  },
  { label: 'Nye bestillinger tildelt meg', hint: 'Push ved tildeling',              def: true  },
  { label: 'Daglig sammendrag',           hint: 'E-post kl. 08:00 hver morgen',    def: true  },
  { label: 'Ukens plan',                  hint: 'E-post mandag morgen',             def: false },
  { label: 'Kommentarer i ordredetalj',   hint: 'Kun når noen nevner deg',          def: true  },
  { label: 'Integrasjonsfeil',            hint: 'MuseumPlus / Dropbox sync-feil',   def: true  },
];

interface ThemeSettingsProps {
  uniqueLocations?: string[];
  uniqueTypes?: string[];
  uniqueOwners?: string[];
}

// ─── SettingsRow (label/hint + control) ─────────────────────────────────────
function SettingsRow({ label, hint, cc, children }: {
  label: string; hint?: string;
  cc: { ink: string; ink3: string; hair: string; mono: string; sans: string };
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${cc.hair}`, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 30, alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: cc.ink }}>{label}</div>
        {hint && <div style={{ fontFamily: cc.mono, fontSize: 10.5, color: cc.ink3, marginTop: 3, lineHeight: 1.4 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Toggle button ───────────────────────────────────────────────────────────
function Toggle({ value, onChange, cc }: {
  value: boolean;
  onChange: (v: boolean) => void;
  cc: { ink: string; hair: string; panel: string };
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 38, height: 22, borderRadius: 11,
        background: value ? cc.ink : cc.hair,
        border: 'none', cursor: 'pointer', padding: 2,
        display: 'flex', alignItems: 'center',
        justifyContent: value ? 'flex-end' : 'flex-start',
        transition: 'background .15s',
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: cc.panel, display: 'block' }} />
    </button>
  );
}

// ─── Utseende section content ────────────────────────────────────────────────
function UtseendeSection({
  localTheme, uniqueLocations, uniqueTypes,
  handleChange, handleArrayChange, handleCardSettingChange,
  handleJobDetailsChange, handleFieldMappingChange, handleColumnHeaderChange,
  toggleArrayItem, handleFontSizeOffsetChange, resetTheme, cc,
}: any) {
  const [subTab, setSubTab] = useState<'farger' | 'kort' | 'typografi' | 'detaljer'>('farger');
  const tabs = [
    { id: 'farger',    label: 'Farger'   },
    { id: 'kort',      label: 'Kort'     },
    { id: 'typografi', label: 'Typografi'},
    { id: 'detaljer',  label: 'Detaljer' },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', color: cc.ink3, marginBottom: 4 }}>UTSEENDE</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: cc.ink }}>Tilpass NaMFOTO</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: cc.ink3, marginTop: 3, letterSpacing: '0.04em' }}>
        ENDRINGER LAGRES AUTOMATISK · GJELDER HELE ARBEIDSFLATEN
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginTop: 20, marginBottom: 20, padding: 4, background: cc.panel, borderRadius: 6, width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            style={{
              padding: '5px 12px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em',
              border: 'none', background: subTab === t.id ? cc.bg : 'transparent',
              color: subTab === t.id ? cc.ink : cc.ink3,
              cursor: 'pointer', borderRadius: 4,
              boxShadow: subTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontWeight: subTab === t.id ? 600 : 400,
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Reset button */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={resetTheme}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em', color: cc.ink3, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <RotateCcw size={12} /> TILBAKESTILL
        </button>
      </div>

      {subTab === 'farger' && (
        <ColorsTab
          localTheme={localTheme}
          uniqueLocations={uniqueLocations}
          uniqueTypes={uniqueTypes}
          onChange={handleChange}
          onArrayChange={handleArrayChange}
        />
      )}
      {subTab === 'kort' && (
        <CardsTab localTheme={localTheme} onCardSettingChange={handleCardSettingChange} />
      )}
      {subTab === 'typografi' && (
        <TypographyTab localTheme={localTheme} onChange={handleChange} onFontSizeOffsetChange={handleFontSizeOffsetChange} />
      )}
      {subTab === 'detaljer' && (
        <div>
          <JobDetailsTab
            localTheme={localTheme}
            onJobDetailsChange={handleJobDetailsChange}
            onFieldMappingChange={handleFieldMappingChange}
            onColumnHeaderChange={handleColumnHeaderChange}
            toggleArrayItem={toggleArrayItem}
          />
          <div style={{ marginTop: 24 }}>
            <ThemePreviewPanel localTheme={localTheme} previewMode="details" setPreviewMode={() => {}} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  uniqueLocations = [], uniqueTypes = [], uniqueOwners = [],
}) => {
  const { baseTheme, updateTheme, resetTheme } = useTheme();
  const { theme } = useTheme();
  const [localTheme, setLocalTheme] = useState(baseTheme);
  const [section, setSection] = useState<SettingsSection>('utseende');

  // Auth gate
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem('settings_authenticated') === 'true'
  );
  const [password, setPassword]   = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Notification toggles
  const [notifVals, setNotifVals] = useState(() => NOTIFICATIONS.map(n => n.def));

  const cc = {
    bg:    theme.stone50,
    panel: theme.stone100,
    ink:   theme.textColorPrimary,
    ink2:  theme.textColorSecondary,
    ink3:  theme.textColorMuted,
    hair:  theme.stone200,
    ok:    theme.statusWithin,
    okBg:  `${theme.statusWithin}1a`,
    critical: theme.statusCritical,
    mono: MONO,
    sans: SANS,
  };

  const SMALLCAP: React.CSSProperties = {
    fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase',
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError('');
    try {
      const res  = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('settings_authenticated', 'true');
      } else {
        setAuthError(data.message || 'Feil passord');
      }
    } catch {
      setAuthError('Kunne ikke verifisere passord. Prøv igjen senere.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Theme change helpers (keep identical to original)
  const handleChange = (key: string, value: string) => {
    const t = { ...localTheme, [key]: value };
    setLocalTheme(t);
    updateTheme({ [key]: value });
  };
  const handleArrayChange = (key: string, index: number, value: string) => {
    const arr = [...(localTheme[key as keyof typeof localTheme] as string[])];
    arr[index] = value;
    const t = { ...localTheme, [key]: arr };
    setLocalTheme(t);
    updateTheme({ [key]: arr });
  };
  const handleCardSettingChange = (key: string, value: unknown) => {
    const s = { ...localTheme.cardSettings, [key]: value };
    const t = { ...localTheme, cardSettings: s };
    setLocalTheme(t);
    updateTheme({ cardSettings: s });
  };
  const handleJobDetailsChange = (key: string, value: unknown) => {
    const s = { ...localTheme.jobDetailsSettings, [key]: value } as any;
    if (!s.highlightFields) s.highlightFields = ['deadline', 'location', 'usage'];
    if (!s.artworkListFields) s.artworkListFields = ['invNr', 'title', 'artist', 'dimensions', 'material', 'technique', 'materialDescription'];
    if (!s.artworkFieldMapping) s.artworkFieldMapping = { invNr: 0, title: 1, artist: 1, dimensions: 3, material: 2, technique: 2, materialDescription: 2, objectName: 0 };
    if (!s.artworkColumnHeaders) s.artworkColumnHeaders = ['Inventarnummer', 'Tittel & Kunstner', 'Materiale', 'Mål'];
    const t = { ...localTheme, jobDetailsSettings: s };
    setLocalTheme(t);
    updateTheme({ jobDetailsSettings: s });
  };
  const handleFieldMappingChange = (fieldKey: string, columnIndex: number) => {
    handleJobDetailsChange('artworkFieldMapping', {
      ...(localTheme.jobDetailsSettings?.artworkFieldMapping || {}),
      [fieldKey]: columnIndex,
    });
  };
  const handleColumnHeaderChange = (index: number, value: string) => {
    const h = [...(localTheme.jobDetailsSettings?.artworkColumnHeaders || ['Inventarnummer', 'Tittel & Kunstner', 'Materiale', 'Mål'])];
    h[index] = value;
    handleJobDetailsChange('artworkColumnHeaders', h);
  };
  const toggleArrayItem = (array: string[], item: string) =>
    array.includes(item) ? array.filter(i => i !== item) : [...array, item];
  const handleFontSizeOffsetChange = (offset: number) => {
    const t = { ...localTheme, fontSizeOffset: offset };
    setLocalTheme(t);
    updateTheme({ fontSizeOffset: offset });
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: cc.bg, color: cc.ink, fontFamily: SANS }}>
        {/* Cmdbar */}
        <div style={{ background: SIDE, color: S_INK, padding: '10px 18px', flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Innstillinger</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: S_DIM, marginTop: 1, letterSpacing: '0.06em' }}>TILPASS UTSEENDE · VARSLER · TASTATUR</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card className="w-full max-w-md p-8 shadow-xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-stone-900" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-serif font-black text-stone-900">Beskyttet område</h2>
                <p className="text-sm text-stone-500">Vennligst oppgi passord for å få tilgang til innstillinger.</p>
              </div>
              <form onSubmit={handleVerifyPassword} className="w-full space-y-4">
                <div className="space-y-1.5">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Passord"
                    className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all ${authError ? 'border-red-500' : 'border-stone-200 focus:border-stone-900'}`}
                    autoFocus
                  />
                  {authError && (
                    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider px-1">
                      <AlertCircle className="w-3 h-3" /> {authError}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || !password}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><ShieldCheck className="w-4 h-4" /> Lås opp</>
                  }
                </button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: cc.bg, color: cc.ink, fontFamily: SANS }}>

      {/* ── Cmdbar ──────────────────────────────────────────────────────── */}
      <div style={{ background: SIDE, color: S_INK, padding: '10px 18px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Innstillinger</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: S_DIM, marginTop: 1, letterSpacing: '0.06em' }}>
            TILPASS UTSEENDE · VARSLER · TASTATUR
          </div>
        </div>
      </div>

      {/* ── Inner layout: nav + content ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr', overflow: 'hidden' }}>

        {/* Inner nav */}
        <div style={{ borderRight: `1px solid ${cc.hair}`, padding: '14px 10px', background: cc.panel, overflowY: 'auto' }}>
          {SECTIONS.map(({ key, k, label }) => {
            const active = section === key;
            return (
              <div
                key={key}
                onClick={() => setSection(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', fontSize: 13, cursor: 'pointer',
                  borderRadius: 4, fontFamily: SANS,
                  background: active ? cc.bg : 'transparent',
                  color: active ? cc.ink : cc.ink2,
                  fontWeight: active ? 500 : 400,
                  marginBottom: 2,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${cc.hair}60`; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{
                  width: 18, height: 18,
                  background: active ? cc.ink : cc.hair,
                  color: active ? cc.bg : cc.ink2,
                  fontFamily: MONO, fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 3, fontWeight: 600, flexShrink: 0,
                }}>
                  {k}
                </span>
                {label}
              </div>
            );
          })}
        </div>

        {/* Section content */}
        <div style={{ padding: 24, overflow: 'auto' }}>

          {/* ── Utseende ── */}
          {section === 'utseende' && (
            <UtseendeSection
              localTheme={localTheme}
              uniqueLocations={uniqueLocations}
              uniqueTypes={uniqueTypes}
              handleChange={handleChange}
              handleArrayChange={handleArrayChange}
              handleCardSettingChange={handleCardSettingChange}
              handleJobDetailsChange={handleJobDetailsChange}
              handleFieldMappingChange={handleFieldMappingChange}
              handleColumnHeaderChange={handleColumnHeaderChange}
              toggleArrayItem={toggleArrayItem}
              handleFontSizeOffsetChange={handleFontSizeOffsetChange}
              resetTheme={resetTheme}
              cc={cc}
            />
          )}

          {/* ── Varsler ── */}
          {section === 'varsler' && (
            <div style={{ maxWidth: 780 }}>
              <div style={{ ...SMALLCAP, color: cc.ink3, marginBottom: 4 }}>VARSLER</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: cc.ink }}>Hva vil du få beskjed om?</div>
              <div style={{ marginTop: 20 }}>
                {NOTIFICATIONS.map(({ label, hint }, i) => (
                  <SettingsRow key={label} label={label} hint={hint} cc={cc}>
                    <Toggle
                      value={notifVals[i]}
                      onChange={v => setNotifVals(notifVals.map((x, k) => k === i ? v : x))}
                      cc={cc}
                    />
                  </SettingsRow>
                ))}
              </div>
            </div>
          )}

          {/* ── Tastatur ── */}
          {section === 'tastatur' && (
            <div style={{ maxWidth: 780 }}>
              <div style={{ ...SMALLCAP, color: cc.ink3, marginBottom: 4 }}>TASTATUR</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: cc.ink }}>Snarveier</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: cc.ink3, marginTop: 3, letterSpacing: '0.04em' }}>TRYKK ? FOR Å SE DETTE HVOR SOM HELST</div>
              <div style={{ marginTop: 20, border: `1px solid ${cc.hair}`, borderRadius: 6, background: cc.panel }}>
                {KEYBOARD_SHORTCUTS.map(([label, kbd], i) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 16px',
                    borderBottom: i < KEYBOARD_SHORTCUTS.length - 1 ? `1px solid ${cc.hair}` : 'none',
                    fontSize: 13, color: cc.ink,
                  }}>
                    <div style={{ flex: 1 }}>{label}</div>
                    <span style={{
                      fontFamily: MONO, fontSize: 11, padding: '3px 9px',
                      border: `1px solid ${cc.hair}`, borderRadius: 3,
                      color: cc.ink, background: cc.bg, letterSpacing: '0.05em',
                    }}>{kbd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Konto ── */}
          {section === 'konto' && (
            <div style={{ maxWidth: 780 }}>
              <div style={{ ...SMALLCAP, color: cc.ink3, marginBottom: 4 }}>KONTO</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: cc.ink }}>Kontoinnstillinger</div>
              <div style={{ marginTop: 20 }}>
                <SettingsRow label="Fotografer" hint="Administrer fotografkontoer og tilganger" cc={cc}>
                  <PhotographerSettingsTab uniqueOwners={uniqueOwners} />
                </SettingsRow>
                <SettingsRow label="Logg ut" hint="Du må logge inn igjen neste gang" cc={cc}>
                  <button
                    onClick={() => { localStorage.removeItem('authToken'); window.location.reload(); }}
                    style={{
                      padding: '7px 14px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em',
                      border: `1px solid ${cc.critical}`, background: 'transparent',
                      color: cc.critical, cursor: 'pointer', borderRadius: 3, fontWeight: 600,
                    }}
                  >
                    LOGG UT
                  </button>
                </SettingsRow>
              </div>
            </div>
          )}

          {/* ── Integrasjoner ── */}
          {section === 'integrasjoner' && (
            <div style={{ maxWidth: 780 }}>
              <div style={{ ...SMALLCAP, color: cc.ink3, marginBottom: 4 }}>INTEGRASJONER</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: cc.ink }}>Tilkoblede tjenester</div>
              <div style={{ marginTop: 20, border: `1px solid ${cc.hair}`, borderRadius: 6, background: cc.panel }}>
                {INTEGRATIONS.map(({ abbr, label, hint, ok }, i) => (
                  <div key={label} style={{
                    padding: '14px 16px',
                    borderBottom: i < INTEGRATIONS.length - 1 ? `1px solid ${cc.hair}` : 'none',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 40, height: 40, background: cc.bg,
                      border: `1px solid ${cc.hair}`, borderRadius: 5,
                      fontFamily: MONO, fontSize: 11,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, color: cc.ink2,
                    }}>{abbr}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', fontWeight: 600, color: cc.ink }}>{label}</div>
                      <div style={{ fontSize: 12, color: cc.ink3, marginTop: 1 }}>{hint}</div>
                    </div>
                    {ok ? (
                      <span style={{
                        fontFamily: MONO, fontSize: 10, padding: '3px 8px', borderRadius: 3,
                        background: cc.okBg, color: cc.ok, fontWeight: 600, letterSpacing: '0.06em',
                      }}>● TILKOBLET</span>
                    ) : (
                      <button style={{
                        padding: '5px 11px', fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
                        border: `1px solid ${cc.hair}`, background: cc.bg, color: cc.ink2,
                        cursor: 'pointer', borderRadius: 3, fontWeight: 600,
                      }}>KOBLE TIL</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Om ── */}
          {section === 'om' && (
            <div style={{ maxWidth: 780 }}>
              <div style={{ ...SMALLCAP, color: cc.ink3, marginBottom: 4 }}>OM</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: cc.ink }}>NaMFOTO</div>
              <div style={{ marginTop: 16, fontSize: 13, color: cc.ink2, lineHeight: 1.7 }}>
                Dashboard for fotooppdrag i Seksjon Foto, Nasjonalmuseet.<br />
                Bygget for å håndtere arbeidsflyt fra bestilling til arkivering.
              </div>
              <div style={{ marginTop: 20, border: `1px solid ${cc.hair}`, borderRadius: 6, background: cc.panel, padding: 16, fontFamily: MONO, fontSize: 11.5, color: cc.ink2, letterSpacing: '0.04em', lineHeight: 1.8 }}>
                <div>VERSJON · 2.0.3</div>
                <div>BYGG · 2026.04.24-a1b2c3d</div>
                <div>KANAL · STABLE</div>
                <div style={{ marginTop: 12, color: cc.ink3, fontSize: 10 }}>
                  © 2026 Nasjonalmuseet · Seksjon Foto
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Helpers used in UtseendeSection
const SMALLCAP: React.CSSProperties = {
  fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase',
};
