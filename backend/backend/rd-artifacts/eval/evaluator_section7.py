# -*- coding: utf-8 -*-
"""
Évaluateur Section 7 (CNESST, fr-CA)
- Lit le manifest JSONL (eval/validation_manifest.jsonl)
- Pour chaque cas, charge le GOLD et la SORTIE (outputs/section7/{id}.md par défaut)
- (Optionnel) exécute une commande externe pour générer la sortie si absente (RUN_CMD)
- Calcule une similarité ligne-à-ligne et applique les règles de conformité
- Écrit un rapport JSON par cas dans eval/reports/{id}.json et un sommaire console

ENV facultatifs:
  RUN_CMD="python scripts/formatter.py --in {input} --out outputs/section7/{id}.md"
  OUTPUT_DIR="outputs/section7"            # où votre agent écrit les fichiers .md
  REPORT_DIR="eval/reports"                # où écrire les rapports .json
"""

import os, re, json, subprocess, shlex, difflib
from datetime import datetime
from pathlib import Path

# --- Réglages par défaut ---
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "outputs/section7"))
REPORT_DIR = Path(os.environ.get("REPORT_DIR", "eval/reports"))
RUN_CMD = os.environ.get("RUN_CMD", "").strip()  # facultatif

# Verbes de consultation autorisés/attendus
VERBES = [
    "consulte", "rencontre", "revoit",
    "obtient un rendez-vous avec", "se présente chez"
]

# Mois FR (pour extraction des dates)
MOIS = [
    "janvier","février","mars","avril","mai","juin",
    "juillet","août","septembre","octobre","novembre","décembre"
]

REGEX_DATE = re.compile(
    r"\b([0-3]?\d(?:er)?)\s+(%s)\s+([12]\d{3})\b" % "|".join(MOIS),
    flags=re.IGNORECASE
)

# motifs critiques
REGEX_ENTREE = re.compile(
    r"^\s*(Le travailleur|La travailleuse)\s+(%s)\s+(le docteur|la docteure|le médecin|la médecin)\s+[^,]+,\s+le\s+[0-3]?\d(?:er)?\s+[A-Za-zéûàî]+?\s+[12]\d{3}\." % "|".join([re.escape(v) for v in VERBES]),
    flags=re.UNICODE
)

REGEX_PARAGRAPHE_DEBUT_DATE = re.compile(r"^\s*Le\s+[0-3]?\d", flags=re.UNICODE)
REGEX_TITRE_MEDECIN = re.compile(r"\b(le docteur|la docteure|Dr\.|Dre\.)\b", flags=re.UNICODE)
REGEX_GUILLEMETS = re.compile(r"«[\s\S]*?»", flags=re.UNICODE)
REGEX_RADIologie = re.compile(r"\b(radiographie|IRM|échographie|scan|arthro-IRM|tomodensitométrie)\b", flags=re.IGNORECASE|re.UNICODE)
REGEX_VERTEBRES_SANS_TIRET = re.compile(r"\b([CTL][0-9]{1,2})\s+(-?)\s*([LS][0-9]{1,2})\b")  # détecte "L5 S1" ou "L5- S1"
REGEX_INTERDIT_EN_PREMIER = re.compile(r"^\s*(En\s+[A-Za-zéû]+|Le\s+[0-3]?\d)", flags=re.UNICODE)

def lire_manifest(path: Path):
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)

