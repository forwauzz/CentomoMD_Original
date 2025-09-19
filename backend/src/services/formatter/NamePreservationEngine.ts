/**
 * Unified Name Preservation Engine for Section 7 AI Formatter
 * Provides consistent name preservation across all implementations
 */

export interface NamePreservationResult {
  success: boolean;
  preservedNames: string[];
  truncatedNames: string[];
  violations: string[];
  suggestions: string[];
}

export interface DoctorName {
  fullName: string;
  title: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  isComplete: boolean;
}

export class NamePreservationEngine {
  
  /**
   * Extract all doctor names from content with enhanced NER
   */
  static extractDoctorNames(content: string, language: 'fr' | 'en'): DoctorName[] {
    const doctorNames: DoctorName[] = [];
    
    // Simplified patterns that are more robust
    const patterns = language === 'fr' 
      ? [
          // Full names: "docteur Jean-Pierre Martin" with specialty
          /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?),\s*([^,\.]+)/gi,
          // Full names: "docteur Jean-Pierre Martin" without specialty
          /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?)(?=\s|,|\.|$)/gi,
          // Single name fallback: "docteur Harry" (incomplete)
          /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)(?=\s|,|\.|$)/gi
        ]
      : [
          // Full names: "Dr. John Smith" with specialty
          /(dr\.?|doctor)\s+([A-Z][a-z''\-]+(?:\s+[A-Z][a-z''\-]+)+?),\s*([^,\.]+)/gi,
          // Full names: "Dr. John Smith" without specialty
          /(dr\.?|doctor)\s+([A-Z][a-z''\-]+(?:\s+[A-Z][a-z''\-]+)+?)(?=\s|,|\.|$)/gi,
          // Single name fallback: "Dr. Harry" (incomplete)
          /(dr\.?|doctor)\s+([A-Z][a-z''\-]+)(?=\s|,|\.|$)/gi
        ];
    
    patterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const title = match[1]; // Preserve original casing
        const fullName = match[2];
        const specialty = match[3] || undefined;
        
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Check if this is a complete name (has first and last name)
        const isComplete = nameParts.length >= 2;
        
        // Normalize for comparison (deburr + lowercase)
        const normalizeForComparison = (str: string) => 
          str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        
        const normalizedFirstName = normalizeForComparison(firstName);
        const normalizedLastName = normalizeForComparison(lastName);
        
        // Only add if we don't already have this name or if this is a more complete version
        const existingIndex = doctorNames.findIndex(existing => 
          normalizeForComparison(existing.firstName) === normalizedFirstName && 
          normalizeForComparison(existing.lastName) === normalizedLastName
        );
        
        if (existingIndex === -1) {
          // New name, add it
          doctorNames.push({
            fullName: `${title} ${fullName}`,
            title: title.toLowerCase(), // Store lowercase for consistency
            firstName,
            lastName,
            specialty,
            isComplete
          });
        } else if (isComplete && !doctorNames[existingIndex].isComplete) {
          // Replace incomplete name with complete version
          doctorNames[existingIndex] = {
            fullName: `${title} ${fullName}`,
            title: title.toLowerCase(), // Store lowercase for consistency
            firstName,
            lastName,
            specialty,
            isComplete
          };
        }
      }
    });
    
    return doctorNames;
  }
  
  /**
   * Generate enhanced name preservation prompt section
   */
  static generateNamePreservationPrompt(language: 'fr' | 'en'): string {
    if (language === 'fr') {
      return `# 🚨 RÈGLE CRITIQUE #1 - PRÉSERVATION ABSOLUE DES NOMS DE MÉDECINS

## RÈGLE ABSOLUE - JAMAIS TRONQUER LES NOMS DE MÉDECINS
- **PRÉSERVE TOUJOURS** les noms complets avec prénom + nom de famille quand disponibles
- **FORMAT OBLIGATOIRE**: "docteur [Prénom] [Nom de famille]" (ex: "docteur Jean-Pierre Martin")
- **JAMAIS** de noms tronqués ou partiels - utilise le nom complet disponible
- **RÈGLE ABSOLUE**: Dans les documents médicaux/légaux, JAMAIS tronquer les noms professionnels
- **VALIDATION LÉGALE**: Chaque référence médicale doit inclure prénom + nom pour validité légale

## EXEMPLES CRITIQUES:
✅ CORRECT: "docteur Harry Durusso" (nom complet préservé)
❌ INCORRECT: "docteur Durusso" (prénom supprimé - INTERDIT)

✅ CORRECT: "docteur Roxanne Bouchard-Bellavance" (nom complet préservé)
❌ INCORRECT: "docteur Bouchard-Bellavance" (prénom supprimé - INTERDIT)

## GESTION DES NOMS INCOMPLETS:
- Si seul le prénom est disponible: "docteur [Prénom] (nom de famille non spécifié)"
- Si seul le nom de famille est disponible: "docteur [Nom de famille] (prénom non spécifié)"

## ⚠️ ATTENTION: Cette règle est CRITIQUE et doit être respectée à 100%`;
    } else {
      return `# 🚨 CRITICAL RULE #1 - ABSOLUTE DOCTOR NAME PRESERVATION

## ABSOLUTE RULE - NEVER TRUNCATE DOCTOR NAMES
- **PRESERVE ALWAYS** full names with first name + surname when available
- **REQUIRED FORMAT**: "Dr. [First Name] [Last Name]" (ex: "Dr. Jean-Pierre Martin")
- **NEVER** truncate or partial names - use the complete name available
- **ABSOLUTE RULE**: In medical/legal documents, NEVER truncate professional names
- **LEGAL VALIDATION**: Every medical reference must include first name + surname for legal validity

## CRITICAL EXAMPLES:
✅ CORRECT: "Dr. Harry Durusso" (full name preserved)
❌ INCORRECT: "Dr. Durusso" (first name removed - FORBIDDEN)

✅ CORRECT: "Dr. Roxanne Bouchard-Bellavance" (full name preserved)
❌ INCORRECT: "Dr. Bouchard-Bellavance" (first name removed - FORBIDDEN)

## INCOMPLETE NAME HANDLING:
- If only first name available: "Dr. [First Name] (last name not specified)"
- If only last name available: "Dr. [Last Name] (first name not specified)"

## ⚠️ WARNING: This rule is CRITICAL and must be followed 100%`;
    }
  }
  
  /**
   * Validate name preservation in formatted content
   */
  static validateNamePreservation(
    originalContent: string,
    formattedContent: string,
    language: 'fr' | 'en'
  ): NamePreservationResult {
    const originalNames = this.extractDoctorNames(originalContent, language);
    const formattedNames = this.extractDoctorNames(formattedContent, language);
    
    const violations: string[] = [];
    const suggestions: string[] = [];
    const preservedNames: string[] = [];
    const truncatedNames: string[] = [];
    
    // Check for name truncation
    originalNames.forEach(originalName => {
      if (originalName.isComplete) {
        const foundInFormatted = formattedNames.find(formattedName => 
          formattedName.firstName === originalName.firstName && 
          formattedName.lastName === originalName.lastName
        );
        
        if (foundInFormatted) {
          preservedNames.push(originalName.fullName);
        } else {
          // Check if only last name was preserved
          const lastNameOnly = formattedNames.find(formattedName => 
            formattedName.lastName === originalName.lastName && 
            formattedName.firstName === ''
          );
          
          if (lastNameOnly) {
            truncatedNames.push(originalName.fullName);
            violations.push(`CRITICAL: Doctor name truncated - "${originalName.fullName}" became "${lastNameOnly.fullName}"`);
          } else {
            violations.push(`MISSING: Doctor name "${originalName.fullName}" not found in formatted content`);
          }
        }
      }
    });
    
    // Check for new names not in original
    formattedNames.forEach(formattedName => {
      if (formattedName.isComplete) {
        const foundInOriginal = originalNames.find(originalName => 
          originalName.firstName === formattedName.firstName && 
          originalName.lastName === formattedName.lastName
        );
        
        if (!foundInOriginal) {
          suggestions.push(`New doctor name found: "${formattedName.fullName}"`);
        }
      }
    });
    
    return {
      success: violations.length === 0,
      preservedNames,
      truncatedNames,
      violations,
      suggestions
    };
  }
  
  /**
   * Restore truncated names in formatted content
   */
  static restoreTruncatedNames(
    originalContent: string,
    formattedContent: string,
    language: 'fr' | 'en'
  ): { restoredContent: string; namesRestored: number } {
    const originalNames = this.extractDoctorNames(originalContent, language);
    let restoredContent = formattedContent;
    let namesRestored = 0;
    
    // Custom accent-aware boundaries to avoid issues with apostrophes/hyphens
    const B = '(?:^|\\s)';
    const E = '(?=\\s|,|\\.|$)';
    
    originalNames.forEach(originalName => {
      if (originalName.isComplete) {
        // Escape special regex characters in the full name
        const escapedFullName = originalName.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Check if full name already exists (no need to restore)
        const fullNamePattern = new RegExp(`${B}${escapedFullName}${E}`, 'gi');
        if (fullNamePattern.test(restoredContent)) {
          console.log(`Full name already present: "${originalName.fullName}"`);
          return;
        }
        
        // Escape special regex characters for individual components
        const escapedTitle = originalName.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedLastName = originalName.lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedFirstName = originalName.firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Replacement order per original name (if isComplete):
        
        // 1. If Title + Last is present and full is absent → replace with full
        const titleLastPattern = new RegExp(`${B}${escapedTitle}\\s+${escapedLastName}${E}`, 'gi');
        if (titleLastPattern.test(restoredContent)) {
          restoredContent = restoredContent.replace(titleLastPattern, originalName.fullName);
          namesRestored++;
          console.log(`Restored truncated name: "${originalName.title} ${originalName.lastName}" → "${originalName.fullName}"`);
          return;
        }
        
        // 2. Else if Title + First is present and full is absent → replace with full
        const titleFirstPattern = new RegExp(`(le\\s+)?${escapedTitle}\\s+${escapedFirstName}${E}`, 'gi');
        if (titleFirstPattern.test(restoredContent)) {
          restoredContent = restoredContent.replace(titleFirstPattern, (match) => {
            // Check if the match includes "le " at the beginning
            const hasLe = match.toLowerCase().startsWith('le ');
            return (hasLe ? 'le ' : '') + originalName.fullName;
          });
          namesRestored++;
          console.log(`Restored incomplete name: "${originalName.title} ${originalName.firstName}" → "${originalName.fullName}"`);
          return;
        }
        
        // 3. Else if last name is multi-token, try first token of the last name (e.g., Le in Le Roux) only as narrow fallback
        if (originalName.lastName && originalName.lastName.includes(' ')) {
          const lastNameTokens = originalName.lastName.split(/\s+/);
          const firstLastNameToken = lastNameTokens[0];
          const escapedFirstLastNameToken = firstLastNameToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          const titleFirstLastNameTokenPattern = new RegExp(`${B}${escapedTitle}\\s+${escapedFirstLastNameToken}${E}`, 'gi');
          if (titleFirstLastNameTokenPattern.test(restoredContent)) {
            restoredContent = restoredContent.replace(titleFirstLastNameTokenPattern, originalName.fullName);
            namesRestored++;
            console.log(`Restored partial last name: "${originalName.title} ${firstLastNameToken}" → "${originalName.fullName}"`);
            return;
          }
        }
      }
    });
    
    return { restoredContent, namesRestored };
  }
}
