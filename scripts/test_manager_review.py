# -*- coding: utf-8 -*-
"""
Test Manager Review Script (Mock version without OpenAI API)
"""
import json
import pathlib

# Load manager prompt and checklist
MANAGER_PROMPT = pathlib.Path("prompts/manager_section7_fr.md").read_text(encoding="utf-8")
CHECKLIST = json.loads(pathlib.Path("prompts/checklist_manager_section7.json").read_text(encoding="utf-8"))

def mock_manager_review(case_id):
    """
    Mock manager review for testing (without OpenAI API)
    """
    report_path = f"eval/reports/{case_id}.json"
    
    if not pathlib.Path(report_path).exists():
        print(f"Error: Report not found: {report_path}")
        return
    
    # Load the evaluation report
    report = json.loads(pathlib.Path(report_path).read_text(encoding="utf-8"))
    
    # Load gold and output texts (truncated for prompt)
    gold = pathlib.Path(report["gold_path"]).read_text(encoding="utf-8")[:2000]
    output = pathlib.Path(report["output_path"]).read_text(encoding="utf-8")[:2000] if pathlib.Path(report["output_path"]).exists() else "[Aucune sortie générée]"
    
    print(f"=== Mock Manager Review for {case_id} ===")
    print(f"Gold text (first 200 chars): {gold[:200]}...")
    print(f"Output text: {output}")
    print(f"Rules score: {report['rules_score']}")
    print(f"Line similarity: {report['line_similarity']}")
    print()
    
    # Mock analysis based on rules
    critical_failures = []
    for issue in report["issues"]:
        if not issue.get("ok", False):
            rule_id = issue.get("rule", "unknown")
            if rule_id in ["header", "parag_travailleur_premier", "interdire_date_en_premier", "une_seule_citation", "radio_pas_de_citations", "chronologie_ascendante"]:
                critical_failures.append(rule_id)
    
    # Mock decision
    if critical_failures:
        print("<manager_verify>reject</manager_verify>")
        print("<manager_feedback>")
        print("- Problème(s) critique(s):")
        for i, failure in enumerate(critical_failures, 1):
            print(f"  {i}) Règle critique échouée: {failure}")
        print("- Actions demandées:")
        print("  1) Corriger les règles critiques échouées")
        print("  2) Régénérer la sortie avec les corrections")
        print("</manager_feedback>")
    else:
        print("<manager_verify>accept</manager_verify>")
    
    print()

def main():
    """
    Main function - test manager review for case_A
    """
    print("Section 7 CNESST Manager Review (Mock Test)")
    print("=" * 60)
    
    # Test review for case_A
    mock_manager_review("case_A")
    
    print("Mock manager review completed successfully")

if __name__ == "__main__":
    main()
