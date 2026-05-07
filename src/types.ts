
export interface Course {
    id: string;
    title: string;
    icon: string;
    isReady: boolean;
    semester: number;
}

export interface OptionGroup {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
}

export interface Question {
    id: number | string;
    question: string;
    options: string[] | OptionGroup;
    answer: string;
    explanation?: string;
    topic?: string;
}

export type QuizMode = 'practice' | 'exam';

export interface QuizState {
    currentExamData: Question[];
    userAnswers: Record<number, string>;
    currentIndex: number;
    timeRemaining: number;
    activeMode: QuizMode;
    examSelectionType: 'random' | 'part' | 'topic';
    partNum?: number;
    selectionValue?: string;
    savedAt: number;
}
