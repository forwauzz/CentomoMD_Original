# -*- coding: utf-8 -*-
"""
Full Pipeline Testing Script for Section 7 CNESST
Creates sample outputs and tests the complete evaluation pipeline
"""
import json
import pathlib
import shutil

def create_sample_outputs():
    """
    Create sample formatted outputs for testing
    """
    output_dir = pathlib.Path("outputs/section7")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Sample formatted output for case_A (good example)
    case_a_good = """7. Historique de faits et évolution

La travailleuse consulte le docteur Vanessa Pinard St-Pierre, le 16 janvier 2024. Elle diagnostique une entorse cervicale secondaire à un traumatisme au travail et prescrit des anti-inflammatoires, de la physiothérapie et un arrêt de travail pour deux semaines, suivi de travaux légers.

La travailleuse rencontre le docteur Michel Tran, le 27 janvier 2024. Il diagnostique une entorse cervicale, entorse trapèze bilatéral et entorse du thorax. Il prescrit des radiographies cervicales et dorsales ainsi qu'une échographie des épaules. Il juge la condition clinique stable. Il prescrit de la physiothérapie et un arrêt de travail jusqu'au 24 février 2024.

La travailleuse revoit le docteur Tran, le 20 février 2024. Il juge la condition clinique détériorée et prescrit de la physiothérapie et un arrêt de travail jusqu'au 10 mars 2024.

La travailleuse obtient des radiographies de la colonne cervico-dorsale le 30 mai 2024. Elles sont interprétées par le docteur Thi Som Mai Le, radiologiste. Ce dernier constate une colonne cervicale sans discopathie et une très minime spondylose dorsale.

La travailleuse revoit le docteur Tran, le 2 juin 2024. Il juge la condition clinique stable et maintient les traitements de physiothérapie, ergothérapie, acupuncture et prescrit des assignations temporaires."""
    
    # Sample formatted output for case_B (with issues)
    case_b_bad = """7. Historique de faits et évolution

Le 19 avril 2024, le travailleur consulte le docteur Sonia Silvano. Elle diagnostique un traumatisme dorso-lombaire et à l'épaule droite. Elle prescrit des radiographies, un scan lombo-sacré et un arrêt de travail.

Une radiographie de l'épaule droite est réalisée le 19 avril 2024. Elle est interprétée par le docteur Marie-Josée Berthiaume, radiologiste. Elle constate : « Microscalcifications à l'enthèse du supra-épineux versus le petit rond au niveau de la tête humérale postérieure sur l'incidence latérale. »

Le travailleur obtient des radiographies de la colonne dorsale, colonne lombo-sacrée et bassin, le 19 avril 2024. Elles sont interprétées par le docteur Michel Dubé, radiologiste. Ce dernier constate des changements dégénératifs légers à L1-L2, modérés à L2-L3, légers à L3-L4 et L4-L5 et légers à modérés à L5 S1."""
    
    # Write sample outputs
    (output_dir / "case_A.md").write_text(case_a_good, encoding="utf-8")
    (output_dir / "case_B.md").write_text(case_b_bad, encoding="utf-8")
    
    print("Created sample outputs:")
    print("  - case_A.md (good example)")
    print("  - case_B.md (with issues)")

def run_evaluation_test():
    """
    Run the evaluation pipeline and show results
    """
    print("\nRunning evaluation pipeline...")
    
    import subprocess
    import sys
    
    try:
        result = subprocess.run([sys.executable, "eval/evaluator_section7.py"], 
                              capture_output=True, text=True, encoding="utf-8")
        
        print("=== EVALUATION RESULTS ===")
        print(result.stdout)
        
        if result.stderr:
            print("=== ERRORS ===")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running evaluation: {e}")
        return False

def run_manager_test():
    """
    Run manager review test
    """
    print("\nRunning manager review test...")
    
    import subprocess
    import sys
    
    try:
        result = subprocess.run([sys.executable, "scripts/test_manager_review.py"], 
                              capture_output=True, text=True, encoding="utf-8")
        
        print("=== MANAGER REVIEW RESULTS ===")
        print(result.stdout)
        
        if result.stderr:
            print("=== ERRORS ===")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running manager test: {e}")
        return False

def analyze_reports():
    """
    Analyze the generated reports
    """
    print("\nAnalyzing evaluation reports...")
    
    reports_dir = pathlib.Path("eval/reports")
    
    if not reports_dir.exists():
        print("No reports directory found")
        return
    
    # Analyze case_A and case_B reports
    for case_id in ["case_A", "case_B"]:
        report_path = reports_dir / f"{case_id}.json"
        
        if report_path.exists():
            report = json.loads(report_path.read_text(encoding="utf-8"))
            
            print(f"\n--- {case_id.upper()} ANALYSIS ---")
            print(f"Line Similarity: {report['line_similarity']:.3f}")
            print(f"Rules Score: {report['rules_score']:.3f}")
            print(f"File Generated: {pathlib.Path(report['output_path']).exists()}")
            
            # Show failed rules
            failed_rules = [issue for issue in report['issues'] if not issue.get('ok', False)]
            if failed_rules:
                print("Failed Rules:")
                for rule in failed_rules:
                    print(f"  - {rule['rule']}: {rule.get('msg', 'No message')}")
            else:
                print("All rules passed!")

def main():
    """
    Main testing function
    """
    print("Section 7 CNESST Pipeline - Full Testing")
    print("=" * 50)
    
    # Step 1: Create sample outputs
    create_sample_outputs()
    
    # Step 2: Run evaluation
    eval_success = run_evaluation_test()
    
    # Step 3: Run manager test
    manager_success = run_manager_test()
    
    # Step 4: Analyze reports
    analyze_reports()
    
    # Summary
    print("\n" + "=" * 50)
    print("TESTING SUMMARY")
    print("=" * 50)
    print(f"Sample Outputs: Created")
    print(f"Evaluation Pipeline: {'Success' if eval_success else 'Failed'}")
    print(f"Manager Review: {'Success' if manager_success else 'Failed'}")
    print(f"Reports Analysis: Completed")
    
    if eval_success and manager_success:
        print("\nAll tests passed! Pipeline is working correctly.")
    else:
        print("\nSome tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
