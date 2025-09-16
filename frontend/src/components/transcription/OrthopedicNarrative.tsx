import React from 'react';

interface OrthopedicNarrativeProps {
  narrative: {
    summary: {
      patient: string;
      chiefComplaint: string;
      history: string;
      examination: string;
      assessment: string;
      plan: string;
    };
    keyFindings: {
      bodyParts: string[];
      painLevel: number | null;
      injuryMechanism: string | null;
      duration: string | null;
    };
    conversationFlow: Array<{
      phase: string;
      timestamp: number;
      trigger: string;
    }>;
    structuredTranscript: Array<{
      phase: string;
      speaker: string;
      text: string;
      timestamp?: number;
      medicalSignificance: string;
    }>;
  } | null;
}

export const OrthopedicNarrative: React.FC<OrthopedicNarrativeProps> = ({ narrative }) => {
  if (!narrative) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Orthopedic Narrative</h3>
        <p className="text-gray-500">No narrative available yet. Start a conversation to generate the orthopedic summary.</p>
      </div>
    );
  }

  const getSignificanceColor = (significance: string) => {
    if (significance.includes('High')) return 'text-red-600 bg-red-50';
    if (significance.includes('Medium')) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      greeting: 'bg-blue-100 text-blue-800',
      chief_complaint: 'bg-purple-100 text-purple-800',
      history: 'bg-green-100 text-green-800',
      examination: 'bg-orange-100 text-orange-800',
      assessment: 'bg-red-100 text-red-800',
      plan: 'bg-indigo-100 text-indigo-800'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Medical Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-700">Patient</h4>
              <p className="text-gray-600 text-sm">{narrative.summary.patient}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Chief Complaint</h4>
              <p className="text-gray-600 text-sm">{narrative.summary.chiefComplaint}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">History</h4>
              <p className="text-gray-600 text-sm">{narrative.summary.history}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-700">Examination</h4>
              <p className="text-gray-600 text-sm">{narrative.summary.examination}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Assessment</h4>
              <p className="text-gray-600 text-sm">{narrative.summary.assessment}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Plan</h4>
              <p className="text-gray-600 text-sm">{narrative.summary.plan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Findings Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Key Findings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {narrative.keyFindings.bodyParts.length}
            </div>
            <div className="text-sm text-gray-600">Body Parts</div>
            <div className="text-xs text-gray-500 mt-1">
              {narrative.keyFindings.bodyParts.join(', ')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {narrative.keyFindings.painLevel || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Pain Level</div>
            <div className="text-xs text-gray-500 mt-1">/10 scale</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {narrative.keyFindings.duration || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Duration</div>
            <div className="text-xs text-gray-500 mt-1">since injury</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {narrative.keyFindings.injuryMechanism ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Mechanism</div>
            <div className="text-xs text-gray-500 mt-1">
              {narrative.keyFindings.injuryMechanism || 'Not identified'}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Flow Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Conversation Flow</h3>
        <div className="flex flex-wrap gap-2">
          {narrative.conversationFlow.map((transition, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(transition.phase)}`}>
                {transition.phase.replace('_', ' ')}
              </span>
              {index < narrative.conversationFlow.length - 1 && (
                <span className="text-gray-400">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Structured Transcript Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Structured Transcript</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {narrative.structuredTranscript.map((turn, index) => (
            <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(turn.phase)}`}>
                  {turn.phase.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  turn.speaker === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {turn.speaker === 'doctor' ? 'Provider' : 'Patient'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSignificanceColor(turn.medicalSignificance)}`}>
                  {turn.medicalSignificance}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{turn.text}</p>
              {turn.timestamp && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(turn.timestamp)}s
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
