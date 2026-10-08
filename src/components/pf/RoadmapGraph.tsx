import { memo, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, type Node, type Edge, type NodeProps, BackgroundVariant } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { FlaskConical, Flag, Award, Target } from "lucide-react";
import type { ComputedNode } from "@/lib/engine";
import { STATUS_META } from "./status";

const W = 196, H = 68;

type NodeData = { n: ComputedNode; selected: boolean };

const TYPE_ICON = { project: FlaskConical, milestone: Flag, certification: Award, role: Target } as const;

const CareerNode = memo(function CareerNode({ data }: NodeProps<Node<NodeData>>) {
  const { n, selected } = data;
  const m = STATUS_META[n.status];
  const Icon = m.icon;
  const TIcon = n.type !== "skill" ? TYPE_ICON[n.type] : null;
  const isTarget = n.type === "role";
  return (
    <div
      className={`group relative rounded-xl border bg-surface-2 px-3 py-2.5 transition-shadow ${m.border} ${isTarget ? "shadow-glow" : ""} ${selected ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""} ${n.status === "current" ? "animate-pf-pulse" : ""}`}
      style={{ width: W, height: H }}
    >
      <Handle type="target" position={Position.Top} className="!size-1.5 !border-0 !bg-border" />
      <div className={`flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider ${m.text}`}>
        <Icon className="size-3" aria-hidden />
        {isTarget ? "Target" : m.label}
        {TIcon && !isTarget && <TIcon className="ml-auto size-3 text-muted-foreground" aria-label={n.type} />}
        {!TIcon && n.status !== "mastered" && n.status !== "completed" && <span className="ml-auto text-muted-foreground">{n.hours}h</span>}
      </div>
      <div className={`mt-1 truncate text-[13px] font-medium ${n.status === "mastered" || n.status === "completed" ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</div>
      <div className="truncate text-[10.5px] text-muted-foreground">{n.category}</div>
      <Handle type="source" position={Position.Bottom} className="!size-1.5 !border-0 !bg-border" />
    </div>
  );
});

const nodeTypes = { career: CareerNode };

export function RoadmapGraph({ nodes, selectedId, onSelect, layoutKey }: { nodes: ComputedNode[]; selectedId: string | null; onSelect: (id: string | null) => void; layoutKey: string }) {
  const positions = useMemo(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 34, ranksep: 62, marginx: 20, marginy: 20 });
    g.setDefaultEdgeLabel(() => ({}));
    nodes.forEach((n) => g.setNode(n.id, { width: W, height: H }));
    nodes.forEach((n) => n.effectiveDeps.forEach((d) => g.setEdge(d, n.id)));
    dagre.layout(g);
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => {
      const p = g.node(n.id);
      map.set(n.id, { x: p.x - W / 2, y: p.y - H / 2 });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  const done = (n: ComputedNode) => n.status === "mastered" || n.status === "completed";
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const rfNodes: Node<NodeData>[] = nodes.map((n) => ({
    id: n.id,
    type: "career",
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: { n, selected: n.id === selectedId },
    draggable: false,
    ariaLabel: `${n.title}, ${STATUS_META[n.status].label}`,
  }));

  const rfEdges: Edge[] = nodes.flatMap((n) =>
    n.effectiveDeps.map((d) => {
      const src = byId.get(d);
      const cls = done(n) ? "done" : src && done(src) && (n.status === "current" || n.status === "next") ? "route" : n.onRoute && !n.optional && !done(n) && src && !done(src) ? "route" : "";
      return { id: `${d}->${n.id}`, source: d, target: n.id, className: cls, animated: n.status === "current" };
    }),
  );

  return (
    <ReactFlow
      key={layoutKey}
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      maxZoom={1.8}
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneClick={() => onSelect(null)}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--grid-dot)" />
      <Controls showInteractive={false} position="bottom-left" />
      <MiniMap pannable zoomable className="!hidden md:!block" maskColor="oklch(0.155 0.006 265 / 70%)" nodeColor="oklch(0.3 0.02 265)" />
    </ReactFlow>
  );
}
