# -*- coding: utf-8 -*-
"""
Robust extraction of golden cases from training/golden_cases_section7.jsonl
"""
import json
import pathlib

def extract_golden_cases():
    jsonl_path = pathlib.Path("training/golden_cases_section7.jsonl")
    output_dir = pathlib.Path("data/golden/section7")
    
    if not jsonl_path.exists():
        print(f"Error: {jsonl_path} not found")
        return
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read the entire file content
    content = jsonl_path.read_text(encoding="utf-8")
    
    # Split by lines and process each complete JSON object
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        try:
            case = json.loads(line)
            case_id = case["case_id"].lower()  # Convert CASE_A to case_A
            
            # Create gold file
            gold_path = output_dir / f"{case_id}_gold.md"
            gold_path.write_text(case["gold_text"], encoding="utf-8")
            
            # Create input file (placeholder - we'll need actual input data)
            input_path = output_dir / f"{case_id}_input.md"
            if not input_path.exists():
                # Create a placeholder input file
                input_path.write_text(f"# Input for {case_id}\n\n[Placeholder - actual input data needed]", encoding="utf-8")
            
            print(f"Created: {gold_path} and {input_path}")
            
        except json.JSONDecodeError as e:
            print(f"Error parsing line {i+1}: {e}")
            # Try to find the end of the JSON object
            if line.startswith('{"case_id":'):
                print(f"Line {i+1} starts with case_id but failed to parse")
            continue

if __name__ == "__main__":
    extract_golden_cases()
