
function sendToAI(courseCode, examQuestions, userAnswers) {
  const missed = [];

  examQuestions.forEach((q, i) => {
    const student = userAnswers[i];
    const correct = q.answer;

    if (!student || student !== correct) {
      const correctOpt = q.options.find(o => o.trim().charAt(0) === correct) || correct;
      const studentOpt = student
        ? (q.options.find(o => o.trim().charAt(0) === student) || student)
        : "Not answered";

      missed.push({
        question:      q.question,
        studentAnswer: studentOpt,
        correctAnswer: correctOpt,
        explanation:   q.explanation || ""
      });
    }
  });

  if (missed.length === 0) {
    alert("🎉 Perfect score! No mistakes to review.");
    return;
  }

  const payload = {
    course:  courseCode,
    missed:  missed,
    total:   examQuestions.length,
    correct: examQuestions.length - missed.length,
    timestamp: Date.now()
  };

  localStorage.setItem("renance_cbt_review", JSON.stringify(payload));

  window.location.href = "ai.html";
}