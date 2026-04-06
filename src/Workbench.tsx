import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  User, Briefcase, Code, FolderOpen, GraduationCap, Award, Mail, 
  Linkedin, Github, ExternalLink, Play, Settings, Plus, Trash2, 
  Save, MessageSquare, ChevronRight, X, Terminal,
  Cpu, Database, Layout, Globe, Search, Shield, Zap, Send, CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface NodePosition {
  x: number;
  y: number;
}

interface NodeData {
  id: string;
  type: string;
  title: string;
  icon: React.ElementType;
  position: NodePosition;
  content: React.ReactNode;
  color: string;
}

interface Connection {
  from: string;
  to: string;
}

interface WorkbenchProps {
}

// --- Components ---

const GridBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div 
      className="absolute inset-0 opacity-[0.03]" 
      style={{ 
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} 
    />
    <div 
      className="absolute inset-0 opacity-[0.05]" 
      style={{ 
        backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', 
        backgroundSize: '200px 200px' 
      }} 
    />
  </div>
);

const ConnectionLine: React.FC<{ from: string, to: string, nodes: NodeData[] }> = ({ from, to, nodes }) => {
  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);

  if (!fromNode || !toNode) return null;

  const x1 = fromNode.position.x + 100; // Half width
  const y1 = fromNode.position.y + 40;  // Half height
  const x2 = toNode.position.x + 100;
  const y2 = toNode.position.y + 40;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dr = Math.sqrt(dx * dx + dy * dy);

  // Bezier curve path
  const path = `M ${x1} ${y1} C ${x1 + dx / 2} ${y1}, ${x1 + dx / 2} ${y2}, ${x2} ${y2}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="2"
        className="transition-all duration-300"
      />
      <motion.path
        d={path}
        fill="none"
        stroke={fromNode.color}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "linear" }}
      />
    </g>
  );
};

const Node: React.FC<{ 
  node: NodeData, 
  onDrag: (id: string, pos: NodePosition) => void, 
  onClick: (id: string) => void,
  isSelected: boolean
}> = ({ 
  node, 
  onDrag, 
  onClick, 
  isSelected 
}) => {
  const Icon = node.icon;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDrag={(_, info) => {
        onDrag(node.id, { x: node.position.x + info.delta.x, y: node.position.y + info.delta.y });
      }}
      initial={node.position}
      animate={node.position}
      onClick={() => onClick(node.id)}
      className={cn(
        "absolute w-48 h-20 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl cursor-grab active:cursor-grabbing flex items-center px-4 gap-3 group transition-all duration-300",
        isSelected ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "hover:border-zinc-600"
      )}
      style={{ zIndex: isSelected ? 50 : 10 }}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
        style={{ backgroundColor: `${node.color}20`, color: node.color }}
      >
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{node.type}</span>
        <span className="text-sm font-medium text-zinc-200 truncate w-28">{node.title}</span>
      </div>
      
      {/* Ports */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-900" />
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-900 group-hover:bg-blue-500 transition-colors" />
    </motion.div>
  );
};

const DetailPanel = ({ node, onClose }: { node: NodeData | null, onClose: () => void }) => {
  if (!node) return null;

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
          <node.icon size={32} />
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

const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // TODO: wire up to a backend endpoint or email service
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
        {status === 'sending' ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        {status === 'sending' ? "SENDING..." : "SEND MESSAGE"}
      </button>
    </form>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <motion.div 
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className={className}
  >
    <Zap size={size} />
  </motion.div>
);

// --- Main App ---

export default function Workbench() {
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: 'profile',
      type: 'profile',
      title: 'Varun',
      icon: User,
      position: { x: 100, y: 100 },
      color: '#3b82f6',
      content: (
        <div className="space-y-4">
          <p className="text-lg">Seasoned Technology Lead</p>
          <p>Over 14 years of extensive experience in full-stack software development, architecting and delivering high-impact enterprise solutions.</p>
          <div className="flex gap-4 pt-4">
            <a href="https://www.linkedin.com/in/varunved" target="_blank" className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors text-blue-400">
              <Linkedin size={20} />
            </a>
            <a href="mailto:varunved1108@gmail.com" className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors text-red-400">
              <Mail size={20} />
            </a>
          </div>
        </div>
      )
    },
    {
      id: 'exp-1',
      type: 'experience',
      title: 'Infosys (Current)',
      icon: Briefcase,
      position: { x: 400, y: 50 },
      color: '#10b981',
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
      )
    },
    {
      id: 'skills',
      type: 'skills',
      title: 'Tech Stack',
      icon: Code,
      position: { x: 400, y: 200 },
      color: '#f59e0b',
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
      )
    },
    {
      id: 'projects',
      type: 'projects',
      title: 'Key Projects',
      icon: FolderOpen,
      position: { x: 700, y: 125 },
      color: '#8b5cf6',
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
      )
    },
    {
      id: 'awards',
      type: 'awards',
      title: 'Recognition',
      icon: Award,
      position: { x: 100, y: 300 },
      color: '#ec4899',
      content: (
        <div className="space-y-4">
          {[
            { name: 'Insta Award Q2 2025', desc: 'Agentic AI use cases for IRT' },
            { name: 'Insta Award Q1 2025', desc: 'Generative AI for Clinical IRT' },
            { name: 'Delivery Star 2021', desc: 'Successful critical project delivery' },
            { name: 'Pfizer Champ 2017', desc: 'Exceptional performance award' }
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
      )
    },
    {
      id: 'edu',
      type: 'education',
      title: 'Education',
      icon: GraduationCap,
      position: { x: 400, y: 350 },
      color: '#06b6d4',
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
      )
    },
    {
      id: 'neo4j',
      type: 'database',
      title: 'Knowledge Graph',
      icon: Database,
      position: { x: 700, y: 50 },
      color: '#4ade80',
      content: (
        <div className="space-y-4">
          <p className="text-sm">Expertise in Neo4j and Clinical Knowledge Graphs.</p>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-[10px] text-emerald-500">
            MATCH (p:Patient)-[:HAS_TRIAL]-&gt;(t:Trial)<br/>
            WHERE t.status = 'ACTIVE'<br/>
            RETURN p.id, t.name
          </div>
          <p className="text-xs text-zinc-500">Fine-tuning Clinical Knowledge Graphs for optimized IRT workflows.</p>
        </div>
      )
    },
    {
      id: 'terminal',
      type: 'system',
      title: 'System Logs',
      icon: Terminal,
      position: { x: 100, y: 450 },
      color: '#a1a1aa',
      content: (
        <div className="bg-black p-4 rounded-lg font-mono text-[10px] space-y-1 h-64 overflow-y-auto custom-scrollbar">
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
              className="w-2 h-4 bg-emerald-500"
            />
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      type: 'contact',
      title: 'Get in Touch',
      icon: MessageSquare,
      position: { x: 700, y: 300 },
      color: '#f43f5e',
      content: <ContactForm />
    }
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { from: 'profile', to: 'exp-1' },
    { from: 'profile', to: 'skills' },
    { from: 'profile', to: 'awards' },
    { from: 'exp-1', to: 'projects' },
    { from: 'skills', to: 'projects' },
    { from: 'skills', to: 'edu' },
    { from: 'skills', to: 'neo4j' },
    { from: 'profile', to: 'terminal' },
    { from: 'profile', to: 'contact' },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const workbenchRef = useRef<HTMLDivElement>(null);

  // Center the node graph in the viewport on initial render
  useLayoutEffect(() => {
    if (!workbenchRef.current) return;
    const rect = workbenchRef.current.getBoundingClientRect();
    const HEADER_HEIGHT = 64;
    const NODE_WIDTH = 192; // w-48
    const NODE_HEIGHT = 80; // h-20

    setNodes(prev => {
      if (prev.length === 0) return prev;
      const xs = prev.map(n => n.position.x);
      const ys = prev.map(n => n.position.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs) + NODE_WIDTH;
      const maxY = Math.max(...ys) + NODE_HEIGHT;

      const graphCenterX = (minX + maxX) / 2;
      const graphCenterY = (minY + maxY) / 2;

      const canvasCenterX = rect.width / 2;
      const canvasCenterY = HEADER_HEIGHT + (rect.height - HEADER_HEIGHT) / 2;

      const offsetX = canvasCenterX - graphCenterX;
      const offsetY = canvasCenterY - graphCenterY;

      return prev.map(n => ({
        ...n,
        position: {
          x: n.position.x + offsetX,
          y: n.position.y + offsetY,
        },
      }));
    });
  }, []);

  const handleDrag = (id: string, pos: NodePosition) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position: pos } : n));
  };

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id);
  };

  const runPortfolio = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setExecutionStatus('running');
    setActiveNodeIndex(-1);

    // Simulate a sequence of node activations
    const sequence = [0, 1, 3, 6, 2, 5, 4, 7]; // Indices of nodes to highlight
    
    for (const index of sequence) {
      setActiveNodeIndex(index);
      // Add a small pulse effect to the active node
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setActiveNodeIndex(-1);
    setExecutionStatus('success');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExecuting(false);
    setExecutionStatus('idle');
    
    // Automatically open the profile node at the end
    setSelectedNodeId('profile');
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="relative w-full h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <GridBackground />

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Terminal size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">VARUN_WORKBENCH_V2</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={runPortfolio}
            disabled={isExecuting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              isExecuting 
                ? "bg-zinc-900 text-zinc-500 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            )}
          >
            {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isExecuting ? "EXECUTING..." : "RUN WORKFLOW"}
          </button>
          <div className="h-6 w-[1px] bg-zinc-800 mx-2" />
          
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-all">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar Tools */}
      <aside className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
        {[
          { icon: Plus, label: 'Add Node' },
          { icon: Layout, label: 'Auto Layout' },
          { icon: Search, label: 'Search' },
          { icon: Shield, label: 'Security' },
          { icon: Database, label: 'Data' },
        ].map((tool, i) => (
          <button 
            key={i}
            onClick={tool.action}
            className="group relative p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800 transition-all"
          >
            <tool.icon size={20} className="text-zinc-400 group-hover:text-white" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap uppercase tracking-widest font-bold">
              {tool.label}
            </span>
          </button>
        ))}
      </aside>

      {/* Workbench Canvas */}
      <div 
        ref={workbenchRef}
        className="absolute inset-0 overflow-hidden cursor-crosshair z-0"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((conn, i) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            const isActive = isExecuting && 
              nodes.findIndex(n => n.id === conn.from) === activeNodeIndex;

            return (
              <React.Fragment key={i}>
                <ConnectionLine from={conn.from} to={conn.to} nodes={nodes} />
                {isActive && (
                  <motion.path
                    d={`M ${fromNode!.position.x + 100} ${fromNode!.position.y + 40} C ${fromNode!.position.x + 100 + (toNode!.position.x - fromNode!.position.x) / 2} ${fromNode!.position.y + 40}, ${fromNode!.position.x + 100 + (toNode!.position.x - fromNode!.position.x) / 2} ${toNode!.position.y + 40}, ${toNode!.position.x + 100} ${toNode!.position.y + 40}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </svg>

        {nodes.map((node, index) => (
          <Node 
            key={node.id} 
            node={node} 
            onDrag={handleDrag} 
            onClick={handleNodeClick}
            isSelected={selectedNodeId === node.id || activeNodeIndex === index}
          />
        ))}
      </div>

      {/* Execution Overlay */}
      <AnimatePresence>
        {isExecuting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px] z-[60] flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-6">
              {executionStatus === 'running' ? (
                <>
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Terminal size={32} className="text-emerald-500" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white tracking-tight">Compiling Portfolio...</h3>
                    <p className="text-zinc-400 text-sm font-mono mt-2">Fetching Varun's experience data from clinical_db...</p>
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4 bg-zinc-900/90 border border-emerald-500/50 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Deployment Successful</h3>
                    <p className="text-zinc-400 text-sm font-mono mt-2">Varun's professional workbench is now live.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <DetailPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
          </>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="absolute bottom-6 right-6 flex items-center gap-6 z-40">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" className="w-full h-full object-cover grayscale" />
              </div>
            ))}
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">3 Collaborators Active</span>
        </div>
        
        <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Cpu size={12} />
            <span>CPU: 12%</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <Globe size={12} />
            <span>Latency: 24ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
