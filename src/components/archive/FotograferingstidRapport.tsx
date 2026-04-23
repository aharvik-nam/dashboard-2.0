import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  REPORT_COLORS,
  CHART_GRID,
  PURPLE_TINTS,
  CORAL_TINTS,
  HEATMAP_BASE_RGB,
  HEATMAP_EMPTY,
  HEATMAP_DARK_TEXT,
  HEATMAP_LIGHT_TEXT,
} from '../../lib/chartTokens';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NMK: any = {
  'Maleri':            {n:948, imgMean:2.05,imgDist:{1:545,2:109,3:89,4:120,p5:85},  pctS:57, spMed:28.1,spP75:61.6,tpMin:27.4,tpP75:52.0, cap7med:15,cap7p75:8,  tpDays:197},
  'Tegning':           {n:1792,imgMean:1.22,imgDist:{1:1475,2:285,3:25,4:1,p5:6},   pctS:82, spMed:0.5, spP75:2.4, tpMin:5.7, tpP75:15.6, cap7med:74,cap7p75:27, tpDays:102},
  'Grafikk':           {n:1290,imgMean:1.14,imgDist:{1:1120,2:160,3:8,4:1,p5:1},    pctS:87, spMed:0.6, spP75:1.3, tpMin:6.5, tpP75:15.3, cap7med:65,cap7p75:27, tpDays:91},
  'Skulptur':          {n:419, imgMean:2.37,imgDist:{1:238,2:64,3:30,4:24,p5:63},   pctS:57, spMed:13.7,spP75:32.4,tpMin:21.5,tpP75:58.3, cap7med:20,cap7p75:7,  tpDays:80},
  'Fotografi':         {n:633, imgMean:1.09,imgDist:{1:577,2:54,3:2,4:0,p5:0},      pctS:91, spMed:2.2, spP75:6.2, tpMin:7.4, tpP75:26.7, cap7med:57,cap7p75:16, tpDays:67},
  'Installasjon/Video':{n:422, imgMean:2.21,imgDist:{1:261,2:111,3:22,4:4,p5:24},   pctS:62, spMed:4.3, spP75:22.6,tpMin:18.7,tpP75:47.2, cap7med:22,cap7p75:9,  tpDays:47},
  'Design objekt':     {n:2814,imgMean:1.64,imgDist:{1:2148,2:299,3:102,4:101,p5:164},pctS:76,spMed:13.7,spP75:43.0,tpMin:39.1,tpP75:76.5, cap7med:11,cap7p75:5,  tpDays:447},
  'Tekstil':           {n:188, imgMean:1.26,imgDist:{1:170,2:12,3:2,4:0,p5:4},      pctS:90, spMed:6.8, spP75:74.9,tpMin:16.1,tpP75:56.9, cap7med:26,cap7p75:7,  tpDays:27},
  'Ark. tegning':      {n:859, imgMean:1.02,imgDist:{1:848,2:9,3:2,4:0,p5:0},       pctS:99, spMed:1.7, spP75:2.3, tpMin:6.6, tpP75:17.9, cap7med:64,cap7p75:23, tpDays:65},
  'Ark. modell/annet': {n:518, imgMean:1.52,imgDist:{1:443,2:34,3:5,4:11,p5:25},    pctS:86, spMed:4.0, spP75:48.6,tpMin:9.2, tpP75:21.5, cap7med:46,cap7p75:20, tpDays:51},
};

const OK: any = {
  'Servise og sølv': {n:2848,imgMean:1.16,imgDist:{1:2626,2:109,3:37,4:45,p5:31}, pctS:92,spMed:17.3,spP75:45.9,tpMin:33.0,tpP75:62.1,cap7med:13,cap7p75:7, tpDays:529},
  'Drakt og tekstil':{n:2152,imgMean:1.20,imgDist:{1:1967,2:79,3:26,4:36,p5:44},  pctS:91,spMed:13.9,spP75:40.1,tpMin:21.6,tpP75:46.2,cap7med:19,cap7p75:9, tpDays:278},
  'Møbler':          {n:1146,imgMean:1.27,imgDist:{1:1055,2:28,3:12,4:11,p5:40},   pctS:92,spMed:17.6,spP75:52.7,tpMin:25.3,tpP75:51.0,cap7med:17,cap7p75:8, tpDays:189},
  'Smykker':         {n:306, imgMean:1.32,imgDist:{1:251,2:35,3:6,4:9,p5:5},       pctS:82,spMed:11.3,spP75:37.4,tpMin:21.1,tpP75:56.4,cap7med:20,cap7p75:7, tpDays:58},
  'Lamper og ur':    {n:437, imgMean:1.32,imgDist:{1:394,2:15,3:9,4:10,p5:9},       pctS:90,spMed:25.6,spP75:66.7,tpMin:20.4,tpP75:43.4,cap7med:21,cap7p75:10,tpDays:66},
  'Kunst (OK)':      {n:512, imgMean:1.15,imgDist:{1:465,2:37,3:5,4:2,p5:3},       pctS:91,spMed:4.1, spP75:11.9,tpMin:9.7, tpP75:23.3,cap7med:43,cap7p75:18,tpDays:54},
};

const NGM: any = {
  'Maleri (NG.M)':{n:2860,imgMean:1.65,imgDist:{1:1908,2:491,3:156,4:174,p5:131},pctS:67,spMed:20.3,spP75:43.2,tpMin:31.1,tpP75:55.1,cap7med:14,cap7p75:8,tpDays:523},
};

const NGM_SIZE: any = {
  XS:{spMed:0.7,spP75:4.8,tpMin:8},S:{spMed:17.6,spP75:41.0,tpMin:18},
  M:{spMed:21.7,spP75:47.1,tpMin:25},L:{spMed:26.9,spP75:49.4,tpMin:30},XL:{spMed:46.3,spP75:91.5,tpMin:52},
};
const NMK_SIZE: any = { XS: { spMed: 13.9 }, S: { spMed: 8.8 }, M: { spMed: 5.8 }, L: { spMed: 20.1 }, XL: { spMed: 1.1 } };
const OK_SIZE: any = { XS: { spMed: 11.1 }, S: { spMed: 10.9 }, M: { spMed: 13.9 }, L: { spMed: 15.5 }, XL: { spMed: 5.4 } };
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const NMK_CROSS: any = {
  'Maleri': { S: 27.5, M: 33.4, L: 30.3, XL: 15.9 },
  'Tegning': { XS: 7.3, M: 1.0, L: 8.8, XL: 0.7 },
  'Grafikk': { S: 0.7, M: 0.5, L: 5.7, XL: 0.6 },
  'Skulptur': { XS: 21.6, S: 10.4, M: 14.0, L: 22.1, XL: 14.7 },
  'Design objekt': { XS: 14.4, S: 10.4, M: 14.3, L: 28.6, XL: 9.0 },
  'Ark. tegning': { S: 2.2, M: 1.2, L: 0.4 },
  'Ark. modell/annet': { XS: 1.4, S: 9.2, M: 5.0, L: 8.7, XL: 1.0 },
  'Tekstil': { S: 5.6, M: 1.8, L: 28.1, XL: 3.1 },
};

