import React, { useEffect, useState } from 'react';
import { Save, Clock, Merge, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { useUserStore } from '@/stores/userStore';
import { getSectionMeta, isSchemaDrivenEnabled } from '@/lib/formSchema';
import { CNESST_SECTIONS } from '@/lib/constants';

interface SectionFormProps {
  sectionId: string;
}

export const SectionForm: React.FC<SectionFormProps> = ({ sectionId }) => {
  // Get section metadata from schema or fallback to constants FIRST
  const sectionMeta = getSectionMeta(sectionId);
  const fallbackSection = CNESST_SECTIONS.find(s => s.id === sectionId);
  const section = sectionMeta || fallbackSection;

  // Early return if no section found - BEFORE any hooks
  if (!section) {
    return (
      <div className="p-8 text-center text-gray-500">
        Section non trouvée
      </div>
    );
  }

  // Now safe to call hooks
  const { t } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp, sections, setActiveSection, schema, setSectionSaving, setSectionError } = useCaseStore();
  const { profile } = useUserStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<'idle' | 'merging' | 'complete' | 'error'>('idle');

  // Navigation functions
  const handlePreviousSection = () => {
    if (!schema?.ui?.order) return;
    const currentIndex = schema.ui.order.indexOf(sectionId);
    if (currentIndex > 0) {
      setActiveSection(schema.ui.order[currentIndex - 1]);
    }
  };

  const handleNextSection = () => {
    if (!schema?.ui?.order) return;
    const currentIndex = schema.ui.order.indexOf(sectionId);
    if (currentIndex < schema.ui.order.length - 1) {
      setActiveSection(schema.ui.order[currentIndex + 1]);
    }
  };

  const canGoPrevious = schema?.ui?.order ? schema.ui.order.indexOf(sectionId) > 0 : false;
  const canGoNext = schema?.ui?.order ? schema.ui.order.indexOf(sectionId) < schema.ui.order.length - 1 : false;
  
  // Use section metadata for rendering
  
  const status = getSectionStatus(sectionId);
  const autosaveTimestamp = getAutosaveTimestamp(sectionId);

  // Load section data from case store when component mounts or sectionId changes
  useEffect(() => {
    const sectionData = sections.find(s => s.id === sectionId);
    if (sectionData && sectionData.data) {
      console.log(`📥 Loading data for ${sectionId}:`, sectionData.data);
      setFormData(sectionData.data);
    } else if (sectionId === 'section_b' && profile && !formData.lastName) {
      // Initialize Section B with profile data if no existing data
      const profileName = profile.display_name || '';
      const nameParts = profileName.split(' ');
      setFormData({
        lastName: nameParts[0] || 'CENTOMO',
        firstName: nameParts[1] || 'Hugo',
        license: '1-18154',
        address: '5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3',
        phone: '514-331-1400',
        email: 'adjointe.orthopedie@gmail.com'
      });
    }
  }, [sectionId, sections, profile]);

  // Watch for changes in section data (e.g., when saved from dictation interface)
  useEffect(() => {
    const sectionData = sections.find(s => s.id === sectionId);
    if (sectionData && sectionData.data) {
      // Only update if the data has actually changed to avoid unnecessary re-renders
      const hasChanges = Object.keys(sectionData.data).some(
        key => sectionData.data[key] !== formData[key]
      );
      if (hasChanges) {
        console.log(`🔄 Updating form data for ${sectionId}:`, sectionData.data);
        setFormData(sectionData.data);
      }
    }
  }, [sections, sectionId, formData]);

  // Auto-save effect with database persistence
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (Object.keys(formData).length > 0) {
        try {
          setSectionSaving(sectionId, true);
          setSectionError(sectionId, false);
          
          // Update local state first
          updateSection(sectionId, formData);
          
          // Get current case context for database save
          const { currentCase, updateNewCaseSection } = useCaseStore.getState();
          
          // If we have a case with proper ID, save to database
          if (currentCase?.id) {
            await updateNewCaseSection(currentCase.id, sectionId, formData, 'in_progress');
            console.log('✅ Auto-saved section to database:', sectionId);
          }
          
          setLastSaved(new Date().toLocaleTimeString());
        } catch (error) {
          console.error('❌ Failed to auto-save section:', error);
          setSectionError(sectionId, true);
          // Still update local state even if database save fails
          updateSection(sectionId, formData);
          setLastSaved(new Date().toLocaleTimeString());
        } finally {
          setSectionSaving(sectionId, false);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, sectionId, updateSection, setSectionSaving, setSectionError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSectionSaving(sectionId, true);
      setSectionError(sectionId, false);
      
      // Update local state first
      updateSection(sectionId, formData);

      // Get current case context for database save
      const { currentCase } = useCaseStore.getState();

      // If we have a case with proper ID, save to database
      if (currentCase?.id) {
        const { updateNewCaseSection } = useCaseStore.getState();
        await updateNewCaseSection(currentCase.id, sectionId, formData, 'in_progress');
        console.log('✅ Section saved to database:', sectionId);
      }

      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Failed to save section:', error);
      setSectionError(sectionId, true);
      // Still update local state even if database save fails
      updateSection(sectionId, formData);
      setLastSaved(new Date().toLocaleTimeString());
    } finally {
      setSectionSaving(sectionId, false);
    }
  };

  const handleMergeSections = async () => {
    const mainContent = formData.mainContent || '';
    const patientVerbatim = formData.patientVerbatim || '';
    const radiologistVerbatim = formData.radiologistVerbatim || '';

    if (!mainContent && !patientVerbatim && !radiologistVerbatim) {
      console.warn('No content to merge');
      return;
    }

    setIsMerging(true);
    setMergeStatus('merging');

    try {
      // TODO: Implement AI formatting logic here
      // For now, we'll do a simple concatenation
      const mergedContent = [
        mainContent,
        patientVerbatim ? `\n\nPatient: ${patientVerbatim}` : '',
        radiologistVerbatim ? `\n\nRadiologist: ${radiologistVerbatim}` : ''
      ].filter(Boolean).join('');

      // Update the main content with merged result
      setFormData(prev => ({
        ...prev,
        mainContent: mergedContent
      }));

      setMergeStatus('complete');
      
      // Auto-save the merged content
      updateSection(sectionId, {
        ...formData,
        mainContent: mergedContent
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setMergeStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error merging sections:', error);
      setMergeStatus('error');
    } finally {
      setIsMerging(false);
    }
  };

  // Render section-specific fields based on schema
  const renderSectionFields = () => {
    if (!isSchemaDrivenEnabled() || !sectionMeta) {
      // Fallback to existing rendering logic
      return renderFallbackFields();
    }

    // Render specific fields based on section type
    switch (sectionId) {
      case 'section_a':
        return renderSectionA();
      case 'section_b':
        return renderSectionB();
      case 'section_c_mandat':
        return renderSectionCMandat();
      case 'section_c_diagnostics':
        return renderSectionCDiagnostics();
      case 'section_c_modalite':
        return renderSectionCModalite();
      case 'section_4_identification':
        return renderSection4();
      case 'section_5_antecedents':
        return renderSection5();
      case 'section_6_medication':
        return renderSection6();
      case 'section_7':
        return renderSection7();
      case 'section_8':
        return renderSection8();
      case 'section_9':
        return renderSection9();
      case 'section_10':
        return renderSection10();
      case 'section_11':
        return renderSection11();
      case 'section_12':
        return renderSection12();
      case 'section_15':
        return renderSection15();
      default:
        return renderFallbackFields();
    }
  };

  // Section-specific renderers
  const renderSectionA = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">A. Renseignements sur le travailleur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workerFileNo">Numéro de dossier du travailleur</Label>
            <Input
              id="workerFileNo"
              value={formData.workerFileNo || ''}
              onChange={(e) => handleInputChange('workerFileNo', e.target.value)}
              placeholder="Entrez le numéro de dossier"
            />
          </div>
                     <div>
            <Label htmlFor="initialIncidentDate">Date de l'incident initial</Label>
            <Input
              id="initialIncidentDate"
              type="date"
              value={formData.initialIncidentDate || ''}
              onChange={(e) => handleInputChange('initialIncidentDate', e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="recurrenceDate">Date de récurrence (si applicable)</Label>
          <Input
            id="recurrenceDate"
            type="date"
            value={formData.recurrenceDate || ''}
            onChange={(e) => handleInputChange('recurrenceDate', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSectionB = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">B. Renseignements sur le médecin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Nom de famille"
            />
          </div>
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Prénom"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="license">No permis</Label>
            <Input
              id="license"
              value={formData.license || ''}
              onChange={(e) => handleInputChange('license', e.target.value)}
              placeholder="Numéro de permis"
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Numéro de téléphone"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Adresse complète"
          />
        </div>
        <div>
          <Label htmlFor="email">Courriel</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Courriel professionnel"
          />
          <p className="text-xs text-gray-500 mt-1">
            Courriel professionnel (différent de l'adresse de connexion)
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSectionCMandat = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">C1. Mandat de l'évaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Points LATMP à évaluer</Label>
          <div className="mt-2 space-y-2">
            {['Diagnostic', 'Date de consolidation', 'Soins/traitements (nature, nécessité, suffisance, durée)', 'Atteinte permanente à l\'intégrité (existence, %)', 'Limitations fonctionnelles (existence, évaluation)'].map((point, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="mandateNotes">Notes</Label>
          <Textarea
            id="mandateNotes"
            value={formData.mandateNotes || ''}
            onChange={(e) => handleInputChange('mandateNotes', e.target.value)}
            placeholder="Notes additionnelles sur le mandat"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSectionCDiagnostics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">C2. Diagnostics acceptés par la CNESST</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-gray-500 text-center py-8">
          Interface pour ajouter des diagnostics sera implémentée.
        </div>
      </CardContent>
    </Card>
  );

  const renderSectionCModalite = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">C3. Modalité de l'entrevue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="modaliteText">Modalité de l'entrevue</Label>
          <Textarea
            id="modaliteText"
            value={formData.modaliteText || ''}
            onChange={(e) => handleInputChange('modaliteText', e.target.value)}
            placeholder="Le texte de la modalité de l'entrevue sera pré-rempli selon la clinique sélectionnée..."
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ce texte est automatiquement généré selon la clinique sélectionnée lors de la création du cas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duree">Durée</Label>
            <Input
              id="duree"
              value={formData.duree || ''}
              onChange={(e) => handleInputChange('duree', e.target.value)}
              placeholder="Durée de l'entrevue"
            />
          </div>
          <div>
            <Label htmlFor="modaliteCommentaires">Commentaires additionnels</Label>
            <Textarea
              id="modaliteCommentaires"
              value={formData.modaliteCommentaires || ''}
              onChange={(e) => handleInputChange('modaliteCommentaires', e.target.value)}
              placeholder="Commentaires additionnels"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">4. Identification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age">Âge</Label>
            <Input
              id="age"
              value={formData.age || ''}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Âge du patient"
            />
          </div>
          <div>
            <Label htmlFor="dominance">Dominance</Label>
            <Input
              id="dominance"
              value={formData.dominance || ''}
              onChange={(e) => handleInputChange('dominance', e.target.value)}
              placeholder="Droitier/Gaucher"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emploi">Emploi</Label>
            <Input
              id="emploi"
              value={formData.emploi || ''}
              onChange={(e) => handleInputChange('emploi', e.target.value)}
              placeholder="Type d'emploi"
            />
          </div>
          <div>
            <Label htmlFor="horaire">Horaire</Label>
            <Input
              id="horaire"
              value={formData.horaire || ''}
              onChange={(e) => handleInputChange('horaire', e.target.value)}
              placeholder="Horaire de travail"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="statutTravail">Statut de travail</Label>
          <Input
            id="statutTravail"
            value={formData.statutTravail || ''}
            onChange={(e) => handleInputChange('statutTravail', e.target.value)}
            placeholder="Statut actuel de travail"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSection5 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">5. Antécédents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="medicaux">Antécédents médicaux</Label>
          <Textarea
            id="medicaux"
            value={formData.medicaux || ''}
            onChange={(e) => handleInputChange('medicaux', e.target.value)}
            placeholder="Antécédents médicaux"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="chirurgicaux">Antécédents chirurgicaux</Label>
          <Textarea
            id="chirurgicaux"
            value={formData.chirurgicaux || ''}
            onChange={(e) => handleInputChange('chirurgicaux', e.target.value)}
            placeholder="Antécédents chirurgicaux"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="auSiteEtPourtour">Au site et pourtour</Label>
          <Textarea
            id="auSiteEtPourtour"
            value={formData.auSiteEtPourtour || ''}
            onChange={(e) => handleInputChange('auSiteEtPourtour', e.target.value)}
            placeholder="Antécédents au site et pourtour"
            rows={2}
          />
        </div>
        <div>
          <Label>Antécédents accidentels</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="accidentelsCNESST">CNESST</Label>
              <Input
                id="accidentelsCNESST"
                value={formData.accidentels?.CNESST || ''}
                onChange={(e) => handleInputChange('accidentels', { ...formData.accidentels, CNESST: e.target.value })}
                placeholder="CNESST"
              />
            </div>
            <div>
              <Label htmlFor="accidentelsSAAQ">SAAQ</Label>
              <Input
                id="accidentelsSAAQ"
                value={formData.accidentels?.SAAQ || ''}
                onChange={(e) => handleInputChange('accidentels', { ...formData.accidentels, SAAQ: e.target.value })}
                placeholder="SAAQ"
              />
            </div>
            <div>
              <Label htmlFor="accidentelsAutres">Autres</Label>
              <Input
                id="accidentelsAutres"
                value={formData.accidentels?.autres || ''}
                onChange={(e) => handleInputChange('accidentels', { ...formData.accidentels, autres: e.target.value })}
                placeholder="Autres"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              value={formData.allergies || ''}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              placeholder="Allergies connues"
            />
          </div>
          <div>
            <Label htmlFor="tabac">Tabac</Label>
            <Input
              id="tabac"
              value={formData.tabac || ''}
              onChange={(e) => handleInputChange('tabac', e.target.value)}
              placeholder="Consommation de tabac"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cannabis">Cannabis</Label>
            <Input
              id="cannabis"
              value={formData.cannabis || ''}
              onChange={(e) => handleInputChange('cannabis', e.target.value)}
              placeholder="Consommation de cannabis"
            />
          </div>
          <div>
            <Label htmlFor="alcool">Alcool</Label>
            <Input
              id="alcool"
              value={formData.alcool || ''}
              onChange={(e) => handleInputChange('alcool', e.target.value)}
              placeholder="Consommation d'alcool"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection6 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">6. Médication actuelle et mesures thérapeutiques en cours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="medication">Médication</Label>
          <Textarea
            id="medication"
            value={formData.medication || ''}
            onChange={(e) => handleInputChange('medication', e.target.value)}
            placeholder="Médication actuelle"
            rows={4}
          />
        </div>
        <div>
          <Label htmlFor="mesuresTherapeutiques">Mesures thérapeutiques en cours</Label>
          <Textarea
            id="mesuresTherapeutiques"
            value={formData.mesuresTherapeutiques || ''}
            onChange={(e) => handleInputChange('mesuresTherapeutiques', e.target.value)}
            placeholder="Mesures thérapeutiques en cours"
            rows={4}
          />
        </div>
        <div>
          <Label htmlFor="medicationCommentaires">Commentaires</Label>
          <Textarea
            id="medicationCommentaires"
            value={formData.medicationCommentaires || ''}
            onChange={(e) => handleInputChange('medicationCommentaires', e.target.value)}
            placeholder="Commentaires additionnels"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSection7 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">7. Historique de faits et évolution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="finalText">Contenu final</Label>
          <Textarea
            id="finalText"
            value={formData.finalText || ''}
            onChange={(e) => handleInputChange('finalText', e.target.value)}
            placeholder="Historique de faits et évolution"
            rows={8}
            className="resize-y"
          />
        </div>
        <div className="text-sm text-gray-500">
          <p>💡 Cette section peut être remplie par dictée audio ou saisie manuelle.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection8 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">8. Questionnaire subjectif et état actuel</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="finalText">Contenu final</Label>
          <Textarea
            id="finalText"
            value={formData.finalText || ''}
            onChange={(e) => handleInputChange('finalText', e.target.value)}
            placeholder="Questionnaire subjectif et état actuel"
            rows={8}
            className="resize-y"
          />
        </div>
        <div className="text-sm text-gray-500 mt-2">
          <p>💡 Cette section peut être remplie par dictée audio ou saisie manuelle.</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection9 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">9. Examen physique</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-gray-500 text-center py-8">
          Interface modulaire pour l'examen physique sera implémentée.
          <br />
          <span className="text-sm">Modules: Rachis lombaire, Hanches, Genoux, Chevilles/Pieds, Neuro-vasculaire</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection10 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">10. Examens paracliniques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="contenu">Contenu</Label>
          <Textarea
            id="contenu"
            value={formData.contenu || ''}
            onChange={(e) => handleInputChange('contenu', e.target.value)}
            placeholder="Résultats des examens paracliniques"
            rows={6}
          />
        </div>
        <div>
          <Label>Références</Label>
          <div className="text-sm text-gray-500 mt-2">
            Interface pour ajouter des références sera implémentée.
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection11 = () => {
    const { generateSection11FromSections } = useCaseStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateFromSections = async () => {
      setIsGenerating(true);
      try {
        await generateSection11FromSections();
        // Refresh form data after generation
        const currentSection = sections.find(s => s.id === sectionId);
        if (currentSection) {
          setFormData(currentSection.data);
        }
      } catch (error) {
        console.error('Failed to generate section 11:', error);
        // TODO: Show user-friendly error message
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">11. Conclusion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleGenerateFromSections}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Génération...
                </>
              ) : (
                <>
                  <span className="mr-2">🤖</span>
                  Générer à partir des sections 7, 8, 9
                </>
              )}
            </Button>
          </div>
          
          <div>
            <Label htmlFor="finalText">Conclusion finale</Label>
            <Textarea
              id="finalText"
              value={formData.finalText || ''}
              onChange={(e) => handleInputChange('finalText', e.target.value)}
              placeholder="Conclusion médicale"
              rows={8}
            />
          </div>
          
          <div className="text-sm text-gray-500">
            <p>💡 Cette section peut être générée automatiquement à partir des sections 7, 8 et 9.</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSection12 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">12. Pourcentage d'atteinte permanente à l'intégrité physique ou psychique (APIPP)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-gray-500 text-center py-8">
          Interface pour les tableaux APIPP sera implémentée.
        </div>
      </CardContent>
    </Card>
  );

  const renderSection15 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">15. Signature et identification du médecin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              value={formData.nom || ''}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              placeholder="Nom du médecin"
            />
          </div>
          <div>
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              value={formData.titre || ''}
              onChange={(e) => handleInputChange('titre', e.target.value)}
              placeholder="Titre professionnel"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="signature">Signature</Label>
          <Textarea
            id="signature"
            value={formData.signature || ''}
            onChange={(e) => handleInputChange('signature', e.target.value)}
            placeholder="Signature électronique ou notes"
            rows={3}
          />
      </div>
      </CardContent>
    </Card>
  );

  // Fallback rendering for when schema is not enabled
  const renderFallbackFields = () => {
    // This is the existing rendering logic
    if (sectionId === 'section_7') {
      return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('historiqueEvolution')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Content */}
                <div>
                  <Label htmlFor="mainContent">{t('mainContent')}</Label>
                  <Textarea
                    id="mainContent"
                    value={formData.mainContent || ''}
                    onChange={(e) => handleInputChange('mainContent', e.target.value)}
                    placeholder={t('mainContentPlaceholder')}
                    rows={6}
                    className="resize-y"
                  />
                </div>

                {/* Patient Verbatim */}
                <div>
                  <Label htmlFor="patientVerbatim">{t('patientVerbatim')}</Label>
                  <Textarea
                    id="patientVerbatim"
                    value={formData.patientVerbatim || ''}
                    onChange={(e) => handleInputChange('patientVerbatim', e.target.value)}
                    placeholder={t('patientVerbatimPlaceholder')}
                    rows={4}
                    className="resize-y"
                  />
                </div>

                {/* Radiologist Verbatim */}
                <div>
                  <Label htmlFor="radiologistVerbatim">{t('radiologistVerbatim')}</Label>
                  <Textarea
                    id="radiologistVerbatim"
                    value={formData.radiologistVerbatim || ''}
                    onChange={(e) => handleInputChange('radiologistVerbatim', e.target.value)}
                    placeholder={t('radiologistVerbatimPlaceholder')}
                    rows={4}
                    className="resize-y"
                  />
                </div>

                {/* Merge Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleMergeSections}
                    disabled={isMerging || mergeStatus === 'merging'}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Merge className="h-4 w-4" />
                    {isMerging ? t('mergingSections') : t('mergeAllSections')}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>

                {/* Merge Status */}
                {mergeStatus === 'complete' && (
                  <div className="text-center text-green-600 text-sm">
                    {t('mergeComplete')}
                  </div>
                )}
                {mergeStatus === 'error' && (
                  <div className="text-center text-red-600 text-sm">
                    Error during merge
                  </div>
                )}
              </CardContent>
            </Card>
      );
    } else if (sectionId === 'section_8') {
      return (
            <Card>
              <CardHeader>
            <CardTitle className="text-lg">{section?.title || 'Section'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="section8Content">{t('sectionContent')}</Label>
                  <Textarea
                    id="section8Content"
                    value={formData.section8Content || ''}
                    onChange={(e) => handleInputChange('section8Content', e.target.value)}
                placeholder={`${t('describeObservations')} ${section?.title || 'Section'}...`}
                    rows={12}
                    className="resize-y"
                  />
                </div>
              </CardContent>
            </Card>
      );
    } else {
      return (
            <>
              {/* Basic Form Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('generalInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientName">{t('patientName')}</Label>
                      <Input
                        id="patientName"
                        value={formData.patientName || ''}
                        onChange={(e) => handleInputChange('patientName', e.target.value)}
                        placeholder={t('enterPatientName')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="diagnosis">{t('mainDiagnosis')}</Label>
                    <Textarea
                      id="diagnosis"
                      value={formData.diagnosis || ''}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      placeholder={t('describeMainDiagnosis')}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section-specific content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('sectionContent')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="observations">{t('observationsAndNotes')}</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations || ''}
                      onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder={`${t('describeObservations')} ${section?.title || 'Section'}...`}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('additionalNotes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.additionalNotes || ''}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    placeholder={t('additionalNotesPlaceholder')}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
                     <div>
             <h1 className="text-2xl font-bold text-slate-700">
                {section?.title || 'Section'}
             </h1>
            <p className="text-gray-500 mt-1">
              {section.audioRequired && (
                <span className="inline-flex items-center gap-1 text-orange-600 text-sm">
                  <Clock className="h-4 w-4" />
                  Dictée audio requise
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Sauvegardé à {lastSaved}
              </div>
            )}
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Render section-specific fields */}
          {renderSectionFields()}

          {/* Status indicator */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Statut:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'completed' ? 'Terminé' :
                 status === 'in_progress' ? 'En cours' :
                 'Non commencé'}
              </span>
            </div>
            {autosaveTimestamp && (
              <div className="text-xs text-gray-500">
                Dernière sauvegarde: {new Date(autosaveTimestamp).toLocaleString()}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousSection}
              disabled={!canGoPrevious}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSection}
              disabled={!canGoNext}
              className="flex items-center gap-1"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
