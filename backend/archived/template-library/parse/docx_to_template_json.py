#!/usr/bin/env python3
"""
CNESST Template Extractor
Extracts Section 8 and 11 templates from CNESST .docx files
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import docx
from docx import Document

class CNESSTTemplateExtractor:
    def __init__(self, docs_path: str, output_path: str):
        self.docs_path = Path(docs_path)
        self.output_path = Path(output_path)
        self.templates = {
            "section7": [],
            "section8": [],
            "section11": []
        }
        
    def extract_text_from_docx(self, file_path: Path) -> str:
        """Extract text content from .docx file"""
        try:
            doc = Document(file_path)
            text = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text.append(paragraph.text.strip())
            return '\n'.join(text)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return ""
    
    def find_section_content(self, text: str, section_number: str) -> Optional[str]:
        """Find content for a specific section"""
        # Patterns to match section headers
        patterns = [
            rf"{section_number}\.\s*[A-Za-zÀ-ÿ\s]+",  # "8. Examen clinique"
            rf"Section\s*{section_number}",  # "Section 8"
            rf"{section_number}\s*[-–]\s*[A-Za-zÀ-ÿ\s]+",  # "8 - Examen clinique"
        ]
        
        lines = text.split('\n')
        section_start = None
        section_end = None
        
        # Find section start
        for i, line in enumerate(lines):
            for pattern in patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    section_start = i
                    break
            if section_start is not None:
                break
        
        if section_start is None:
            return None
        
        # Find section end (next section or end of document)
        for i in range(section_start + 1, len(lines)):
            line = lines[i].strip()
            # Check if this is the start of another section
            if re.match(r'^\d+\.', line) or re.match(r'^Section\s+\d+', line):
                section_end = i
                break
        
        if section_end is None:
            section_end = len(lines)
        
        # Extract section content
        section_lines = lines[section_start:section_end]
        return '\n'.join(section_lines)
    
    def extract_section8_templates(self, text: str, source_file: str) -> List[Dict[str, Any]]:
        """Extract Section 8 templates (Examen clinique)"""
        templates = []
        section_content = self.find_section_content(text, "8")
        
        if not section_content:
            return templates
        
        # Split into subsections based on common patterns
        subsections = self.split_section8_subsections(section_content)
        
        for i, subsection in enumerate(subsections):
            if len(subsection.strip()) < 50:  # Skip very short content
                continue
                
            template = {
                "section": "8",
                "title": f"Section 8 - {self.generate_section8_title(subsection)}",
                "content": subsection.strip(),
                "tags": self.extract_section8_tags(subsection),
                "source_file": source_file,
                "language": "fr",
                "category": "examen_clinique",
                "complexity": "medium"
            }
            templates.append(template)
        
        return templates
    
    def extract_section7_templates(self, text: str, source_file: str) -> List[Dict[str, Any]]:
        """Extract Section 7 templates (Historique de faits et évolution)"""
        templates = []
        section_content = self.find_section_content(text, "7")
        
        if not section_content:
            return templates
        
        # Split into subsections based on common patterns
        subsections = self.split_section7_subsections(section_content)
        
        for i, subsection in enumerate(subsections):
            if len(subsection.strip()) < 50:  # Skip very short content
                continue
                
            template = {
                "section": "7",
                "title": f"Section 7 - {self.generate_section7_title(subsection)}",
                "content": subsection.strip(),
                "tags": self.extract_section7_tags(subsection),
                "source_file": source_file,
                "language": "fr",
                "category": "historique_evolution",
                "complexity": "medium"
            }
            templates.append(template)
        
        return templates
    
    def extract_section11_templates(self, text: str, source_file: str) -> List[Dict[str, Any]]:
        """Extract Section 11 templates (Résumé et conclusion)"""
        templates = []
        section_content = self.find_section_content(text, "11")
        
        if not section_content:
            return templates
        
        # Split into subsections based on common patterns
        subsections = self.split_section11_subsections(section_content)
        
        for i, subsection in enumerate(subsections):
            if len(subsection.strip()) < 50:  # Skip very short content
                continue
                
            template = {
                "section": "11",
                "title": f"Section 11 - {self.generate_section11_title(subsection)}",
                "content": subsection.strip(),
                "tags": self.extract_section11_tags(subsection),
                "source_file": source_file,
                "language": "fr",
                "category": "resume_conclusion",
                "complexity": "high"
            }
            templates.append(template)
        
        return templates
    
    def split_section8_subsections(self, content: str) -> List[str]:
        """Split Section 8 content into logical subsections"""
        # Common Section 8 subsections
        subsection_patterns = [
            r"Examen clinique\s*:",
            r"Examens paracliniques\s*:",
            r"Imagerie\s*:",
            r"Diagnostic\s*:",
            r"Mobilité\s*:",
            r"Douleur\s*:",
            r"Force musculaire\s*:",
            r"Réflexes\s*:",
            r"Tests\s*:"
        ]
        
        return self.split_by_patterns(content, subsection_patterns)
    
    def split_section7_subsections(self, content: str) -> List[str]:
        """Split Section 7 content into logical subsections"""
        # Common Section 7 subsections
        subsection_patterns = [
            r"Historique de faits\s*:",
            r"Évolution\s*:",
            r"Antécédents\s*:",
            r"Circonstances\s*:",
            r"Date de l'événement\s*:",
            r"Lieu de l'événement\s*:",
            r"Description des faits\s*:",
            r"Traitements antérieurs\s*:",
            r"Consultations\s*:",
            r"Examens\s*:"
        ]
        
        return self.split_by_patterns(content, subsection_patterns)
    
    def split_section11_subsections(self, content: str) -> List[str]:
        """Split Section 11 content into logical subsections"""
        # Common Section 11 subsections
        subsection_patterns = [
            r"Résumé de l'évolution\s*:",
            r"Diagnostic\(s\) retenu\(s\)\s*:",
            r"Lien avec le travail\s*:",
            r"Pronostic et limitations\s*:",
            r"Autres remarques\s*:",
            r"Plan de traitement\s*:",
            r"Recommandations\s*:"
        ]
        
        return self.split_by_patterns(content, subsection_patterns)
    
    def split_by_patterns(self, content: str, patterns: List[str]) -> List[str]:
        """Split content by multiple patterns"""
        lines = content.split('\n')
        subsections = []
        current_subsection = []
        
        for line in lines:
            # Check if this line matches any subsection pattern
            is_subsection_start = any(re.search(pattern, line, re.IGNORECASE) for pattern in patterns)
            
            if is_subsection_start and current_subsection:
                # Save current subsection and start new one
                subsections.append('\n'.join(current_subsection))
                current_subsection = [line]
            else:
                current_subsection.append(line)
        
        # Add the last subsection
        if current_subsection:
            subsections.append('\n'.join(current_subsection))
        
        return subsections
    
    def generate_section8_title(self, content: str) -> str:
        """Generate a title for Section 8 template"""
        # Look for anatomical regions or specific findings
        anatomical_patterns = [
            r"épaule", r"genou", r"rachis", r"lombaire", r"cervical",
            r"membre supérieur", r"membre inférieur", r"colonne"
        ]
        
        for pattern in anatomical_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return f"Examen clinique - {pattern.title()}"
        
        return "Examen clinique général"
    
    def generate_section7_title(self, content: str) -> str:
        """Generate a title for Section 7 template"""
        # Look for key terms to categorize the template
        if re.search(r"historique.*faits", content, re.IGNORECASE):
            return "Historique de faits"
        elif re.search(r"évolution", content, re.IGNORECASE):
            return "Évolution de la situation"
        elif re.search(r"antécédents", content, re.IGNORECASE):
            return "Antécédents médicaux"
        elif re.search(r"circonstances", content, re.IGNORECASE):
            return "Circonstances de l'événement"
        elif re.search(r"traitements", content, re.IGNORECASE):
            return "Traitements antérieurs"
        else:
            return "Historique et évolution"
    
    def generate_section11_title(self, content: str) -> str:
        """Generate a title for Section 11 template"""
        # Look for key terms to categorize the template
        if re.search(r"résumé.*évolution", content, re.IGNORECASE):
            return "Résumé de l'évolution"
        elif re.search(r"diagnostic", content, re.IGNORECASE):
            return "Diagnostics retenus"
        elif re.search(r"lien.*travail", content, re.IGNORECASE):
            return "Lien avec le travail"
        elif re.search(r"pronostic", content, re.IGNORECASE):
            return "Pronostic et limitations"
        else:
            return "Conclusion médicale"
    
    def extract_section8_tags(self, content: str) -> List[str]:
        """Extract relevant tags for Section 8 templates"""
        tags = ["examen_clinique"]
        
        # Anatomical regions
        if re.search(r"épaule", content, re.IGNORECASE):
            tags.append("épaule")
        if re.search(r"genou", content, re.IGNORECASE):
            tags.append("genou")
        if re.search(r"rachis|lombaire|cervical", content, re.IGNORECASE):
            tags.append("rachis")
        if re.search(r"membre supérieur", content, re.IGNORECASE):
            tags.append("membre_supérieur")
        if re.search(r"membre inférieur", content, re.IGNORECASE):
            tags.append("membre_inférieur")
        
        # Examination types
        if re.search(r"imagerie|radiographie|IRM|TDM", content, re.IGNORECASE):
            tags.append("imagerie")
        if re.search(r"force musculaire", content, re.IGNORECASE):
            tags.append("force")
        if re.search(r"mobilité|amplitude", content, re.IGNORECASE):
            tags.append("mobilité")
        if re.search(r"réflexes", content, re.IGNORECASE):
            tags.append("réflexes")
        
        return tags
    
    def extract_section7_tags(self, content: str) -> List[str]:
        """Extract relevant tags for Section 7 templates"""
        tags = ["historique_evolution"]
        
        # Content types
        if re.search(r"historique.*faits", content, re.IGNORECASE):
            tags.append("historique_faits")
        if re.search(r"évolution", content, re.IGNORECASE):
            tags.append("évolution")
        if re.search(r"antécédents", content, re.IGNORECASE):
            tags.append("antécédents")
        if re.search(r"circonstances", content, re.IGNORECASE):
            tags.append("circonstances")
        if re.search(r"traitements", content, re.IGNORECASE):
            tags.append("traitements")
        if re.search(r"consultations", content, re.IGNORECASE):
            tags.append("consultations")
        if re.search(r"examens", content, re.IGNORECASE):
            tags.append("examens")
        
        # Injury types
        if re.search(r"accident", content, re.IGNORECASE):
            tags.append("accident")
        if re.search(r"blessure", content, re.IGNORECASE):
            tags.append("blessure")
        if re.search(r"traumatisme", content, re.IGNORECASE):
            tags.append("traumatisme")
        if re.search(r"douleur", content, re.IGNORECASE):
            tags.append("douleur")
        
        return tags
    
    def extract_section11_tags(self, content: str) -> List[str]:
        """Extract relevant tags for Section 11 templates"""
        tags = ["résumé_conclusion"]
        
        # Content types
        if re.search(r"résumé.*évolution", content, re.IGNORECASE):
            tags.append("évolution")
        if re.search(r"diagnostic", content, re.IGNORECASE):
            tags.append("diagnostic")
        if re.search(r"lien.*travail", content, re.IGNORECASE):
            tags.append("lien_travail")
        if re.search(r"pronostic|limitations", content, re.IGNORECASE):
            tags.append("pronostic")
        if re.search(r"consolidation", content, re.IGNORECASE):
            tags.append("consolidation")
        if re.search(r"atteinte permanente", content, re.IGNORECASE):
            tags.append("atteinte_permanente")
        
        return tags
    
    def process_all_files(self):
        """Process all .docx files in the docs directory"""
        docx_files = list(self.docs_path.glob("*.docx"))
        
        print(f"Found {len(docx_files)} .docx files to process")
        
        for file_path in docx_files:
            print(f"Processing: {file_path.name}")
            
            # Extract text from .docx
            text = self.extract_text_from_docx(file_path)
            if not text:
                continue
            
            # Extract Section 7 templates
            section7_templates = self.extract_section7_templates(text, file_path.name)
            self.templates["section7"].extend(section7_templates)
            
            # Extract Section 8 templates
            section8_templates = self.extract_section8_templates(text, file_path.name)
            self.templates["section8"].extend(section8_templates)
            
            # Extract Section 11 templates
            section11_templates = self.extract_section11_templates(text, file_path.name)
            self.templates["section11"].extend(section11_templates)
        
        print(f"Extracted {len(self.templates['section7'])} Section 7 templates")
        print(f"Extracted {len(self.templates['section8'])} Section 8 templates")
        print(f"Extracted {len(self.templates['section11'])} Section 11 templates")
    
    def save_templates(self):
        """Save templates to JSON files"""
        # Save Section 7 templates
        section7_path = self.output_path / "section7"
        section7_path.mkdir(exist_ok=True)
        
        for i, template in enumerate(self.templates["section7"]):
            filename = f"template_{i+1:03d}.json"
            filepath = section7_path / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(template, f, ensure_ascii=False, indent=2)
        
        # Save Section 8 templates
        section8_path = self.output_path / "section8"
        section8_path.mkdir(exist_ok=True)
        
        for i, template in enumerate(self.templates["section8"]):
            filename = f"template_{i+1:03d}.json"
            filepath = section8_path / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(template, f, ensure_ascii=False, indent=2)
        
        # Save Section 11 templates
        section11_path = self.output_path / "section11"
        section11_path.mkdir(exist_ok=True)
        
        for i, template in enumerate(self.templates["section11"]):
            filename = f"template_{i+1:03d}.json"
            filepath = section11_path / filename
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(template, f, ensure_ascii=False, indent=2)
        
        # Save summary
        summary = {
            "total_section7": len(self.templates["section7"]),
            "total_section8": len(self.templates["section8"]),
            "total_section11": len(self.templates["section11"]),
            "generated_at": str(Path().cwd()),
            "source_files": [str(f.name) for f in self.docs_path.glob("*.docx")]
        }
        
        with open(self.output_path / "extraction_summary.json", 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"Templates saved to {self.output_path}")

def main():
    # Paths
    docs_path = Path("../../../temp_docs/combined")
    output_path = Path("../json")
    
    # Create extractor and process files
    extractor = CNESSTTemplateExtractor(docs_path, output_path)
    extractor.process_all_files()
    extractor.save_templates()

if __name__ == "__main__":
    main()
