import React, { useEffect } from 'react';
import { create } from 'zustand';
import { X, ChevronRight } from 'lucide-react';

// --- STORE ---
export interface LayerNode {
  id: string;
  depth: number;
  label: string;
  tagName: string;
  className: string;
  htmlSnippet: string;
  cssRules: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number; };
  zIndex: number;
  color?: string;
}

interface LayerStoreState {
  appState: 'home' | 'loading' | 'view';
  targetUrl: string;
  layers: LayerNode[];
  screenshot: string | null;
  viewport: { width: number; height: number } | null;
  hoveredId: string | null;
  selectedId: string | null;
  setTargetUrl: (url: string) => void;
  startVisualizing: () => Promise<void>;
  resetToHome: () => void;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setMockLayers: (layers: LayerNode[]) => void;
}

const useLayerStore = create<LayerStoreState>((set, get) => ({
  appState: 'home',
  targetUrl: '',
  layers: [],
  screenshot: null,
  viewport: null,
  hoveredId: null,
  selectedId: null,
  setTargetUrl: (url) => set({ targetUrl: url }),
  startVisualizing: async () => {
    set({ appState: 'loading' });
    setTimeout(() => set({ appState: 'view' }), 1500);
  },
  resetToHome: () => set({ appState: 'home', targetUrl: '', layers: [], screenshot: null, viewport: null, selectedId: null, hoveredId: null }),
  setHoveredId: (id) => set({ hoveredId: id }),
  setSelectedId: (id) => set({ selectedId: get().selectedId === id ? null : id }),
  setMockLayers: (layers) => set({ layers }),
}));

// --- COMPONENTS ---
function LayerScene() {
  const { layers, hoveredId, selectedId, setHoveredId, setSelectedId } = useLayerStore();

  return (
    <div className="w-full h-screen bg-[#05050a] flex flex-col items-center justify-center overflow-hidden select-none">
      <div className="text-white mb-12 font-mono opacity-50 tracking-widest text-sm">
        PURE CSS 3D LAYER VISUALIZER
      </div>
      
      <div className="relative flex items-center justify-center" style={{ perspective: '2000px', width: '800px', height: '600px' }}>
        <div className="relative w-full h-full transition-transform duration-700 ease-out" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(-30deg)' }}>
          {layers.map((layer) => {
            const isHovered = hoveredId === layer.id;
            const isSelected = selectedId === layer.id;
            const isActive = isHovered || isSelected;
            
            const baseZ = layer.depth * 50; 
            const targetZ = isActive ? baseZ + 40 : baseZ;
            const scale = isActive ? 1.02 : 1;

            return (
              <div
                key={layer.id}
                onMouseEnter={() => setHoveredId(layer.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(layer.id)}
                className="absolute rounded-xl cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  backgroundColor: layer.color || 'rgba(255, 255, 255, 0.1)',
                  width: `${layer.rect.width}px`,
                  height: `${layer.rect.height}px`,
                  left: `${layer.rect.x}px`,
                  top: `${layer.rect.y}px`,
                  willChange: 'transform, border-color, box-shadow',
                  transform: `translateZ(${targetZ}px) scale(${scale})`,
                  border: isActive ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isActive ? '0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)' : '0 4px 6px rgba(0,0,0,0.3)',
                  zIndex: layer.depth,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div className={`absolute -top-3 -left-3 px-2 py-1 rounded-md text-xs font-bold font-mono transition-colors duration-200 pointer-events-none shadow-lg ${isActive ? 'bg-[#10b981] text-black border border-[#10b981]' : 'bg-[#111] text-[#10b981] border border-[#10b981]/30'}`}>
                  {layer.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="text-white mt-12 font-mono opacity-40 text-xs">
        * 레이어를 마우스 오버하거나 클릭해보세요.
      </div>
    </div>
  );
}

function InspectorPanel() {
  const { layers, selectedId, hoveredId, setSelectedId } = useLayerStore();
  
  const activeId = selectedId || hoveredId;
  const node = layers.find((l) => l.id === activeId);

  if (!node) return null;

  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[320px] bg-[#111111]/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-2xl overflow-hidden select-none z-50">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <h3 className="text-[#10b981] font-mono font-bold text-lg tracking-tight">
          {node.label}
        </h3>
        <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <PropertyRow label="요소 타입" value={node.tagName} />
        <PropertyRow label="클래스" value={node.className || '없음'} />
        <PropertyRow label="크기" value={`${node.rect.width} × ${node.rect.height}`} />
        <PropertyRow label="위치" value={`${node.rect.x}, ${node.rect.y}`} />
        <PropertyRow label="z-index" value={node.zIndex.toString()} />
      </div>

      <div className="p-3">
        <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
          <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
            자세히 보기
          </span>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-gray-100 font-mono tracking-wide truncate max-w-[150px] text-right" title={value}>
        {value}
      </span>
    </div>
  );
}

// --- MAIN APP ENTRY ---
export default function App() {
  const { setMockLayers, appState } = useLayerStore();

  useEffect(() => {
    // 테스트용 임시 데이터 주입
    const mockData: LayerNode[] = [
      { id: '1', depth: 1, label: '<body>', tagName: 'body', className: '', htmlSnippet: '<body>...</body>', cssRules: { display: 'block' }, color: 'rgba(30, 41, 59, 0.8)', rect: { x: 0, y: 0, width: 800, height: 600 }, zIndex: 1 },
      { id: '2', depth: 2, label: '<header.header>', tagName: 'header', className: 'header', htmlSnippet: '<header class="header">...</header>', cssRules: { display: 'flex' }, color: 'rgba(16, 185, 129, 0.3)', rect: { x: 0, y: 0, width: 800, height: 80 }, zIndex: 2 },
      { id: '3', depth: 3, label: '<div.search_box>', tagName: 'div', className: 'search_box', htmlSnippet: '<div class="search_box">...</div>', cssRules: { width: '400px', height: '40px', background: '#fff' }, color: 'rgba(59, 130, 246, 0.6)', rect: { x: 200, y: 20, width: 400, height: 40 }, zIndex: 3 },
      { id: '4', depth: 2, label: '<main.main_banner>', tagName: 'main', className: 'main_banner', htmlSnippet: '<main class="main_banner">...</main>', cssRules: { display: 'block' }, color: 'rgba(139, 92, 246, 0.3)', rect: { x: 0, y: 80, width: 800, height: 520 }, zIndex: 2 },
    ];
    setMockLayers(mockData);
    
    // 개발 편의를 위해 뷰 모드로 전환
    useLayerStore.setState({ appState: 'view' });
  }, [setMockLayers]);

  return (
    <div className="w-screen h-screen bg-[#05050a] overflow-hidden relative font-sans text-white">
      {appState === 'view' && (
        <>
          <div className="absolute inset-0">
            <LayerScene />
          </div>
          <InspectorPanel />
        </>
      )}
    </div>
  );
}