import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Job } from "../types";
import { formatType, getLocationIndex, formatLocation, getJobDate, isInternJob, isExternJob } from "../utils/jobUtils";

export interface StageStat {
  id: string;
  name: string;
  internAvg: number;
  eksternAvg: number;
  diff: number;
}

export interface Bottleneck {
  type: 'intern' | 'ekstern' | 'diff';
  stageName: string;
  value: number;
}

export interface ArchiveStatsData {
  generatedAt: Timestamp;
  totalCount: number;
  thisMonth: number;
  thisYear: number;
  overFrist: number;
  innenFrist: number;
  snittDagerOverFrist: number;
  internCount: number;
  eksternCount: number;
  internOverFrist: number;
  eksternOverFrist: number;
  internSnittBehandlingstid: number;
  eksternSnittBehandlingstid: number;
  totalFakturert: number;
  snittPerOppdrag: number;
  fristHistogram: { "0-30": number; "31-90": number; "91-365": number; ">365": number };
  toppFotografer: Array<{ navn: string; count: number }>;
  toppLokasjoner: Array<{ navn: string; count: number }>;
  toppOppdragstyper: Array<{ type: string; count: number; prosent: number }>;
  arligUtvikling: Array<{ ar: number; count: number }>;
  inntektPerAr: Array<{ ar: number; totalNOK: number; antall: number }>;
  stageStats: StageStat[];
  topInternBottlenecks: Bottleneck[];
  topEksternBottlenecks: Bottleneck[];
  topDiffBottlenecks: Bottleneck[];
  internDistribution: { median: number; p90: number; min: number; max: number };
  eksternDistribution: { median: number; p90: number; min: number; max: number };
  processingTimeTrend: Array<{ month: string; internAvg: number; eksternAvg: number }>;
  stageFlow: Array<{
    stageId: string;
    stageName: string;
    internCount: number;
    eksternCount: number;
    internAvgTime: number;
    eksternAvgTime: number;
  }>;
  thresholdAlarms: Array<{
    stageId: string;
    stageName: string;
    internOverThreshold: number;
    internPercent: number;
    eksternOverThreshold: number;
    eksternPercent: number;
  }>;
  longestRunningOrders: Array<{
    id: string;
    title: string;
    stageName: string;
    days: number;
    type: 'intern' | 'ekstern';
  }>;
}

export async function fetchArchiveStats(): Promise<ArchiveStatsData | null> {
  try {
    const docRef = doc(db, "analytics_cache", "archive_stats");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ArchiveStatsData;
    }
    return null;
  } catch (error) {
    console.error("Feil ved henting av arkivstatistikk:", error);
    return null;
  }
}

