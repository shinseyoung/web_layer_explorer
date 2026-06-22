import React from 'react';
import { create } from 'zustand';
import { X, Search } from 'lucide-react';

// --- 전역 상태 관리 (Zustand Store) ---
export interface LayerNode {
  id: string;
  depth: number;
  label: string;
  tagName: string;
  className: string;
  rect: { x: number; y: number; width: number; height: number; };
  zIndex: number;
  color?: string;
}

interface LayerStoreState {
  appState: 'view' | 'loading';
  targetUrl: string;
  layers: LayerNode[];
  hoveredId: string | null;
  selectedId: string | null;
  setTargetUrl: (url: string) => void;
  startVisualizing: () => Promise<void>;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
}

const useLayerStore = create<LayerStoreState>((set, get) => ({
  appState: 'view',
  targetUrl: '',
  layers: [],
  hoveredId: null,
  selectedId: null,
  setTargetUrl: (url) => set({ targetUrl: url }),
  
  startVisualizing: async () => {
    set({ appState: 'loading', layers: [], selectedId: null, hoveredId: null });
    
    // [추후 백엔드 API 통신으로 교체될 부분] 임시 1.5초 로딩 후 Mock 데이터 렌더링
    setTimeout(() => {
      const mockData: LayerNode[] = [
        { id: '1', depth: 1, label: '<body>', tagName: 'body', className: '', color: 'rgba(30, 41, 59, 0.8)', rect: { x: 0, y: 0, width: 800, height: 600 }, zIndex: 1 },
        { id: '2', depth: 2, label: '<header.header>', tagName: 'header', className: 'header', color: 'rgba(16, 185, 129, 0.3)', rect: { x: 0, y: 0, width: 800, height: 80 }, zIndex: 2 },
        { id: '3', depth: 3, label: '<div.search_box>', tagName: 'div', className: 'search_box', color: 'rgba(59, 130, 246, 0.6)', rect: { x: 200, y: 20, width: 400, height: 40 }, zIndex: 3 },
        { id: '4', depth: 2, label: '<main.main_banner>', tagName: 'main', className: 'main_banner', color: 'rgba(139, 92, 246, 0.3)', rect: { x: 0, y: 80, width: 800, height: 520 }, zIndex: 2 },
      ];
      set({ appState: 'view', layers: mockData });
    }, 1500);
  },
  
  setHoveredId: (id) => set({ hoveredId: id }),
  setSelectedId: (id) => set({ selectedId: get().selectedId === id ? null : id }),
}));

// --- 컴포넌트: 상단 바 (TopBar) ---
function TopBar() {
  const { targetUrl, setTargetUrl, startVisualizing, appState } = useLayerStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUrl.trim()) startVisualizing();
  };

  return (
    <header className="h-16 w-full bg-[#0a0a0f] border-b border-white/10 flex items-center px-6 z-20 shrink-0">
      <div className="font-bold text-[#10b981] tracking-widest text-lg w-48">WLE</div>
      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-auto flex">
        <div className="relative w-full flex items-center">
          <Search size={18} className="absolute left-4 text-gray-500" />
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={appState === 'loading'}
            className="w-full bg-[#111] border border-white/10 rounded-l-xl py-2 pl-12 pr-4 text-sm font-mono text-white focus:outline-none focus:border-[#10b981] transition-colors disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!targetUrl || appState === 'loading'}
          className="px-6 py-2 bg-[#10b981] text-[#05050a] font-bold text-sm rounded-r-xl hover:bg-white transition-colors disabled:opacity-50"
        >
          {appState === 'loading' ? '분석 중...' : '분석'}
        </button>
      </form>
      <div className="w-48"></div> {/* 우측 공간 밸런스 */}
    </header>
  );
}

