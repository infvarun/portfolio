import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Briefcase, Code, FolderOpen, GraduationCap, Award, Mail,
  Linkedin, Terminal, Database, MessageSquare, X,
  Zap, Send, CheckCircle2
} from 'lucide-react';
import WorkflowCanvas, { type CanvasNode, type CanvasConnection } from './WorkflowCanvas';

// ── Types ──────────────────────────────────────────────────────────────
interface DetailNodeData {
  id: string;
  type: string;
  title: string;
  color: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

// ── Contact Form ───────────────────────────────────────────────────────
const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">Message Sent!</h3>
        <p className="text-zinc-400">Varun will get back to you soon.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-bold transition-all"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Name</label>
        <input
          required
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Your Name"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Message</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
          placeholder="How can I help you?"
        />
      </div>
      <button
        disabled={status === 'sending'}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
      >
        {status === 'sending' ? <Spinner size={20} /> : <Send size={20} />}
        {status === 'sending' ? "SENDING..." : "SEND MESSAGE"}
      </button>
    </form>
  );
};

const Spinner = ({ size }: { size: number }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    <Zap size={size} />
  </motion.div>
);

// ── Detail Panel ───────────────────────────────────────────────────────
const DetailPanel = ({ node, onClose }: { node: DetailNodeData | null; onClose: () => void }) => {
  if (!node) return null;
  const Icon = node.icon;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[100] overflow-y-auto p-8"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition-all"
      >
        <X size={20} />
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${node.color}15`, color: node.color }}
        >
          <Icon size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{node.title}</h2>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">{node.type}</p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 leading-relaxed">
        {node.content}
      </div>
    </motion.div>
  );
};

// ── Portfolio Data ─────────────────────────────────────────────────────
function buildPortfolioData(): { canvasNodes: CanvasNode[]; detailMap: Record<string, DetailNodeData>; connections: CanvasConnection[] } {
  const canvasNodes: CanvasNode[] = [
    { id: 'profile', type: 'profile', title: 'Varun', position: { x: 100, y: 200 }, color: '#3b82f6' },
    { id: 'exp-1', type: 'experience', title: 'Infosys (Current)', position: { x: 420, y: 80 }, color: '#10b981' },
    { id: 'skills', type: 'skills', title: 'Tech Stack', position: { x: 420, y: 260 }, color: '#f59e0b' },
    { id: 'projects', type: 'projects', title: 'Key Projects', position: { x: 740, y: 170 }, color: '#8b5cf6' },
    { id: 'awards', type: 'awards', title: 'Recognition', position: { x: 100, y: 400 }, color: '#ec4899' },
    { id: 'edu', type: 'education', title: 'Education', position: { x: 420, y: 440 }, color: '#06b6d4' },
    { id: 'neo4j', type: 'database', title: 'Knowledge Graph', position: { x: 740, y: 50 }, color: '#4ade80' },
    { id: 'terminal', type: 'system', title: 'System Logs', position: { x: 100, y: 580 }, color: '#a1a1aa' },
    { id: 'contact', type: 'contact', title: 'Get in Touch', position: { x: 740, y: 370 }, color: '#f43f5e' },
  ];

  const detailMap: Record<string, DetailNodeData> = {
    profile: {
      id: 'profile', type: 'profile', title: 'Varun', color: '#3b82f6', icon: User,
      content: (
        <div className="space-y-4">
          <p className="text-lg">Seasoned Technology Lead</p>
          <p>Over 14 years of extensive experience in full-stack software development, architecting and delivering high-impact enterprise solutions.</p>
          <div className="flex gap-4 pt-4">
            <a href="https://www.linkedin.com/in/varunved" target="_blank" rel="noreferrer" className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors text-blue-400">
              <Linkedin size={20} />
            </a>
            <a href="mailto:varunved1108@gmail.com" className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors text-red-400">
              <Mail size={20} />
            </a>
          </div>
        </div>
      ),
    },
    'exp-1': {
      id: 'exp-1', type: 'experience', title: 'Infosys (Current)', color: '#10b981', icon: Briefcase,
      content: (
        <div className="space-y-4">
          <div className="border-l-2 border-emerald-500 pl-4 py-1">
            <h3 className="font-bold text-white">Technology Lead</h3>
            <p className="text-sm text-zinc-500">Sep 2023 - Present | Groton, CT</p>
          </div>
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li>Technical Lead for Clinical IRT (Interactive Response Technology).</li>
            <li>Expertise in Clinical Global Supply (Packaging, Distribution, IRT).</li>
            <li>Mastery of IRT Study design: Visit Scheduling, Dosing, Randomization, and Supply.</li>
            <li>Leading projects through full SDLC—design, architecture, testing, and launch.</li>
            <li>Troubleshooting live production and operational issues with business stakeholders.</li>
          </ul>
        </div>
      ),
    },
    skills: {
      id: 'skills', type: 'skills', title: 'Tech Stack', color: '#f59e0b', icon: Code,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-widest">Core Tech</h4>
            <div className="flex flex-wrap gap-2">
              {['JavaScript (ES6+, TypeScript)', 'React.js', 'Java', 'Python', 'SQL'].map(s => (
                <span key={s} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-widest">AI & Data</h4>
            <div className="flex flex-wrap gap-2">
              {['Generative AI', 'LLM Integration', 'Neo4j', 'Langchain', 'Knowledge Graphs'].map(s => (
                <span key={s} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-widest">Compliance & Ops</h4>
            <div className="flex flex-wrap gap-2">
              {['GMP/GxP Compliance', 'SLA Adherence', 'ServiceNow', 'ALM Tools', 'Agile'].map(s => (
                <span key={s} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-300">{s}</span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    projects: {
      id: 'projects', type: 'projects', title: 'Key Projects', color: '#8b5cf6', icon: FolderOpen,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <h4 className="font-bold text-white mb-2">AI Knowledge Graph</h4>
            <p className="text-xs text-zinc-400">Building solutions using Python, Neo4j, ReactJs, and LLM to get precise results for Clinical study use cases.</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <h4 className="font-bold text-white mb-2">Clinical Trial IRT System</h4>
            <p className="text-xs text-zinc-400">Architected validated IRT solutions for patient randomization and supply management using Angular, Java, and MS SQL.</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <h4 className="font-bold text-white mb-2">MDM Tool</h4>
            <p className="text-xs text-zinc-400">Implemented SSO with OAuth2 and features for bulk data manipulation via REST APIs.</p>
          </div>
        </div>
      ),
    },
    awards: {
      id: 'awards', type: 'awards', title: 'Recognition', color: '#ec4899', icon: Award,
      content: (
        <div className="space-y-4">
          {[
            { name: 'Insta Award Q2 2025', desc: 'Agentic AI use cases for IRT' },
            { name: 'Insta Award Q1 2025', desc: 'Generative AI for Clinical IRT' },
            { name: 'Delivery Star 2021', desc: 'Successful critical project delivery' },
            { name: 'Pfizer Champ 2017', desc: 'Exceptional performance award' },
          ].map((a, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="mt-1 p-1 bg-pink-500/10 text-pink-500 rounded">
                <Award size={14} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{a.name}</h4>
                <p className="text-xs text-zinc-500">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    edu: {
      id: 'edu', type: 'education', title: 'Education', color: '#06b6d4', icon: GraduationCap,
      content: (
        <div className="space-y-6">
          <div className="relative pl-6 border-l border-zinc-800">
            <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-cyan-500" />
            <h4 className="font-bold text-white">Master of Computer Applications</h4>
            <p className="text-sm text-zinc-400">Visveswaraya Technological University</p>
            <p className="text-xs text-zinc-500">2010 - 2013</p>
          </div>
          <div className="relative pl-6 border-l border-zinc-800">
            <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-zinc-700" />
            <h4 className="font-bold text-white">Bachelor of Business Administration</h4>
            <p className="text-sm text-zinc-400">IIMT Engineering College</p>
            <p className="text-xs text-zinc-500">2006 - 2009</p>
          </div>
        </div>
      ),
    },
    neo4j: {
      id: 'neo4j', type: 'database', title: 'Knowledge Graph', color: '#4ade80', icon: Database,
      content: (
        <div className="space-y-4">
          <p className="text-sm">Expertise in Neo4j and Clinical Knowledge Graphs.</p>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-[10px] text-emerald-500">
            MATCH (p:Patient)-[:HAS_TRIAL]-&gt;(t:Trial)<br />
            WHERE t.status = 'ACTIVE'<br />
            RETURN p.id, t.name
          </div>
          <p className="text-xs text-zinc-500">Fine-tuning Clinical Knowledge Graphs for optimized IRT workflows.</p>
        </div>
      ),
    },
    terminal: {
      id: 'terminal', type: 'system', title: 'System Logs', color: '#a1a1aa', icon: Terminal,
      content: (
        <div className="bg-black p-4 rounded-lg font-mono text-[10px] space-y-1 h-64 overflow-y-auto">
          <p className="text-blue-400">[SYSTEM] Initializing Varun_OS v2.5.0...</p>
          <p className="text-zinc-500">08:00:01 Loading core_competencies.so...</p>
          <p className="text-zinc-500">08:00:02 Research & Development [OK]</p>
          <p className="text-zinc-500">08:00:03 Solution Design [OK]</p>
          <p className="text-zinc-500">08:00:04 Full-Stack Architecture [OK]</p>
          <p className="text-zinc-500">08:00:05 Team Leadership [OK]</p>
          <p className="text-emerald-400 mt-2">08:00:10 Fetching awards...</p>
          <p className="text-zinc-400"> - Star Award (Infosys) Q1 2015</p>
          <p className="text-zinc-400"> - Insta Award Q1 2024</p>
          <p className="text-zinc-400"> - Insta Award Q2 2025</p>
          <p className="text-blue-400 mt-2">08:00:15 Connecting to LinkedIn API...</p>
          <p className="text-emerald-400">08:00:16 Connection established.</p>
          <p className="text-zinc-500 mt-2">08:00:20 Ready for interaction.</p>
          <div className="flex gap-1 mt-2">
            <span className="text-emerald-500">varun@portfolio:~$</span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-4 bg-emerald-500 inline-block"
            />
          </div>
        </div>
      ),
    },
    contact: {
      id: 'contact', type: 'contact', title: 'Get in Touch', color: '#f43f5e', icon: MessageSquare,
      content: <ContactForm />,
    },
  };

  const connections: CanvasConnection[] = [
    { from: 'profile', to: 'exp-1' },
    { from: 'profile', to: 'skills' },
    { from: 'profile', to: 'awards' },
    { from: 'exp-1', to: 'projects' },
    { from: 'skills', to: 'projects' },
    { from: 'skills', to: 'edu' },
    { from: 'skills', to: 'neo4j' },
    { from: 'profile', to: 'terminal' },
    { from: 'profile', to: 'contact' },
  ];

  return { canvasNodes, detailMap, connections };
}

// ── Main Workbench ─────────────────────────────────────────────────────
export default function Workbench() {
  const [portfolioData] = useState(() => buildPortfolioData());
  const [nodes, setNodes] = useState<CanvasNode[]>(portfolioData.canvasNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  const handleNodeDrag = useCallback((id: string, pos: { x: number; y: number }) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position: pos } : n));
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedDetail = selectedNodeId ? portfolioData.detailMap[selectedNodeId] : null;

  return (
    <div className="relative w-full h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Canvas Workflow */}
      <WorkflowCanvas
        nodes={nodes}
        connections={portfolioData.connections}
        selectedNodeId={selectedNodeId}
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDrag}
        onCanvasClick={handleCanvasClick}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-14 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl flex items-center justify-between px-6 z-50 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Terminal size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">VARUN · PORTFOLIO</h1>
            <p className="text-[10px] text-zinc-500 tracking-widest font-medium">CANVAS WORKFLOW</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold hidden sm:block">
            Click a node to explore · Scroll to zoom · Drag to pan
          </span>
        </div>
      </header>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedNodeId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNodeId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <DetailPanel node={selectedDetail} onClose={() => setSelectedNodeId(null)} />
          </>
        )}
      </AnimatePresence>

      {/* Minimap hint */}
      <div className="absolute bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{nodes.length} Nodes · {portfolioData.connections.length} Connections</span>
      </div>
    </div>
  );
}
