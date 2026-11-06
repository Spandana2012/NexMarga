import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Bot,
  FileSearch,
  LayoutDashboard,
  Target,
  UploadCloud,
  MessageSquareText,
} from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Upload Resume",
    href: "/upload",
    icon: UploadCloud,
  },
  {
    title: "Analysis",
    href: "/analysis",
    icon: BarChart3,
  },
  {
    title: "AI Agents",
    href: "/ai-agents",
    icon: Bot,
  },
];

export const dashboardStats = [
  {
    label: "Resume score",
    value: "86%",
    delta: "+12% this week",
  },
  {
    label: "Skills mapped",
    value: "24",
    delta: "+6 new gaps",
  },
  {
    label: "Interview sets",
    value: "7",
    delta: "+3 prepared",
  },
  {
    label: "Agent runs",
    value: "18",
    delta: "+5 completed",
  },
];

export const landingFeatures = [
  {
    title: "Live agent workflows",
    description:
      "Run focused AI workflows for resume analysis, skill-gap discovery, and interview preparation.",
    icon: BrainCircuit,
  },
  {
    title: "Actionable dashboards",
    description:
      "Turn completed analyses into polished insight panels with clear next steps.",
    icon: LayoutDashboard,
  },
  {
    title: "Premium workflows",
    description:
      "Guide users from resume upload to analysis with interfaces that feel fast, calm, and enterprise-ready.",
    icon: BriefcaseBusiness,
  },
];

export const workflowSteps = [
  {
    title: "Upload your resume",
    description:
      "Securely bring in your latest resume and profile documents with a focused, confidence-building flow.",
  },
  {
    title: "Activate AI agents",
    description:
      "Use the Resume Analyzer, Skill Gap Agent, and Interview Preparation Agent for targeted guidance.",
  },
  {
    title: "Review strategic output",
    description:
      "Receive a clear snapshot of strengths, gaps, suggested actions, and interview preparation opportunities.",
  },
];

export const agentCards = [
  {
    title: "Resume Analyzer Agent",
    description:
      "Surfaces structure issues, keyword alignment, and clarity improvements for stronger first impressions.",
    icon: FileSearch,
  },
  {
    title: "Skill Gap Agent",
    description:
      "Highlights missing capabilities and maps them to realistic upskilling priorities.",
    icon: Target,
  },
  {
    title: "Interview Preparation Agent",
    description:
      "Converts resume and role details into technical, project, HR, and study-plan preparation.",
    icon: MessageSquareText,
  },
];
