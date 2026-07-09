const DATA_URL = "data/chemistry.json";
const STORAGE_KEY = "diagnosticTool.chemistry.subtopics";

const SUBTOPIC_SEPARATOR = "|||";

let allQuestions = [];
let state = {
  selectedSubtopics: [],
  questionsPerSubtopic: "1",
  level: "all",
  quiz: [],
  currentIndex: 0,
  answers: {}
};

const els = {
  setupView: document.getElementById("setupView"),
  quizView: document.getElementById("quizView"),
  resultsView: document.getElementById("resultsView"),
  setupForm: document.getElementById("setupForm"),
  topicList: document.getElementById("topicList"),
  setupError: document.getElementById("setupError"),
  quizError: document.getElementById("quizError"),
  selectAllTopicsBtn: document.getElementById("selectAllTopicsBtn"),
  resetAppBtn: document.getElementById("resetAppBtn"),
  questionCounter: document.getElementById("questionCounter"),
  questionTopic: document.getElementById("questionTopic"),
  questionSubtopic: document.getElementById("questionSubtopic"),
  levelPill: document.getElementById("levelPill"),
  progressBar: document.getElementById("progressBar"),
  questionText: document.getElementById("questionText"),
  questionImageBlock: document.getElementById("questionImageBlock"),
  questionImage: document.getElementById("questionImage"),
  questionImageCaption: document.getElementById("questionImageCaption"),
  optionsList: document.getElementById("optionsList"),
  prevQuestionBtn: document.getElementById("prevQuestionBtn"),
  nextQuestionBtn: document.getElementById("nextQuestionBtn"),
  overallPercent: document.getElementById("overallPercent"),
  overallFraction: document.getElementById("overallFraction"),
  topicResults: document.getElementById("topicResults"),
  subtopicResults: document.getElementById("subtopicResults"),
  recommendationText: document.getElementById("recommendationText"),
  toggleReviewBtn: document.getElementById("toggleReviewBtn"),
  reviewList: document.getElementById("reviewList"),
  restartBtn: document.getElementById("restartBtn"),
  newDiagnosticBtn: document.getElementById("newDiagnosticBtn")
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed };
  } catch (error) {
    console.warn("Could not load saved state:", error);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function resetState() {
  state = {
    selectedSubtopics: [],
    questionsPerSubtopic: "1",
    level: "all",
    quiz: [],
    currentIndex: 0,
    answers: {}
  };
  localStorage.removeItem(STORAGE_KEY);
}

function showView(viewName) {
  [els.setupView, els.quizView, els.resultsView].forEach((view) => {
    view.classList.remove("active");
  });

  if (viewName === "setup") els.setupView.classList.add("active");
  if (viewName === "quiz") els.quizView.classList.add("active");
  if (viewName === "results") els.resultsView.classList.add("active");
}

async function loadQuestions() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);
    allQuestions = await response.json();
    renderSyllabusSelection();
  } catch (error) {
    els.topicList.innerHTML = `
      <div class="error-message">
        Could not load the question bank. If you opened this file directly, run it through a local server or GitHub Pages.
      </div>
    `;
    console.error(error);
  }
}

function getSubtopicKey(question) {
  return `${question.topic}${SUBTOPIC_SEPARATOR}${question.subtopic}`;
}

function splitSubtopicKey(key) {
  const [topic, subtopic] = key.split(SUBTOPIC_SEPARATOR);
  return { topic, subtopic };
}

function groupQuestionsByTopicAndSubtopic() {
  const topicMap = new Map();

  allQuestions.forEach((question) => {
    if (!topicMap.has(question.topic)) {
      topicMap.set(question.topic, new Map());
    }

    const subtopicMap = topicMap.get(question.topic);
    if (!subtopicMap.has(question.subtopic)) {
      subtopicMap.set(question.subtopic, []);
    }

    subtopicMap.get(question.subtopic).push(question);
  });

  return topicMap;
}