def charger(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()

def ecrire_json(path: Path, obj: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def run_commande(cmd_template: str, case_id: str, input_path: Path, out_path: Path):
    cmd = cmd_template.format(id=case_id, input=str(input_path), output=str(out_path), out=str(out_path))
    print(f"[RUN] {cmd}")
    try:
        res = subprocess.run(shlex.split(cmd), capture_output=True, text=True, timeout=1200)
        ok = (res.returncode == 0)
        return ok, res.stdout, res.stderr
    except Exception as e:
        return False, "", str(e)

def extraire_dates_ordre(texte: str):
    dates = []
    for m in REGEX_DATE.finditer(texte):
        j, mois, an = m.groups()
        j = j.replace("er","1")
        try:
            # normaliser en datetime pour comparaison
            d = datetime.strptime(f"{j} {mois} {an}", "%d %B %Y")
            dates.append(d)
        except Exception:
            pass
    return dates

def similarite_lignes(a: str, b: str):
    # compare ligne à ligne avec ratio moyen
    la = [x.strip() for x in a.strip().splitlines() if x.strip()]
    lb = [x.strip() for x in b.strip().splitlines() if x.strip()]
    if not la and not lb:
        return 1.0
    ratios = []
    L = max(len(la), len(lb))
    for i in range(L):
        s1 = la[i] if i < len(la) else ""
        s2 = lb[i] if i < len(lb) else ""
        r = difflib.SequenceMatcher(None, s1, s2).ratio()
        ratios.append(r)
    if not ratios:
        return 0.0
    return sum(ratios) / len(ratios)

def paragraphs(texte: str):
    # paragraphes: blocs séparés par une ligne vide
    blocs = [p.strip() for p in re.split(r"\n\s*\n", texte.strip()) if p.strip()]
    return blocs

def verifier_regles(texte: str):
    issues = []

    # 1) En-tête exact
    if not texte.startswith("7. Historique de faits et évolution"):
        issues.append({"rule":"header", "ok":False, "msg":"L'en-tête exact est manquant ou mal orthographié."})
    else:
        issues.append({"rule":"header", "ok":True})

    # 2) Chaque paragraphe doit commencer par Le travailleur / La travailleuse
    pgs = paragraphs(texte)
    p_ok = True
    bad_idx = []
    for idx, p in enumerate(pgs):
        # ignorer l'éventuel bloc introductif de profession si présent? (spécifique: section 7 exige tout paragraphe commence par travailleur/travailleuse)
        if not p.startswith("Le travailleur") and not p.startswith("La travailleuse"):
            p_ok = False
            bad_idx.append(idx+1)
    issues.append({"rule":"parag_travailleur_premier", "ok":p_ok, "details":bad_idx})

    # 3) Interdire commencer par une date / "En <mois>"
    bad_date = []
    for idx, p in enumerate(pgs):
        if REGEX_INTERDIT_EN_PREMIER.search(p.splitlines()[0]):
            bad_date.append(idx+1)
    issues.append({"rule":"interdire_date_en_premier", "ok":len(bad_date)==0, "details":bad_date})

    # 4) Titre médecin présent par entrée (contrôle souple: au moins un titre détecté dans le doc)
    has_title = bool(REGEX_TITRE_MEDECIN.search(texte))
    issues.append({"rule":"titre_medecin_present", "ok":has_title})

    # 5) Citations appropriées (déclaration initiale du travailleur + rapports radiologiques verbatim)
    quotes = REGEX_GUILLEMETS.findall(texte)
    # Compter les citations non-radiologiques (devrait être 0 ou 1 - déclaration du travailleur)
    non_radio_quotes = 0
    for idx, p in enumerate(pgs):
        if "«" in p and "»" in p and not REGEX_RADIologie.search(p):
            non_radio_quotes += 1
    
    issues.append({"rule":"une_seule_citation", "ok":non_radio_quotes <= 1, "total_quotes":len(quotes), "non_radio_quotes":non_radio_quotes})

    # 6) Rapports radiologiques verbatim (tous les paragraphes radiologiques doivent contenir des citations verbatim)
    radio_paragraphs = []
    radio_with_quotes = []
    for idx, p in enumerate(pgs):
        if REGEX_RADIologie.search(p):
            radio_paragraphs.append(idx+1)
            if "«" in p and "»" in p:
                radio_with_quotes.append(idx+1)
    
    # Tous les paragraphes radiologiques doivent avoir des citations verbatim
    radio_verbatim_ok = len(radio_paragraphs) == 0 or len(radio_with_quotes) == len(radio_paragraphs)
    issues.append({"rule":"radio_verbatim_obligatoire", "ok":radio_verbatim_ok, "total_radio":len(radio_paragraphs), "with_quotes":len(radio_with_quotes), "missing_quotes":list(set(radio_paragraphs) - set(radio_with_quotes))})

    # 7) Variation des verbes (≥2 verbes distincts utilisés)
    verbes_trouves = set()
    for v in VERBES:
        if re.search(rf"\b{re.escape(v)}\b", texte):
            verbes_trouves.add(v)
    issues.append({"rule":"variation_verbes", "ok":len(verbes_trouves)>=2, "distincts":sorted(verbes_trouves)})

    # 8) Chronologie ascendante (dates non décroissantes)
    dts = extraire_dates_ordre(texte)
    chrono_ok = all(dts[i] <= dts[i+1] for i in range(len(dts)-1)) if dts else True
    issues.append({"rule":"chronologie_ascendante", "ok":chrono_ok, "nb_dates":len(dts)})

    # 9) Vertèbres: éviter formats sans tiret (ex.: L5 S1)
    bad_levels = REGEX_VERTEBRES_SANS_TIRET.findall(texte)
    issues.append({"rule":"vertebres_avec_tiret", "ok":len(bad_levels)==0, "exemples":[ " ".join(x) for x in bad_levels ][:5]})

    return issues

def scorer_conformite(issues):
    """
    Score simple: chaque règle passée vaut 1.0, manquée vaut 0.
    """
    total = len(issues)
    ok = sum(1 for it in issues if it.get("ok"))
    return ok / total if total else 0.0

def main():
    manifest_path = Path("eval/validation_manifest.jsonl")
    if not manifest_path.exists():
        raise SystemExit("Manifest introuvable: eval/validation_manifest.jsonl")

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    lignes = list(lire_manifest(manifest_path))
    resume = []

    for entry in lignes:
        cid = entry["id"]
        gold_path = Path(entry["gold_path"])
        input_path = Path(entry["input_path"])
        out_path = OUTPUT_DIR / f"{cid}.md"

        print(f"\n=== Cas: {cid} ===")
        gold = charger(gold_path)

        # Générer si absent et RUN_CMD fourni
        if not out_path.exists() and RUN_CMD:
            ok, so, se = run_commande(RUN_CMD, cid, input_path, out_path)
            if not ok:
                print(f"[ERREUR] Génération échec pour {cid}: {se}")

        # Charger sortie produite (si elle n'existe toujours pas: vide)
        produced = out_path.read_text(encoding="utf-8") if out_path.exists() else ""

        # Similarité ligne-à-ligne (par rapport au GOLD)
        sim = similarite_lignes(produced, gold)

        # Règles (appliquées à la SORTIE produite)
        issues = verifier_regles(produced)

        # Score de conformité
        rules_score = scorer_conformite(issues)

        # Rapport JSON
        rapport = {
            "id": cid,
            "output_path": str(out_path),
            "input_path": str(input_path),
            "gold_path": str(gold_path),
            "line_similarity": round(sim, 4),
            "rules_score": round(rules_score, 4),
            "issues": issues
        }
        ecrire_json(REPORT_DIR / f"{cid}.json", rapport)

        resume.append([cid, sim, rules_score, out_path.exists()])

        print(f"Similarité(lignes): {sim:.3f} | Conformité(règles): {rules_score:.3f} | Généré: {out_path.exists()}")

    # Sommaire global
    print("\n=== SOMMAIRE ===")
    for cid, sim, rs, ok in resume:
        print(f"{cid:>7} | sim={sim:.3f} | règles={rs:.3f} | fichier={'oui' if ok else 'non'}")
    print(f"\nRapports JSON écrits dans: {REPORT_DIR.resolve()}")

if __name__ == "__main__":
    main()
