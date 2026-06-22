// apps/client/src/components/inspector/InspectorPanel.tsx
import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useLayerStore } from '../../store/useLayerStore'; // 스토어 불러오기

export default function InspectorPanel() {
  // MOCK_SELECTED_NODE(정적 데이터)를 삭제하고 Zustand 스토어에서 실시간 상태를 가져옵니다.
  const { layers, selectedId, hoveredId, setSelectedId } = useLayerStore();

  // 클릭된 레이어가 있으면 그것을, 없으면 호버된 레이어를 패널에 표시합니다.
  const activeId = selectedId || hoveredId;
  const node = layers.find((l) => l.id === activeId);

  // 선택되거나 호버된 노드가 없으면 패널을 숨깁니다.
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