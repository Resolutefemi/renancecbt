
/**
 * ai-bridge.ts
 * Bridges the Quiz Engine and Renance AI for post-exam review.
 */

export interface MissedQuestion {
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
}

export interface AIReviewPayload {
    course: string;
    missed: MissedQuestion[];
    total: number;
    correct: number;
    timestamp: number;
}

/**
 * Captures missed questions and redirects student to AI tutor for review.
 */
export function sendToAI(courseCode: string, examQuestions: any[], userAnswers: any[]): void {
    const missed: MissedQuestion[] = [];

    examQuestions.forEach((q, i) => {
        const student = userAnswers[i];
        const correct = q.answer;

        if (!student || student !== correct) {
            const correctOpt = q.options.find((o: string) => o.trim().charAt(0) === correct) || correct;
            const studentOpt = student
                ? (q.options.find((o: string) => o.trim().charAt(0) === student) || student)
                : "Not answered";

            missed.push({
                question: q.question,
                studentAnswer: studentOpt,
                correctAnswer: correctOpt,
                explanation: q.explanation || ""
            });
        }
    });

    if (missed.length === 0) {
        alert("🎉 Perfect score! No mistakes to review.");
        return;
    }

    const payload: AIReviewPayload = {
        course: courseCode,
        missed: missed,
        total: examQuestions.length,
        correct: examQuestions.length - missed.length,
        timestamp: Date.now()
    };

    localStorage.setItem("renance_cbt_review", JSON.stringify(payload));
    window.location.href = "ai.html";
}
