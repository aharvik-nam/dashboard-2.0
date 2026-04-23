/*
 * fieldNames.ts — single source of truth for HubSpot field names and status strings.
 *
 * Change a field name here and it updates everywhere. Avoids typos and makes
 * it easy to audit which fields the app depends on.
 */

/* ── HubSpot property keys ───────────────────────────────────────────────── */

export const FIELDS = {
  DEADLINE:       'frist_for_fotografering',
  DATETIME:       'dato_og_klokkeslett',
  LOCATION:       'lokasjon_for_fotografering___ny',
  LOCATION_ALT:   'lokasjon_for_fotografering',
  TYPE:           'type_fotografering',
  DEALSTAGE:      'dealstage',
  TAGS:           'hubspot_tags',
  TECHNIQUE:      'teknikk',
  EXTRA_INFO:     'tilleggsinformasjon_foto',
  OPPDRAGSTYPE:   'oppdragstype',
  OBJECT_SOURCE:  'hs_object_source',
  OBJECT_SOURCE_DETAIL: 'hs_object_source_detail_1',
  NUM_LINE_ITEMS: 'hs_num_of_associated_line_items',
  AMOUNT:         'amount',
} as const;

/* ── Status / label strings ──────────────────────────────────────────────── */

export const STATUS = {
  UNASSIGNED:  'Ikke Fordelt',
  DISTRIBUTION: 'fordeling',
  SOLVED:      'Løst',
} as const;

export const DEALSTAGE = {
  DISTRIBUTION:          '4',
  APPOINTMENT_SCHEDULED: 'appointmentscheduled',
} as const;
