import { VERBATIM_START, VERBATIM_END } from '../../../shared/text-protection';

export function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

export type VerbatimState = { isOpen: boolean; customOpen: string|null };

const BASIC_FR_OPEN  = ['ouvrir parenthèse','ouvrir parenthese','début verbatim','debut verbatim','commencer verbatim'];
const BASIC_FR_CLOSE = ['fermer parenthèse','fermer parenthese','fin verbatim','terminer verbatim'];

const BASIC_EN_OPEN  = ['open parenthesis','start verbatim'];
const BASIC_EN_CLOSE = ['close parenthesis','end verbatim'];

const CUSTOM_FR = [
  { trigger: 'rapport radiologique', end: 'fin rapport', key: 'radiology' },
  { trigger: 'citation patient',     end: 'fin citation', key: 'quotes' },
  { trigger: 'spécifications techniques', end:'fin spécifications', key:'technical' },
  { trigger: 'résultats laboratoire', end:'fin résultats', key:'lab' },
  { trigger: 'diagnostic médical',    end:'fin diagnostic', key:'diagnosis' },
  { trigger: 'prescription exacte',   end:'fin prescription', key:'prescription' },
];

const CUSTOM_EN = [
  { trigger:'radiology report', end:'end report', key:'radiology' },
  { trigger:'patient quote',    end:'end quote',  key:'quotes' },
  { trigger:'lab results',      end:'end results', key:'lab' },
];

export function detectVerbatimCmd(text: string, lang:'fr-CA'|'en-US'){
  const t = norm(text);
  const O = lang==='fr-CA' ? BASIC_FR_OPEN : BASIC_EN_OPEN;
  const C = lang==='fr-CA' ? BASIC_FR_CLOSE: BASIC_EN_CLOSE;
  if (O.some(p=>t===norm(p))) return { kind:'open' as const };
  if (C.some(p=>t===norm(p))) return { kind:'close' as const };
  const PAIRS = lang==='fr-CA' ? CUSTOM_FR : CUSTOM_EN;
  for (const p of PAIRS) {
    if (t===norm(p.trigger)) return { kind:'customOpen' as const, key:p.key };
    if (t===norm(p.end))     return { kind:'customClose' as const, key:p.key };
  }
  return null;
}

export function wrapVerbatim(text: string, isProtected:boolean){
  return isProtected ? `${VERBATIM_START} ${text} ${VERBATIM_END}` : text;
}
