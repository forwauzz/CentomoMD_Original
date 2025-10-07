export type CommandIntent =
  | 'section.switch' | 'paragraph.break' | 'stream.pause' | 'stream.resume'
  | 'buffer.clear' | 'doc.save' | 'doc.export' | 'undo' | 'format.medical'
  | 'format.cnesst' | 'validation' | 'custom.vocabulary' | 'template.load';

export function norm(s:string){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
}

export function detectCoreCommand(text: string, lang:'fr-CA'|'en-US'): {intent:CommandIntent; arg?:string} | null {
  const t = norm(text);
  if (t.length===0 || t.split(' ').length>6) return null; // short utterances only

  const FR = {
    paragraph: ['nouveau paragraphe','paragraphe'],
    pause:     ['pause','pause transcription'],
    resume:    ['reprendre','reprendre transcription','continuer'],
    clear:     ['effacer','vider'],
    save:      ['sauvegarder','enregistrer'],
    export:    ['export','exporter'],
    undo:      ['annuler','retour'],
    format:    ['formatage médical','formatage cnesst','format cnesst'],
    validation: ['validation','valider','vérifier'],
    vocabulary: ['vocabulaire personnalisé','vocabulaire médical'],
    template:  ['charger template','template'],
    section:   /^section\s+(\d{1,2})$/
  };
  const EN = {
    paragraph: ['new paragraph','paragraph'],
    pause:     ['pause','pause transcription'],
    resume:    ['resume','resume transcription','continue'],
    clear:     ['clear','erase'],
    save:      ['save'],
    export:    ['export'],
    undo:      ['undo','go back'],
    format:    ['medical formatting','cnesst formatting','format cnesst'],
    validation: ['validation','validate','verify'],
    vocabulary: ['custom vocabulary','medical vocabulary'],
    template:  ['load template','template'],
    section:   /^section\s+(\d{1,2})$/
  };

  const L = lang==='fr-CA'?FR:EN;
  if (L.paragraph.includes(t)) return {intent:'paragraph.break'};
  if (L.pause.includes(t))     return {intent:'stream.pause'};
  if (L.resume.includes(t))    return {intent:'stream.resume'};
  if (L.clear.includes(t))     return {intent:'buffer.clear'};
  if (L.save.includes(t))      return {intent:'doc.save'};
  if (L.export.includes(t))    return {intent:'doc.export'};
  if (L.undo.includes(t))      return {intent:'undo'};
  if (L.format.includes(t))    return {intent:'format.cnesst'};
  if (L.validation.includes(t)) return {intent:'validation'};
  if (L.vocabulary.includes(t)) return {intent:'custom.vocabulary'};
  if (L.template.includes(t))  return {intent:'template.load'};
  const m = t.match(L.section);
  if (m) return {intent:'section.switch', arg:m[1]};
  return null;
}
