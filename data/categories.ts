export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  keywords?: string[];
}

export const categories: Category[] = [
  {
    id: "working-memory",
    name: "Working Memory",
    description: "Games that strengthen your ability to temporarily hold and manipulate information. Strong working memory helps students remember instructions, professionals juggle multiple tasks, and everyone follow conversations better. Regular training can improve academic performance, workplace efficiency, and reduce everyday forgetfulness.",
    slug: "working-memory",
    icon: "Brain",
    keywords: [
      "working memory training",
      "memory training",
      "improve working memory",
      "working memory exercises",
      "best way to improve working memory",
      "boost working memory",
      "brain working memory",
      "working memory capacity",
      "short-term memory improvement",
      "cognitive training for memory"
    ]
  },
  {
    id: "visual-tracking",
    name: "Visual Tracking",
    description: "Games that enhance your ability to follow moving objects and maintain visual focus. Better visual tracking helps readers avoid line-skipping, drivers track multiple vehicles, and athletes follow fast-moving balls. Training this skill can improve reading fluency, sports performance, and safety in dynamic environments like traffic or crowded spaces.",
    slug: "visual-tracking",
    icon: "Eye",
    keywords: [
      "visual tracking exercises",
      "improve visual tracking",
      "visual tracking skills",
      "eye tracking training",
      "visual attention training",
      "visual processing speed",
      "visual focus exercises",
      "eye movement training",
      "visual tracking for reading",
      "sports vision training"
    ]
  },
  {
    id: "sustained-attention",
    name: "Sustained Attention",
    description: "Games that build your ability to maintain focus over extended periods. Enhanced sustained attention helps students stay engaged during long lectures, professionals maintain productivity throughout the workday, and everyone complete tasks without mental wandering. Training can improve learning outcomes, work quality, and reduce careless errors in daily activities.",
    slug: "sustained-attention",
    icon: "Focus",
    keywords: [
      "sustained attention training",
      "improve focus duration",
      "concentration exercises",
      "attention span improvement",
      "focus training",
      "mental endurance exercises",
      "concentration games",
      "improve attention span",
      "focus and concentration training",
      "mindfulness for attention"
    ]
  },
  {
    id: "selective-attention",
    name: "Selective Attention",
    description: "Games that improve your ability to focus on relevant information while filtering out distractions. Better selective attention helps students study in noisy environments, professionals concentrate in busy offices, and everyone maintain focus despite interruptions. Training this skill can enhance productivity in distracting settings, improve comprehension of important information, and reduce stress from sensory overload.",
    slug: "selective-attention",
    icon: "Target",
    keywords: [
      "selective attention training",
      "filter distractions",
      "focus amid distractions",
      "attention filtering exercises",
      "cognitive control training",
      "distraction resistance",
      "improve selective attention",
      "focus training with distractions",
      "attention control exercises",
      "cognitive filtering"
    ]
  },
  {
    id: "divided-attention",
    name: "Divided Attention",
    description: "Games that develop your ability to effectively split attention between multiple tasks or stimuli. Enhanced divided attention helps parents monitor children while completing household tasks, professionals handle concurrent responsibilities, and drivers safely navigate while being aware of surroundings. Training can improve multitasking efficiency, reduce errors when juggling responsibilities, and increase awareness in complex situations.",
    slug: "divided-attention",
    icon: "Split",
    keywords: [
      "divided attention training",
      "multitasking exercises",
      "split attention practice",
      "dual task training",
      "improve multitasking ability",
      "cognitive multitasking",
      "attention splitting exercises",
      "multiple task management",
      "simultaneous processing training",
      "cognitive load management"
    ]
  },
  {
    id: "reaction-time",
    name: "Reaction Time",
    description: "Games that sharpen your speed of response to visual or auditory stimuli. Faster reaction time helps athletes perform better and drivers respond quickly to road hazards. Regular training can improve sports performance, enhance safety in emergency situations, and maintain cognitive vitality with aging. Even millisecond improvements can make significant real-world differences.",
    slug: "reaction-time",
    icon: "Zap",
    keywords: [
      "reaction time training",
      "reaction games",
      "improve response speed",
      "faster reflexes exercises",
      "reflex games",
      "quick reaction games",
      "speed training cognitive",
      "processing speed improvement",
      "reflex training",
      "cognitive speed exercises",
      "faster brain response",
      "neurological speed training"
    ]
  },
  {
    id: "cognitive-flexibility",
    name: "Cognitive Flexibility",
    description: "Games that enhance your ability to switch between different concepts or adapt to changing rules. Greater cognitive flexibility helps students apply knowledge across subjects, professionals adapt to changing work requirements, and everyone navigate social situations more effectively. Training this skill can improve problem-solving creativity, adaptability to new technologies, and resilience when facing unexpected changes.",
    slug: "cognitive-flexibility",
    icon: "Shuffle",
    keywords: [
      "cognitive flexibility training",
      "mental flexibility exercises",
      "adaptive thinking training",
      "task switching practice",
      "improve mental adaptability",
      "cognitive shifting exercises",
      "mental agility training",
      "flexible thinking games",
      "rule switching training",
      "brain flexibility improvement"
    ]
  },
  {
    id: "spatial-memory",
    name: "Spatial Memory",
    description: "Games that strengthen your ability to remember and manipulate spatial information. Strong spatial memory helps with navigation, remembering object locations, understanding maps, and visualizing 3D structures. This skill is crucial for activities like parking, finding items, following directions, and excelling in STEM fields that require spatial reasoning.",
    slug: "spatial-memory",
    icon: "Map",
    keywords: [
      "spatial memory training",
      "spatial awareness exercises",
      "visual-spatial memory",
      "spatial reasoning games",
      "location memory training",
      "3D spatial skills",
      "spatial visualization",
      "spatial working memory",
      "navigation skills training",
      "spatial intelligence games"
    ]
  },
  {
    id: "adhd-games",
    name: "Traffic-Boosting Collection: ADHD Games for Adults",
    description: "Short, clearly structured games that practice working memory, inhibition, and sustained attention, the executive functions often affected by ADHD. These games are not a treatment for ADHD and do not replace professional care, but they offer an easy way to practice focus.",
    slug: "adhd-games",
    icon: "BrainCircuit",
    keywords: [
      "ADHD games for adults",
      "games for adhd adults",
      "concentration games for adhd",
      "adhd brain training",
      "focus games for adults with adhd",
      "adhd memory games",
      "executive function training adhd",
      "inhibition control exercises",
      "attention deficit games",
      "scientific adhd training"
    ]
  },
  {
    id: "brain-games-for-kids",
    name: "Traffic-Boosting Collection: Focus Games for Kids",
    description: "Fun brain games for children that practice attention, memory, following instructions, and impulse control in short, game-like rounds. Use them as playful practice alongside schoolwork, not as a replacement for it.",
    slug: "brain-games-for-kids",
    icon: "Gamepad2",
    keywords: [
      "brain games for kids",
      "focus games for kids",
      "attention games for children",
      "adhd games for kids",
      "concentration exercises for kids",
      "memory games for children",
      "visual tracking for kids",
      "impulse control games for kids",
      "educational brain games",
      "kids cognitive training"
    ]
  },
  {
    id: "relaxation",
    name: "Relaxation & Stress Relief",
    description: "Guided breathing exercises for relaxation and stress relief. Slow, paced breathing can raise heart rate variability (HRV) while you practice and helps many people feel calmer within a few minutes.",
    slug: "relaxation",
    icon: "Wind",
    keywords: [
      "relaxation exercises",
      "stress relief games",
      "breathing exercises",
      "vagus nerve stimulation",
      "hrv training",
      "resonance breathing",
      "coherent breathing",
      "calm down techniques",
      "anxiety relief exercises",
      "mindfulness games"
    ]
  },
  {
    id: "double-decision-games",
    name: "Double Decision",
    description: "Every version of the Double Decision visual speed game in one place. Each round flashes something in the centre and a target out to the side, and you report both, training useful field of view, visual processing speed and divided attention.",
    slug: "double-decision-games",
    icon: "Target",
    keywords: [
      "double decision game",
      "double decision brain training",
      "useful field of view training",
      "ufov training",
      "visual processing speed game",
      "speed of processing training",
      "peripheral vision game",
      "divided attention game"
    ]
  },
  {
    id: "personality-tests",
    name: "Viral Personality Tests",
    description: "Shareable, entertainment-first online personality tests and quiz experiences. These pages are designed more for curiosity, comparison, and social conversation than formal psychological assessment, making them useful when you want a fast result people will actually repost.",
    slug: "personality-tests",
    icon: "Brain",
    keywords: [
      "sbti personality test",
      "sbti test",
      "sbti mbti",
      "personality test",
      "viral personality quiz",
      "mbti style test",
      "online personality quiz",
      "fun personality test",
      "shareable personality result",
      "internet personality test"
    ]
  }
];

// 辅助函数
export function getCategory(id: string): Category | undefined {
  return categories.find(category => category.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(category => category.slug === slug);
} 
