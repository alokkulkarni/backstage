// This file is kept for reference but is not currently being used
// To use this data, you'll need to install @backstage/plugin-tech-radar
// and update App.tsx accordingly

// Mock types to avoid import errors
// Interfaces are exported to prevent 'declared but never used' errors
export interface TechRadarApi {
  load(): Promise<TechRadarLoaderResponse>;
}

export interface TechRadarLoaderResponse {
  quadrants: { id: string; name: string }[];
  rings: { id: string; name: string; color: string }[];
  entries: {
    id: string;
    title: string;
    quadrant: string;
    ring: string;
    moved: number;
    description: string;
  }[];
}

export const techRadarData: TechRadarLoaderResponse = {
  quadrants: [
    { id: 'languages', name: 'Languages' },
    { id: 'platforms', name: 'Platforms' },
    { id: 'frameworks', name: 'Frameworks & Libraries' },
    { id: 'tools', name: 'Tools' },
  ],
  rings: [
    { id: 'adopt', name: 'ADOPT', color: '#93c47d' },
    { id: 'trial', name: 'TRIAL', color: '#93d2c2' },
    { id: 'assess', name: 'ASSESS', color: '#fbdb84' },
    { id: 'hold', name: 'HOLD', color: '#efafa9' },
  ],
  entries: [
    // Languages
    {
      id: 'typescript',
      title: 'TypeScript',
      quadrant: 'languages',
      ring: 'adopt',
      moved: 0,
      description:
        'TypeScript is our primary language for frontend and backend development, providing strong typing for JavaScript.',
    },
    {
      id: 'python',
      title: 'Python',
      quadrant: 'languages',
      ring: 'adopt',
      moved: 0,
      description:
        'Python is used for data processing, scripts, and machine learning applications.',
    },
    {
      id: 'go',
      title: 'Go',
      quadrant: 'languages',
      ring: 'trial',
      moved: 1,
      description:
        'Go is being evaluated for performance-critical microservices.',
    },
    {
      id: 'rust',
      title: 'Rust',
      quadrant: 'languages',
      ring: 'assess',
      moved: 0,
      description:
        'Rust is being assessed for systems programming and performance-critical components.',
    },
    {
      id: 'perl',
      title: 'Perl',
      quadrant: 'languages',
      ring: 'hold',
      moved: 0,
      description:
        'Legacy scripts should be migrated away from Perl to more maintainable languages.',
    },

    // Platforms
    {
      id: 'kubernetes',
      title: 'Kubernetes',
      quadrant: 'platforms',
      ring: 'adopt',
      moved: 0,
      description:
        'Our primary container orchestration platform for all services.',
    },
    {
      id: 'aws',
      title: 'AWS',
      quadrant: 'platforms',
      ring: 'adopt',
      moved: 0,
      description: 'Primary cloud provider for infrastructure.',
    },
    {
      id: 'azure',
      title: 'Azure',
      quadrant: 'platforms',
      ring: 'trial',
      moved: 0,
      description:
        'Secondary cloud provider being evaluated for specific workloads.',
    },
    {
      id: 'gcp',
      title: 'Google Cloud Platform',
      quadrant: 'platforms',
      ring: 'assess',
      moved: 0,
      description: 'Being assessed for specialized ML/AI workloads.',
    },
    {
      id: 'bare-metal',
      title: 'Bare Metal Servers',
      quadrant: 'platforms',
      ring: 'hold',
      moved: -1,
      description:
        'Legacy infrastructure that should be migrated to cloud or containerized environments.',
    },

    // Frameworks & Libraries
    {
      id: 'react',
      title: 'React',
      quadrant: 'frameworks',
      ring: 'adopt',
      moved: 0,
      description:
        'Primary frontend framework for building user interfaces.',
    },
    {
      id: 'nestjs',
      title: 'NestJS',
      quadrant: 'frameworks',
      ring: 'adopt',
      moved: 1,
      description:
        'Recommended framework for TypeScript-based backend services.',
    },
    {
      id: 'fastapi',
      title: 'FastAPI',
      quadrant: 'frameworks',
      ring: 'trial',
      moved: 0,
      description: 'Python web framework for microservices and APIs.',
    },
    {
      id: 'svelte',
      title: 'Svelte',
      quadrant: 'frameworks',
      ring: 'assess',
      moved: 1,
      description:
        'Being evaluated for smaller, performance-critical frontend applications.',
    },
    {
      id: 'angularjs',
      title: 'AngularJS (v1.x)',
      quadrant: 'frameworks',
      ring: 'hold',
      moved: 0,
      description:
        'Legacy frontend framework that should be migrated to modern alternatives.',
    },

    // Tools
    {
      id: 'github-actions',
      title: 'GitHub Actions',
      quadrant: 'tools',
      ring: 'adopt',
      moved: 1,
      description: 'Primary CI/CD tool for all repositories.',
    },
    {
      id: 'argocd',
      title: 'ArgoCD',
      quadrant: 'tools',
      ring: 'adopt',
      moved: 0,
      description: 'GitOps continuous delivery tool for Kubernetes.',
    },
    {
      id: 'sonarqube',
      title: 'SonarQube',
      quadrant: 'tools',
      ring: 'adopt',
      moved: 0,
      description: 'Code quality and security scanning tool.',
    },
    {
      id: 'nexus-iq',
      title: 'Nexus IQ',
      quadrant: 'tools',
      ring: 'trial',
      moved: 0,
      description: 'Software composition analysis for dependency scanning.',
    },
    {
      id: 'jenkins',
      title: 'Jenkins',
      quadrant: 'tools',
      ring: 'hold',
      moved: -1,
      description:
        'Legacy CI tool that should be migrated to GitHub Actions.',
    },
  ],
};