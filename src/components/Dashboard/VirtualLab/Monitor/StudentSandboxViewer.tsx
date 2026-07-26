import { useEffect, useState, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { virtualLabHub } from '@/services/virtualLabHub';
import { CodeEditorPanel } from '../Sandbox/CodeEditorPanel';
import { CircuitCanvas, type PartVisualState } from '../Sandbox/CircuitCanvas';
import { SerialMonitorPanel } from '../Sandbox/SerialMonitorPanel';
import type { LabCircuitComponent, SimulationEventEntity } from '@/services/dashboardApi';

interface StudentSandboxViewerProps {
  projectId: string;
  studentName: string;
  onClose: () => void;
  boardType?: string;
}

export const StudentSandboxViewer = ({ projectId, studentName, onClose, boardType = 'esp32' }: StudentSandboxViewerProps) => {
  const [code, setCode] = useState('');
  const [components, setComponents] = useState<LabCircuitComponent[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [partStates, setPartStates] = useState<Record<string, PartVisualState>>({});
  const [serialOutput, setSerialOutput] = useState('');
  const [guidanceMessage, setGuidanceMessage] = useState('');
  
  const guidanceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Join the student's group
    virtualLabHub.watchStudent(projectId).catch(console.error);

    const onDiagramUpdated = (pid: string, diagramJson: string) => {
      if (pid !== projectId) return;
      try {
        const parsed = JSON.parse(diagramJson);
        if (parsed.parts) setComponents(parsed.parts);
        if (parsed.connections) setConnections(parsed.connections);
      } catch (e) {
        console.error('Failed to parse diagram', e);
      }
    };

    const onCodeUpdated = (pid: string, sourceCode: string) => {
      if (pid !== projectId) return;
      setCode(sourceCode);
    };

    const onSimulationEvent = (pid: string, event: SimulationEventEntity) => {
      if (pid !== projectId) return;
      
      if (event.type === 'serial') {
        const message = typeof event.payload.message === 'string' ? event.payload.message : '';
        setSerialOutput(prev => prev + message + (event.payload.newline ? '\n' : ''));
        return;
      }

      if (event.type === 'part-state') {
        const partId = typeof event.payload.partId === 'string' ? event.payload.partId : '';
        const component = typeof event.payload.component === 'string' ? event.payload.component : '';
        if (!partId) return;

        if (component === 'led') {
          const value = event.payload.state === 'on' ? '1' : '0';
          setPartStates(prev => ({ ...prev, [partId]: { ...prev[partId], value } }));
        } else if (component === 'buzzer') {
          const buzzing = event.payload.state === 'buzzing';
          setPartStates(prev => ({ ...prev, [partId]: { ...prev[partId], buzzing } }));
        }
      }
    };

    virtualLabHub.on('StudentDiagramUpdated', onDiagramUpdated);
    virtualLabHub.on('StudentCodeUpdated', onCodeUpdated);
    virtualLabHub.on('StudentSimulationEvent', onSimulationEvent);

    return () => {
      virtualLabHub.off('StudentDiagramUpdated', onDiagramUpdated);
      virtualLabHub.off('StudentCodeUpdated', onCodeUpdated);
      virtualLabHub.off('StudentSimulationEvent', onSimulationEvent);
      virtualLabHub.unwatchStudent(projectId).catch(console.error);
    };
  }, [projectId]);

  const handleSendGuidance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidanceMessage.trim()) return;
    
    virtualLabHub.sendGuidance(projectId, guidanceMessage).catch(console.error);
    setGuidanceMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-50 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-[#0f4c5c] text-white p-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">Giám sát học sinh: {studentName}</h2>
            <p className="text-xs text-cyan-200 mt-1 opacity-80">Chế độ xem trực tiếp (Read-only)</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
          <div className="col-span-1 lg:col-span-4 flex flex-col h-full min-h-0 pointer-events-none opacity-90 relative">
            <div className="absolute inset-0 z-10 bg-transparent"></div>
            <CodeEditorPanel
              code={code}
              onChange={() => {}}
              onRun={() => {}}
              onStop={() => {}}
              isRunning={false}
              isCompiling={false}
              compileError={null}
            />
          </div>

          <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
            <div className="flex-[2] min-h-0 rounded-2xl overflow-hidden border border-border shadow-sm bg-[#222] relative pointer-events-none opacity-90">
              <div className="absolute inset-0 z-10 bg-transparent"></div>
              <CircuitCanvas
                engine={null}
                boardType={boardType}
                components={components}
                connections={connections}
                partStates={partStates}
                onComponentMove={() => {}}
                onWireConnect={() => {}}
                onWireDelete={() => {}}
                onWireWaypointChange={() => {}}
                onWireColorChange={() => {}}
                onComponentDelete={() => {}}
                onComponentAttrChange={() => {}}
                onComponentRotate={() => {}}
              />
            </div>

            <div className="flex-[1] min-h-[150px] rounded-2xl overflow-hidden flex flex-row gap-4">
              <div className="flex-1 pointer-events-none">
                 <SerialMonitorPanel output={serialOutput} onClear={() => setSerialOutput('')} />
              </div>
              <div className="w-80 bg-white rounded-xl border border-border p-4 flex flex-col">
                <h3 className="font-bold text-[#0f4c5c] mb-2 text-sm">Nhận xét nhanh</h3>
                <form onSubmit={handleSendGuidance} className="flex flex-col gap-2 flex-1">
                  <textarea
                    ref={guidanceInputRef as any}
                    value={guidanceMessage}
                    onChange={(e) => setGuidanceMessage(e.target.value)}
                    placeholder="Nhập góp ý cho học sinh này..."
                    className="flex-1 w-full p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <Button 
                    type="submit" 
                    disabled={!guidanceMessage.trim()}
                    className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white w-full h-9 rounded-lg pointer-events-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gửi phản hồi
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
