import { NM_ID_REGEX } from "../constants.js";
import { NMObject, NMTitle, NMMultimedia } from "../types/nmTypes.js";

/**
 * Hjelpefunksjoner for å behandle data fra Nasjonalmuseets API
 */

/**
 * Henter ferdig formatert mål-streng fra Nasjonalmuseets API
 */
export function formatNMDimensions(data: any): string {
  return data?.publishableDimensions || data?.PublishableDimensions || "";
}

/**
 * Velger én tittel fra Nasjonalmuseets API basert på prioritering:
 * 1. "anvendt" (brukt tittel)
 * 2. "hovedtittel"
 * 3. "alternativ"
 * 4. mainTitle (fallback)
 * 5. otherTitles (fallback)
 * 6. Fallback til "Ukjent tittel"
 */
export function getPrimaryNMTitle(obj: any): string {
  if (!obj) return "Ukjent tittel";

  // Support both titles and Titles
  const titles = obj.titles || obj.Titles;

  if (Array.isArray(titles) && titles.length > 0) {
    const priorityOrder = ["anvendt", "hovedtittel", "alternativ"];
    
    const byType = (type: string) => {
      const match = titles.find(t => {
        const typeVal = t?.type?.value || t?.type;
        return typeVal && typeVal.toString().toLowerCase() === type;
      });
      return match?.value || match?.title;
    };

    for (const type of priorityOrder) {
      const v = byType(type);
      if (v) return v;
    }

    const firstWithValue = titles.find(t => t?.value || t?.title);
    if (firstWithValue) return firstWithValue.value || firstWithValue.title;
  }

  // Ny del: bruk mainTitle/otherTitles når titles mangler
  if (typeof obj.mainTitle === "string" && obj.mainTitle.trim().length > 0) {
    return obj.mainTitle.trim();
  }
  if (Array.isArray(obj.otherTitles) && obj.otherTitles.length > 0) {
    const first = obj.otherTitles.find((t: any) => typeof t === "string" && t.trim().length > 0);
    if (first) return first.trim();
  }

  // If obj is just a string
  if (typeof obj === 'string' && obj.trim().length > 0) return obj.trim();

  return "Ukjent tittel";
}

/**
 * Henter kunstnernavn fra Nasjonalmuseets API
 */
export function getNMArtist(data: any): string {
  if (!data) return "";

  // Sjekk alle mulige varianter av produksjons-feltet
  const productionsArray = data?.production || data?.productions || data?.production_events || 
                           data?.Production || data?.Productions || data?.Production_events || [];
  
  if (Array.isArray(productionsArray) && productionsArray.length > 0) {
    // Helper for å hente rollenavn som streng
    const getRoleStr = (p: any): string => {
      const role = p?.person?.role?.value || p?.role?.value || p?.person?.role || p?.role || "";
      return (typeof role === 'string' ? role : role?.value || "").toLowerCase().trim();
    };

    // Helper for å hente navn fra et produksjonsobjekt
    const getName = (p: any): string => {
      return p?.person?._resolved?.name || 
             p?._resolved?.name || 
             p?.person?.name || 
             p?.name || 
             p?.person?.FullName || 
             "";
    };

    // 1. Finn primærrolle (Kunstner, Designer, etc.)
    const primaryRoles = ["kunstner", "artist", "designer", "maker", "skaper"];
    const artistProd = productionsArray.find((p: any) => {
      const roleStr = getRoleStr(p);
      return primaryRoles.some(r => roleStr.includes(r));
    });
    
    if (artistProd) {
      const name = getName(artistProd);
      if (name) return name;
    }

    // 2. Finn sekundærrolle (Produsent, etc.)
    const secondaryRoles = ["produsent", "producer", "tilvirker", "fabrikant"];
    const producerProd = productionsArray.find((p: any) => {
      const roleStr = getRoleStr(p);
      return secondaryRoles.some(r => roleStr.includes(r));
    });

    if (producerProd) {
      const name = getName(producerProd);
      if (name) return name;
    }
    
    // 3. Fallback til første person i productions hvis ingen spesifikk rolle ble funnet
    const firstProd = productionsArray[0];
    if (firstProd) {
      const name = getName(firstProd);
      if (name) return name;
    }
  }

  // Fallback til det gamle formatet (online_collection)
  return data?.online_collection?.Production?.[0]?.PersonRefMetaData?.FullName || "";
}

/**
 * Henter objekttype/navn fra Nasjonalmuseets API
 */
export function getNMObjectName(data: any): string {
  if (data?.objectName?.value) return data.objectName.value;
  const val = data?.ObjectName || data?.objectName || data?.object_name || data?.Object_name;
  if (Array.isArray(val)) return val[0] || "";
  if (typeof val === 'string') return val;
  return "";
}

