import { Section01 } from './sections/Section01';
import { Section02 } from './sections/Section02';
import { Section03 } from './sections/Section03';
import { Section04 } from './sections/Section04';
import { Section05 } from './sections/Section05';
import { Section06 } from './sections/Section06';
import { Section07 } from './sections/Section07';
import { Section08 } from './sections/Section08';
import { Section09 } from './sections/Section09';
import { Section10 } from './sections/Section10';
import { Section11 } from './sections/Section11';
import { Section12 } from './sections/Section12';
import { Section13 } from './sections/Section13';

interface CaseSectionContentProps {
  sectionNumber: number;
  caseData: any;
  onUpdate: (sectionNumber: number, content: any) => void;
  onSave: () => void;
}

export const CaseSectionContent: React.FC<CaseSectionContentProps> = ({
  sectionNumber,
  caseData,
  onUpdate,
  onSave
}) => {
  const sectionData = caseData.sections[`section_${sectionNumber}`] || {};

  const commonProps = {
    data: sectionData,
    onUpdate: (content: any) => onUpdate(sectionNumber, content),
    onSave
  };

  // Sections 7 and 8 need full height for split view
  const isFullHeight = sectionNumber === 7 || sectionNumber === 8;

  return (
    <div className={isFullHeight ? "h-full" : ""}>
      {sectionNumber === 1 && <Section01 {...commonProps} />}
      {sectionNumber === 2 && <Section02 {...commonProps} />}
      {sectionNumber === 3 && <Section03 {...commonProps} />}
      {sectionNumber === 4 && <Section04 {...commonProps} />}
      {sectionNumber === 5 && <Section05 {...commonProps} />}
      {sectionNumber === 6 && <Section06 {...commonProps} />}
      {sectionNumber === 7 && <Section07 {...commonProps} caseId={caseData.id} />}
      {sectionNumber === 8 && <Section08 {...commonProps} />}
      {sectionNumber === 9 && <Section09 {...commonProps} />}
      {sectionNumber === 10 && <Section10 {...commonProps} />}
      {sectionNumber === 11 && <Section11 {...commonProps} allSections={caseData.sections} />}
      {sectionNumber === 12 && <Section12 {...commonProps} />}
      {sectionNumber === 13 && <Section13 {...commonProps} caseData={caseData} />}
      {![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(sectionNumber) && (
        <div>Section non trouvée</div>
      )}
    </div>
  );
};

