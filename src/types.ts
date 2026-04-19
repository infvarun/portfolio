export interface CanvasNodeData {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  color: string;
}

export interface CanvasConnectionData {
  from: string;
  to: string;
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