// --- 컴포넌트: 3D 레이어 캔버스 (좌측 2/3) ---
function LayerScene() {
  const { layers, hoveredId, selectedId, setHoveredId, setSelectedId } = useLayerStore();

  return (
    <div className="w-full h-full bg-[#05050a] flex items-center justify-center overflow-hidden select-none relative">
      {layers.length === 0 ? (
        <div className="text-gray-600 font-mono text-sm tracking-widest text-center border border-dashed border-gray-800 rounded-xl p-12">
          상단에 URL을 입력하여<br/>DOM 구조를 시각화하세요.
        </div>
      ) : (
        <div className="relative flex items-center justify-center" style={{ perspective: '2000px', width: '800px', height: '600px' }}>
          <div className="relative w-full h-full transition-transform duration-700 ease-out" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(-30deg)' }}>
            {layers.map((layer) => {
              const isHovered = hoveredId === layer.id;
              const isSelected = selectedId === layer.id;
              const isActive = isHovered || isSelected;
              const targetZ = isActive ? (layer.depth * 50) + 40 : (layer.depth * 50);
              
              return (
                <div
                  key={layer.id}
                  onMouseEnter={() => setHoveredId(layer.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedId(layer.id)}
                  className="absolute rounded-xl cursor-pointer transition-all duration-400"
                  style={{
                    backgroundColor: layer.color || 'rgba(255,255,255,0.1)',
                    width: `${layer.rect.width}px`, height: `${layer.rect.height}px`,
                    left: `${layer.rect.x}px`, top: `${layer.rect.y}px`,
                    transform: `translateZ(${targetZ}px) scale(${isActive ? 1.02 : 1})`,
                    border: isActive ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: isActive ? '0 20px 40px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
                    zIndex: layer.depth,
                  }}
                >
                  <div className={`absolute -top-3 -left-3 px-2 py-1 rounded-md text-xs font-bold font-mono ${isActive ? 'bg-[#10b981] text-black' : 'bg-[#111] text-[#10b981]'}`}>
                    {layer.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 컴포넌트: 우측 인스펙터 (우측 1/3) ---
function InspectorPanel() {
  const { layers, selectedId, hoveredId, setSelectedId } = useLayerStore();
  const node = layers.find((l) => l.id === (selectedId || hoveredId));

  if (!node) {
    return <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center text-gray-600 font-mono text-xs">레이어 정보가 여기에 표시됩니다.</div>;
  }

  return (
    <div className="w-full h-full bg-[#0a0a0f] border-l border-white/5 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <h3 className="text-[#10b981] font-mono font-bold text-lg">{node.label}</h3>
        <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
      </div>
      <div className="p-6 flex flex-col gap-5">
        <div className="flex justify-between text-sm"><span className="text-gray-500">태그명</span><span className="text-white font-mono">{node.tagName.toUpperCase()}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">클래스</span><span className="text-white font-mono">{node.className || '없음'}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">크기</span><span className="text-white font-mono">{node.rect.width} × {node.rect.height}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">좌표</span><span className="text-white font-mono">X: {node.rect.x}, Y: {node.rect.y}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">z-index</span><span className="text-white font-mono">{node.zIndex}</span></div>
      </div>
    </div>
  );
}

// --- 메인 App 컴포넌트 ---
export default function App() {
  const { appState } = useLayerStore();

  return (
    <div className="w-screen h-screen bg-[#05050a] flex flex-col font-sans text-white overflow-hidden">
      {/* 1. 상단 바 */}
      <TopBar />
      
      {/* 2. 하단 분할 영역 (좌측 캔버스, 우측 인스펙터) */}
      <div className="flex-1 flex relative w-full h-full overflow-hidden">
        {/* 분석 중 로딩 오버레이 */}
        {appState === 'loading' && (
          <div className="absolute inset-0 bg-[#05050a]/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[#10b981] font-mono animate-pulse">DOM 트리를 분석 중입니다...</div>
          </div>
        )}
        
        <div className="w-2/3 h-full relative">
          <LayerScene />
        </div>
        
        <div className="w-1/3 h-full relative">
          <InspectorPanel />
        </div>
      </div>
    </div>
  );
}