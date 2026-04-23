/**
 * Slår opp et objekt i DigitaltMuseum via vår proxy
 * og returnerer URL til standardbildet i valgt dimensjon.
 *
 * @param {string} invno        Inventarnummer, f.eks. "NMK.2005.0257"
 * @param {string} ownerFilter  Solr-owner filter, f.eks. "NMK*"
 * @param {string} dimension    DMS-dimensjon, f.eks. "800x800"
 * @returns {Promise<string|null>}  Bilde-URL eller null hvis ikke funnet
 */
export async function getDigitaltMuseumImageUrl(invno: string, ownerFilter = "NMK*", dimension = "800x800"): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      invno,
      ownerFilter
    });
    
    const res = await fetch(`/api/dimu/search?${params.toString()}`);
    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    if (!data.response || data.response.numFound === 0) {
      return null;
    }

    const doc = data.response.docs[0];
    const mediaId = doc["artifact.defaultMediaIdentifier"];

    if (!mediaId) {
      return null;
    }

    return `https://mm.dimu.org/image/${mediaId}?dimension=${dimension}`;
  } catch (error) {
    console.error("Error fetching from DiMu proxy:", error);
    return null;
  }
}
