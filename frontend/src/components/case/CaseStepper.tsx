import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseStepperProps {
  currentSection: number;
  onSectionChange: (section: number) => void;
  sections: { [key: string]: any };
}

const SECTION_LABELS = [
  '1. Mandat',
  '2. Diagnostics',
  '3. Modalités',
  '4. Identification',
  '5. Antécédents',
  '6. Médication',
  '7. Historique',
  '8. Entrevue',
  '9. Examen physique',
  '10. Examens paracliniques',
  '11. Conclusion',
  '12. Atteinte permanente',
  '13. Vérification légale'
];

export const CaseStepper: React.FC<CaseStepperProps> = ({
  currentSection,
  onSectionChange,
  sections
}) => {
  const isSectionCompleted = (sectionNum: number) => {
    const sectionKey = `section_${sectionNum}`;
    const sectionData = sections[sectionKey];
    return sectionData && Object.keys(sectionData).length > 0;
  };

  const isSectionActive = (sectionNum: number) => {
    return sectionNum === currentSection;
  };

  const isSectionAccessible = (sectionNum: number) => {
    // Allow access to any section - users can jump around freely
    return true;
  };

  return (
    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
      {SECTION_LABELS.map((label, index) => {
        const sectionNum = index + 1;
        const completed = isSectionCompleted(sectionNum);
        const active = isSectionActive(sectionNum);
        const accessible = isSectionAccessible(sectionNum);

        return (
          <div key={sectionNum} className="flex items-center">
            {/* Section Circle */}
            <button
              onClick={() => accessible && onSectionChange(sectionNum)}
              disabled={!accessible}
              className={cn(
                'flex flex-col items-center gap-1 min-w-[60px] transition-all',
                !accessible && 'opacity-50 cursor-not-allowed',
                accessible && 'cursor-pointer hover:opacity-80'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  active && 'border-[#009639] bg-[#009639] text-white',
                  completed && !active && 'border-[#009639] bg-[#009639]/10 text-[#009639]',
                  !completed && !active && 'border-gray-300 bg-white text-gray-400'
                )}
              >
                {completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{sectionNum}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs text-center max-w-[60px]',
                  active && 'font-semibold text-[#009639]',
                  !active && 'text-gray-600'
                )}
              >
                {label.split('. ')[1] || label}
              </span>
            </button>

            {/* Connector Line */}
            {index < SECTION_LABELS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 mx-1 transition-all',
                  completed || (sectionNum < currentSection)
                    ? 'bg-[#009639]'
                    : 'bg-gray-300'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

