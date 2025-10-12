# -*- coding: utf-8 -*-
"""
Simple Testing Script for Section 7 CNESST Pipeline
Tests the pipeline components directly without subprocess calls
"""
import json
import pathlib

def test_evaluation_directly():
    """
    Test the evaluation logic directly
    """
    print("Testing evaluation logic directly...")
    
    # Import the evaluator functions
    import sys
    sys.path.append('eval')
    
    try:
        from evaluator_section7 import verifier_regles, similarite_lignes, scorer_conformite
        
        # Test with sample text
        sample_text = """7. Historique de faits et évolution

La travailleuse consulte le docteur Vanessa Pinard St-Pierre, le 16 janvier 2024. Elle diagnostique une entorse cervicale secondaire à un traumatisme au travail et prescrit des anti-inflammatoires, de la physiothérapie et un arrêt de travail pour deux semaines, suivi de travaux légers.

La travailleuse rencontre le docteur Michel Tran, le 27 janvier 2024. Il diagnostique une entorse cervicale, entorse trapèze bilatéral et entorse du thorax."""
        
        # Test rules verification
        issues = verifier_regles(sample_text)
        rules_score = scorer_conformite(issues)
        
        print(f"Rules Score: {rules_score:.3f}")
        print(f"Number of rules checked: {len(issues)}")
        
        # Show failed rules
        failed_rules = [issue for issue in issues if not issue.get('ok', False)]
        if failed_rules:
            print("Failed Rules:")
            for rule in failed_rules:
                print(f"  - {rule['rule']}")
        else:
            print("All rules passed!")
            
        return True
        
    except Exception as e:
        print(f"Error testing evaluation: {e}")
        return False

def test_manager_logic():
    """
    Test the manager evaluation logic
    """
    print("\nTesting manager evaluation logic...")
    
    try:
        # Load manager prompt and checklist
        manager_prompt = pathlib.Path("prompts/manager_section7_fr.md").read_text(encoding="utf-8")
        checklist = json.loads(pathlib.Path("prompts/checklist_manager_section7.json").read_text(encoding="utf-8"))
        
        print(f"Manager prompt loaded: {len(manager_prompt)} characters")
        print(f"Checklist loaded: {len(checklist['rules'])} rules")
        
        # Test prompt formatting
        test_data = {
            "gold_excerpt_ou_lien": "Sample gold text...",
            "sortie_excerpt_ou_lien": "Sample output text...",
            "rapport_json_contenu": '{"test": "data"}',
            "section7_json_contenu": json.dumps(checklist, ensure_ascii=False, indent=2)
        }
        
        formatted_prompt = manager_prompt.format(**test_data)
        print(f"Prompt formatting successful: {len(formatted_prompt)} characters")
        
        return True
        
    except Exception as e:
        print(f"Error testing manager logic: {e}")
        return False

def test_file_structure():
    """
    Test that all required files exist
    """
    print("\nTesting file structure...")
    
    required_files = [
        "eval/evaluator_section7.py",
        "eval/validation_manifest.jsonl",
        "prompts/manager_section7_fr.md",
        "prompts/checklist_manager_section7.json",
        "training/golden_cases_section7.jsonl",
        "data/golden/section7/case_a_gold.md",
        "data/golden/section7/case_b_gold.md"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not pathlib.Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("Missing files:")
        for file_path in missing_files:
            print(f"  - {file_path}")
        return False
    else:
        print("All required files present!")
        return True

def test_golden_cases():
    """
    Test that golden cases are properly loaded
    """
    print("\nTesting golden cases...")
    
    try:
        # Test manifest
        manifest_path = pathlib.Path("eval/validation_manifest.jsonl")
        with manifest_path.open("r", encoding="utf-8") as f:
            manifest_entries = [json.loads(line.strip()) for line in f if line.strip()]
        
        print(f"Manifest entries: {len(manifest_entries)}")
        
        # Test golden cases
        golden_path = pathlib.Path("training/golden_cases_section7.jsonl")
        with golden_path.open("r", encoding="utf-8") as f:
            golden_entries = [json.loads(line.strip()) for line in f if line.strip()]
        
        print(f"Golden cases: {len(golden_entries)}")
        
        # Test data directory
        data_dir = pathlib.Path("data/golden/section7")
        gold_files = list(data_dir.glob("*_gold.md"))
        print(f"Extracted gold files: {len(gold_files)}")
        
        return True
        
    except Exception as e:
        print(f"Error testing golden cases: {e}")
        return False

def main():
    """
    Main testing function
    """
    print("Section 7 CNESST Pipeline - Simple Testing")
    print("=" * 50)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Golden Cases", test_golden_cases),
        ("Evaluation Logic", test_evaluation_directly),
        ("Manager Logic", test_manager_logic)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"Test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("TESTING SUMMARY")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nPassed: {passed}/{len(results)} tests")
    
    if passed == len(results):
        print("\nAll tests passed! Pipeline is ready for use.")
    else:
        print(f"\n{len(results) - passed} tests failed. Check the output above.")

if __name__ == "__main__":
    main()