/**
 * Henter material- og teknikkbeskrivelse fra Nasjonalmuseets API
 */
export function getNMMaterialTechniqueDescription(data: any): string {
  if (data?.materialTechniqueDescription?.value) return data.materialTechniqueDescription.value;
  return data?.materialTechniqueDescription || data?.material_technique_description || 
         data?.MaterialTechniqueDescription || data?.Material_technique_description || "";
}

/**
 * Henter MaterialTechnique (råstreng) fra Nasjonalmuseets API
 */
export function getNMMaterialTechnique(data: any): string {
  const val = data?.MaterialTechnique || data?.materialTechnique || data?.material_technique;
  if (Array.isArray(val)) return val[0] || "";
  if (typeof val === 'string') return val;
  return "";
}

/**
 * Henter teknikker fra Nasjonalmuseets API
 */
export function getNMTechniques(data: any): string[] {
  const techniques = data?.techniques || data?.Techniques || data?.technique || data?.Technique;
  if (!techniques || !Array.isArray(techniques)) return [];
  return techniques
    .map((t: any) => t?.value || t?.title || (typeof t === 'string' ? t : ""))
    .filter((v: any) => !!v);
}

/**
 * Henter materialer fra Nasjonalmuseets API
 */
export function getNMMaterials(data: any): string[] {
  const materials = data?.materials || data?.Materials || data?.material || data?.Material;
  if (!materials || !Array.isArray(materials)) return [];
  return materials
    .map((m: any) => m?.value || m?.title || (typeof m === 'string' ? m : ""))
    .filter((v: any) => !!v);
}

/**
 * Normaliserer inventarnummer for API-søk.
 * Som hovedregel skal alt være store bokstaver, med unntak av NAMT-serien
 * som ofte krever små bokstaver i deler av nummeret.
 */
export function normalizeInvNr(invNr: string): string {
  if (!invNr) return "";
  
  // Fix double ampersand error (NG.K&&H -> NG.K&H)
  const trimmed = invNr.trim().replace(/&&/g, '&');
  
  // Hvis det starter med NAMT (uavhengig av case), behandler vi det som et unntak.
  // Vi antar her at brukeren ønsker å beholde casen de skrev hvis det er NAMT,
  // eller vi kan tvinge NAMT-prefixet til store og resten til små hvis det er standarden.
  // Basert på instruks: "der skal noen ganger inventarnummer skrives med små bokstaver"
  if (trimmed.toUpperCase().startsWith("NAMT")) {
    // Vi sørger for at NAMT-prefixet er store bokstaver, men lar resten være som det er
    // (eller konverterer til små hvis det er det mest vanlige for disse postene)
    return "NAMT" + trimmed.substring(4).toLowerCase();
  }
  
  // Standard: Alt til store bokstaver
  return trimmed.toUpperCase();
}

/**
 * Parser en streng med potensielt flere inventarnummer.
 * Håndterer skilletegn som komma, "og", "&", "+".
 * Støtter også områder med "TO", f.eks. "NMK.2005.0267.001.182 TO NMK.2005.0267.001.190"
 * Forsøker også å utvide forkortede nummer basert på forrige fullstendige nummer.
 */
