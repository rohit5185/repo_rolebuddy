// ── Role Ecosystem Data ───────────────────────────────────────────────────────
// This module defines all static role ecosystem data for role detail pages.
// Data is curated, preparation-focused, and entirely anonymous.
// No PII is stored or exposed here.

export type JourneyStage = {
  step: number;
  title: string;
  description: string;
  focus: string[];
};

export type PreparationSignal = {
  id: string;
  text: string;
  count: number;
};

export type RoleData = {
  slug: string;
  title: string;
  ecosystemLabel: string;
  summary: string;
  color: string;
  totalAspirants: number;
  activeToday: number;
  growthPercent: number;
  skills: string[];
  commonGoals: string[];
  journeyStages: JourneyStage[];
  signals: PreparationSignal[];
  relatedSlugs: string[];
};

// ── Canonical Role Registry ───────────────────────────────────────────────────

export const ROLE_REGISTRY: Record<string, RoleData> = {
  "backend-nodejs-engineer": {
    slug: "backend-nodejs-engineer",
    title: "Backend Node.js Engineer",
    ecosystemLabel: "Server-side",
    summary:
      "Master scalable APIs, database design and server architecture. Backend engineers build the systems that power every product — from REST APIs to real-time WebSocket servers.",
    color: "#3b2ae1",
    totalAspirants: 2340,
    activeToday: 381,
    growthPercent: 18,
    skills: [
      "Node.js", "Express.js", "REST APIs", "MongoDB", "PostgreSQL",
      "JWT Auth", "WebSockets", "Redis", "Docker", "API Design",
    ],
    commonGoals: [
      "Solve 2 DSA problems daily",
      "Revise backend system design concepts",
      "Build a REST API project",
      "Practice mock interviews",
      "Apply to 5 companies",
    ],
    journeyStages: [
      {
        step: 1,
        title: "Learning Fundamentals",
        description: "Core Node.js, async patterns, and database basics",
        focus: ["Node.js", "Express.js", "MongoDB", "SQL basics"],
      },
      {
        step: 2,
        title: "Building Projects",
        description: "Hands-on APIs and backend systems from scratch",
        focus: ["REST APIs", "Authentication", "CRUD apps", "Docker"],
      },
      {
        step: 3,
        title: "System Design",
        description: "Designing scalable, production-grade architectures",
        focus: ["DB design", "Caching", "Load balancing", "Microservices"],
      },
      {
        step: 4,
        title: "Interview Preparation",
        description: "DSA, behavioral questions and system design rounds",
        focus: ["DSA", "LeetCode", "Mock interviews", "STAR method"],
      },
      {
        step: 5,
        title: "Active Applications",
        description: "Applying, iterating on rejections and getting offers",
        focus: ["Resume polish", "Referrals", "Offer negotiation"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 47 },
      { id: "s2", text: "revising system design concepts", count: 23 },
      { id: "s3", text: "practicing mock API interviews", count: 14 },
      { id: "s4", text: "solving DSA problems right now", count: 31 },
      { id: "s5", text: "building backend projects this week", count: 18 },
    ],
    relatedSlugs: ["backend-python-engineer", "fullstack-developer", "devops-engineer"],
  },

  "frontend-react-engineer": {
    slug: "frontend-react-engineer",
    title: "Frontend React Engineer",
    ecosystemLabel: "UI Engineering",
    summary:
      "Build modern, performant user interfaces using React and the broader JS ecosystem. Frontend engineers craft the experiences users interact with every day.",
    color: "#0ea5e9",
    totalAspirants: 3120,
    activeToday: 512,
    growthPercent: 24,
    skills: [
      "React", "TypeScript", "Next.js", "Tailwind CSS", "JavaScript",
      "HTML/CSS", "State Management", "Testing", "Performance", "Accessibility",
    ],
    commonGoals: [
      "Build a React portfolio project",
      "Solve 1–2 frontend coding challenges",
      "Revise component design patterns",
      "Practice UI/UX interview questions",
      "Apply to 5 frontend roles",
    ],
    journeyStages: [
      {
        step: 1,
        title: "HTML/CSS/JS Mastery",
        description: "Strong fundamentals before touching any framework",
        focus: ["HTML5", "CSS3", "Vanilla JS", "DOM manipulation"],
      },
      {
        step: 2,
        title: "React Ecosystem",
        description: "Components, state, hooks and advanced React patterns",
        focus: ["React", "TypeScript", "Hooks", "Context API"],
      },
      {
        step: 3,
        title: "Building Products",
        description: "Ship real projects: portfolio, clones, side projects",
        focus: ["Next.js", "Tailwind", "API integration", "Deployment"],
      },
      {
        step: 4,
        title: "Interview Preparation",
        description: "Frontend system design, coding rounds and behavioral",
        focus: ["Frontend system design", "LeetCode", "Mock interviews"],
      },
      {
        step: 5,
        title: "Active Applications",
        description: "Targeted job search with a polished portfolio",
        focus: ["Resume", "GitHub presence", "Portfolio site"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 89 },
      { id: "s2", text: "building React portfolio projects", count: 42 },
      { id: "s3", text: "practicing JavaScript interview questions", count: 34 },
      { id: "s4", text: "revising TypeScript concepts", count: 27 },
      { id: "s5", text: "applying to frontend roles this week", count: 19 },
    ],
    relatedSlugs: ["fullstack-developer", "backend-nodejs-engineer", "ml-engineer"],
  },

  "data-analyst": {
    slug: "data-analyst",
    title: "Data Analyst",
    ecosystemLabel: "Data & Insights",
    summary:
      "Transform raw data into business decisions. Data analysts work with SQL, Python and visualization tools to uncover insights that drive strategy.",
    color: "#10b981",
    totalAspirants: 1870,
    activeToday: 294,
    growthPercent: 31,
    skills: [
      "SQL", "Python", "Excel", "Tableau", "Power BI",
      "Statistics", "Data Cleaning", "Pandas", "NumPy", "Data Storytelling",
    ],
    commonGoals: [
      "Practice 3 SQL queries daily",
      "Complete a data analysis project",
      "Revise statistics fundamentals",
      "Learn a new visualization technique",
      "Apply to 5 analyst positions",
    ],
    journeyStages: [
      {
        step: 1,
        title: "SQL & Statistics",
        description: "Master querying and basic statistical thinking",
        focus: ["SQL", "Aggregations", "Joins", "Basic statistics"],
      },
      {
        step: 2,
        title: "Python for Data",
        description: "Pandas, NumPy and exploratory data analysis",
        focus: ["Python", "Pandas", "NumPy", "EDA"],
      },
      {
        step: 3,
        title: "Visualization",
        description: "Communicating data stories with visual tools",
        focus: ["Tableau", "Power BI", "Matplotlib", "Seaborn"],
      },
      {
        step: 4,
        title: "Case Studies & Projects",
        description: "Real-world analysis projects to build portfolio",
        focus: ["Kaggle datasets", "Business case analysis", "Dashboard building"],
      },
      {
        step: 5,
        title: "Interview Preparation",
        description: "SQL tests, case interviews and behavioral rounds",
        focus: ["SQL interviews", "Case studies", "A/B testing concepts"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 61 },
      { id: "s2", text: "practicing SQL challenges", count: 38 },
      { id: "s3", text: "building Tableau dashboards", count: 19 },
      { id: "s4", text: "working on Kaggle datasets", count: 24 },
      { id: "s5", text: "preparing for case interviews", count: 12 },
    ],
    relatedSlugs: ["data-engineer", "ml-engineer", "backend-python-engineer"],
  },

  "fullstack-developer": {
    slug: "fullstack-developer",
    title: "Full Stack Developer",
    ecosystemLabel: "Full Stack",
    summary:
      "Own the entire product stack — frontend to backend, database to deployment. Full stack developers are versatile engineers who ship end-to-end features.",
    color: "#8b5cf6",
    totalAspirants: 2780,
    activeToday: 443,
    growthPercent: 21,
    skills: [
      "React", "Node.js", "PostgreSQL", "MongoDB", "TypeScript",
      "REST APIs", "Docker", "CI/CD", "Authentication", "Deployment",
    ],
    commonGoals: [
      "Build a full-stack side project",
      "Implement authentication end-to-end",
      "Revise both frontend and backend concepts",
      "Deploy a project to production",
      "Apply to full-stack roles",
    ],
    journeyStages: [
      {
        step: 1,
        title: "Frontend Foundations",
        description: "React, HTML, CSS and JavaScript essentials",
        focus: ["React", "JavaScript", "HTML/CSS", "TypeScript"],
      },
      {
        step: 2,
        title: "Backend Foundations",
        description: "Node.js, databases and API design",
        focus: ["Node.js", "Express", "SQL/NoSQL", "REST APIs"],
      },
      {
        step: 3,
        title: "Full Stack Integration",
        description: "Connecting frontend and backend seamlessly",
        focus: ["Authentication", "State sync", "Error handling", "Testing"],
      },
      {
        step: 4,
        title: "Production & DevOps",
        description: "Docker, CI/CD and cloud deployment basics",
        focus: ["Docker", "GitHub Actions", "AWS/Vercel", "Monitoring"],
      },
      {
        step: 5,
        title: "Interview Preparation",
        description: "System design, coding rounds and full-stack problem-solving",
        focus: ["System design", "DSA", "Mock interviews"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 74 },
      { id: "s2", text: "building end-to-end projects", count: 41 },
      { id: "s3", text: "revising both frontend and backend", count: 29 },
      { id: "s4", text: "deploying to production for the first time", count: 16 },
      { id: "s5", text: "practicing system design", count: 22 },
    ],
    relatedSlugs: ["frontend-react-engineer", "backend-nodejs-engineer", "devops-engineer"],
  },

  "devops-engineer": {
    slug: "devops-engineer",
    title: "DevOps Engineer",
    ecosystemLabel: "Infrastructure",
    summary:
      "Automate, scale and secure infrastructure. DevOps engineers bridge development and operations with cloud platforms, containerization and CI/CD pipelines.",
    color: "#f59e0b",
    totalAspirants: 1240,
    activeToday: 186,
    growthPercent: 22,
    skills: [
      "Kubernetes", "Docker", "AWS", "Terraform", "CI/CD",
      "Linux", "Ansible", "GitHub Actions", "Monitoring", "Bash scripting",
    ],
    commonGoals: [
      "Set up a CI/CD pipeline",
      "Deploy with Kubernetes locally",
      "Revise AWS service concepts",
      "Practice infrastructure-as-code",
      "Apply to DevOps/SRE roles",
    ],
    journeyStages: [
      {
        step: 1,
        title: "Linux & Networking",
        description: "OS fundamentals, bash scripting and networking",
        focus: ["Linux", "Bash", "Networking", "SSH"],
      },
      {
        step: 2,
        title: "Containerization",
        description: "Docker, container orchestration and image building",
        focus: ["Docker", "Docker Compose", "Container registries"],
      },
      {
        step: 3,
        title: "Cloud Platforms",
        description: "AWS/GCP/Azure services and cloud-native patterns",
        focus: ["AWS EC2", "S3", "IAM", "Lambda", "RDS"],
      },
      {
        step: 4,
        title: "CI/CD & Automation",
        description: "Automated pipelines and infrastructure-as-code",
        focus: ["GitHub Actions", "Terraform", "Ansible", "Jenkins"],
      },
      {
        step: 5,
        title: "Kubernetes & Observability",
        description: "Orchestration, monitoring and production reliability",
        focus: ["Kubernetes", "Prometheus", "Grafana", "Logging"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 33 },
      { id: "s2", text: "setting up Kubernetes clusters", count: 14 },
      { id: "s3", text: "practicing Terraform scripts", count: 19 },
      { id: "s4", text: "revising AWS architecture patterns", count: 21 },
      { id: "s5", text: "working on CI/CD pipelines", count: 11 },
    ],
    relatedSlugs: ["backend-nodejs-engineer", "fullstack-developer", "backend-python-engineer"],
  },

  "ml-engineer": {
    slug: "ml-engineer",
    title: "ML Engineer",
    ecosystemLabel: "AI / ML",
    summary:
      "Build intelligent systems that learn from data. ML engineers combine software engineering with machine learning to deploy models at scale.",
    color: "#ec4899",
    totalAspirants: 1560,
    activeToday: 248,
    growthPercent: 47,
    skills: [
      "Python", "PyTorch", "TensorFlow", "NumPy", "Pandas",
      "Scikit-learn", "MLOps", "LLMs", "Feature Engineering", "Model Deployment",
    ],
    commonGoals: [
      "Implement a model from scratch",
      "Complete a Kaggle competition",
      "Read and summarize an ML paper",
      "Build a model serving API",
      "Apply to ML engineer / research roles",
    ],
    journeyStages: [
      {
        step: 1,
        title: "Math & Python",
        description: "Linear algebra, statistics and Python fundamentals",
        focus: ["Linear algebra", "Statistics", "Python", "NumPy"],
      },
      {
        step: 2,
        title: "ML Fundamentals",
        description: "Classical algorithms, loss functions and training loops",
        focus: ["Scikit-learn", "Supervised learning", "Regression", "Classification"],
      },
      {
        step: 3,
        title: "Deep Learning",
        description: "Neural networks, CNNs, transformers and NLP",
        focus: ["PyTorch", "TensorFlow", "CNNs", "Transformers"],
      },
      {
        step: 4,
        title: "MLOps & Deployment",
        description: "Taking models to production environments",
        focus: ["MLflow", "Model serving", "Docker", "API deployment"],
      },
      {
        step: 5,
        title: "Research & Applications",
        description: "Applying SOTA techniques to real-world problems",
        focus: ["LLMs", "Fine-tuning", "Kaggle", "Research papers"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 41 },
      { id: "s2", text: "training models on Kaggle", count: 22 },
      { id: "s3", text: "studying transformer architecture", count: 17 },
      { id: "s4", text: "building model deployment pipelines", count: 13 },
      { id: "s5", text: "reading ML research papers", count: 9 },
    ],
    relatedSlugs: ["data-analyst", "data-engineer", "backend-python-engineer"],
  },

  "backend-python-engineer": {
    slug: "backend-python-engineer",
    title: "Backend Python Engineer",
    ecosystemLabel: "Server-side",
    summary:
      "Build robust, high-performance backend systems using Python's rich ecosystem. From Django REST frameworks to FastAPI microservices.",
    color: "#3b82f6",
    totalAspirants: 1980,
    activeToday: 319,
    growthPercent: 19,
    skills: [
      "Python", "Django", "FastAPI", "PostgreSQL", "Redis",
      "Celery", "REST APIs", "SQLAlchemy", "Docker", "Pytest",
    ],
    commonGoals: [
      "Build a FastAPI project end-to-end",
      "Practice Python coding challenges",
      "Revise Django ORM concepts",
      "Work on async Python patterns",
      "Apply to Python backend roles",
    ],
    journeyStages: [
      {
        step: 1,
        title: "Python Mastery",
        description: "Advanced Python: OOP, async, decorators and typing",
        focus: ["Python", "OOP", "Async/await", "Type hints"],
      },
      {
        step: 2,
        title: "Web Frameworks",
        description: "Django and FastAPI for building production APIs",
        focus: ["Django", "FastAPI", "REST design", "Serialization"],
      },
      {
        step: 3,
        title: "Databases & Caching",
        description: "PostgreSQL, Redis, query optimization and ORMs",
        focus: ["PostgreSQL", "SQLAlchemy", "Redis", "Query optimization"],
      },
      {
        step: 4,
        title: "Testing & Production",
        description: "Test-driven development and deployment patterns",
        focus: ["Pytest", "Docker", "CI/CD", "Celery"],
      },
      {
        step: 5,
        title: "Interview Preparation",
        description: "Python DSA, system design and behavioral interviews",
        focus: ["Python DSA", "System design", "Mock interviews"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 53 },
      { id: "s2", text: "working on FastAPI projects", count: 27 },
      { id: "s3", text: "practicing Python coding challenges", count: 31 },
      { id: "s4", text: "revising Django REST concepts", count: 18 },
      { id: "s5", text: "preparing for system design rounds", count: 14 },
    ],
    relatedSlugs: ["backend-nodejs-engineer", "data-engineer", "ml-engineer"],
  },

  "data-engineer": {
    slug: "data-engineer",
    title: "Data Engineer",
    ecosystemLabel: "Data Platform",
    summary:
      "Design and build the data pipelines and infrastructure that analysts and ML engineers rely on. Data engineers handle the movement, storage and transformation of data at scale.",
    color: "#14b8a6",
    totalAspirants: 1120,
    activeToday: 164,
    growthPercent: 28,
    skills: [
      "Apache Spark", "Airflow", "dbt", "Snowflake", "SQL",
      "Python", "Kafka", "AWS Glue", "BigQuery", "Data Modeling",
    ],
    commonGoals: [
      "Build an ETL pipeline from scratch",
      "Set up an Airflow DAG",
      "Practice advanced SQL",
      "Learn data warehouse design",
      "Apply to data engineering roles",
    ],
    journeyStages: [
      {
        step: 1,
        title: "SQL & Python Basics",
        description: "Strong data querying and Python scripting foundation",
        focus: ["Advanced SQL", "Python", "Pandas", "Data types"],
      },
      {
        step: 2,
        title: "Data Pipelines",
        description: "ETL/ELT patterns, scheduling and orchestration",
        focus: ["Airflow", "dbt", "ETL design", "Data quality"],
      },
      {
        step: 3,
        title: "Big Data Processing",
        description: "Distributed computing with Spark and streaming",
        focus: ["Apache Spark", "Kafka", "Streaming", "Partitioning"],
      },
      {
        step: 4,
        title: "Cloud Data Platforms",
        description: "Snowflake, BigQuery and cloud storage at scale",
        focus: ["Snowflake", "BigQuery", "AWS S3", "Redshift"],
      },
      {
        step: 5,
        title: "Interview Preparation",
        description: "SQL tests, pipeline design and system architecture",
        focus: ["SQL interviews", "Pipeline design", "Case studies"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 28 },
      { id: "s2", text: "building Airflow pipelines", count: 15 },
      { id: "s3", text: "practicing advanced SQL", count: 22 },
      { id: "s4", text: "exploring Spark transformations", count: 11 },
      { id: "s5", text: "studying data warehouse design", count: 8 },
    ],
    relatedSlugs: ["data-analyst", "ml-engineer", "backend-python-engineer"],
  },

  "cybersecurity-analyst": {
    slug: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    ecosystemLabel: "Security",
    summary:
      "Defend systems, networks and data from threats. Cybersecurity analysts identify vulnerabilities, respond to incidents and build secure infrastructure.",
    color: "#ef4444",
    totalAspirants: 890,
    activeToday: 127,
    growthPercent: 35,
    skills: [
      "SIEM tools", "Penetration Testing", "OWASP Top 10", "Networking",
      "Linux", "Incident Response", "Wireshark", "Metasploit", "Python scripting", "Cloud Security",
    ],
    commonGoals: [
      "Practice TryHackMe / HackTheBox",
      "Study OWASP Top 10 vulnerabilities",
      "Set up a home lab",
      "Revise network security concepts",
      "Pursue CompTIA Security+ or CEH",
    ],
    journeyStages: [
      {
        step: 1,
        title: "Networking Fundamentals",
        description: "TCP/IP, protocols, firewalls and network architecture",
        focus: ["Networking", "TCP/IP", "DNS", "Firewalls"],
      },
      {
        step: 2,
        title: "Security Concepts",
        description: "Cryptography, authentication and threat modeling",
        focus: ["Cryptography", "IAM", "OWASP", "Threat modeling"],
      },
      {
        step: 3,
        title: "Hands-on Practice",
        description: "Labs, CTFs and penetration testing exercises",
        focus: ["TryHackMe", "HackTheBox", "CTFs", "Metasploit"],
      },
      {
        step: 4,
        title: "Certifications",
        description: "Industry-recognized certifications for credibility",
        focus: ["CompTIA Security+", "CEH", "OSCP", "CISSP"],
      },
      {
        step: 5,
        title: "Interview Preparation",
        description: "Security scenarios, incident response and behavioral",
        focus: ["Scenario questions", "Incident response", "Blue team skills"],
      },
    ],
    signals: [
      { id: "s1", text: "people checked in today", count: 22 },
      { id: "s2", text: "completing TryHackMe challenges", count: 14 },
      { id: "s3", text: "studying OWASP vulnerabilities", count: 11 },
      { id: "s4", text: "practicing penetration testing", count: 8 },
      { id: "s5", text: "working toward Security+ certification", count: 9 },
    ],
    relatedSlugs: ["devops-engineer", "backend-nodejs-engineer", "backend-python-engineer"],
  },
};

// ── Slug Utilities ────────────────────────────────────────────────────────────

export function getRoleBySlug(slug: string): RoleData | null {
  return ROLE_REGISTRY[slug] ?? null;
}

export function getAllSlugs(): string[] {
  return Object.keys(ROLE_REGISTRY);
}

/** Map a community id from DiscoveryPageV2 to a role slug */
export const COMMUNITY_ID_TO_SLUG: Record<string, string> = {
  "backend-node": "backend-nodejs-engineer",
  "frontend-react": "frontend-react-engineer",
  "data-analyst": "data-analyst",
  "fullstack": "fullstack-developer",
  "devops": "devops-engineer",
  "ml-engineer": "ml-engineer",
  "backend-python": "backend-python-engineer",
  "data-engineer": "data-engineer",
  "cybersecurity": "cybersecurity-analyst",
};