function renderSyllabusSelection() {
  const topicMap = groupQuestionsByTopicAndSubtopic();

  if (topicMap.size === 0) {
    els.topicList.innerHTML = `<p class="muted">No topics found in the question bank.</p>`;
    return;
  }

  els.topicList.innerHTML = Array.from(topicMap.entries())
    .map(([topic, subtopicMap]) => {
      const subtopicEntries = Array.from(subtopicMap.entries());
      const topicQuestionCount = subtopicEntries.reduce((total, [, questions]) => total + questions.length, 0);
      const topicKey = createStableDomKey(topic);

      const subtopicHtml = subtopicEntries
        .map(([subtopic, questions]) => {
          const firstQuestion = questions[0];
          const subtopicKey = getSubtopicKey(firstQuestion);
          const checked = state.selectedSubtopics.includes(subtopicKey) ? "checked" : "";
          const levels = [...new Set(questions.map((question) => question.level))].join("/");

          return `
            <label class="subtopic-card">
              <input
                type="checkbox"
                name="subtopics"
                value="${escapeHtml(subtopicKey)}"
                data-topic="${escapeHtml(topic)}"
                ${checked}
              />
              <span>
                <strong>${escapeHtml(subtopic)}</strong>
                <small class="muted">${questions.length} question${questions.length === 1 ? "" : "s"} · ${escapeHtml(levels)}</small>
              </span>
            </label>
          `;
        })
        .join("");

      return `
        <section class="syllabus-topic" data-topic="${escapeHtml(topic)}">
          <label class="topic-parent-card">
            <input
              type="checkbox"
              name="topicGroups"
              data-topic="${escapeHtml(topic)}"
              data-topic-key="${topicKey}"
            />
            <span>
              <strong>${escapeHtml(topic)}</strong>
              <small class="muted">${subtopicEntries.length} subtopic${subtopicEntries.length === 1 ? "" : "s"} · ${topicQuestionCount} question${topicQuestionCount === 1 ? "" : "s"}</small>
            </span>
          </label>
          <div class="subtopic-list">
            ${subtopicHtml}
          </div>
        </section>
      `;
    })
    .join("");

  updateParentCheckboxes();
  updateSelectAllButton();
}

