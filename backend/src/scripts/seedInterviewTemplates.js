import { InterviewTemplate } from "../features/interview/interview.model.js";
import { logger } from "../utils/logger.js";

const SYSTEM_TEMPLATE_DEFAULTS = {
  isSystemTemplate: true,
  visibility: "public",
  createdBy: null,
  usageCount: 0,
  tags: []
};

const TEMPLATES = [
  // ────────────────────── TECH / TECHNICAL ──────────────────────
  {
    ...SYSTEM_TEMPLATE_DEFAULTS,
    title: "Frontend Engineering — React & JavaScript",
    domain: "tech",
    role: "Frontend Engineer",
    type: "technical",
    difficulty: "intermediate",
    estimatedDuration: 40,
    questions: [
      {
        question: "Can you explain the difference between controlled and uncontrolled components in React? When would you choose one over the other?",
        type: "technical",
        followUps: ["Can you give a real example from your projects?", "How does this affect form validation?"],
        expectedTopics: ["state management", "refs", "form handling", "React lifecycle"]
      },
      {
        question: "How does the virtual DOM work, and why is reconciliation important for performance?",
        type: "technical",
        followUps: ["What is React Fiber?", "Have you used React.memo or useMemo to optimize renders?"],
        expectedTopics: ["diffing algorithm", "re-renders", "shouldComponentUpdate", "optimization"]
      },
      {
        question: "Explain the differences between useEffect, useLayoutEffect, and useCallback. When do you use each?",
        type: "technical",
        followUps: ["What happens if you forget the dependency array?", "How do you clean up side effects?"],
        expectedTopics: ["hooks", "side effects", "closures", "dependency array"]
      },
      {
        question: "How would you optimize a React app that has become slow due to too many re-renders?",
        type: "technical",
        followUps: ["What tools would you use to profile it?", "Describe a real performance bottleneck you fixed."],
        expectedTopics: ["React DevTools", "memoization", "code splitting", "lazy loading"]
      },
      {
        question: "Describe how you would build a custom hook to manage paginated API data with loading and error states.",
        type: "technical",
        followUps: ["How would you handle race conditions?", "Would you use SWR or React Query?"],
        expectedTopics: ["custom hooks", "async/await", "abort controllers", "state management"]
      }
    ]
  },
  {
    ...SYSTEM_TEMPLATE_DEFAULTS,
    title: "Backend Engineering — Node.js & APIs",
    domain: "tech",
    role: "Backend Engineer",
    type: "technical",
    difficulty: "intermediate",
    estimatedDuration: 45,
    questions: [
      {
        question: "Explain the Node.js event loop in detail. How does it handle asynchronous operations without blocking?",
        type: "technical",
        followUps: ["What is the difference between microtasks and macrotasks?", "How does setTimeout differ from setImmediate?"],
        expectedTopics: ["event loop phases", "libuv", "call stack", "callback queue"]
      },
      {
        question: "How would you design a rate-limiting system for a public API? Walk me through your approach.",
        type: "technical",
        followUps: ["Would you use Redis?", "How do you handle distributed rate limiting across multiple server instances?"],
        expectedTopics: ["token bucket", "sliding window", "Redis", "distributed systems"]
      },
      {
        question: "Describe the difference between JWT and session-based authentication. What are the tradeoffs?",
        type: "technical",
        followUps: ["How do you handle JWT refresh tokens securely?", "What would you store in the JWT payload?"],
        expectedTopics: ["stateless vs stateful", "HttpOnly cookies", "token expiry", "refresh rotation"]
      },
      {
        question: "How would you structure a Node.js/Express project as it scales to a large team? What patterns do you follow?",
        type: "technical",
        followUps: ["How do you handle error propagation across layers?", "What is your approach to middleware?"],
        expectedTopics: ["feature-based structure", "separation of concerns", "middleware chain", "error handling"]
      },
      {
        question: "You have a database query that is causing high latency in production. Walk me through how you would diagnose and fix it.",
        type: "technical",
        followUps: ["How would you use EXPLAIN ANALYZE?", "When would you add an index vs. denormalize data?"],
        expectedTopics: ["indexing strategy", "query optimization", "MongoDB explain", "N+1 problem"]
      }
    ]
  },
  {
    ...SYSTEM_TEMPLATE_DEFAULTS,
    title: "Data Structures & Algorithms — General Tech",
    domain: "tech",
    role: null,
    type: "technical",
    difficulty: "intermediate",
    estimatedDuration: 50,
    questions: [
      {
        question: "Given an array of integers, find all pairs that sum to a target value. Explain your approach and its time complexity.",
        type: "technical",
        followUps: ["Can you do it in O(n) time?", "How does your solution change if the array is sorted?"],
        expectedTopics: ["hash maps", "two pointers", "time/space complexity", "edge cases"]
      },
      {
        question: "Explain the difference between a stack and a queue. Give a real-world use case for each.",
        type: "technical",
        followUps: ["How would you implement a queue using two stacks?", "What is a deque?"],
        expectedTopics: ["LIFO vs FIFO", "call stack", "BFS/DFS", "circular buffer"]
      },
      {
        question: "What is a binary search tree? How does insertion, deletion, and lookup work? When does it degrade to O(n)?",
        type: "technical",
        followUps: ["What is an AVL tree?", "When would you use a BST vs a hash map?"],
        expectedTopics: ["tree traversal", "balancing", "worst case", "ordered data"]
      },
      {
        question: "Describe how you would detect a cycle in a linked list.",
        type: "technical",
        followUps: ["What is Floyd's algorithm?", "Can you find where the cycle begins?"],
        expectedTopics: ["two pointers", "fast and slow pointer", "space complexity"]
      },
      {
        question: "What is dynamic programming? Walk me through solving the coin change problem.",
        type: "technical",
        followUps: ["What is the difference between top-down and bottom-up DP?", "How do you identify if a problem can use DP?"],
        expectedTopics: ["memoization", "tabulation", "overlapping subproblems", "optimal substructure"]
      }
    ]
  },

  // ────────────────────── TECH / BEHAVIORAL ──────────────────────
  {
    title: "Behavioral — Tech Roles (STAR Method)",
    domain: "tech",
    role: null,
    type: "behavioral",
    difficulty: "beginner",
    estimatedDuration: 35,
    questions: [
      {
        question: "Tell me about a time you had to debug a particularly difficult production issue. How did you approach it?",
        type: "behavioral",
        followUps: ["What was the root cause?", "What did you change afterwards to prevent recurrence?"],
        expectedTopics: ["problem solving", "debugging process", "communication", "post-mortem"]
      },
      {
        question: "Describe a situation where you disagreed with a technical decision made by your team or manager. What did you do?",
        type: "behavioral",
        followUps: ["How did the situation resolve?", "Would you handle it differently now?"],
        expectedTopics: ["conflict resolution", "technical advocacy", "communication", "outcome"]
      },
      {
        question: "Tell me about a project you are most proud of. What was your specific contribution?",
        type: "behavioral",
        followUps: ["What would you do differently?", "How did it impact users or the business?"],
        expectedTopics: ["ownership", "technical depth", "impact", "growth mindset"]
      },
      {
        question: "Describe a time when you had to learn a new technology or framework quickly. How did you handle it?",
        type: "behavioral",
        followUps: ["What resources did you use?", "What was the result?"],
        expectedTopics: ["learning agility", "self-study", "resourcefulness", "delivery under pressure"]
      },
      {
        question: "Give me an example of when you had to balance technical debt with feature delivery. What tradeoffs did you make?",
        type: "behavioral",
        followUps: ["How did you communicate the tradeoff to stakeholders?", "What happened long-term?"],
        expectedTopics: ["technical debt", "prioritization", "stakeholder communication", "engineering judgment"]
      }
    ]
  },

  // ────────────────────── TECH / HR ──────────────────────
  {
    title: "HR Round — Tech Roles",
    domain: "tech",
    role: null,
    type: "hr",
    difficulty: "beginner",
    estimatedDuration: 25,
    questions: [
      {
        question: "Tell me about yourself and your journey into software engineering.",
        type: "open",
        followUps: ["What sparked your interest in tech?", "What is your proudest achievement so far?"],
        expectedTopics: ["background", "motivation", "career narrative", "self-awareness"]
      },
      {
        question: "Why are you interested in this role/company specifically?",
        type: "open",
        followUps: ["What do you know about our product?", "What excites you about the domain?"],
        expectedTopics: ["company research", "role fit", "genuine interest", "career goals"]
      },
      {
        question: "Where do you see yourself in 3–5 years?",
        type: "open",
        followUps: ["Are you interested in technical depth or leadership?", "How does this role fit that path?"],
        expectedTopics: ["career vision", "growth ambition", "role alignment", "honesty"]
      },
      {
        question: "What are your salary expectations for this role?",
        type: "open",
        followUps: ["Have you researched market rates?", "Are you flexible on this?"],
        expectedTopics: ["market research", "negotiation readiness", "confidence", "realistic expectations"]
      },
      {
        question: "Do you have any questions for us?",
        type: "open",
        followUps: ["Ask about the engineering culture", "Ask about growth opportunities"],
        expectedTopics: ["curiosity", "preparation", "engagement", "reverse interview skills"]
      }
    ]
  },

  // ────────────────────── TECH / RESUME ROUND ──────────────────────
  {
    title: "Resume Round — Tech Roles",
    domain: "tech",
    role: null,
    type: "resume_round",
    difficulty: "beginner",
    estimatedDuration: 30,
    questions: [
      {
        question: "Walk me through your most recent role and your key responsibilities.",
        type: "open",
        followUps: ["What was the size of your team?", "What was your biggest impact there?"],
        expectedTopics: ["work history", "clarity", "scope of work", "ownership"]
      },
      {
        question: "Tell me about the most technically complex project listed on your resume.",
        type: "technical",
        followUps: ["What was the hardest part?", "What would you change if you could redo it?"],
        expectedTopics: ["technical depth", "architecture decisions", "problem solving", "reflection"]
      },
      {
        question: "You listed [Skill/Technology] on your resume. Can you rate yourself 1–10 and justify it?",
        type: "technical",
        followUps: ["What would it take to become a 10?", "Have you used it in production?"],
        expectedTopics: ["self-awareness", "honesty", "skill depth", "practical experience"]
      },
      {
        question: "I see a gap in your resume between [Period X] and [Period Y]. Can you explain what you were doing?",
        type: "open",
        followUps: ["Did you continue learning during that time?", "How has it shaped your approach to work?"],
        expectedTopics: ["transparency", "growth during gaps", "personal narrative", "confidence"]
      },
      {
        question: "Why did you leave (or why are you leaving) your previous role?",
        type: "open",
        followUps: ["What did you learn from that role?", "What are you looking for that was missing there?"],
        expectedTopics: ["professionalism", "self-awareness", "career progression", "positive framing"]
      }
    ]
  },

  // ────────────────────── TECH / MIXED ──────────────────────
  {
    title: "Full Stack Mixed Interview",
    domain: "tech",
    role: null,
    type: "mixed",
    difficulty: "advanced",
    estimatedDuration: 60,
    questions: [
      {
        question: "Design a URL shortener like bit.ly. Walk through the system design.",
        type: "technical",
        followUps: ["How would you handle 100 million URLs?", "How do you prevent collisions in short IDs?"],
        expectedTopics: ["hashing", "database choice", "caching", "horizontal scaling", "redirects"]
      },
      {
        question: "Describe a time when you had to make a critical architectural decision under time pressure.",
        type: "behavioral",
        followUps: ["What tradeoffs did you accept?", "If you had more time, would you have decided differently?"],
        expectedTopics: ["decision making", "tradeoffs", "communication", "ownership"]
      },
      {
        question: "How do you ensure the APIs you build are secure against common vulnerabilities like CSRF, XSS, and injection attacks?",
        type: "technical",
        followUps: ["How do you handle CORS in production?", "Have you done a security audit before?"],
        expectedTopics: ["OWASP top 10", "input validation", "HTTPS", "headers", "parameterized queries"]
      },
      {
        question: "Give an example of a time you improved a team process — not just code.",
        type: "behavioral",
        followUps: ["How did you get buy-in?", "What was the measurable impact?"],
        expectedTopics: ["process improvement", "leadership without title", "teamwork", "communication"]
      },
      {
        question: "Walk me through how you would implement a real-time notification system.",
        type: "technical",
        followUps: ["WebSockets vs Server-Sent Events — which would you choose?", "How do you handle offline users?"],
        expectedTopics: ["WebSockets", "polling", "message queues", "delivery guarantees", "scalability"]
      }
    ]
  },

  // ────────────────────── NON-TECH / HR ──────────────────────
  {
    title: "HR Round — Business, Marketing & Operations",
    domain: "non-tech",
    role: null,
    type: "hr",
    difficulty: "beginner",
    estimatedDuration: 25,
    questions: [
      {
        question: "Tell me about yourself — your background, current situation, and why you are looking for this opportunity.",
        type: "open",
        followUps: ["What makes you different from other candidates?", "What are you most excited about professionally right now?"],
        expectedTopics: ["personal narrative", "career clarity", "confidence", "professional identity"]
      },
      {
        question: "Why are you specifically interested in this role and this company?",
        type: "open",
        followUps: ["Have you researched the company's recent news?", "What about our culture attracts you?"],
        expectedTopics: ["company research", "genuine motivation", "culture fit", "role alignment"]
      },
      {
        question: "Walk me through a project or initiative you led end-to-end. What was your role and what was the outcome?",
        type: "behavioral",
        followUps: ["What challenges did you face?", "What would you do differently?"],
        expectedTopics: ["ownership", "project management", "outcome orientation", "leadership"]
      },
      {
        question: "Describe a difficult professional relationship you had. How did you manage it?",
        type: "behavioral",
        followUps: ["What did you learn from it?", "How did it affect your work?"],
        expectedTopics: ["conflict resolution", "emotional intelligence", "professionalism", "communication"]
      },
      {
        question: "What are your salary expectations and notice period?",
        type: "open",
        followUps: ["Are there any other offers you are considering?", "What is your priority — role fit or compensation?"],
        expectedTopics: ["negotiation", "market awareness", "honesty", "decisiveness"]
      }
    ]
  },

  // ────────────────────── NON-TECH / BEHAVIORAL ──────────────────────
  {
    title: "Behavioral — Non-Tech Roles (STAR Method)",
    domain: "non-tech",
    role: null,
    type: "behavioral",
    difficulty: "beginner",
    estimatedDuration: 35,
    questions: [
      {
        question: "Tell me about a time you had to manage multiple competing priorities. How did you decide what to work on first?",
        type: "behavioral",
        followUps: ["What was at stake?", "Would you make the same decision again?"],
        expectedTopics: ["prioritization", "time management", "stakeholder communication", "outcome"]
      },
      {
        question: "Describe a situation where you had to convince a skeptical stakeholder or client. How did you approach it?",
        type: "behavioral",
        followUps: ["What data or arguments were most effective?", "What was the final outcome?"],
        expectedTopics: ["persuasion", "data-driven communication", "relationship building", "influence"]
      },
      {
        question: "Tell me about a time you made a significant mistake at work. How did you handle it?",
        type: "behavioral",
        followUps: ["What did you learn?", "How did it affect your relationships with colleagues?"],
        expectedTopics: ["accountability", "growth mindset", "resilience", "transparency"]
      },
      {
        question: "Give me an example of when you had to adapt quickly to a major change at work.",
        type: "behavioral",
        followUps: ["How did you support your team through the change?", "What was the outcome?"],
        expectedTopics: ["adaptability", "change management", "leadership", "communication"]
      },
      {
        question: "Describe a time when you went above and beyond for a customer or stakeholder.",
        type: "behavioral",
        followUps: ["Was it recognised?", "How did it shape your approach to your work going forward?"],
        expectedTopics: ["customer orientation", "initiative", "impact", "ownership"]
      }
    ]
  },

  // ────────────────────── NON-TECH / MIXED ──────────────────────
  {
    title: "Marketing Role — Mixed Interview",
    domain: "non-tech",
    role: "Marketing Manager",
    type: "mixed",
    difficulty: "intermediate",
    estimatedDuration: 45,
    questions: [
      {
        question: "How would you build a go-to-market strategy for a new product launching in a competitive market?",
        type: "technical",
        followUps: ["How do you define your ICP?", "What metrics would you use to measure success?"],
        expectedTopics: ["ICP", "positioning", "channels", "metrics", "competitive analysis"]
      },
      {
        question: "Tell me about the most successful campaign you have run. Walk me through the strategy, execution, and results.",
        type: "behavioral",
        followUps: ["What did not go as planned?", "What would you scale if you had a bigger budget?"],
        expectedTopics: ["campaign strategy", "performance metrics", "creative execution", "iteration"]
      },
      {
        question: "How do you approach content marketing for a brand that has no existing audience?",
        type: "technical",
        followUps: ["How do you decide on content formats?", "How do you measure content ROI?"],
        expectedTopics: ["SEO", "distribution channels", "audience building", "content calendar", "analytics"]
      },
      {
        question: "Describe a time you had to defend a marketing budget decision to finance or leadership.",
        type: "behavioral",
        followUps: ["What data did you use?", "What was the outcome?"],
        expectedTopics: ["business case building", "ROI framing", "stakeholder management", "data literacy"]
      },
      {
        question: "How do you stay current with changes in digital marketing platforms and algorithms?",
        type: "open",
        followUps: ["What recent change had the biggest impact on your work?", "How did you adapt?"],
        expectedTopics: ["continuous learning", "platform knowledge", "adaptability", "professional development"]
      }
    ]
  },

  // ────────────────────── ANY / RESUME ROUND ──────────────────────
  {
    title: "Resume Deep-Dive — Any Role",
    domain: "any",
    role: null,
    type: "resume_round",
    difficulty: "beginner",
    estimatedDuration: 30,
    questions: [
      {
        question: "Take me through your resume chronologically — from your first relevant role to today.",
        type: "open",
        followUps: ["What was your biggest career pivot?", "What connects the dots in your journey?"],
        expectedTopics: ["career narrative", "consistency", "growth trajectory", "self-awareness"]
      },
      {
        question: "What is the single biggest impact you have had in your career so far? How do you quantify it?",
        type: "behavioral",
        followUps: ["How did it compare to peers?", "Did it lead to recognition or promotion?"],
        expectedTopics: ["quantifiable impact", "ownership", "scope", "results orientation"]
      },
      {
        question: "What skills or experiences on your resume do you feel are most relevant to this role and why?",
        type: "open",
        followUps: ["Are there gaps you are aware of?", "How are you closing those gaps?"],
        expectedTopics: ["role alignment", "self-awareness", "strategic positioning", "honest assessment"]
      },
      {
        question: "Is there anything on your resume that you feel is undersold or that you want to elaborate on?",
        type: "open",
        followUps: ["Why did you undersell it originally?", "What was the actual impact?"],
        expectedTopics: ["hidden value", "confidence", "communication", "role fit"]
      },
      {
        question: "What is one thing NOT on your resume that you think is crucial for this interviewer to know about you?",
        type: "open",
        followUps: ["Why did you leave it off?", "How does it relate to this opportunity?"],
        expectedTopics: ["self-promotion", "personality fit", "unique value", "authenticity"]
      }
    ]
  }
];

export async function seedInterviewTemplates() {
  try {
    const existingCount = await InterviewTemplate.countDocuments();

    if (existingCount > 0) {
      return;
    }

    await InterviewTemplate.insertMany(TEMPLATES);
    logger.info({ count: TEMPLATES.length }, "Inserted system interview templates");
  } catch (error) {
    logger.error({ err: error }, "Failed to seed interview templates");
  }
}
