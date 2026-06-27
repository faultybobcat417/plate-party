import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TRIVIA_DB = [
  { q: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correct: 1 },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
  { q: "What is 2 + 2 × 2?", options: ["6", "8", "4", "10"], correct: 0 },
  { q: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], correct: 2 },
  { q: "What is the chemical symbol for gold?", options: ["Au", "Ag", "Fe", "Pb"], correct: 0 },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
  { q: "What year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], correct: 1 },
  { q: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], correct: 1 },
  { q: "Which element has the atomic number 1?", options: ["Helium", "Oxygen", "Hydrogen", "Carbon"], correct: 2 },
  { q: "What is the speed of light (approx)?", options: ["300,000 km/s", "150,000 km/s", "1,000 km/s", "1,000,000 km/s"], correct: 0 },
];

serve(async (req) => {
  const { action, count = 5 } = await req.json();

  if (action === "generate") {
    const shuffled = [...TRIVIA_DB].sort(() => Math.random() - 0.5).slice(0, count);
    const questions = shuffled.map((q, idx) => ({
      id: `q_${idx}`,
      question: q.q,
      options: q.options,
      correctIndex: q.correct,
    }));
    const clientQuestions = questions.map(({ correctIndex, ...rest }) => rest);
    return new Response(
      JSON.stringify({ questions: clientQuestions, serverSeed: Date.now() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (action === "validate") {
    const { answers } = await req.json();
    const score = answers.filter((a: any) => a.correct).length;
    const flagged = score === answers.length && answers.every((a: any) => a.timeMs < 2000);
    return new Response(
      JSON.stringify({ score, valid: true, flagged }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Unknown action" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
});
