# -*- coding: utf-8 -*-
"""
Manager Review Script for Section 7 CNESST Pipeline
Reads evaluation reports and triggers manager evaluation layer
"""
import json
import openai
import os
import pathlib

# Load manager prompt and checklist
MANAGER_PROMPT = pathlib.Path("prompts/manager_section7_fr.md").read_text(encoding="utf-8")
CHECKLIST = json.loads(pathlib.Path("prompts/checklist_manager_section7.json").read_text(encoding="utf-8"))

def run_review(case_id):
    """
    Run manager review for a specific case
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
    
    # Format the prompt
    full_prompt = MANAGER_PROMPT.format(
        gold_excerpt_ou_lien=gold,
        sortie_excerpt_ou_lien=output,
        rapport_json_contenu=json.dumps(report["issues"], ensure_ascii=False, indent=2),
        section7_json_contenu=json.dumps(CHECKLIST, ensure_ascii=False, indent=2)
    )
    
    try:
        # Call OpenAI API
        completion = openai.chat.completions.create(
            model="gpt-4o",  # Using gpt-4o instead of gpt-4.1-turbo
            messages=[
                {"role": "system", "content": "Tu es un évaluateur expert en conformité médicale CNESST."},
                {"role": "user", "content": full_prompt}
            ],
            temperature=0.1
        )
        
        response = completion.choices[0].message.content
        print(f"=== Manager Review for {case_id} ===")
        print(response)
        print()
        
        return response
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

def main():
    """
    Main function - run manager review for case_A
    """
    print("🧠 Section 7 CNESST Manager Review")
    print("=" * 50)
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set")
        print("Please set your OpenAI API key before running this script")
        return
    
    # Run review for case_A
    result = run_review("case_A")
    
    if result:
        print("✅ Manager review completed successfully")
    else:
        print("❌ Manager review failed")

if __name__ == "__main__":
    main()