export async function generateAndSaveArchiveStats(jobs: Job[]): Promise<ArchiveStatsData> {
  const PIPELINE_STAGES = [
    { id: "702524", name: "1. Mottar bestilling" },
    { id: "702525", name: "2. Sendt tilbud" },
    { id: "702526", name: "3. Aksept" },
    { id: "702527", name: "4. Planlegging" },
    { id: "702529", name: "5. Fotografering" },
    { id: "702530", name: "6. Etterarbeid" },
    { id: "702536", name: "7. Ferdigstilt" }
  ];

  const stageSumsIntern = new Map<string, number>();
  const stageCountsIntern = new Map<string, number>();
  const stageSumsEkstern = new Map<string, number>();
  const stageCountsEkstern = new Map<string, number>();

  // For threshold alarms
  const THRESHOLD_DAYS = 7;
  const stageOverThresholdIntern = new Map<string, number>();
  const stageOverThresholdEkstern = new Map<string, number>();
  const allStageOrderTimes: Array<{ id: string; title: string; stageName: string; days: number; type: 'intern' | 'ekstern' }> = [];

  // We need to calculate all the stats here
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // For trend analysis (last 12 months)
  const trendMap = new Map<string, { internSum: number; internCount: number; eksternSum: number; eksternCount: number }>();
  const last12Months: { key: string; label: string }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    last12Months.push({ key, label });
    trendMap.set(key, { internSum: 0, internCount: 0, eksternSum: 0, eksternCount: 0 });
  }

  // For distribution
  const internTimes: number[] = [];
  const eksternTimes: number[] = [];

  let totalCount = 0;
  let thisMonth = 0;
  let thisYear = 0;
  let overFrist = 0;
  let innenFrist = 0;
  let totalDagerOverFrist = 0;

  let internCount = 0;
  let eksternCount = 0;
  let internOverFrist = 0;
  let eksternOverFrist = 0;

  let totalProcessingTimeIntern = 0;
  let countProcessingTimeIntern = 0;
  let totalProcessingTimeExtern = 0;
  let countProcessingTimeExtern = 0;

  let totalFakturert = 0;
  let countFakturert = 0;

  const fristHistogram = { "0-30": 0, "31-90": 0, "91-365": 0, ">365": 0 };

  const photographerCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const yearCounts: Record<string, number> = {};
  const revenueByYear: Record<string, { amount: number; count: number }> = {};

  jobs.forEach(job => {
    const props = job.all_properties || {};
    totalCount++;

    const closedDateStr = props.closedate || props.createdate;
    if (closedDateStr) {
      const closedDate = new Date(closedDateStr);
      if (closedDate.getFullYear() === currentYear) {
        thisYear++;
        if (closedDate.getMonth() === currentMonth) {
          thisMonth++;
        }
      }
      const yearStr = closedDate.getFullYear().toString();
      yearCounts[yearStr] = (yearCounts[yearStr] || 0) + 1;
    }

    const typeFotografering = (props.type_fotografering || "").toLowerCase();
    const oppdragstype = (props.oppdragstype || "").toLowerCase();
    const title = (job.title || "").toLowerCase();
    const lokasjon = (props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "").toLowerCase();
    const amount = parseFloat(props.amount || "0");

    const isExtern = isExternJob(job);
    const isIntern = isInternJob(job);
    const isUkjent = !isIntern && !isExtern;

    // Beregn tid i stages
    PIPELINE_STAGES.forEach(stage => {
      let ms = Number(props[`hs_v2_cumulative_time_in_${stage.id}`]) || 0;
      
      // Spesialregel for Stage 5: Fotografering (702529) - bruk latest_time hvis cumulative mangler eller er mindre
      if (stage.id === "702529") {
        const latestMs = Number(props[`hs_v2_latest_time_in_${stage.id}`]) || 0;
        if (latestMs > ms) ms = latestMs;
      }

      if (ms > 0) {
        const days = ms / 86400000;
        if (isIntern) {
          stageSumsIntern.set(stage.id, (stageSumsIntern.get(stage.id) || 0) + days);
          stageCountsIntern.set(stage.id, (stageCountsIntern.get(stage.id) || 0) + 1);
          if (days > THRESHOLD_DAYS) {
            stageOverThresholdIntern.set(stage.id, (stageOverThresholdIntern.get(stage.id) || 0) + 1);
          }
          allStageOrderTimes.push({ id: job.id, title: job.title, stageName: stage.name, days, type: 'intern' });
        } else if (isExtern) {
          stageSumsEkstern.set(stage.id, (stageSumsEkstern.get(stage.id) || 0) + days);
          stageCountsEkstern.set(stage.id, (stageCountsEkstern.get(stage.id) || 0) + 1);
          if (days > THRESHOLD_DAYS) {
            stageOverThresholdEkstern.set(stage.id, (stageOverThresholdEkstern.get(stage.id) || 0) + 1);
          }
          allStageOrderTimes.push({ id: job.id, title: job.title, stageName: stage.name, days, type: 'ekstern' });
        }
      }
    });

    if (isIntern) internCount++;
    if (isExtern) eksternCount++;

    const deadlineStr = getJobDate(job);
    if (deadlineStr) {
      const deadlineDate = new Date(deadlineStr);
      const diffTime = now.getTime() - deadlineDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        overFrist++;
        totalDagerOverFrist += diffDays;
        if (isIntern) internOverFrist++;
        if (isExtern) eksternOverFrist++;

        if (diffDays <= 30) fristHistogram["0-30"]++;
        else if (diffDays <= 90) fristHistogram["31-90"]++;
        else if (diffDays <= 365) fristHistogram["91-365"]++;
        else fristHistogram[">365"]++;
      } else {
        innenFrist++;
      }
    }

    const source = props.hs_analytics_source;
    const sourceData1 = props.hs_analytics_source_data_1;
    let daysToClose = NaN;

    // Prioriter kumulativ tid i Stage 5: Fotografering (702529)
    // Konverter fra millisekunder til dager (ms / 86400000)
    const cumulativeTime5 = props.hs_v2_cumulative_time_in_702529;
    const latestTime5 = props.hs_v2_latest_time_in_702529;

    if (cumulativeTime5 && String(cumulativeTime5).trim() !== "") {
      daysToClose = parseFloat(String(cumulativeTime5)) / 86400000;
    } else if (latestTime5 && String(latestTime5).trim() !== "") {
      daysToClose = parseFloat(String(latestTime5)) / 86400000;
    } else if (props.hs_days_to_close_raw && String(props.hs_days_to_close_raw).trim() !== "") {
      // hs_days_to_close_raw er allerede i dager
      daysToClose = parseFloat(String(props.hs_days_to_close_raw));
    } else if (props.days_to_close_raw && String(props.days_to_close_raw).trim() !== "") {
      // days_to_close_raw er også i dager
      daysToClose = parseFloat(String(props.days_to_close_raw));
    } else if (props.createdate && props.closedate) {
      const createDate = new Date(props.createdate);
      const closeDate = new Date(props.closedate);
      daysToClose = (closeDate.getTime() - createDate.getTime()) / 86400000;
    }

    const isBulkImport = daysToClose === 0 && source === "OFFLINE" && sourceData1 === "IMPORT";

    if (!isNaN(daysToClose) && !isBulkImport) {
      if (isIntern) {
        totalProcessingTimeIntern += daysToClose;
        countProcessingTimeIntern++;
        internTimes.push(daysToClose);
      }
      if (isExtern) {
        totalProcessingTimeExtern += daysToClose;
        countProcessingTimeExtern++;
        eksternTimes.push(daysToClose);
      }

      // Trend analysis
      if (closedDateStr) {
        const d = new Date(closedDateStr);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const trend = trendMap.get(key);
        if (trend) {
          if (isIntern) {
            trend.internSum += daysToClose;
            trend.internCount++;
          } else if (isExtern) {
            trend.eksternSum += daysToClose;
            trend.eksternCount++;
          }
        }
      }
    }

    if (isExtern && amount > 0) {
      totalFakturert += amount;
      countFakturert++;

      if (closedDateStr) {
        const yearStr = new Date(closedDateStr).getFullYear().toString();
        if (!revenueByYear[yearStr]) revenueByYear[yearStr] = { amount: 0, count: 0 };
        revenueByYear[yearStr].amount += amount;
        revenueByYear[yearStr].count++;
      }
    }

    const owner = job.owner_names?.[0] || "Ufordelt";
    photographerCounts[owner] = (photographerCounts[owner] || 0) + 1;

    const locFormatted = formatLocation(props.lokasjon_for_fotografering___ny || props.lokasjon_for_fotografering || "Ukjent", props, job.title);
    locationCounts[locFormatted] = (locationCounts[locFormatted] || 0) + 1;

    const formattedType = formatType(props.type_fotografering || "", props, job.title);
    if (formattedType) {
      typeCounts[formattedType] = (typeCounts[formattedType] || 0) + 1;
    }
  });

  const toppFotografer = Object.entries(photographerCounts)
    .map(([navn, count]) => ({ navn, count }))
    .sort((a, b) => b.count - a.count);

  const toppLokasjoner = Object.entries(locationCounts)
    .map(([navn, count]) => ({ navn, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const toppOppdragstyper = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count, prosent: Math.round((count / totalCount) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const arligUtvikling = Object.entries(yearCounts)
    .map(([ar, count]) => ({ ar: parseInt(ar, 10), count }))
    .sort((a, b) => a.ar - b.ar);

  const inntektPerAr = Object.entries(revenueByYear)
    .map(([ar, data]) => ({ ar: parseInt(ar, 10), totalNOK: data.amount, antall: data.count }))
    .sort((a, b) => a.ar - b.ar);

  // Beregn snitt per stage
  const stageStats: StageStat[] = PIPELINE_STAGES.map(stage => {
    const internAvg = (stageSumsIntern.get(stage.id) || 0) / (stageCountsIntern.get(stage.id) || 1);
    const eksternAvg = (stageSumsEkstern.get(stage.id) || 0) / (stageCountsEkstern.get(stage.id) || 1);
    return {
      id: stage.id,
      name: stage.name,
      internAvg: Number(internAvg.toFixed(1)),
      eksternAvg: Number(eksternAvg.toFixed(1)),
      diff: Number((internAvg - eksternAvg).toFixed(1))
    };
  });

  // Flaskehals-analyse
  const topInternBottlenecks = [...stageStats]
    .sort((a, b) => b.internAvg - a.internAvg)
    .slice(0, 3)
    .map(s => ({ type: 'intern' as const, stageName: s.name, value: s.internAvg }));

  const topEksternBottlenecks = [...stageStats]
    .sort((a, b) => b.eksternAvg - a.eksternAvg)
    .slice(0, 3)
    .map(s => ({ type: 'ekstern' as const, stageName: s.name, value: s.eksternAvg }));

  const topDiffBottlenecks = [...stageStats]
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3)
    .map(s => ({ type: 'diff' as const, stageName: s.name, value: s.diff }));

  // Helper for percentiles
  const calculatePercentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  };

  const internDistribution = {
    median: calculatePercentile(internTimes, 50),
    p90: calculatePercentile(internTimes, 90),
    min: internTimes.length > 0 ? Math.min(...internTimes) : 0,
    max: internTimes.length > 0 ? Math.max(...internTimes) : 0
  };

  const eksternDistribution = {
    median: calculatePercentile(eksternTimes, 50),
    p90: calculatePercentile(eksternTimes, 90),
    min: eksternTimes.length > 0 ? Math.min(...eksternTimes) : 0,
    max: eksternTimes.length > 0 ? Math.max(...eksternTimes) : 0
  };

  const processingTimeTrend = last12Months.map(m => {
    const data = trendMap.get(m.key)!;
    return {
      month: m.label,
      internAvg: data.internCount > 0 ? Number((data.internSum / data.internCount).toFixed(1)) : 0,
      eksternAvg: data.eksternCount > 0 ? Number((data.eksternSum / data.eksternCount).toFixed(1)) : 0
    };
  });

  const stageFlow = PIPELINE_STAGES.map(stage => ({
    stageId: stage.id,
    stageName: stage.name,
    internCount: stageCountsIntern.get(stage.id) || 0,
    eksternCount: stageCountsEkstern.get(stage.id) || 0,
    internAvgTime: Number(((stageSumsIntern.get(stage.id) || 0) / (stageCountsIntern.get(stage.id) || 1)).toFixed(1)),
    eksternAvgTime: Number(((stageSumsEkstern.get(stage.id) || 0) / (stageCountsEkstern.get(stage.id) || 1)).toFixed(1))
  }));

  const thresholdAlarms = PIPELINE_STAGES.map(stage => {
    const internOver = stageOverThresholdIntern.get(stage.id) || 0;
    const eksternOver = stageOverThresholdEkstern.get(stage.id) || 0;
    const internTotal = stageCountsIntern.get(stage.id) || 1;
    const eksternTotal = stageCountsEkstern.get(stage.id) || 1;
    return {
      stageId: stage.id,
      stageName: stage.name,
      internOverThreshold: internOver,
      internPercent: Math.round((internOver / internTotal) * 100),
      eksternOverThreshold: eksternOver,
      eksternPercent: Math.round((eksternOver / eksternTotal) * 100)
    };
  });

  const longestRunningOrders = allStageOrderTimes
    .sort((a, b) => b.days - a.days)
    .slice(0, 10);

  const statsData: ArchiveStatsData = {
    generatedAt: Timestamp.now(),
    totalCount,
    thisMonth,
    thisYear,
    overFrist,
    innenFrist,
    snittDagerOverFrist: overFrist > 0 ? totalDagerOverFrist / overFrist : 0,
    internCount,
    eksternCount,
    internOverFrist,
    eksternOverFrist,
    internSnittBehandlingstid: countProcessingTimeIntern > 0 ? totalProcessingTimeIntern / countProcessingTimeIntern : 0,
    eksternSnittBehandlingstid: countProcessingTimeExtern > 0 ? totalProcessingTimeExtern / countProcessingTimeExtern : 0,
    totalFakturert,
    snittPerOppdrag: countFakturert > 0 ? totalFakturert / countFakturert : 0,
    fristHistogram,
    toppFotografer,
    toppLokasjoner,
    toppOppdragstyper,
    arligUtvikling,
    inntektPerAr,
    stageStats,
    topInternBottlenecks,
    topEksternBottlenecks,
    topDiffBottlenecks,
    internDistribution,
    eksternDistribution,
    processingTimeTrend,
    stageFlow,
    thresholdAlarms,
    longestRunningOrders
  };

  const docRef = doc(db, "analytics_cache", "archive_stats");
  await setDoc(docRef, statsData);

  return statsData;
}