function getSelectedSubtopicsFromForm() {
  return Array.from(document.querySelectorAll('input[name="subtopics"]:checked')).map(
    (input) => input.value
  );
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function generateQuiz(selectedSubtopics, questionsPerSubtopic, level) {
  const quiz = [];

  selectedSubtopics.forEach((subtopicKey) => {
    let subtopicQuestions = allQuestions.filter((question) => getSubtopicKey(question) === subtopicKey);

    if (level !== "all") {
      subtopicQuestions = subtopicQuestions.filter((question) => question.level === level);
    }

    subtopicQuestions = shuffleArray(subtopicQuestions);

    if (questionsPerSubtopic !== "all") {
      subtopicQuestions = subtopicQuestions.slice(0, Number(questionsPerSubtopic));
    }

    quiz.push(...subtopicQuestions);
  });

  return shuffleArray(quiz);
}

function startQuiz(event) {
  event.preventDefault();

  els.setupError.textContent = "";

  const selectedSubtopics = getSelectedSubtopicsFromForm();
  const questionsPerSubtopic = getRadioValue("questionsPerSubtopic");
  const level = getRadioValue("level");

  if (selectedSubtopics.length === 0) {
    els.setupError.textContent = "Please select at least one topic or subtopic.";
    return;
  }

  const quiz = generateQuiz(selectedSubtopics, questionsPerSubtopic, level);

  if (quiz.length === 0) {
    els.setupError.textContent = "No questions match your selection. Try all levels or choose another subtopic.";
    return;
  }

  state = {
    selectedSubtopics,
    questionsPerSubtopic,
    level,
    quiz,
    currentIndex: 0,
    answers: {}
  };

  saveState();
  showView("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = state.quiz[state.currentIndex];

  if (!question) {
    showView("setup");
    return;
  }

  els.quizError.textContent = "";
  els.questionCounter.textContent = `Question ${state.currentIndex + 1} of ${state.quiz.length}`;
  els.questionTopic.textContent = question.topic;
  els.questionSubtopic.textContent = question.subtopic;
  els.levelPill.textContent = `${question.level} · ${question.difficulty}`;
  els.progressBar.style.width = `${((state.currentIndex + 1) / state.quiz.length) * 100}%`;
  els.questionText.textContent = question.question;
  if (question.image && question.image.src) {
    els.questionImage.src = question.image.src;
    els.questionImage.alt = question.image.alt || "";
    els.questionImageCaption.textContent = question.image.caption || "";
    els.questionImageCaption.classList.toggle("hidden", !question.image.caption);
    els.questionImageBlock.classList.remove("hidden");
  } else {
    els.questionImage.src = "";
    els.questionImage.alt = "";
    els.questionImageCaption.textContent = "";
    els.questionImageBlock.classList.add("hidden");
  }

  const selectedAnswer = state.answers[question.id];

  els.optionsList.innerHTML = question.options
    .map((option, index) => {
      const checked = Number(selectedAnswer) === index ? "checked" : "";
      return `
        <label class="option-card">
          <input type="radio" name="answer" value="${index}" ${checked} />
          <span>${escapeHtml(option)}</span>
        </label>
      `;
    })
    .join("");

  els.prevQuestionBtn.disabled = state.currentIndex === 0;
  els.nextQuestionBtn.textContent = state.currentIndex === state.quiz.length - 1 ? "Finish" : "Next";
}

function storeCurrentAnswer() {
  const question = state.quiz[state.currentIndex];
  const selected = document.querySelector('input[name="answer"]:checked');

  if (!selected) return false;

  state.answers[question.id] = Number(selected.value);
  saveState();
  return true;
}

function goToPreviousQuestion() {
  storeCurrentAnswer();
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    saveState();
    renderQuestion();
  }
}

function goToNextQuestion() {
  const answered = storeCurrentAnswer();

  if (!answered) {
    els.quizError.textContent = "Please select an answer before continuing.";
    return;
  }

  if (state.currentIndex === state.quiz.length - 1) {
    showResults();
    return;
  }

  state.currentIndex += 1;
  saveState();
  renderQuestion();
}

function calculateResults() {
  const topicScores = {};
  const subtopicScores = {};
  let totalCorrect = 0;

  state.quiz.forEach((question) => {
    const subtopicKey = getSubtopicKey(question);

    if (!topicScores[question.topic]) {
      topicScores[question.topic] = {
        correct: 0,
        total: 0
      };
    }

    if (!subtopicScores[subtopicKey]) {
      subtopicScores[subtopicKey] = {
        topic: question.topic,
        subtopic: question.subtopic,
        correct: 0,
        total: 0
      };
    }

    topicScores[question.topic].total += 1;
    subtopicScores[subtopicKey].total += 1;

    if (state.answers[question.id] === question.answer) {
      topicScores[question.topic].correct += 1;
      subtopicScores[subtopicKey].correct += 1;
      totalCorrect += 1;
    }
  });

  return {
    totalCorrect,
    totalQuestions: state.quiz.length,
    topicScores,
    subtopicScores
  };
}

function showResults() {
  const results = calculateResults();
  saveState();
  renderResults(results);
  showView("results");
}

function renderResults(results) {
  const overallPercentage = Math.round((results.totalCorrect / results.totalQuestions) * 100);

  els.overallPercent.textContent = `${overallPercentage}%`;
  els.overallFraction.textContent = `${results.totalCorrect} / ${results.totalQuestions}`;

  renderScoreCards(els.topicResults, Object.entries(results.topicScores).map(([topic, score]) => ({
    label: topic,
    correct: score.correct,
    total: score.total
  })));

  renderScoreCards(els.subtopicResults, Object.values(results.subtopicScores).map((score) => ({
    label: score.subtopic,
    context: score.topic,
    correct: score.correct,
    total: score.total
  })));

  const weakestSubtopic = getWeakestScore(Object.values(results.subtopicScores).map((score) => ({
    label: score.subtopic,
    context: score.topic,
    correct: score.correct,
    total: score.total
  })));

  els.recommendationText.textContent = buildRecommendation(overallPercentage, weakestSubtopic);
  renderReviewList();
}

function renderScoreCards(container, entries) {
  const sortedEntries = entries.sort((a, b) => {
    if (a.context && b.context && a.context !== b.context) return a.context.localeCompare(b.context);
    return a.label.localeCompare(b.label);
  });

  container.innerHTML = sortedEntries
    .map((entry) => {
      const percentage = Math.round((entry.correct / entry.total) * 100);
      const contextHtml = entry.context ? `<small class="muted">${escapeHtml(entry.context)}</small>` : "";

      return `
        <div class="topic-result-card">
          <div class="topic-result-top">
            <span>
              ${escapeHtml(entry.label)}
              ${contextHtml}
            </span>
            <span>${percentage}% · ${entry.correct}/${entry.total}</span>
          </div>
          <div class="mini-track">
            <div class="mini-bar" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function getWeakestScore(entries) {
  if (entries.length === 0) return null;

  return entries
    .map((entry) => ({
      ...entry,
      percentage: (entry.correct / entry.total) * 100
    }))
    .sort((a, b) => a.percentage - b.percentage || a.label.localeCompare(b.label))[0];
}

function buildRecommendation(overallPercentage, weakestSubtopic) {
  if (!weakestSubtopic) return "Complete a diagnostic to receive a recommendation.";

  const area = weakestSubtopic.context
    ? `${weakestSubtopic.label} within ${weakestSubtopic.context}`
    : weakestSubtopic.label;

  if (overallPercentage >= 85) {
    return `Excellent overall performance. Your lowest subtopic was ${area}, so use that as your first refinement target.`;
  }

  if (overallPercentage >= 65) {
    return `Good start. Your priority subtopic is ${area}. Focus on this subtopic before moving on to full exam-style practice.`;
  }

  return `Your first revision priority should be ${area}. Focus on this subtopic before moving on to full exam-style practice.`;
}

function renderReviewList() {
  els.reviewList.innerHTML = state.quiz
    .map((question, index) => {
      const userAnswer = state.answers[question.id];
      const isCorrect = userAnswer === question.answer;
      const userAnswerText = typeof userAnswer === "number" ? question.options[userAnswer] : "No answer";
      const correctAnswerText = question.options[question.answer];

      return `
        <article class="review-card ${isCorrect ? "correct" : "incorrect"}">
          <p class="eyebrow">Question ${index + 1} · ${escapeHtml(question.subtopic)}</p>
          <h3>${escapeHtml(question.question)}</h3>
          <p class="muted">${escapeHtml(question.topic)}</p>
          <p>
            <span class="review-label">Your answer:</span>
            <span class="${isCorrect ? "correct-text" : "incorrect-text"}">${escapeHtml(userAnswerText)}</span>
          </p>
          <p>
            <span class="review-label">Correct answer:</span>
            <span class="correct-text">${escapeHtml(correctAnswerText)}</span>
          </p>
          <p class="muted">${escapeHtml(question.explanation)}</p>
        </article>
      `;
    })
    .join("");
}

function restartSameDiagnostic() {
  state.currentIndex = 0;
  state.answers = {};
  state.quiz = shuffleArray(state.quiz);
  saveState();
  showView("quiz");
  renderQuestion();
}

function newDiagnostic() {
  resetState();
  renderSyllabusSelection();
  document.querySelector('input[name="questionsPerSubtopic"][value="1"]').checked = true;
  document.querySelector('input[name="level"][value="all"]').checked = true;
  els.reviewList.classList.add("hidden");
  els.toggleReviewBtn.textContent = "Show review";
  showView("setup");
}

function toggleReview() {
  const isHidden = els.reviewList.classList.toggle("hidden");
  els.toggleReviewBtn.textContent = isHidden ? "Show review" : "Hide review";
}

function handleSyllabusSelectionChange(event) {
  const target = event.target;

  if (target.name === "topicGroups") {
    const topic = target.dataset.topic;
    const subtopicCheckboxes = getSubtopicCheckboxesForTopic(topic);

    subtopicCheckboxes.forEach((checkbox) => {
      checkbox.checked = target.checked;
    });
  }

  state.selectedSubtopics = getSelectedSubtopicsFromForm();
  updateParentCheckboxes();
  updateSelectAllButton();
}

function getSubtopicCheckboxesForTopic(topic) {
  return Array.from(document.querySelectorAll('input[name="subtopics"]')).filter(
    (checkbox) => checkbox.dataset.topic === topic
  );
}

function updateParentCheckboxes() {
  const parentCheckboxes = document.querySelectorAll('input[name="topicGroups"]');

  parentCheckboxes.forEach((parentCheckbox) => {
    const topic = parentCheckbox.dataset.topic;
    const subtopicCheckboxes = getSubtopicCheckboxesForTopic(topic);
    const checkedCount = subtopicCheckboxes.filter((checkbox) => checkbox.checked).length;

    parentCheckbox.checked = checkedCount > 0 && checkedCount === subtopicCheckboxes.length;
    parentCheckbox.indeterminate = checkedCount > 0 && checkedCount < subtopicCheckboxes.length;
  });
}

function updateSelectAllButton() {
  const checkboxes = Array.from(document.querySelectorAll('input[name="subtopics"]'));
  const allSelected = checkboxes.length > 0 && checkboxes.every((checkbox) => checkbox.checked);
  els.selectAllTopicsBtn.textContent = allSelected ? "Clear all" : "Select all";
}

function selectAllTopics() {
  const checkboxes = Array.from(document.querySelectorAll('input[name="subtopics"]'));
  const allSelected = checkboxes.length > 0 && checkboxes.every((checkbox) => checkbox.checked);

  checkboxes.forEach((checkbox) => {
    checkbox.checked = !allSelected;
  });

  state.selectedSubtopics = getSelectedSubtopicsFromForm();
  updateParentCheckboxes();
  updateSelectAllButton();
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return String(value).replaceAll('"', '\\"');
}

function createStableDomKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attachEventListeners() {
  els.setupForm.addEventListener("submit", startQuiz);
  els.topicList.addEventListener("change", handleSyllabusSelectionChange);
  els.prevQuestionBtn.addEventListener("click", goToPreviousQuestion);
  els.nextQuestionBtn.addEventListener("click", goToNextQuestion);
  els.restartBtn.addEventListener("click", restartSameDiagnostic);
  els.newDiagnosticBtn.addEventListener("click", newDiagnostic);
  els.toggleReviewBtn.addEventListener("click", toggleReview);
  els.selectAllTopicsBtn.addEventListener("click", selectAllTopics);
  els.resetAppBtn.addEventListener("click", newDiagnostic);
}

async function init() {
  attachEventListeners();
  loadState();
  await loadQuestions();

  if (state.quiz.length > 0 && Object.keys(state.answers).length === state.quiz.length) {
    renderResults(calculateResults());
    showView("results");
  } else if (state.quiz.length > 0) {
    showView("quiz");
    renderQuestion();
  } else {
    showView("setup");
  }
}

init();
