export const NM_ID_REGEX = /(?:NG|NMK|OK|MS|L|DEP|T|B|F|K|S|U|V|X|NAMF|NAMT)(?:[\.\-][A-Z0-9&]+)+/gi;

export const NM_PREFIXES = [
  "NG", "NMK", "OK", "MS", "L", "DEP", "T", "B", "F", "K", "S", "U", "V", "X", "NAMF", "NAMT"
];

export const HUBSPOT_SHOWN_FIELDS = [
  "dealname", "closedate", "createdate", "dealstage", "pipeline", "nm_id", "mappelink", "oppdragstype",
  "first_name", "last_name", "firma", "firma_eller_privat", "intern_eller_ekstern_bestilling",
  "email", "telefonnummer", "frist_for_fotografering", "dato_for_fotografering", "fotooppdrag_ferdig", "bestilling_klar_til_fotografering",
  "lokasjon_for_fotografering___ny", "lokasjon_for_fotografering", "gateadresse", "postnummer", "poststed", "link_til_museum__",
  "type_fotografering", "bruk_av_bilder", "levering_etter_fotografering", "dato_og_klokkeslett", "kontaktperson_pa_kommunikasjon_og_sammenheng"
];

export const TRACK_FIELD_REGEX = /^bilde_(\d+)_skal_fotograferes$/;
export const INV_NR_FIELD_REGEX = /^inventarnummer_(\d+)$/;
