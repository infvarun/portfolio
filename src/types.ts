import { LucideIcon } from 'lucide-react';

export interface NodeData {
  id: string;
  type: 'profile' | 'experience' | 'skill' | 'project' | 'education' | 'award' | 'contact';
  title: string;
  content: any;
  icon: LucideIcon;
  position: { x: number; y: number };
  connections: string[]; // IDs of nodes this node connects to
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  highlights: string[];
}

export interface Award {
  name: string;
  year: string;
  description: string;
}
