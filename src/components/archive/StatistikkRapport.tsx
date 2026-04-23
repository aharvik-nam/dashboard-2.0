import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  REPORT_COLORS,
  CHART_GRID,
  PHOTOGRAPHER_COLORS,
  YEAR_SERIES_COLORS,
  NEUTRAL_SERIES,
  TABLE_TEXT,
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
import { Line, Bar } from 'react-chartjs-2';

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

const FARGER = PHOTOGRAPHER_COLORS;

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

export const StatistikkRapport: React.FC = () => {
  // Chart Data & Options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: CHART_GRID.tickAlpha,
          font: { size: 10 }
        },
      },
      y: {
        grid: {
          color: CHART_GRID.gridAlpha,
        },
        ticks: {
          color: CHART_GRID.tickAlpha,
          font: { size: 10 }
        },
        beginAtZero: true,
      },
    },
  };

  const volData = {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [
      { label: 'Børre Høstland',              data: [102, 126, 127, 161, 152], borderColor: FARGER['Børre Høstland'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
      { label: 'Andreas Harvik (rå)',          data: [47,  100, 87,  126, 121], borderColor: FARGER['Andreas Harvik'],  backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
      { label: 'Ina Wesenberg',                data: [42,  68,  105, 91,  122], borderColor: FARGER['Ina Wesenberg'],   backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
      { label: 'Annar Bjørgli',                data: [27,  54,  60,  132, 113], borderColor: FARGER['Annar Bjørgli'],   backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
      { label: 'Frode Larsen',                 data: [15,  58,  75,  122, 82],  borderColor: FARGER['Frode Larsen'],    backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
      { label: 'Andreas Harvik (justert 100 %)', data: [94, 200, 174, 252, 242], borderColor: FARGER['Andreas Harvik'], borderDash: [6, 4], backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
    ],
  };

  const ieData = {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [
      { label: 'Intern',   data: [246, 423, 485, 716, 634], backgroundColor: REPORT_COLORS.purple, borderRadius: 3 },
      { label: 'Bildebyrå', data: [100, 98,  102, 121, 125], backgroundColor: REPORT_COLORS.amber,  borderRadius: 3 },
    ],
  };

  return (
    <div className="stats-body">
      <header className="site-header-stats">
        <div className="max-w-[1100px] mx-auto px-8">
          <p className="header-label-stats">Seksjon foto — Nasjonalmuseet</p>
          <h1>Statistikk og<br /><em>AI-analyse</em></h1>
          <p>AI basert analyse utført av Claude: Basert på 3 327 oppdrag registrert i HubSpot. Data dekker avsluttede fotobestillinger, bildebyråbestillinger og arbeidsforhold 2021–2025.</p>
          <div className="header-stats-row">
            <div className="header-stat-item"><span className="num">3 327</span><span className="lbl">Totale oppdrag</span></div>
            <div className="header-stat-item"><span className="num">3 244</span><span className="lbl">Avsluttede</span></div>
            <div className="header-stat-item"><span className="num">5</span><span className="lbl">Faste fotografer</span></div>
            <div className="header-stat-item"><span className="num">562</span><span className="lbl">Bildebyrå-bestillinger</span></div>
          </div>
        </div>
      </header>

      <nav className="toc-stats">
        <div className="max-w-[1100px] mx-auto px-8 flex gap-4">
          <a href="#volum">Oppdragsvolum</a>
          <a href="#typer">Oppdragstyper</a>
          <a href="#leveringstid">Leveringstid</a>
          <a href="#sesong">Sesongvariasjon</a>
          <a href="#spesialisering">Spesialisering</a>
          <a href="#studioer">Studioer</a>
          <a href="#bildebyraa">Bildebyrå</a>
          <a href="#arbeidsmiljo">Arbeidsmiljø</a>
          <a href="#monotoni">Monotoni</a>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-8">
        {/* 1. OPPDRAGSVOLUM */}
        <section className="section-stats" id="volum">
          <div className="section-header-stats">
            <p className="section-label-stats">01 — Oppdragsvolum</p>
            <h2 className="section-title-stats">Vekst per fotograf, 2021–2025</h2>
            <p className="section-desc-stats">Interne fotooppdrag. Andreas Harvik jobber 50 % som fotograf og 50 % som fotoarkivar. Den stiplede linjen viser hans <strong>justerte volum (×2)</strong> — hva oppdragstallet ville vært om han jobbet 100 % som fotograf. <em>Merk:</em> 2021 var ikke fullt driftsår — museet åpnet juni 2022. Veksttall fra 2021 er misvisende som baseline.</p>
          </div>
          <div className="metric-grid-stats">
            <div className="metric-stats"><div className="label">Børre Høstland</div><div className="value">668</div><div className="sub">Ansatt siden ~2006</div></div>
            <div className="metric-stats" style={{ border: '2px solid #993C1D', borderRadius: '8px', position: 'relative' }}><div className="label">Andreas Harvik ½</div><div className="value">481</div><div className="sub">Rå · justert: <strong>962</strong> (100 %)</div></div>
            <div className="metric-stats"><div className="label">Ina Wesenberg</div><div className="value">428</div><div className="sub">Ansatt mars 2021</div></div>
            <div className="metric-stats"><div className="label">Annar Bjørgli</div><div className="value">386</div><div className="sub">Ansatt siden 2013</div></div>
            <div className="metric-stats"><div className="label">Frode Larsen</div><div className="value">352</div><div className="sub">Ansatt siden 2013</div></div>
          </div>
          <div className="note-block-stats" style={{ marginBottom: '1rem' }}>
            <strong>Andreas Harvik jobber 50 % som fotograf.</strong> 481 registrerte oppdrag tilsvarer dermed <strong>962 oppdrag</strong> i et 100 %-perspektiv — høyest i seksjonen. Den stiplede linjen i grafen viser dette justerte volumet. Sammenlignes rå-tall direkte med de andre fotografene undervurderes hans faktiske produksjonsintensitet vesentlig.
          </div>
          <div className="card-stats">
            <div className="card-title-stats">Oppdrag per fotograf per år</div>
            <div className="legend-stats">
              <span><span className="legend-dot-stats" style={{ background: FARGER['Børre Høstland'] }}></span>Børre Høstland</span>
              <span><span className="legend-dot-stats" style={{ background: FARGER['Andreas Harvik'] }}></span>Andreas Harvik (rå)</span>
              <span><span className="legend-dot-stats" style={{ background: FARGER['Ina Wesenberg'] }}></span>Ina Wesenberg</span>
              <span><span className="legend-dot-stats" style={{ background: FARGER['Annar Bjørgli'] }}></span>Annar Bjørgli</span>
              <span><span className="legend-dot-stats" style={{ background: FARGER['Frode Larsen'] }}></span>Frode Larsen</span>
              <span><span className="legend-dot-stats" style={{ background: FARGER['Andreas Harvik'], opacity: 0.5, outline: `2px dashed ${FARGER['Andreas Harvik']}`, outlineOffset: '1px' }}></span>Andreas Harvik (justert 100 %)</span>
            </div>
            <div className="h-[300px] w-full"><Line data={volData} options={commonOptions} /></div>
          </div>
          <div className="card-stats" style={{ marginTop: '1rem' }}>
            <div className="card-title-stats">Intern vs. Bildebyrå per år</div>
            <div className="legend-stats">
              <span><span className="legend-dot-stats" style={{ background: REPORT_COLORS.purple }}></span>Intern</span>
              <span><span className="legend-dot-stats" style={{ background: REPORT_COLORS.amber }}></span>Bildebyrå (ekstern)</span>
            </div>
            <div className="h-[220px] w-full"><Bar data={ieData} options={{ ...commonOptions, scales: { ...commonOptions.scales, x: { ...commonOptions.scales.x, stacked: true }, y: { ...commonOptions.scales.y, stacked: true } } }} /></div>
          </div>

          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Totalt internvolum økte fra 423 oppdrag (2022) til 716 (2024) — en vekst på 69 % med uendret antall fotografer. 
              2025 viser en nedgang til 634 oppdrag, noe som kan indikere at seksjonen nærmer seg kapasitetsgrensen. 
              <strong>Veksttallene fra 2021 som baseline er misvisende</strong> for Annar og Frode (ansatt 2013) og delvis for Andreas og Ina (begynte mars 2021 i et museum som ennå ikke hadde åpnet). 
              Reell vekst bør måles fra 2022.
            </p>
            <p className="analyse-text-stats">
              <strong>Andreas sin 50 %-stilling skjuler den reelle produksjonsintensiteten.</strong> 
              481 registrerte oppdrag gir inntrykk av lavere bidrag enn de andre — men justert for halv stillingsprosent tilsvarer dette 962 oppdrag i 100 %-ekvivalent, <em>klart høyest i seksjonen</em>. 
              I tillegg kommer 50 % stilling som fotoarkivar. 
              Volumet i reprorommet er med andre ord ikke «lavt» — det er svært høyt sett opp mot faktisk tilgjengelig fotograferingstid.
            </p>
            <ul className="tiltak-list-stats">
              <li className="warn">Andreas har høyest produksjonsintensitet i seksjonen når stillingsprosent tas i betraktning (962 ekvivalente oppdrag). Kombiner dette med monotonieksponering på 83 % — totalbelastningen i fotograferrollen bør vurderes nøye.</li>
              <li className="warn">Overvåk 2025-trenden: nedgang fra 716 til 634 oppdrag bør bekreftes eller avkreftes — er det kapasitetsgrense, endret etterspørsel eller feilregistrering?</li>
              <li className="amber">Bruk 2022 som baseline for alle fremtidige volumsammenligninger, og oppgi alltid Andreas sine tall i 100 %-ekvivalent for rettferdig sammenligning.</li>
              <li className="ok">Ina Wesenberg hadde høyest råvolum av alle i 2025 (122 oppdrag) — generalistkompetansen hennes er en strategisk ressurs.</li>
            </ul>
          </AnalyseDropdown>
        </section>
        
        {/* Further sections would follow the same pattern... */}
        {/* 2. OPPDRAGSTYPER */}
        <section className="section-stats" id="typer">
          <div className="section-header-stats">
            <p className="section-label-stats">02 — Oppdragstyper</p>
            <h2 className="section-title-stats">Hva fotograferes</h2>
            <p className="section-desc-stats">Fordeling av oppdragstyper for interne bestillinger.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-stats">
              <div className="card-title-stats">Antall oppdrag per type</div>
              <div className="h-[340px] w-full">
                <Bar 
                  data={{
                    labels: ['Kunst på papir','Maleri','Gjenstand','Objekt','Arrangement kv/helg','Annet','Presse/SoMe','Portrett','Utstillingsdok.','Butikk/marked.','Kunstverk i utstil.','Ustillingsåpning'],
                    datasets: [{ data: [384,374,262,246,159,158,103,55,43,37,35,33], backgroundColor: REPORT_COLORS.purple, borderRadius: 3 }]
                  }} 
                  options={{ ...commonOptions, indexAxis: 'y' as const }} 
                />
              </div>
            </div>
            <div className="card-stats">
              <div className="card-title-stats">Leveringstid per type — median og snitt (dager)</div>
              <div className="h-[340px] w-full">
                <Bar 
                  data={{
                    labels: ['Skanning','Maleri','Butikk/marked.','Presse/SoMe','Annet','Gjenstand','Portrett','Montering','Kunst på papir','Utstillingsdok.','Arrangement','Objekt','Ustillingsåpning'],
                    datasets: [
                      { label: 'Median', data: [6,8,9,12,15,17,20,27,29,30,36,37,52], backgroundColor: REPORT_COLORS.green,             borderRadius: 3 },
                      { label: 'Snitt',  data: [34,24,22,25,36,30,34,42,50,45,51,63,57], backgroundColor: REPORT_COLORS.purpleLight, borderRadius: 3 }
                    ]
                  }} 
                  options={{ ...commonOptions, indexAxis: 'y' as const }} 
                />
              </div>
            </div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Kunst på papir (384) og maleri (374) dominerer volumet og er de to oppdragstypene med høyest grad av monotoni. 
              Arrangement kvelds/helg er en liten men voksende kategori (159 oppdrag totalt) med direkte arbeidsmiljøkonsekvenser. 
              Kategorien «Annet» (158 oppdrag) er stor nok til å bety noe — manglende kategorisering gjør det vanskelig å analysere arbeidsbelastning og planlegge kapasitet.
            </p>
            <ul className="tiltak-list-stats">
              <li className="amber">Rydd opp i kategorien «Annet»: 158 oppdrag uten type er et statistisk hull. Gjennomgå og rekategoriser historisk, og innfør kontroll ved registrering.</li>
              <li className="warn">Arrangement kvelds/helg-kategorien må knyttes til kompensasjons- og hviletidsregister for å dokumentere lovlighet (aml. § 10-6 og § 10-8).</li>
              <li className="ok">Vurder å opprette en dedikert kategori for «Røntgen» og «3D av utstilling» — disse er spesialiserte oppgaver som bør synliggjøres som egne kompetanseområder.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 3. LEVERINGSTID */}
        <section className="section-stats" id="leveringstid">
          <div className="section-header-stats">
            <p className="section-label-stats">03 — Leveringstid</p>
            <h2 className="section-title-stats">Fra mottak til levering</h2>
            <p className="section-desc-stats">Total median 20 dager, gjennomsnitt 44 dager. Stor spredning skyldes langtidsplanlagte oppdrag (utstillingsåpning, arrangement, objekt) som bestilles i god tid — fotograferingen skjer på fastsatt dato. Dette er god planlegging, ikke forsinkelse.</p>
          </div>
          <div className="metric-grid-stats">
            <div className="metric-stats"><div className="label">Median (alle)</div><div className="value">20 d</div></div>
            <div className="metric-stats"><div className="label">Gjennomsnitt (alle)</div><div className="value">44 d</div></div>
            <div className="metric-stats"><div className="label">Raskeste type</div><div className="value">6 d</div><div className="sub">Skanning</div></div>
            <div className="metric-stats"><div className="label">Tregest type</div><div className="value">52 d</div><div className="sub">Ustillingsåpning</div></div>
          </div>
          <div className="insight-grid-stats">
            <div className="insight-stats ok"><h4>Reaktive oppdrag er raske</h4><p>Maleri (8d), butikk/marked (9d) og presse (12d) løses raskt — lite planlegging nødvendig.</p></div>
            <div className="insight-stats ok"><h4>Planlagte oppdrag — lang ledetid er forventet</h4><p>Arrangement (36d), objekt (37d) og utstillingsåpning (52d) bestilles i god tid. Fotograferingen skjer på fastsatt dato — ledetiden er planlagt, ikke forsinkelse.</p></div>
            <div className="insight-stats warn"><h4>Kunst på papir overrasker</h4><p>Median 29 dager er høyt for en spesialisert oppgave. Kan tyde på kø hos Andreas (50 % fotograf).</p></div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Median 20 dager er akseptabelt for en bred oppdragsmiks. 
              <strong>Viktig kontekst:</strong> Lang ledetid for utstillingsåpning (52 d), utstillingsdokumentasjon (30 d median), arrangement (36 d) og objekt (37 d) er <em>ikke</em> et tegn på ineffektivitet — disse bestilles planmessig i god tid fordi fotograferingen er knyttet til en fastsatt dato. Ledetiden reflekterer god planlegging, ikke kø. 
              Differansen mellom median (20 d) og gjennomsnitt (44 d) skyldes slike langtidsplanlagte oppdrag som trekker snittet opp.
              <strong>Kunst på papir (29 d median)</strong> skiller seg ut: dette er et studiooppdrag uten fastsatt hendelsesdato, og ledetiden peker dermed på en reell kapasitetsbegrensning hos Andreas, som er nesten eneansvarlig og kun jobber 50 % som fotograf.
            </p>
            <ul className="tiltak-list-stats">
              <li className="warn">Kunst på papir (29 d median): kartlegg køsituasjonen konkret. Dette er det eneste studiooppdraget der lang ledetid ikke kan forklares med forhåndsplanlegging.</li>
              <li className="ok">Utstillingsåpning, arrangement og objekt: lang ledetid er et tegn på god bestillingskultur og planlegging — ikke et problem. Viderehold og beskriv dette som innarbeidet praksis.</li>
              <li className="ok">Maleri (8 d median) og presse (12 d median) fungerer bra. Disse er eksempler på effektiv reaktiv kapasitet som kan dokumenteres som best practice.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 4. SESONG */}
        <section className="section-stats" id="sesong">
          <div className="section-header-stats">
            <p className="section-label-stats">04 — Sesongvariasjon</p>
            <h2 className="section-title-stats">Månedlig leveringsvolum</h2>
            <p className="section-desc-stats">Tydelig mønster med topp i mars og nov/jan, bunn i juli og desember.</p>
          </div>
          <div className="card-stats">
            <div className="card-title-stats">Leveringer per måned, 2022–2025</div>
            <div className="legend-stats">
              <span><span className="legend-dot-stats" style={{ background: YEAR_SERIES_COLORS['2022'] }}></span>2022</span>
              <span><span className="legend-dot-stats" style={{ background: YEAR_SERIES_COLORS['2023'] }}></span>2023</span>
              <span><span className="legend-dot-stats" style={{ background: YEAR_SERIES_COLORS['2024'] }}></span>2024</span>
              <span><span className="legend-dot-stats" style={{ background: YEAR_SERIES_COLORS['2025'] }}></span>2025</span>
            </div>
            <div className="h-[280px] w-full">
              <Line 
                data={{
                  labels: ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'],
                  datasets: [
                    { label: '2022', data: [22,23,60,21,24,14,4,73,26,57,59,23],  borderColor: YEAR_SERIES_COLORS['2022'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderWidth: 1.5 },
                    { label: '2023', data: [64,30,23,23,47,45,30,52,33,37,51,19], borderColor: YEAR_SERIES_COLORS['2023'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderWidth: 1.5 },
                    { label: '2024', data: [73,42,66,54,47,44,27,48,44,78,69,40], borderColor: YEAR_SERIES_COLORS['2024'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 },
                    { label: '2025', data: [60,81,62,54,49,33,30,39,48,37,68,29], borderColor: YEAR_SERIES_COLORS['2025'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderWidth: 2 }
                  ]
                }} 
                options={commonOptions} 
              />
            </div>
          </div>
          <div className="insight-grid-stats" style={{ marginTop: '1rem' }}>
            <div className="insight-stats"><h4>Mars er konsistent travlest</h4><p>Rekord 104 leveringer i mars 2024. Strukturell topp hvert år.</p></div>
            <div className="insight-stats ok"><h4>August er sterkere enn ventet</h4><p>Feriemåned, men høyt volum — sannsynlig innhenting av restanser.</p></div>
            <div className="insight-stats amber"><h4>Juli er lavest</h4><p>23,5 i snitt — naturlig feriedal, men 2022 hadde bare 4 leveringer.</p></div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Sesongprofilen er stabil og forutsigbar over alle fire driftsår (2022–2025). Mars is konsistent travlest — rekord 104 leveringer mars 2024. 
              Juli er naturlig lav (23,5 snitt), men august er høyere enn forventet for en feriemåned, noe som sannsynligvis reflekterer innhenting av restanser. 
              En forutsigbar sesongkurve er en operasjonell styrke: ferie- og ressursplanlegging kan optimaliseres mot kjente toppunkter.
            </p>
            <ul className="tiltak-list-stats">
              <li className="ok">Bruk den stabile sesongprofilen aktivt i ferieavvikling: koordiner at flest mulig er til stede i mars, november og januar.</li>
              <li className="amber">August-toppen er sannsynligvis restanseinnhenting — vurder om dette kan jevnes ut ved bedre løpende produksjon i juni/juli.</li>
              <li className="amber">Planlegg kapasitet eksplisitt for Q1 (januar–mars) som den mest belastede perioden hvert år.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 5. SPESIALISERING */}
        <section className="section-stats" id="spesialisering">
          <div className="section-header-stats">
            <p className="section-label-stats">05 — Spesialisering</p>
            <h2 className="section-title-stats">Hvem gjør hva</h2>
            <p className="section-desc-stats">Prosentandel av hver enkelt fotografs totale oppdrag per type. Tydelig spesialisering hos fire av fem fotografer.</p>
          </div>
          <div className="card-stats">
            <div className="card-title-stats">Type fotografering per fotograf (% av egne oppdrag)</div>
            <div className="heatmap-wrap-stats">
              <table className="heatmap-stats">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '5px 8px' }}></th>
                    <th>Børre</th><th>Andreas</th><th>Ina</th><th>Annar</th><th>Frode</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'Maleri', data: [71.3, 0.8, 0.3, 8.0, 0.3] },
                    { type: 'Kunst på papir', data: [0.8, 81.8, 5.3, 2.5, 0.7] },
                    { type: 'Gjenstand', data: [0.3, 1.3, 7.3, 4.0, 69.5] },
                    { type: 'Objekt', data: [1.3, 0.3, 1.2, 60.6, 10.9] },
                    { type: 'Arrangement', data: [7.3, 2.7, 8.5, 6.5, 8.9] },
                    { type: 'Presse/SoMe', data: [1.3, 1.6, 14.1, 4.0, 1.7] },
                    { type: 'Portrett', data: [1.3, 0.3, 10.6, 2.2, 1.3] },
                    { type: 'Butikk/marked.', data: [0.2, 0.0, 9.1, 0.6, 0.0] },
                    { type: 'Utstillingsdok.', data: [1.7, 0.5, 7.9, 1.2, 0.3] },
                    { type: 'Annet', data: [3.9, 4.8, 21.1, 5.2, 4.3] }
                  ].map((row, ri) => (
                    <tr key={ri}>
                      <td className="row-label">{row.type}</td>
                      {row.data.map((v, ci) => {
                        const t = Math.min(v / 82, 1);
                        const r = Math.round(238 - (238 - 83) * t);
                        const g = Math.round(237 - (237 - 74) * t);
                        const b = Math.round(254 - (254 - 183) * t);
                        const color = `rgb(${r},${g},${b})`;
                        const textColor = v / 82 > 0.45 ? TABLE_TEXT.darkOnLight : CHART_GRID.tickMuted;
                        return (
                          <td key={ci}>
                            <div className="hm-cell-stats" style={{ background: color, color: textColor }}>
                              {v >= 2 ? Math.round(v) + '%' : (v > 0 ? '·' : '')}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="insight-grid-stats" style={{ marginTop: '1rem' }}>
            <div className="insight-stats warn"><h4>Børre — maleri (71 %)</h4><p>Klart mest malerioppdrag. Dominerer Fotoatelier Maleri alene.</p></div>
            <div className="insight-stats warn"><h4>Andreas — kunst på papir (82 %)</h4><p>Neste all fotografering i Reprorom. Halvtidsstilling som fotograf.</p></div>
            <div className="insight-stats amber"><h4>Frode — gjenstand (70 %)</h4><p>Primæransvar for Fotoatelier Gjenstand.</p></div>
            <div className="insight-stats amber"><h4>Annar — objekt (61 %)</h4><p>Primæransvar for Fotoatelier Objekt.</p></div>
            <div className="insight-stats ok"><h4>Ina — generalist</h4><p>Bred fordeling. Ingen type over 25 %. Tar oppdrag ingen andre dekker.</p></div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Spesialiseringen er dypt innarbeidet — Børre (~2006), Annar og Frode (2013) har ti eller flere år med samme primæroppgave. 
              Dette gir høy faglig kvalitet og forutsigbar oppgavefordeling, men skaper en «single point of failure»-struktur: 
              fire av fem fotografer har én dominerende type som ingen andre behersker fullt ut. 
              Ina Wesenberg (generalist, ingen type over 25 %) er seksjonens eneste strukturelle buffer.
            </p>
            <p className="analyse-text-stats">
              En mer subtil konsekvens av den sterke spesialiseringen er at faglig kompetanse i liten grad deles på tvers av studioene. 
              Fotografer som er svært dyktige innen én disiplin har begrenset kjennskap til andre disipliners metoder, utstyr og faglige utfordringer — og omvendt. 
              Dette kan over tid svekke den kollegiale fagkulturen og gjøre det vanskeligere å ta felles faglige løft, identifisere felles utfordringer eller benytte hverandres erfaring. 
              Noe kryssopplæring — selv begrenset — ville styrket både den individuelle faglige bredden og seksjonens samlede robusthet.
            </p>
            <ul className="tiltak-list-stats">
              <li className="warn">Bygg opp kompetansedeling: minst én sekundærfotograf per oppdragstype bør kunne tre inn ved fravær. Start med reprorom og Fotoatelier Gjenstand.</li>
              <li className="amber">Vurder jevnlige faglige delingsarenaer på tvers av studioene — ikke for å endre ansvarsfordeling, men for å styrke felles metodisk forståelse og kollegial støtte.</li>
              <li className="amber">Dokumenter fotografenes spesialkompetanse formelt (teknikk, utstyr, prosesser) slik at opplæring av backup kan struktureres.</li>
              <li className="ok">Inas generalistprofil er en bevisst ressurs — ikke kanaliser henne mot én spesialisering. Hun fyller hullene de andre ikke dekker.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 6. STUDIOER */}
        <section className="section-stats" id="studioer">
          <div className="section-header-stats">
            <p className="section-label-stats">06 — Studioer og lokasjoner</p>
            <h2 className="section-title-stats">Oppdrag per studio og år</h2>
            <p className="section-desc-stats">Viser om belastning deles mellom fotografer, eller om én person bærer all last. «Nasjonalmuseet — på location» og «Ute på location» er slått sammen til én kategori — de er samme oppdragstype, bare ulikt registrert i HubSpot.</p>
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-stats)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Fotostudioer</h3>
          
          {[
            { navn: 'Fotoatelier Maleri', notat: 'Børre alene nesten hele tiden. Annar dekket opp med 32 oppdrag i rekordåret 2024.', avlastning: true, data: { 'Børre Høstland': [105, 108, 110, 122], 'Annar Bjørgli': [2, 0, 32, 4], 'Andreas Harvik': [2, 0, 1, 2] } },
            { navn: 'Reprorom', notat: 'Andreas nesten alene. Ina bidro med 12 oppdrag i 2025 — marginal avlastning på svært monotont arbeid.', avlastning: false, data: { 'Andreas Harvik': [91, 76, 117, 101], 'Ina Wesenberg': [0, 4, 1, 12], 'Børre Høstland': [3, 2, 5, 10] } },
            { navn: 'Fotoatelier Objekt', notat: 'Annar er primærfotograf. Frode avlastet tydelig i 2024 med 26 oppdrag.', avlastning: true, data: { 'Annar Bjørgli': [25, 41, 76, 73], 'Frode Larsen': [3, 10, 26, 4], 'Ina Wesenberg': [1, 1, 1, 4] } },
            { navn: 'Fotoatelier Gjenstand', notat: 'Frode dominerer fullstendig. Ina bidro i 2022 (19 stk), men har trukket seg gradvis tilbake.', avlastning: false, data: { 'Frode Larsen': [31, 48, 71, 64], 'Ina Wesenberg': [19, 8, 14, 1], 'Annar Bjørgli': [0, 1, 1, 1] } }
          ].map((s, si) => (
            <div key={si} className="studio-card-stats">
              <div className="studio-header-stats">
                <span className="studio-name-stats">{s.navn}</span>
                {s.avlastning ? <span className="badge-stats badge-ok-stats">avlastning skjer</span> : <span className="badge-stats badge-warn-stats">én fotograf bærer lasset</span>}
              </div>
              <p className="studio-note-stats">{s.notat}</p>
              <div className="studio-grid-stats">
                <div>
                  <table className="studio-table-stats">
                    <thead>
                      <tr><th></th><th>2022</th><th>2023</th><th>2024</th><th>2025</th><th>Tot.</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(s.data).map(([f, d]) => (
                        <tr key={f}>
                          <td><span className="foto-dot-stats" style={{ background: (FARGER as any)[f] || NEUTRAL_SERIES.fallback }}></span>{f.split(' ')[0]}</td>
                          {d.map((v, vi) => <td key={vi} style={{ fontWeight: v > 20 ? 600 : 400, color: v > 0 ? TABLE_TEXT.active : TABLE_TEXT.muted }}>{v || '—'}</td>)}
                          <td style={{ fontWeight: 600 }}>{d.reduce((a, b) => a + b, 0)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td>Totalt</td>
                        {[0, 1, 2, 3].map(yi => <td key={yi}>{Object.values(s.data).reduce((sum, d) => sum + (d[yi] || 0), 0) || '—'}</td>)}
                        <td>{Object.values(s.data).flat().reduce((a, b) => a + b, 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="h-[110px] w-full">
                  <Bar 
                    data={{
                      labels: ['2022', '2023', '2024', '2025'],
                      datasets: Object.entries(s.data).map(([f, d]) => ({ label: f, data: d, backgroundColor: (FARGER as any)[f] || NEUTRAL_SERIES.fallback, borderWidth: 0 }))
                    }} 
                    options={{ ...commonOptions, scales: { x: { ...commonOptions.scales.x, stacked: true }, y: { ...commonOptions.scales.y, stacked: true } } }} 
                  />
                </div>
              </div>
            </div>
          ))}

          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-stats)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '1.75rem 0 1rem' }}>På location</h3>
          <div className="studio-card-stats">
            <div className="studio-header-stats">
              <span className="studio-name-stats">Locationfotografering (Nasjonalmuseet + ute)</span>
              <span className="badge-stats badge-ok-stats">avlastning skjer</span>
            </div>
            <p className="studio-note-stats">Slått sammen: «Nasjonalmuseet — på location» og «Ute på location» er samme oppdragstype, ulikt registrert. Ina Wesenberg dominerer og vokser sterkt. Totalt volum øker hvert år — ingen reell nedgang.</p>
            <div className="studio-grid-stats">
              <div>
                <table className="studio-table-stats">
                  <thead>
                    <tr><th></th><th>2022</th><th>2023</th><th>2024</th><th>2025</th><th>Tot.</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { f: 'Ina Wesenberg', d: [14, 55, 67, 97] },
                      { f: 'Annar Bjørgli', d: [15, 15, 15, 28] },
                      { f: 'Børre Høstland', d: [11, 18, 38, 12] },
                      { f: 'Frode Larsen', d: [10, 12, 23, 10] },
                      { f: 'Andreas Harvik', d: [5, 5, 6, 12] }
                    ].map((row, ri) => (
                      <tr key={ri}>
                        <td><span className="foto-dot-stats" style={{ background: (FARGER as any)[row.f] || NEUTRAL_SERIES.fallback }}></span>{row.f.split(' ')[0]}</td>
                        {row.d.map((v, vi) => <td key={vi} style={{ fontWeight: v > 20 ? 600 : 400, color: v > 0 ? TABLE_TEXT.active : TABLE_TEXT.muted }}>{v || '—'}</td>)}
                        <td style={{ fontWeight: 600 }}>{row.d.reduce((a, b) => a + b, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="h-[110px] w-full">
                <Bar 
                  data={{
                    labels: ['2022', '2023', '2024', '2025'],
                    datasets: [
                      { label: 'Ina Wesenberg', data: [14, 55, 67, 97], backgroundColor: FARGER['Ina Wesenberg'] },
                      { label: 'Annar Bjørgli', data: [15, 15, 15, 28], backgroundColor: FARGER['Annar Bjørgli'] },
                      { label: 'Børre Høstland', data: [11, 18, 38, 12], backgroundColor: FARGER['Børre Høstland'] },
                      { label: 'Frode Larsen', data: [10, 12, 23, 10], backgroundColor: FARGER['Frode Larsen'] },
                      { label: 'Andreas Harvik', data: [5, 5, 6, 12], backgroundColor: FARGER['Andreas Harvik'] }
                    ]
                  }} 
                  options={{ ...commonOptions, scales: { x: { ...commonOptions.scales.x, stacked: true }, y: { ...commonOptions.scales.y, stacked: true } } }} 
                />
              </div>
            </div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Reproromet og Fotoatelier Gjenstand er de mest sårbare studioene: én fotograf bærer nær all last uten etablert andrelinjedekning. 
              Fotoatelier Maleri har vist at avlastning fungerer — Annars bidrag i 2024 (32 oppdrag) viser at kryssopplæring er mulig og gir resultater. 
              Locationfotografering vokser år for år (55 i 2022 → 161 i 2025) og drives primært av Ina Wesenberg — det som tidligere fremsto som nedgang i «Ute på location» skyldtes kun ulik registreringspraksis av samme oppdragstype.
              En utfordring som ikke vises i tallene er at spesialisering begrenser faglig kryssbefruktning: fotografer som primært jobber i gjenstand- og objektstudio har begrenset kjennskap til maleri- og reprorutiner, og omvendt. Dette reduserer seksjonens samlede faglige robusthet over tid.
            </p>
            <ul className="tiltak-list-stats">
              <li className="warn">Reprorom: Inas marginale bidrag i 2025 (12 oppdrag) er for lite til å utgjøre reell avlastning. Strukturert opplæring av én sekundærfotograf bør prioriteres.</li>
              <li className="warn">Fotoatelier Gjenstand: Ina har trukket seg gradvis tilbake. Kapasitetsberedskapen er svak — vurder enkel kompetanseoverføring til minst én annen fotograf.</li>
              <li className="ok">Fotoatelier Maleri er modellen: Annar avlastet med 32 oppdrag i 2024. Viderehold og formaliser denne strukturen som del av ordinær arbeidsfordeling.</li>
              <li className="amber">Locationfotografering vokser sterkt og domineres av Ina (97 oppdrag i 2025). Vurder om andre fotografer gradvis bør bygge kompetanse på denne oppdragstypen.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 7. BILDEBYRÅ */}
        <section className="section-stats" id="bildebyraa">
          <div className="section-header-stats">
            <p className="section-label-stats">07 — Bildebyrå</p>
            <h2 className="section-title-stats">Eksterne bildebestillinger</h2>
            <p className="section-desc-stats">562 bestillinger via Bildebyrået 2021–2025. Stabil strøm på ~100/år. 44 % internasjonale kunder.</p>
          </div>
          <div className="metric-grid-stats">
            <div className="metric-stats"><div className="label">Totalt bestillinger</div><div className="value">562</div></div>
            <div className="metric-stats"><div className="label">Internasjonale</div><div className="value">44 %</div><div className="sub">234 bestillinger</div></div>
            <div className="metric-stats"><div className="label">Største kunde</div><div className="value">MUNCH</div><div className="sub">13 bestillinger</div></div>
            <div className="metric-stats"><div className="label">Gjengangere</div><div className="value">52 firma</div><div className="sub">med 2+ ordre</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-stats">
              <div className="card-title-stats">Bruksområde per år</div>
              <div className="legend-stats">
                <span><span className="legend-dot-stats" style={{ background: REPORT_COLORS.purple }}></span>Museum/forskning</span>
                <span><span className="legend-dot-stats" style={{ background: REPORT_COLORS.coral }}></span>Kommersiell</span>
                <span><span className="legend-dot-stats" style={{ background: NEUTRAL_SERIES.gray }}></span>Privat</span>
              </div>
              <div className="h-[220px] w-full">
                <Line 
                  data={{
                    labels: ['2021', '2022', '2023', '2024', '2025'],
                    datasets: [
                      { label: 'Museum/forskning', data: [55,44,55,71,66], borderColor: REPORT_COLORS.purple,     backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, pointBackgroundColor: REPORT_COLORS.purple,     borderWidth: 2 },
                      { label: 'Kommersiell',       data: [30,38,36,27,40], borderColor: REPORT_COLORS.coral,      backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, pointBackgroundColor: REPORT_COLORS.coral,      borderWidth: 2 },
                      { label: 'Privat',             data: [15,16,11,23,19], borderColor: NEUTRAL_SERIES.gray,      backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderWidth: 1.5, borderDash: [4, 3] }
                    ]
                  }} 
                  options={commonOptions} 
                />
              </div>
            </div>
            <div className="card-stats">
              <div className="card-title-stats">Topp internasjonale markeder</div>
              <div className="mt-2 space-y-2">
                {[
                  { l: 'Tyskland', n: 43 }, { l: 'Danmark', n: 37 }, { l: 'USA', n: 22 }, { l: 'Sverige', n: 20 }, { l: 'Storbritannia', n: 16 }, { l: 'Frankrike', n: 16 }
                ].map((g, gi) => (
                  <div key={gi} className="grid grid-cols-[100px_1fr_30px] items-center gap-2 text-xs">
                    <span className="text-stone-500">{g.l}</span>
                    <div className="bg-[#f0ede6] rounded-sm h-2.5 overflow-hidden">
                      <div style={{ width: `${Math.round(g.n / 43 * 100)}%`, background: REPORT_COLORS.amber, height: '100%' }}></div>
                    </div>
                    <span className="font-bold text-right">{g.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="insight-grid-stats" style={{ marginTop: '1rem' }}>
            <div className="insight-stats"><h4>Museum/forskning vokser</h4><p>Fra 44 i 2022 til 71 i 2024. Det sterkeste segmentet og i klar vekst.</p></div>
            <div className="insight-stats ok"><h4>Stabilt totalt volum</h4><p>Ca. 100 bestillinger per år uten store svingninger — forutsigbar inntektskilde.</p></div>
            <div className="insight-stats amber"><h4>Mer norsk over tid</h4><p>2021–22 hadde flere utenlandske enn norske. Fra 2023 vender dette.</p></div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Bildebyrået er seksjonens mest stabile og forutsigbare leveranse: ~100 bestillinger per år uten store svingninger, 
              med museum/forskning som det klart voksende segmentet (44 i 2022 → 71 i 2024). 
              44 % internasjonale kunder gir god eksponering, og norsk andel øker fra 2023 — et tegn på økt nasjonal etterspørsel etter Nasjonalmuseet-åpningen. 
              52 gjengangerfirmaer (2+ ordre) indikerer god kundelojalitet.
            </p>
            <ul className="tiltak-list-stats">
              <li className="ok">Museum/forskning-segmentet vokser organisk — ingen spesielle tiltak nødvendig, men ressurser bør sikres for å håndtere fortsatt vekst.</li>
              <li className="amber">Kommersiell bruk varierer (27–40 per år) — vurder om prisstruktur og avtalevilkår er oppdatert for dette segmentet.</li>
              <li className="amber">Topp internasjonale markeder (Tyskland 43, Danmark 37, USA 22) kan prioriteres i aktiv markedsføring av bildebyrået.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 8. ARBEIDSMILJØ */}
        <section className="section-stats" id="arbeidsmiljo">
          <div className="section-header-stats">
            <p className="section-label-stats">08 — Arbeidsmiljø</p>
            <h2 className="section-title-stats">Reell kvelds- og helgearbeid</h2>
            <p className="section-desc-stats">Relevant for arbeidsmiljøloven § 10-8 (hviletid), § 10-10 (søndagsarbeid) og § 10-6 (overtid).</p>
          </div>
          <div className="metric-grid-stats">
            <div className="metric-stats"><div className="label">Reell helgjobbing totalt</div><div className="value">70</div><div className="sub">2022–2025</div></div>
            <div className="metric-stats"><div className="label">Reelle søndagsoppdrag</div><div className="value">31</div><div className="sub">§ 10-10 krever særlig grunn</div></div>
            <div className="metric-stats"><div className="label">Herav arrangement</div><div className="value">45</div><div className="sub">64 % av reell helgjobbing</div></div>
            <div className="metric-stats"><div className="label">Stabilt per år</div><div className="value">~15–16</div><div className="sub">Ingen klar veksttrend</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-stats">
              <div className="card-title-stats">Reell helgjobbing per fotograf — lørdag vs. søndag (2022–2025)</div>
              <div className="mt-2 space-y-2">
                {[
                  { n: 'Annar', l: 13, s: 7, t: 266 }, { n: 'Børre', l: 7, s: 7, t: 351 }, { n: 'Frode', l: 5, s: 8, t: 236 }, { n: 'Ina', l: 6, s: 5, t: 290 }, { n: 'Andreas', l: 6, s: 3, t: 283 }
                ].sort((a,b)=>(b.l+b.s)-(a.l+a.s)).map((d, di) => (
                  <div key={di} className="grid grid-cols-[80px_1fr_130px] items-center gap-2 text-xs">
                    <span className="text-stone-500">{d.n}</span>
                    <div className="flex h-3.5 rounded-sm overflow-hidden bg-[#f0ede6]">
                      <div style={{ width: `${Math.round(d.l / 20 * 100)}%`, background: REPORT_COLORS.amber }}></div>
                      <div style={{ width: `${Math.round(d.s / 20 * 100)}%`, background: REPORT_COLORS.coral }}></div>
                    </div>
                    <span className="text-stone-500">{d.l+d.s} oppdrag ({( (d.l+d.s)/d.t*100 ).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-stats">
              <div className="card-title-stats">Reell helgjobbing per år (2022–2025)</div>
              <div className="h-[180px] w-full">
                <Bar 
                  data={{
                    labels: ['2022','2023','2024','2025'],
                    datasets: [
                      { label: 'Arrangement', data: [0,15,14,16], backgroundColor: REPORT_COLORS.coral, borderRadius: 3 },
                      { label: 'Andre',        data: [15,4,3,2],  backgroundColor: REPORT_COLORS.amber, borderRadius: 3 }
                    ]
                  }} 
                  options={{ ...commonOptions, scales: { x: { ...commonOptions.scales.x, stacked: true }, y: { ...commonOptions.scales.y, stacked: true } } }} 
                />
              </div>
            </div>
          </div>
          <div className="note-block-stats">
            <strong>Om de opprinnelige tallene (115 helgeoppdrag / 46 søndager):</strong> Disse inkluderte studiooppdrag (maleri, gjenstand, objekt, kunst på papir) med helgefrist — sannsynligvis manuell registrering ved ukeslutt fremfor faktisk søndagsarbeid. Etter filtrering gjenstår 79 reelle helgeoppdrag totalt (alle år), 70 i perioden 2022–2025.
          </div>
          <div className="insight-grid-stats" style={{ marginTop: '1rem' }}>
            <div className="insight-stats amber"><h4>Arrangement dominerer</h4><p>45 av 70 reelle helgeoppdrag (64 %) er arrangement. Stabilt nivå, men må dokumenteres og kompenseres.</p></div>
            <div className="insight-stats warn"><h4>31 reelle søndager</h4><p>§ 10-10 krever særlig grunnlag. Annar (7), Børre (7), Frode (8) har flest. Bør verifiseres mot arbeidsavtale.</p></div>
            <div className="insight-stats amber"><h4>Annar mest eksponert</h4><p>20 helgeoppdrag (7,5 % av sine totale) — høyest av alle. Flest lørdager (13) og nest flest søndager (7).</p></div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Etter korrekt filtrering er bildet vesentlig mer nyansert enn opprinnelige tall tydet på. 
              Reell helgjobbing er stabil på ~15 oppdrag per år og domineres av arrangement-oppdrag — som er forventet for et aktivt museum med kvelds- og helgearrangementer. 
              <strong>Veksttallene fra original rapport (+92 % arrangement 2023→2024) gjelder totalt antall arrangement-oppdrag, ikke nødvendigvis helgejobbing</strong> — arrangement-oppdrag med helgefrist har vært stabile på 14–16 per år siden 2023. 
              Annar Bjørgli er mest eksponert med 20 reelle helgeoppdrag over perioden (7,5 % av sine totale).
            </p>
            <ul className="tiltak-list-stats">
              <li className="warn">Verifiser de 31 reelle søndagsoppdragene mot arbeidsavtale og tariffavtale (aml. § 10-10). Særlig Frode (8), Annar (7) og Børre (7).</li>
              <li className="amber">Etabler rutine for registrering av faktisk arbeidsdag — ikke bare fristdato. Dette skiller mellom planlagt helgejobb og administrativ feilregistrering.</li>
              <li className="amber">Annar Bjørgli: høyest eksponering for helgjobbing kombinert med høy spesialisering og studioavhengighet — totalbelastningen bør vurderes helhetlig.</li>
              <li className="ok">Det opprinnelige alarmsignalet om nær-dobling av søndagsoppdrag er korrigert. Nivået er håndterbart, men krever fortsatt dokumentasjon og kompensasjon.</li>
            </ul>
          </AnalyseDropdown>
        </section>

        {/* 9. MONOTONI */}
        <section className="section-stats" id="monotoni">
          <div className="section-header-stats">
            <p className="section-label-stats">09 — Monotoni og variasjon</p>
            <h2 className="section-title-stats">Ensformighet i arbeidet</h2>
            <p className="section-desc-stats">Relevant for arbeidsmiljøloven § 4-2 — krav til variasjon og selvbestemmelse.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="card-stats" style={{ borderLeft: '3px solid var(--coral)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--coral)', marginBottom: '4px' }}>Svært monotont</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-stats)' }}>Maleri og kunst på papir (repro) — repetitiv rigg</div>
            </div>
            <div className="card-stats" style={{ borderLeft: '3px solid var(--amber)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--amber)', marginBottom: '4px' }}>Moderat monotont</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-stats)' }}>Gjenstand og objekt — systematisk</div>
            </div>
            <div className="card-stats" style={{ borderLeft: '3px solid var(--teal)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal)', marginBottom: '4px' }}>Variert</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-stats)' }}>Arrangement, portrett, presse, utstilling</div>
            </div>
          </div>
          <div className="card-stats">
            <div className="card-title-stats">Monotonifordeling per fotograf</div>
            <div className="mt-2 space-y-2">
              {[
                { n: 'Børre', s: 79, m: 2, v: 19 }, { n: 'Andreas', s: 83, m: 2, v: 16 }, { n: 'Annar', s: 10, m: 65, v: 25 }, { n: 'Frode', s: 1, m: 80, v: 19 }, { n: 'Ina', s: 6, m: 9, v: 86 }
              ].map((d, di) => (
                <div key={di} className="grid grid-cols-[120px_1fr] items-center gap-2 text-xs">
                  <span className="text-stone-500">{d.n}</span>
                  <div className="flex h-[22px] rounded-sm overflow-hidden">
                    {d.s > 0 && <div style={{ width: `${d.s}%`, background: REPORT_COLORS.coral }} className="flex items-center justify-center text-[10px] text-white font-bold">{d.s > 8 ? d.s + '%' : ''}</div>}
                    {d.m > 0 && <div style={{ width: `${d.m}%`, background: REPORT_COLORS.amber }} className="flex items-center justify-center text-[10px] text-white font-bold">{d.m > 8 ? d.m + '%' : ''}</div>}
                    {d.v > 0 && <div style={{ width: `${d.v}%`, background: REPORT_COLORS.green }} className="flex items-center justify-center text-[10px] text-white font-bold">{d.v > 8 ? d.v + '%' : ''}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-stats" style={{ marginTop: '1rem' }}>
            <div className="card-title-stats">Svært monoton andel per år — maleri og repro (2023–2025)</div>
            <div className="h-[200px] w-full">
              <Line 
                data={{
                  labels: ['2023','2024','2025'],
                  datasets: [
                    { label: 'Børre (maleri)',  data: [82,70,85], borderColor: FARGER['Børre Høstland'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 5, pointBackgroundColor: FARGER['Børre Høstland'], borderWidth: 2 },
                    { label: 'Andreas (repro)', data: [83,82,80], borderColor: FARGER['Andreas Harvik'], backgroundColor: 'transparent', tension: 0.3, pointRadius: 5, pointBackgroundColor: FARGER['Andreas Harvik'], borderWidth: 2 },
                    { label: 'Annar',           data: [2,22,4],   borderColor: NEUTRAL_SERIES.mid,       backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, pointBackgroundColor: NEUTRAL_SERIES.mid,       borderWidth: 1.5, borderDash: [4,3] },
                    { label: 'Frode',           data: [0,0,2],    borderColor: NEUTRAL_SERIES.light,     backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, pointBackgroundColor: NEUTRAL_SERIES.light,     borderWidth: 1.5, borderDash: [4,3] }
                  ]
                }} 
                options={{ ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: 0, max: 100, ticks: { ...commonOptions.scales.y.ticks, callback: v => v + '%' } } } }} 
              />
            </div>
          </div>
          <AnalyseDropdown>
            <p className="analyse-text-stats">
              Monotonieksponering for Andreas og Børre er seksjonens mest alvorlige arbeidsmiljøfunn og faller direkte under aml. § 4-2 (krav til variasjon og mulighet for faglig utvikling). 
              Andreas har 83 % svært monotone oppdrag og 61 % av arbeidsukene sine inneholder <em>kun</em> reproduksjonsoppdrag. 
              For Børre er andelen 79 %, med en stabil eller svakt stigende trend (82 % i 2023 → 85 % i 2025). 
              Inas 86 % varierte profil viser at høy variasjon er mulig innen seksjonen — problemet er strukturelt, ikke iboende.
            </p>
            <p className="analyse-text-stats">
              <strong>Om selvbestemmelse og variasjon:</strong> Det er legitimt at noen fotografer trives best med én type oppgave, og retten til selvbestemmelse i eget arbeid er en verdi arbeidsmiljøloven også anerkjenner. 
              Dersom en fotograf aktivt ønsker den arbeidsfordelingen de har, endres bildet. 
              Men dersom en fotograf <em>ønsker mer variasjon</em>, plikter arbeidsgiver å legge til rette for det — da kommer § 4-2 direkte til anvendelse, og dette kan verken fravikes eller avtalefestes bort gjennom arbeidskontrakt, innarbeidet praksis eller studiostruktur. 
              I tillegg er høy spesialisering et sårbarhetsproblem uavhengig av individuelle preferanser: manglende kompetansedeling på tvers av studioene svekker seksjonens samlede faglige robusthet og gjør den avhengig av enkeltpersoner.
            </p>
            <ul className="tiltak-list-stats">
              <li className="warn">Avklar individuelt om fotografer med høy monotonieksponering ønsker mer variasjon. Hvis svaret er ja, aktiveres § 4-2 fullt ut og arbeidsgiver har plikt til å handle.</li>
              <li className="warn">Børre (maleri): Annars avlastning i 2024 (32 malerier) er et bevis på at rotasjon fungerer. Formaliser og viderehold — andelen steg igjen til 85 % i 2025 uten denne strukturen.</li>
              <li className="amber">Sørg for at spesialkompetanse dokumenteres og deles på tvers av studioene — ikke for å endre ansvarsfordelingen, men for å sikre at seksjonen ikke er sårbar ved fravær.</li>
              <li className="amber">Kartlegg hva § 4-2 konkret innebærer for stillingsbeskrivelsene, og vurder om de bør justeres i dialog med tillitsvalgte.</li>
              <li className="ok">Ina: bruk hennes generalistprofil som modell for hva variert arbeid ser ut som i seksjonen. Dokumenter og synliggjør dette internt.</li>
            </ul>
          </AnalyseDropdown>
        </section>
      </main>

      <footer className="footer-stats">
        <p>Seksjon foto — Nasjonalmuseet &nbsp;·&nbsp; Basert på HubSpot-data 2021–2025 &nbsp;·&nbsp; Generert april 2026</p>
      </footer>
    </div>
  );
};