const OK_CROSS: any = {
  'Servise og sølv': { XS: 25.9, S: 17.1, M: 6.0, L: 6.6 },
  'Drakt og tekstil': { XS: 8.4, S: 4.1, M: 14.4, L: 30.4, XL: 9.7 },
  'Møbler': { XS: 8.8, S: 142.1, M: 17.0, L: 24.1, XL: 13.3 },
  'Smykker': { XS: 14.7, S: 10.8, M: 20.8, L: 10.8 },
  'Lamper og ur': { XS: 10.7, S: 66.7, M: 37.0, L: 0.2 },
};

const AnalyseDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="analyse-block-stats">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer outline-none group"
      >
        <h3 style={{ marginBottom: 0 }} className="group-hover:text-[var(--purple)] transition-colors">Analyse og tiltak</h3>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export const FotograferingstidRapport: React.FC = () => {
  const [activeTab, setActiveTab] = useState('oversikt');

  const { purple, purpleLight, teal, tealLight, coral, coralLight } = REPORT_COLORS;

  const font = (sz = 11) => ({ family: 'DM Sans', size: sz });

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (c: any) => ` ${c.dataset.label}: ${c.raw != null ? c.raw : '—'} min`
        }
      }
    },
    scales: {
      x: {
        grid: { color: CHART_GRID.line },
        ticks: { font: font(), color: CHART_GRID.tickMuted }
      },
      y: {
        grid: { color: CHART_GRID.line },
        ticks: { font: font(), color: CHART_GRID.tickPrimary }
      }
    }
  };

  const horizontalBarOptions = {
    ...baseOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        grid: { color: CHART_GRID.line },
        ticks: { font: font(), color: CHART_GRID.tickMuted }
      },
      y: {
        grid: { display: false },
        ticks: { font: font(), color: CHART_GRID.tickPrimary }
      }
    }
  };

  const stackedBarOptions = {
    ...baseOptions,
    scales: {
      x: {
        stacked: true,
        grid: { color: CHART_GRID.line },
        ticks: { font: font(), color: CHART_GRID.tickMuted, callback: (v: any) => v + '%' }
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { font: font(11), color: CHART_GRID.tickPrimary }
      }
    },
    indexAxis: 'y' as const,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        display: true,
        position: 'top' as const,
        labels: { font: font(), color: CHART_GRID.tickPrimary, boxWidth: 12, boxHeight: 10 }
      },
      tooltip: {
        callbacks: {
          label: (c: any) => ` ${c.dataset.label}: ${c.raw != null ? c.raw : '—'}%`
        }
      }
    }
  };

  const nmkK = Object.keys(NMK);
  const okK = Object.keys(OK);

  const renderOversikt = () => (
    <div className="space-y-8">
      <div className="section-header-stats">
        <p className="section-label-stats">01 — Oversikt</p>
        <h2 className="section-title-stats">Sammendrag av funn</h2>
        <p className="section-desc-stats">De viktigste funnene på tvers av alle tre samlinger.</p>
      </div>

      <div className="co-stats p-stats">
        <div className="co-title-stats">Hva rapporten måler</div>
        Rapporten viser <strong>fotograferingstid</strong> — tidsrommet fra første til siste eksponering av et objekt i en fotograferingssesjon. For kategorier der de fleste objekter bare har ett bilde (grafikk, tegning), brukes <strong>dagsgjennomstrømning</strong> som supplement: total tidsspan for dagen delt på antall objekter fotografert. Verdier vises som <strong>typisk dag</strong> (medianen — halvparten av dagene er raskere, halvparten tregere) og <strong>tyngste kvartal</strong> (de 25% av dagene som tar lengst tid — ikke et unntak, men én av fire arbeidsdager). Etterarbeidsdata er ikke inkludert — disse dataene har for mange usikkerhetskilder til å gi et pålitelig bilde.
      </div>

      <div className="metric-grid-stats">
        <div className="metric-stats">
          <span className="label">Grafikk</span>
          <span className="value" style={{ color: purple }}>~6 min</span>
          <span className="sub">per objekt</span>
        </div>
        <div className="metric-stats">
          <span className="label">Tegning</span>
          <span className="value" style={{ color: teal }}>~6 min</span>
          <span className="sub">per objekt</span>
        </div>
        <div className="metric-stats">
          <span className="label">Maleri NG.M</span>
          <span className="value" style={{ color: coral }}>~30 min</span>
          <span className="sub">per objekt</span>
        </div>
        <div className="metric-stats">
          <span className="label">Design/møbler OK</span>
          <span className="value" style={{ color: amber }}>~25 min</span>
          <span className="sub">per objekt</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-stats">
          <div className="card-eye-stats">Billedkunst og arkitektur (NMK + NG.M)</div>
          <h3 className="card-h-stats">Fotograferingstid per kunsttype</h3>
          <p className="analyse-text-stats">Grafen viser typisk fotograferingstid (span) per kunsttype. Grafikk og tegning har svært lav span — dette reflekterer at de nesten alltid tas som enkeltbilder. Maleri, skulptur og designobjekter viser den faktiske variasjonen tydeligst.</p>
          <div className="legend-stats">
            <span><span className="legend-dot-stats" style={{ background: purple }}></span>Typisk (median)</span>
            <span><span className="legend-dot-stats" style={{ background: purpleLight }}></span>Tyngste kvartal</span>
          </div>
          <div className="h-[400px]">
            <Bar 
              data={{
                labels: nmkK,
                datasets: [
                  { label: 'Typisk (median)', data: nmkK.map(k => NMK[k].spMed), backgroundColor: purple, borderRadius: 4, barPercentage: 0.52 },
                  { label: 'Tyngste kvartal', data: nmkK.map(k => NMK[k].spP75), backgroundColor: purpleLight, borderRadius: 4, barPercentage: 0.52 }
                ]
              }}
              options={horizontalBarOptions}
            />
          </div>
        </div>
        <div className="card-stats">
          <div className="card-eye-stats">Design og brukskunst (OK)</div>
          <h3 className="card-h-stats">Fotograferingstid per objektgruppe</h3>
          <p className="analyse-text-stats">For OK-samlingen er lamper og ur mest tidkrevende basert på span, fulgt av møbler. Smykker tar overraskende lang tid til tross for liten fysisk størrelse.</p>
          <div className="legend-stats">
            <span><span className="legend-dot-stats" style={{ background: coral }}></span>Typisk (median)</span>
            <span><span className="legend-dot-stats" style={{ background: coralLight }}></span>Tyngste kvartal</span>
          </div>
          <div className="h-[400px]">
            <Bar 
              data={{
                labels: okK,
                datasets: [
                  { label: 'Typisk (median)', data: okK.map(k => OK[k].spMed), backgroundColor: coral, borderRadius: 4, barPercentage: 0.52 },
                  { label: 'Tyngste kvartal', data: okK.map(k => OK[k].spP75), backgroundColor: coralLight, borderRadius: 4, barPercentage: 0.52 }
                ]
              }}
              options={horizontalBarOptions}
            />
          </div>
        </div>
      </div>

      <div className="insight-grid-stats">
        <div className="insight-stats p-stats">
          <h4>Repro-fotografering: enkeltbilder dominerer</h4>
          <p>87–99% av grafikk, tegning og arkitektoniske tegninger er fotografert med bare ett bilde per objekt. Gjennomstrømningstallene (~6 min/objekt) er det pålitelige målet her.</p>
        </div>
        <div className="insight-stats c-stats">
          <h4>Maleri: størrelse er den viktigste faktoren</h4>
          <p>NG.M-data viser at fotograferingstiden øker nesten lineært med maleriets areal — fra under 1 minutt for miniatyrer til 46 minutter typisk for XL-malerier.</p>
        </div>
        <div className="insight-stats a-stats">
          <h4>Store gjenstander krever mer tid — men størrelse er ikke alt</h4>
          <p>For tredimensjonale gjenstander er det gjenstandens kompleksitet, materialets egenskaper og antall vinkler som styrer tidsbruken — ikke bare fysisk størrelse.</p>
        </div>
        <div className="insight-stats g-stats">
          <h4>Gjennomstrømning vs. span — to ulike mål</h4>
          <p>Span fungerer best for objekter med mange bilder. Dagsgjennomstrømning inkluderer riggingstid og overhead. Begge er nødvendige for et fullstendig bilde.</p>
        </div>
      </div>
    </div>
  );

  const renderMetode = () => (
    <div className="space-y-8">
      <div className="section-header-stats">
        <p className="section-label-stats">02 — Metode</p>
        <h2 className="section-title-stats">Slik er tallene beregnet</h2>
        <p className="section-desc-stats">Hva tallene måler, og like viktig: hva de ikke måler.</p>
      </div>

      <div className="co-stats p-stats">
        <div className="co-title-stats">Kun fotograferingstid er inkludert</div>
        Etterarbeid (softcropping i Fotostation, metadataregistrering, Photoshop-arbeid) er <strong>ikke</strong> inkludert i denne rapporten. Det skyldes at <em>File Modification Date/Time</em> oppdateres av alle programvarer som berører filen. Tallene gjelder utelukkende selve fotograferingen.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-stats">
          <h3 className="card-h-stats">Datakildene</h3>
          <p className="analyse-text-stats">Data er hentet fra <strong>NMK_Teknikk.txt</strong>, <strong>OK_Teknikk.txt</strong> og <strong>NGM_Teknikk.txt</strong>, som kobler filnavn til kunstverksinndeling og dimensjoner fra Museumplus. EXIF-tidsstempler brukes som eksponeringstidspunkt.</p>
        </div>
        <div className="card-stats">
          <h3 className="card-h-stats">To beregningsmetoder</h3>
          <p className="analyse-text-stats"><strong>Span-metoden:</strong> Tidsforskjell mellom første og siste eksponering av et objekt på én dag. Krever minst 2 bilder.<br/><br/><strong>Dagsgjennomstrømning:</strong> Total tidsspan for alle eksponeringer av en kategori på én dag, delt på antall distinkte objekter. Inkluderer riggingstid og overhead.</p>
        </div>
        <div className="card-stats">
          <h3 className="card-h-stats">Størrelsesdata</h3>
          <p className="analyse-text-stats">Dimensjoner er hentet fra MuseumPlus. Fem størrelseskategorier: XS (under 200 cm²), S (200–1 500 cm²), M (1 500–7 000 cm²), L (7 000–20 000 cm²), XL (over 20 000 cm²).</p>
        </div>
        <div className="card-stats">
          <h3 className="card-h-stats">Forbehold</h3>
          <ul className="analyse-text-stats list-disc pl-5 space-y-1">
            <li><strong>Enkeltbilder:</strong> 57–99% av objektene har bare ett bilde — disse bidrar ikke til span.</li>
            <li><strong>Riggingstid:</strong> Span måler ikke oppsett før første bilde.</li>
            <li><strong>Spredning:</strong> Tyngste kvartal er gjerne 2–4× høyere enn typisk dag.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderNMK = () => (
    <div className="space-y-8">
      <div className="section-header-stats">
        <p className="section-label-stats">03 — NMK</p>
        <h2 className="section-title-stats">Nasjonalmuseet for kunst</h2>
        <p className="section-desc-stats">~26 000 objekt-sesjoner kategorisert etter kunsttype fra MuseumPlus.</p>
      </div>

      <div className="co-stats t-stats">
        <div className="co-title-stats">Om grafikk og tegning i NMK</div>
        Span-metoden er lite egnet for grafikk og tegning fordi <strong>87–99% av objektene har bare ett bilde</strong>. De lave span-verdiene (under 1 minutt) for disse kategoriene er ikke et uttrykk for rask fotografering — de reflekterer at spennet mellom første og eneste eksponering er null. Se gjennomstrømningstallene for et realistisk bilde av tidsbruk per objekt. For maleri, skulptur og designobjekter er span-data derimot meningsfull.
      </div>

      <div className="card-stats">
        <div className="card-eye-stats">NMK — typisk dag og tyngste kvartal per kunsttype</div>
        <h3 className="card-h-stats">Fotograferingstid: typisk dag og spredning</h3>
        <p className="analyse-text-stats">Grafen viser typisk dag (span-median, lilla) og tyngste kvartal (lysere) for alle NMK-kunsttyper. Maleri har høyest median med 28 minutter — og tyngste kvartal på 61 minutter viser at én av fire malerisesjoner tar over en time bare under eksponering. Skulptur og designobjekter har moderat span med stor spredning, noe som gjenspeiler stor variasjon i gjenstandenes kompleksitet.</p>
        <div className="legend-stats">
          <span><span className="legend-dot-stats" style={{ background: purple }}></span>Typisk dag (median)</span>
          <span><span className="legend-dot-stats" style={{ background: purpleLight }}></span>Tyngste kvartal</span>
        </div>
        <div className="h-[500px]">
          <Bar 
            data={{
              labels: nmkK,
              datasets: [
                { label: 'Typisk dag (median)', data: nmkK.map(k => NMK[k].spMed), backgroundColor: purple, borderRadius: 4, barPercentage: 0.52 },
                { label: 'Tyngste kvartal', data: nmkK.map(k => NMK[k].spP75), backgroundColor: purpleLight, borderRadius: 4, barPercentage: 0.52 }
              ]
            }}
            options={horizontalBarOptions}
          />
        </div>
      </div>

      <div className="card-stats">
        <div className="card-eye-stats">NMK — andel enkeltbilder per kategori</div>
        <h3 className="card-h-stats">Hvor mange objekter har bare ett bilde?</h3>
        <p className="analyse-text-stats">Søylene viser andelen objekter i hver kategori som bare er dokumentert med ett bilde. Rød farge (over 80%) indikerer at span-metoden er lite informativ for kategorien — gjennomstrømningstall er mer relevant. Grønn (under 50%) betyr at span-data er pålitelig.</p>
        <div className="h-[400px]">
          <Bar 
            data={{
              labels: nmkK,
              datasets: [{
                label: '% enkeltbilder',
                data: nmkK.map(k => NMK[k].pctS),
                backgroundColor: nmkK.map((k: string) => NMK[k].pctS > 80 ? coral : NMK[k].pctS > 50 ? amber : teal),
                borderRadius: 4
              }]
            }}
            options={{
              ...horizontalBarOptions,
              scales: {
                ...horizontalBarOptions.scales,
                x: { ...horizontalBarOptions.scales.x, max: 100 }
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderOK = () => (
    <div className="space-y-8">
      <div className="section-header-stats">
        <p className="section-label-stats">04 — OK</p>
        <h2 className="section-title-stats">Kunstindustrimuseet</h2>
        <p className="section-desc-stats">~15 300 objekt-sesjoner gruppert i objektfamilier.</p>
      </div>

      <div className="co-stats a-stats">
        <div className="co-title-stats">Om OK-samlingen</div>
        Over 90% av OK-objektene er fotografert med bare ett bilde i de fleste kategorier — for smykker er andelen 82%, for de øvrige mellom 90 og 92%. Span-data er dermed lite egnet for disse kategoriene. Gjennomstrømningstallene gir et bedre bilde. Det er likevel nyttig å se span-fordelingen for de objektene som har fått flere bilder — disse representerer de mer krevende sesjonene.
      </div>

      <div className="card-stats">
        <div className="card-eye-stats">OK — typisk dag og tyngste kvartal per objektgruppe</div>
        <h3 className="card-h-stats">Fotograferingstid for flerbilde-sesjoner</h3>
        <p className="analyse-text-stats">Lamper og ur topper listen med 26 minutters typisk span, etterfulgt av møbler (18 min) og servise og sølv (17 min). Smykker viser 11 minutter i typisk span, men bør ses i lys av at gjennomstrømningstiden (~21 min/objekt) er høyere enn for mange større gjenstander.</p>
        <div className="legend-stats">
          <span><span className="legend-dot-stats" style={{ background: coral }}></span>Typisk dag (median)</span>
          <span><span className="legend-dot-stats" style={{ background: coralLight }}></span>Tyngste kvartal</span>
        </div>
        <div className="h-[400px]">
          <Bar 
            data={{
              labels: okK,
              datasets: [
                { label: 'Typisk dag (median)', data: okK.map(k => OK[k].spMed), backgroundColor: coral, borderRadius: 4, barPercentage: 0.52 },
                { label: 'Tyngste kvartal', data: okK.map(k => OK[k].spP75), backgroundColor: coralLight, borderRadius: 4, barPercentage: 0.52 }
              ]
            }}
            options={horizontalBarOptions}
          />
        </div>
      </div>
    </div>
  );

  const renderNGM = () => (
    <div className="space-y-8">
      <div className="section-header-stats">
        <p className="section-label-stats">05 — NG.M</p>
        <h2 className="section-title-stats">Maleriet</h2>
        <p className="section-desc-stats">~3 000 objekt-sesjoner med tydelig størrelseseffekt.</p>
      </div>

      <div className="co-stats c-stats">
        <div className="co-title-stats">NG.M — spesialisert maleri-produksjon</div>
        NG.M-samlingen er primært den eldre samlingen av malerier. NG.M-dataene gir det reneste bildet av størrelseseffekten på fotograferingstid, fordi samlingen er mer homogen i verkstype enn NMK. Fotograferingstiden stiger nesten lineært med maleriets fysiske størrelse — et av de mest robuste enkeltfunnene i hele datasetet.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-stats">
          <div className="card-eye-stats">NG.M maleri — fotograferingstid etter størrelse</div>
          <h3 className="card-h-stats">Størrelse driver fotograferingstid</h3>
          <p className="analyse-text-stats">Fra XS (under 200 cm², under 1 minutt) til XL (over 20 000 cm², 46 minutter typisk). Tyngste kvartal for XL er 91 minutter — én av fire store malerier tar over en og en halv time under eksponering alene.</p>
          <div className="legend-stats">
            <span><span className="legend-dot-stats" style={{ background: purple }}></span>Typisk (median)</span>
            <span><span className="legend-dot-stats" style={{ background: purpleLight }}></span>Tyngste kvartal</span>
          </div>
          <div className="h-[360px]">
            <Bar 
              data={{
                labels: SIZES,
                datasets: [
                  { label: 'Typisk (median)', data: SIZES.map(s => NGM_SIZE[s].spMed), backgroundColor: purple, borderRadius: 4, barPercentage: 0.52 },
                  { label: 'Tyngste kvartal', data: SIZES.map(s => NGM_SIZE[s].spP75), backgroundColor: purpleLight, borderRadius: 4, barPercentage: 0.52 }
                ]
              }}
              options={horizontalBarOptions}
            />
          </div>
        </div>
        <div className="card-stats">
          <div className="card-eye-stats">NG.M maleri — gjennomstrømning etter størrelse</div>
          <h3 className="card-h-stats">Objekter per dag synker med størrelse</h3>
          <p className="analyse-text-stats">Gjennomstrømningstiden per objekt stiger med størrelse. En dag med tre XL-malerier er derfor en krevende dag, mens en dag med ti S-malerier er godt innenfor kapasiteten.</p>
          <div className="h-[360px]">
            <Bar 
              data={{
                labels: SIZES,
                datasets: [{
                  label: 'Gjennomstrøm min/obj',
                  data: SIZES.map(s => NGM_SIZE[s].tpMin),
                  backgroundColor: teal,
                  borderRadius: 4,
                  barPercentage: 0.6
                }]
              }}
              options={baseOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStorrelse = () => {
    const buildHeatTable = (cross: any, rows: string[]) => {
      const all: number[] = [];
      rows.forEach(r => SIZES.forEach(s => {
        const v = cross[r]?.[s];
        if (v != null) all.push(v);
      }));
      const mx = Math.max(...all, 1);

      const heatStyle = (v: number | null) => {
        if (v == null) return HEATMAP_EMPTY;
        const t = Math.min(v / mx, 1);
        const r = Math.round(HEATMAP_BASE_RGB.r + t * (194 - HEATMAP_BASE_RGB.r));
        const g = Math.round(HEATMAP_BASE_RGB.g + t * (92  - HEATMAP_BASE_RGB.g));
        const b = Math.round(HEATMAP_BASE_RGB.b + t * (74  - HEATMAP_BASE_RGB.b));
        return {
          background: `rgba(${r},${g},${b},${0.15 + t * 0.75})`,
          color: t > 0.55 ? HEATMAP_LIGHT_TEXT : HEATMAP_DARK_TEXT,
          fontWeight: 600,
        };
      };

      return (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-stone-100">
              <th className="p-2"></th>
              {SIZES.map(s => <th key={s} className="p-2 text-center">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r} className="border-b border-stone-100">
                <td className="p-2 font-bold bg-stone-50">{r}</td>
                {SIZES.map(s => {
                  const v = cross[r]?.[s] ?? null;
                  return (
                    <td key={s} className="p-2 text-center" style={heatStyle(v)}>
                      {v != null ? v : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    };

    return (
      <div className="space-y-8">
        <div className="section-header-stats">
          <p className="section-label-stats">06 — Størrelse</p>
          <h2 className="section-title-stats">Betyr størrelse noe for fotograferingstiden?</h2>
          <p className="section-desc-stats">Dimensjoner fra MuseumPlus koblet mot EXIF-tidsstempler.</p>
        </div>

        <div className="co-stats a-stats">
          <div className="co-title-stats">Konklusjon</div>
          <strong>Ja, men på svært ulike måter avhengig av verkstype.</strong> For flate 2D-verk (maleri) er det en klar sammenheng: større areal gir lengre fotograferingstid. For 3D-gjenstander er sammenhengen svakere — kompleksitet dominerer.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-stats">
            <div className="card-eye-stats">Fotograferingstid etter størrelse — alle samlinger</div>
            <h3 className="card-h-stats">NG.M viser klareste størrelses-effekt</h3>
            <p className="analyse-text-stats">NG.M (grønn) stiger konsekvent fra XS til XL. NMK (lilla) viser en mer uregelmessig kurve. OK (rød) er relativt flat.</p>
            <div className="legend-stats">
              <span><span className="legend-dot-stats" style={{ background: purple }}></span>NMK</span>
              <span><span className="legend-dot-stats" style={{ background: coral }}></span>OK</span>
              <span><span className="legend-dot-stats" style={{ background: teal }}></span>NG.M</span>
            </div>
            <div className="h-[360px]">
              <Bar 
                data={{
                  labels: SIZES,
                  datasets: [
                    { label: 'NMK', data: SIZES.map(s => NMK_SIZE[s].spMed), backgroundColor: purple, borderRadius: 3, barPercentage: 0.3 },
                    { label: 'OK', data: SIZES.map(s => OK_SIZE[s].spMed), backgroundColor: coral, borderRadius: 3, barPercentage: 0.3 },
                    { label: 'NG.M', data: SIZES.map(s => NGM_SIZE[s].spMed), backgroundColor: teal, borderRadius: 3, barPercentage: 0.3 }
                  ]
                }}
                options={baseOptions}
              />
            </div>
          </div>
          <div className="card-stats">
            <div className="card-eye-stats">NMK — fotograferingstid per kategori og størrelse</div>
            <h3 className="card-h-stats">Heatmap: mørkere = lengre fotograferingstid</h3>
            <div className="overflow-x-auto">
              {buildHeatTable(NMK_CROSS, Object.keys(NMK_CROSS))}
            </div>
          </div>
        </div>

        <div className="card-stats">
          <div className="card-eye-stats">OK — fotograferingstid per objektgruppe og størrelse</div>
          <h3 className="card-h-stats">Heatmap: størrelse har varierende effekt per gruppe</h3>
          <div className="overflow-x-auto">
            {buildHeatTable(OK_CROSS, Object.keys(OK_CROSS))}
          </div>
        </div>
      </div>
    );
  };

  const renderGjennomstrom = () => {
    const tpNmkCats = nmkK.filter(k => NMK[k].tpMin);
    const labels = [...tpNmkCats, 'Maleri (NG.M)'];
    
    return (
      <div className="space-y-8">
        <div className="section-header-stats">
          <p className="section-label-stats">07 — Gjennomstrømning</p>
          <h2 className="section-title-stats">Dagsgjennomstrømning og bilder per objekt</h2>
          <p className="section-desc-stats">Analyse som inkluderer alle objekter, også de med bare ett bilde. Viser bilder per objekt og teoretisk kapasitet ved full utnyttelse.</p>
        </div>

        <div className="co-stats g-stats">
          <div className="co-title-stats">Om tallene</div>
          <strong>Gjennomstrømningstid</strong> er total tidsspan for en fotograferingsdag delt på antall objekter — inkluderer rigging og overhead. <strong>Bilder per objekt</strong> viser hvor mange eksponerte filer hvert objekt faktisk genererer. <strong>Kapasitet 7 timer</strong> er beregnet som 420 min ÷ gjennomstrømningstid og viser hva som er mulig å fotografere på én full arbeidsdag. Tallene reflekterer <strong>nåværende kapasitet under eksisterende bemanning</strong>.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-stats">
            <div className="card-eye-stats">NMK og NG.M — bilder per objekt-sesjon</div>
            <h3 className="card-h-stats">Hvor mange filer genererer hvert objekt?</h3>
            <p className="analyse-text-stats">Søylene viser prosentfordeling av bilder per objekt. Malerier i NMK dokumenteres med gjennomsnittlig 2,1 bilder. Grafikk og tegning er nesten alltid enkeltbilder.</p>
            <div className="h-[400px]">
              <Bar 
                data={{
                  labels: [...nmkK, 'Maleri (NG.M)'],
                  datasets: [
                    { label: '1 bilde',   data: [...nmkK, 'Maleri (NG.M)'].map(k => { const d = NMK[k] || NGM[k]; return Math.round(100 * d.imgDist[1]  / d.n); }), backgroundColor: PURPLE_TINTS[0] },
                    { label: '2 bilder',  data: [...nmkK, 'Maleri (NG.M)'].map(k => { const d = NMK[k] || NGM[k]; return Math.round(100 * d.imgDist[2]  / d.n); }), backgroundColor: PURPLE_TINTS[1] },
                    { label: '3 bilder',  data: [...nmkK, 'Maleri (NG.M)'].map(k => { const d = NMK[k] || NGM[k]; return Math.round(100 * d.imgDist[3]  / d.n); }), backgroundColor: PURPLE_TINTS[2] },
                    { label: '4 bilder',  data: [...nmkK, 'Maleri (NG.M)'].map(k => { const d = NMK[k] || NGM[k]; return Math.round(100 * d.imgDist[4]  / d.n); }), backgroundColor: PURPLE_TINTS[3] },
                    { label: '5+ bilder', data: [...nmkK, 'Maleri (NG.M)'].map(k => { const d = NMK[k] || NGM[k]; return Math.round(100 * d.imgDist.p5 / d.n); }), backgroundColor: PURPLE_TINTS[4] }
                  ]
                }}
                options={stackedBarOptions}
              />
            </div>
          </div>
          <div className="card-stats">
            <div className="card-eye-stats">OK — bilder per objekt-sesjon</div>
            <h3 className="card-h-stats">OK-gjenstander fotograferes oftest én gang</h3>
            <p className="analyse-text-stats">I OK-samlingen er enkeltbilder dominerende — over 90% i de fleste kategorier. Servise og sølv og møbler har noen innslag av flerbilde-sesjoner.</p>
            <div className="h-[400px]">
              <Bar 
                data={{
                  labels: okK,
                  datasets: [
                    { label: '1 bilde',   data: okK.map(k => Math.round(100 * OK[k].imgDist[1]  / OK[k].n)), backgroundColor: CORAL_TINTS[0] },
                    { label: '2 bilder',  data: okK.map(k => Math.round(100 * OK[k].imgDist[2]  / OK[k].n)), backgroundColor: CORAL_TINTS[1] },
                    { label: '3 bilder',  data: okK.map(k => Math.round(100 * OK[k].imgDist[3]  / OK[k].n)), backgroundColor: CORAL_TINTS[2] },
                    { label: '4 bilder',  data: okK.map(k => Math.round(100 * OK[k].imgDist[4]  / OK[k].n)), backgroundColor: CORAL_TINTS[3] },
                    { label: '5+ bilder', data: okK.map(k => Math.round(100 * OK[k].imgDist.p5  / OK[k].n)), backgroundColor: CORAL_TINTS[4] }
                  ]
                }}
                options={stackedBarOptions}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-stats">
            <div className="card-eye-stats">NMK og NG.M — minutter per objekt</div>
            <h3 className="card-h-stats">Typisk dag og tyngste kvartal</h3>
            <p className="analyse-text-stats">Repro-kategorier bruker 5–7 minutter per objekt under fotograferingen. Maleri, skulptur og designobjekter tar 20–40 minutter.</p>
            <div className="h-[400px]">
              <Bar 
                data={{
                  labels: labels,
                  datasets: [
                    { label: 'Typisk dag', data: [...tpNmkCats.map(k => NMK[k].tpMin), 31.1], backgroundColor: purple, borderRadius: 3, barPercentage: 0.42 },
                    { label: 'Tyngste kvartal', data: [...tpNmkCats.map(k => NMK[k].tpP75), 55.1], backgroundColor: purpleLight, borderRadius: 3, barPercentage: 0.42 }
                  ]
                }}
                options={horizontalBarOptions}
              />
            </div>
          </div>
          <div className="card-stats">
            <div className="card-eye-stats">OK — minutter per objekt</div>
            <h3 className="card-h-stats">Typisk dag og tyngste kvartal</h3>
            <p className="analyse-text-stats">OK-samlingen har relativt jevn fordeling mellom kategorier, de fleste mellom 20 og 35 minutter per objekt.</p>
            <div className="h-[400px]">
              <Bar 
                data={{
                  labels: okK,
                  datasets: [
                    { label: 'Typisk dag', data: okK.map(k => OK[k].tpMin), backgroundColor: coral, borderRadius: 3, barPercentage: 0.42 },
                    { label: 'Tyngste kvartal', data: okK.map(k => OK[k].tpP75), backgroundColor: coralLight, borderRadius: 3, barPercentage: 0.42 }
                  ]
                }}
                options={horizontalBarOptions}
              />
            </div>
          </div>
        </div>

        <div className="card-stats">
          <div className="card-eye-stats">Kapasitet 7 timer — objekter mulig ved full utnyttelse</div>
          <h3 className="card-h-stats">Teoretisk maks ved 100% kapasitet hele dagen</h3>
          <p className="analyse-text-stats">Søylene viser hvor mange objekter som er mulig å fotografere på én 7-timers arbeidsdag dersom studioet er i bruk sammenhengende.</p>
          <div className="h-[400px]">
            <Bar 
              data={{
                labels: [...labels, ...okK],
                datasets: [
                  { 
                    label: 'Typisk dag', 
                    data: [...tpNmkCats.map(k => NMK[k].cap7med), 14, ...okK.map(k => OK[k].cap7med)], 
                    backgroundColor: [...labels.map(() => purple), ...okK.map(() => coral)], 
                    borderRadius: 4, 
                    barPercentage: 0.52 
                  },
                  { 
                    label: 'Tyngste kvartal', 
                    data: [...tpNmkCats.map(k => NMK[k].cap7p75), 8, ...okK.map(k => OK[k].cap7p75)], 
                    backgroundColor: [...labels.map(() => purpleLight), ...okK.map(() => coralLight)], 
                    borderRadius: 4, 
                    barPercentage: 0.52 
                  }
                ]
              }}
              options={{
                ...baseOptions,
                plugins: {
                  ...baseOptions.plugins,
                  legend: { display: true, position: 'top' }
                }
              }}
            />
          </div>
        </div>

        <div className="card-stats">
          <div className="card-eye-stats">Planleggingstabell — fotografering kun</div>
          <h3 className="card-h-stats">Kapasitet og gjennomsnittlig antall bilder per objekt</h3>
          <p className="analyse-text-stats">Etterarbeid i Fotostation og Photoshop kommer i tillegg og er ikke inkludert. «Teoretisk maks 7t» er 420 min ÷ gjennomstrømningstid.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="py-2 px-3">Samling</th>
                  <th className="py-2 px-3">Kategori</th>
                  <th className="py-2 px-3 text-right">Bilder/obj</th>
                  <th className="py-2 px-3 text-right">Min/obj (typisk)</th>
                  <th className="py-2 px-3 text-right">Maks 7t (typisk)</th>
                  <th className="py-2 px-3 text-right">Dager i data</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...Object.entries(NMK).filter(([, v]: any) => v.tpMin).map(([k, v]: any) => ({ s: 'NMK', k, ...v })),
                  ...Object.entries(OK).filter(([, v]: any) => v.tpMin).map(([k, v]: any) => ({ s: 'OK', k, ...v })),
                  { s: 'NG.M', k: 'Maleri', imgMean: 1.65, tpMin: 31.1, cap7med: 14, tpDays: 523 }
                ].sort((a, b) => a.tpMin - b.tpMin).map((r, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100`}>{r.s}</span></td>
                    <td className="py-2 px-3 font-medium">{r.k}</td>
                    <td className="py-2 px-3 text-right">{r.imgMean?.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">{r.tpMin}</td>
                    <td className="py-2 px-3 text-right font-bold text-teal-600">{r.cap7med}</td>
                    <td className="py-2 px-3 text-right">{r.tpDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyse = () => (
    <div className="analysis-stats space-y-6">
      <h2>Analyse av fotograferingstid ved Seksjon foto, Nasjonalmuseet</h2>
      <p className="analyse-text-stats">Denne analysen er basert på EXIF-metadata fra om lag 50 000 tiff-filer i NMK, OK og NG.M-samlingene. Dataene dekker en periode fra de tidligste digitale registreringene og frem til april 2026. Analysen begrenser seg til selve fotograferingstiden — etterarbeid i Fotostation og Photoshop er ikke inkludert.</p>
      
      <h3>1. Tre studios med tre ulike fotograferingsworkflows</h3>
      <p className="analyse-text-stats">Seksjon foto opererer med tre ulike produksjonsmiljøer, og det er viktig å forstå dem for å tolke tidsdata riktig.</p>
      <p className="analyse-text-stats"><strong>Reprostudio</strong> brukes til grafikk, tegning og arkitektoniske tegninger. Fotograferingen skjer i høyt tempo: mange objekter eksponeres i sekvens med minimal rigging mellom hvert. Andelen enkeltbilder er ekstrem — 87–99%.</p>
      <p className="analyse-text-stats"><strong>Maleriatelier</strong> bruker Hasselblad og Phocus. Hvert maleri krever individuell rigging og belysningsjustering. Andelen enkeltbilder er lavere (~57–67%) fordi malerier vanligvis dokumenteres med flere varianter.</p>
      <p className="analyse-text-stats"><strong>Objekt- og gjenstandsatelier</strong> fotograferer 3D-gjenstander fra flere vinkler, og kompleksiteten varierer enormt.</p>

      <h3>2. Enkeltbilder, median og kapasitetsgrenser</h3>
      <p className="analyse-text-stats">En stor andel av alle fotograferte objekter er dokumentert med bare ett bilde. For grafikk er dette 87%, for arkitektoniske tegninger 99%. Span-metoden gir dermed verdien 0 for disse.</p>
      <p className="analyse-text-stats">Gjennomstrømningstallene for repro-kategorier (6–7 minutter per objekt) er et mål på <strong>nåværende kapasitet under eksisterende bemanning</strong> — ikke et uttrykk for hva som er teknisk mulig.</p>

      <h3>3. Maleri — størrelse er den viktigste enkeltfaktoren</h3>
      <p className="analyse-text-stats">NG.M-dataene gir det reneste bildet av størrelseseffekten. Fotograferingstiden stiger nesten lineært med maleriets areal: et miniaturmaleri under 200 cm² tar under ett minutt å eksponere, mens et XL-lerret over 20 000 cm² tar 46 minutter typisk.</p>

      <h3>4. Arkitektonisk materiale — to ulike utfordringer</h3>
      <p className="analyse-text-stats">Arkitektoniske <strong>tegninger</strong> under ca. 1×0,7 m fotograferes som repro. Gjennomstrømningstiden er ~7 minutter per objekt.</p>
      <p className="analyse-text-stats">Arkitektonisk <strong>materiale over ca. 1×0,7 m</strong> krever Objektstudio. Fotograferingstiden varierer mye (median 4 minutter, tyngste kvartal 49 minutter).</p>

      <h3>5. OK-samlingen — kompleksitet og materialer</h3>
      <p className="analyse-text-stats">For tredimensjonale gjenstander i OK er det ikke størrelsen, men gjenstandens optiske og fysiske egenskaper som bestemmer fotograferingstiden. <strong>Smykker</strong> tar rundt 21 minutter per objekt i gjennomstrømningstid.</p>

      <h3>6. Implikasjoner for planlegging</h3>
      <ul className="analyse-text-stats list-disc pl-5 space-y-2">
        <li><strong>Bruk størrelse aktivt:</strong> For maleri er størrelse den beste enkeltprediktoren for tidsbruk.</li>
        <li><strong>Kapasitetsmål:</strong> Gjennomstrømningstallene for repro-kategorier gjenspeiler dagens bemanningssituasjon.</li>
        <li><strong>Planlegg etter tyngste kvartal:</strong> Tyngste kvartal er gjennomgående 2–4 ganger høyere enn typisk dag.</li>
      </ul>

      <div className="note-block-stats bg-stone-100 p-4 rounded-lg border-l-4 border-stone-400">
        <strong>Oppsummering:</strong> Fotograferingstiden varierer mye mellom kunsttyper. Størrelse for maleri og kompleksitet for 3D-gjenstander er de viktigste variablene. Etterarbeidet i Fotostation og Photoshop er reelt og vesentlig, men krever bedre datagrunnlag for å kvantifiseres pålitelig.
      </div>
    </div>
  );

  const renderTabell = () => {
    const allRows = [
      ...Object.entries(NMK).map(([k, v]: [string, any]) => ({ s: 'NMK', k, ...v })),
      ...Object.entries(OK).map(([k, v]: [string, any]) => ({ s: 'OK', k, ...v })),
      { s: 'NG.M', k: 'Maleri', n: 2860, imgMean: 1.65, pctS: 67, spMed: 20.3, spP75: 43.2, tpMin: 31.1, cap7med: 14 },
    ].sort((a, b) => (b.spMed || 0) - (a.spMed || 0));

    const sBadge: any = { NMK: 'bg-stone-100 text-stone-600', OK: 'bg-stone-100 text-stone-600', 'NG.M': 'bg-stone-100 text-stone-600' };

    return (
      <div className="space-y-6">
        <div className="section-header-stats">
          <p className="section-label-stats">08 — Tabell</p>
          <h2 className="section-title-stats">Detaljert datagrunnlag</h2>
          <p className="section-desc-stats">Alle kategorier med råtall. Kun fotograferingstid.</p>
        </div>
        <div className="card-stats overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400">Samling</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400">Kategori</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400 text-right">Sesjoner</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400 text-right">% enkelt</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400 text-right">Span typisk</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400 text-right">Span tyngste kv.</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400 text-right">Min/obj</th>
                <th className="py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-stone-400 text-right">Maks 7t</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((r, i) => (
                <tr key={i} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sBadge[r.s]}`}>{r.s}</span></td>
                  <td className="py-3 px-4 font-medium">{r.k}</td>
                  <td className="py-3 px-4 text-right">{(r.n || 0).toLocaleString('no')}</td>
                  <td className="py-3 px-4 text-right">{r.pctS ?? '—'}%</td>
                  <td className="py-3 px-4 text-right">{r.spMed?.toFixed(1) ?? '—'}</td>
                  <td className="py-3 px-4 text-right">{r.spP75?.toFixed(1) ?? '—'}</td>
                  <td className="py-3 px-4 text-right">{r.tpMin ?? '—'}</td>
                  <td className="py-3 px-4 text-right">{r.cap7med ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'metode', label: 'Metode' },
    { id: 'nmk', label: 'NMK' },
    { id: 'ok', label: 'OK' },
    { id: 'ngm', label: 'NG.M' },
    { id: 'storrelse', label: 'Størrelse' },
    { id: 'gjennomstrom', label: 'Gjennomstrømning' },
    { id: 'tabell', label: 'Tabell' },
    { id: 'analyse', label: 'Analyse' }
  ];

  return (
    <div className="stats-body min-h-screen">
      <div className="site-header-stats">
        <div className="header-label-stats">Seksjon foto · Nasjonalmuseet</div>
        <h1>Fotograferingstid per kunstverksinndeling</h1>
        <p>En analyse av hvor lang tid selve fotograferingen tar, fordelt på type kunstverk og objektgruppe.</p>
        <div className="header-stats-row">
          <div className="header-stat-item">
            <span className="num">~50 000</span>
            <span className="lbl">TIFF-filer analysert</span>
          </div>
          <div className="header-stat-item">
            <span className="num">3</span>
            <span className="lbl">Samlinger (NMK · OK · NG.M)</span>
          </div>
          <div className="header-stat-item">
            <span className="num">~47 500</span>
            <span className="lbl">Objekt-sesjoner</span>
          </div>
          <div className="header-stat-item">
            <span className="num">5</span>
            <span className="lbl">Størrelseskategorier</span>
          </div>
        </div>
      </div>

      <div className="toc-stats">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nb-stats ${activeTab === tab.id ? 'on' : ''}`}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '14px 20px', 
              fontSize: '13px', 
              fontWeight: 500, 
              color: activeTab === tab.id ? 'var(--purple)' : 'var(--muted-stats)',
              borderBottom: `2.5px solid ${activeTab === tab.id ? 'var(--purple)' : 'transparent'}`,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 max-w-[1480px] mx-auto">
        {activeTab === 'oversikt' && renderOversikt()}
        {activeTab === 'metode' && renderMetode()}
        {activeTab === 'nmk' && renderNMK()}
        {activeTab === 'ok' && renderOK()}
        {activeTab === 'ngm' && renderNGM()}
        {activeTab === 'storrelse' && renderStorrelse()}
        {activeTab === 'gjennomstrom' && renderGjennomstrom()}
        {activeTab === 'tabell' && renderTabell()}
        {activeTab === 'analyse' && renderAnalyse()}
      </div>

      <div className="footer-stats">
        <span><strong>Datakilde:</strong> NMK_Teknikk.txt · OK_Teknikk.txt · NGM_Teknikk.txt + TIFF EXIF Photo.DateTimeOriginal</span>
        <span className="mx-4">|</span>
        <span><strong>Måler kun:</strong> Fotograferingstid. Etterarbeid er ikke inkludert.</span>
        <span className="mx-4">|</span>
        <span><strong>Generert:</strong> April 2026 · Seksjon foto, Nasjonalmuseet</span>
      </div>
    </div>
  );
};