export function parseInventoryNumbers(input: string): string[] {
  if (!input) return [];

  // Split by major separators: , ; \n & og +
  // User request: Only split on '&' if it has spaces around it (e.g. " & ")
  // If it's "K&H" it should be treated as one ID.
  const segments = input.split(/,|;| og | OG |\s+&\s+|\+|\n|\r|\//).map(s => s.trim()).filter(s => s.length > 0);
  
  const results: string[] = [];
  let lastContext: string | null = null;

  for (const segment of segments) {
    // Sjekk for bokstav-område som "OK-19648A-D" eller "OK-19648A-d"
    const letterRangeMatch = segment.match(/^([A-Z0-9.-]+)([A-Z])-([A-Z])$/i);
    if (letterRangeMatch) {
      const prefix = letterRangeMatch[1];
      const startChar = letterRangeMatch[2].toUpperCase();
      const endChar = letterRangeMatch[3].toUpperCase();
      
      const startCode = startChar.charCodeAt(0);
      const endCode = endChar.charCodeAt(0);
      
      // Sikre at det er et fornuftig område (f.eks. A-Z)
      if (startCode < endCode && endCode - startCode < 26) {
        for (let code = startCode; code <= endCode; code++) {
          const generated = normalizeInvNr(prefix + String.fromCharCode(code));
          results.push(generated);
          lastContext = generated;
        }
        continue;
      }
    }

    // Sjekk for område "TO"
    if (/\s+TO\s+/i.test(segment)) {
      const rangeParts = segment.split(/\s+TO\s+/i).map(p => p.trim());
      if (rangeParts.length === 2) {
        let start = rangeParts[0];
        let end = rangeParts[1];
        
        // Hvis start eller end mangler kontekst (punktum), prøv å bruke lastContext
        if (!start.includes('.') && lastContext) {
          const contextParts = lastContext.split('.');
          contextParts[contextParts.length - 1] = start;
          start = contextParts.join('.');
        }
        if (!end.includes('.') && lastContext) {
          const contextParts = lastContext.split('.');
          contextParts[contextParts.length - 1] = end;
          end = contextParts.join('.');
        } else if (!end.includes('.') && start.includes('.')) {
          // Hvis end mangler punktum men start har det, bruk start som kontekst for end
          const contextParts = start.split('.');
          contextParts[contextParts.length - 1] = end;
          end = contextParts.join('.');
        }

        if (start.includes('.') && end.includes('.')) {
          const startNormalized = normalizeInvNr(start);
          const endNormalized = normalizeInvNr(end);
          
          const startSegs = startNormalized.split('.');
          const endSegs = endNormalized.split('.');
          
          if (startSegs.length === endSegs.length) {
            const prefix = startSegs.slice(0, -1).join('.');
            const endPrefix = endSegs.slice(0, -1).join('.');
            
            if (prefix === endPrefix) {
              const startNum = parseInt(startSegs[startSegs.length - 1], 10);
              const endNum = parseInt(endSegs[endSegs.length - 1], 10);
              
              if (!isNaN(startNum) && !isNaN(endNum)) {
                const min = Math.min(startNum, endNum);
                const max = Math.max(startNum, endNum);
                const padding = startSegs[startSegs.length - 1].length;
                
                for (let i = min; i <= max; i++) {
                  const numStr = i.toString().padStart(padding, '0');
                  const generated = `${prefix}.${numStr}`;
                  results.push(generated);
                  lastContext = generated;
                }
                continue;
              }
            }
          }
        }
      }
    }

    // Standard logikk for enkeltnummer eller kontekst-utvidelse
    if (segment.includes('.')) {
      const normalized = normalizeInvNr(segment);
      results.push(normalized);
      lastContext = normalized;
    } else if (lastContext) {
      const contextParts = lastContext.split('.');
      if (contextParts.length > 1) {
        contextParts[contextParts.length - 1] = segment;
        const expanded = normalizeInvNr(contextParts.join('.'));
        results.push(expanded);
        lastContext = expanded; 
      } else {
        const normalized = normalizeInvNr(segment);
        results.push(normalized);
        lastContext = normalized;
      }
    } else {
      const normalized = normalizeInvNr(segment);
      results.push(normalized);
      lastContext = normalized;
    }
  }

  // Fjern duplikater
  return Array.from(new Set(results));
}

/**
 * Henter det beste bildet fra Nasjonalmuseets API basert på spesifikke kriterier:
 * 1. publishable: true
 * 2. usage: "Standard-bilde"
 * 3. thumbnail: true
 * 4. iiifUrl starter med "https://ms01.nasjonalmuseet.no"
 * 
 * Transformerer også URL-en til å be om opptil 800px bredde:
 * .../full/full/0/default.jpg -> .../full/,800/0/default.jpg
 */
export function getNMImage(data: any): string | null {
  const multimedia = data?.multimedia || data?.Multimedia || data?.media || data?.Media;
  if (!multimedia || !Array.isArray(multimedia)) return null;

  const validMedia = multimedia.find((m: any) => {
    const usage = typeof m.usage === 'string' ? m.usage : m.usage?.value;
    return (
      m.publishable === true &&
      usage === "Standard-bilde" &&
      m.iiifUrl?.startsWith("https://ms01.nasjonalmuseet.no")
    );
  });

  if (validMedia && validMedia.iiifUrl) {
    // Transform URL: replace /full/full/ with /full/pct:15/
    return validMedia.iiifUrl.replace("/full/full/", "/full/,800/");
  }

  return null;
}

/**
 * Ekstraherer unike Nasjonalmuseet-IDer fra en tekststreng.
 * Håndterer IDer som NG.M.00467, NMK.2023.0123, NAMF.1234.567 osv.
 */
export function extractNmIds(text: string): string[] {
  if (!text) return [];
  
  const matches = text.match(NM_ID_REGEX);
  if (!matches || matches.length === 0) {
    return [];
  }
  
  // Fjern duplikater og normaliser
  return Array.from(new Set(matches.map(m => normalizeInvNr(m))));
}
