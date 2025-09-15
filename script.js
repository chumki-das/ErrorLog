// ===== DOM ELEMENTS =====
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const extractBtn = document.getElementById('extractBtn');
const resultsSection = document.getElementById('resultsSection');
const extractedText = document.getElementById('extractedText');
const questionTag = document.getElementById('questionTag');
const questionExplanation = document.getElementById('questionExplanation');
const saveBtn = document.getElementById('saveBtn');
const questionsList = document.getElementById('questionsList');
const questionCount = document.getElementById('questionCount');
const parsedQuestion = document.getElementById('parsedQuestion');
const questionCard = document.getElementById('questionCard');
const parseBtn = document.getElementById('parseBtn');
const correctAnswerSection = document.getElementById('correctAnswerSection');
const correctAnswerOptions = document.getElementById('correctAnswerOptions');

// Mode switching
const uploadModeBtn = document.getElementById('uploadModeBtn');
const practiceModeBtn = document.getElementById('practiceModeBtn');
const uploadMode = document.getElementById('uploadMode');
const practiceMode = document.getElementById('practiceMode');

// Practice mode elements
const practiceSetup = document.getElementById('practiceSetup');
const practiceSession = document.getElementById('practiceSession');
const practiceResults = document.getElementById('practiceResults');
const tagSelector = document.getElementById('tagSelector');
const practiceQuestionCount = document.getElementById('practiceQuestionCount');
const startPracticeBtn = document.getElementById('startPracticeBtn');

// Practice session elements
const currentQuestionNum = document.getElementById('currentQuestionNum');
const totalQuestions = document.getElementById('totalQuestions');
const currentScore = document.getElementById('currentScore');
const questionsAnswered = document.getElementById('questionsAnswered');
const practiceQuestionCard = document.getElementById('practiceQuestionCard');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

// Practice results elements
const finalScore = document.getElementById('finalScore');
const finalPercentage = document.getElementById('finalPercentage');
const resultsSummary = document.getElementById('resultsSummary');
const newPracticeBtn = document.getElementById('newPracticeBtn');
const backToUploadBtn = document.getElementById('backToUploadBtn');

// ===== GLOBAL STATE =====
let currentImage = null;
let currentParsedQuestion = null;
let selectedCorrectAnswer = null;
let practiceQuestions = [];
let currentPracticeIndex = 0;
let practiceAnswers = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    loadSavedQuestions();
    setupEventListeners();
});

function setupEventListeners() {
    // Mode switching
    uploadModeBtn.addEventListener('click', () => switchMode('upload'));
    practiceModeBtn.addEventListener('click', () => switchMode('practice'));

    // Upload mode
    imageInput.addEventListener('change', handleImageUpload);
    extractBtn.addEventListener('click', handleTextExtraction);
    parseBtn.addEventListener('click', handleParseQuestion);
    saveBtn.addEventListener('click', handleSaveQuestion);

    // Practice mode
    startPracticeBtn.addEventListener('click', startPracticeSession);
    prevQuestionBtn.addEventListener('click', () => navigatePractice(-1));
    nextQuestionBtn.addEventListener('click', () => navigatePractice(1));
    newPracticeBtn.addEventListener('click', () => {
        practiceSetup.style.display = 'block';
        practiceSession.style.display = 'none';
        practiceResults.style.display = 'none';
        loadTagSelector();
    });
    backToUploadBtn.addEventListener('click', () => switchMode('upload'));
}

// ===== MODE SWITCHING =====
function switchMode(mode) {
    if (mode === 'upload') {
        // Show upload mode
        uploadMode.style.display = 'block';
        practiceMode.style.display = 'none';

        // Style UPLOAD button as ACTIVE (solid blue background, white text)
        uploadModeBtn.classList.remove('text-primary', 'border-primary', 'bg-white');
        uploadModeBtn.classList.add('bg-primary', 'text-white');

        // Style PRACTICE button as INACTIVE (white background, blue text, blue border)
        practiceModeBtn.classList.remove('bg-primary', 'text-white');
        practiceModeBtn.classList.add('text-primary', 'border-primary', 'bg-white');

    } else {
        // Show practice mode
        uploadMode.style.display = 'none';
        practiceMode.style.display = 'block';
        practiceSetup.style.display = 'block';
        practiceSession.style.display = 'none';
        practiceResults.style.display = 'none';

        // Style PRACTICE button as ACTIVE (solid blue background, white text)
        practiceModeBtn.classList.remove('text-primary', 'border-primary', 'bg-white');
        practiceModeBtn.classList.add('bg-primary', 'text-white');

        // Style UPLOAD button as INACTIVE (white background, blue text, blue border)
        uploadModeBtn.classList.remove('bg-primary', 'text-white');
        uploadModeBtn.classList.add('text-primary', 'border-primary', 'bg-white');

        loadTagSelector();
    }
}

// ===== IMAGE UPLOAD & OCR =====
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        currentImage = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.innerHTML = `
                <div class="mt-4">
                    <img src="${e.target.result}" alt="Uploaded image" class="max-w-full h-auto rounded-lg shadow-md mx-auto" style="max-height: 300px;">
                </div>
            `;
            extractBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

async function handleTextExtraction() {
    if (!currentImage) return;

    extractBtn.textContent = 'Processing...';
    extractBtn.disabled = true;
    resultsSection.style.display = 'block';
    extractedText.value = 'Processing image... This may take a few seconds.';

    try {
        const { data: { text } } = await Tesseract.recognize(
            currentImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        extractedText.value = `Processing... ${progress}%`;
                    }
                }
            }
        );

        extractedText.value = text.trim() || 'No text could be extracted from this image.';

        // Show parse button if we have text
        if (text.trim() && text.trim() !== 'No text could be extracted from this image.') {
            parseBtn.style.display = 'block';
        }

    } catch (error) {
        console.error('OCR Error:', error);
        extractedText.value = 'Error extracting text. Please try again with a clearer image.';
    } finally {
        extractBtn.textContent = 'Extract Text & Parse Question';
        extractBtn.disabled = false;
    }
}

// ===== QUESTION PARSING =====
function handleParseQuestion() {
    const text = extractedText.value.trim();
    if (!text) return;

    const parsed = parseMultipleChoiceQuestion(text);
    if (parsed) {
        currentParsedQuestion = parsed;
        selectedCorrectAnswer = null;
        displayParsedQuestion(parsed);
        showCorrectAnswerSelector(parsed);
        saveBtn.style.display = 'block';
    } else {
        // Handle as plain text question
        currentParsedQuestion = null;
        selectedCorrectAnswer = null;
        parsedQuestion.style.display = 'block';
        correctAnswerSection.style.display = 'none';
        questionCard.innerHTML = `
            <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800 mb-2">⚠️ Could not detect multiple-choice format</p>
                <p class="text-sm text-gray-700">This will be saved as a text-based question.</p>
                <div class="mt-3 p-3 bg-white rounded border font-mono text-sm whitespace-pre-wrap">${escapeHtml(text)}</div>
            </div>
        `;
        saveBtn.style.display = 'block';
    }
}
function parseMultipleChoiceQuestion(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // STEP 1: Check for manual #options: marker first
    const optionsMarkerIndex = lines.findIndex(line => line.toLowerCase() === '#options:');

    if (optionsMarkerIndex !== -1) {
        // Manual mode: everything before #options: is the question (preserve line breaks)
        const questionPrompt = lines.slice(0, optionsMarkerIndex).join('\n').trim();
        const optionLines = lines.slice(optionsMarkerIndex + 1);

        // Convert option lines to A), B), C) format automatically
        const options = optionLines.map((line, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D, E...
            return {
                letter: letter,
                text: line.trim()
            };
        }).filter(option => option.text.length > 0); // Remove empty lines

        if (options.length >= 2 && questionPrompt.length > 5) {
            return {
                prompt: questionPrompt,
                options: options,
                type: 'multiple-choice',
                source: 'manual' // Track that this was manually triggered
            };
        }
    }

    // STEP 2: Fall back to automatic detection (original logic)
    let questionPrompt = '';
    let options = [];
    let foundOptions = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line looks like a multiple choice option
        const optionMatch = line.match(/^([A-E])\)\s*(.+)$/i) || line.match(/^([A-E])\.?\s*(.+)$/i);

        if (optionMatch && !foundOptions) {
            foundOptions = true;
            // Everything before this is the question (preserve line breaks)
            questionPrompt = lines.slice(0, i).join('\n').trim();
        }

        if (optionMatch) {
            options.push({
                letter: optionMatch[1].toUpperCase(),
                text: optionMatch[2].trim()
            });
        } else if (!foundOptions && line.length > 10) {
            // If we haven't found options yet, this might be part of the question
            continue;
        }
    }

    // If we found at least 2 options, consider it a valid multiple choice question
    if (options.length >= 2 && questionPrompt.length > 10) {
        return {
            prompt: questionPrompt,
            options: options,
            type: 'multiple-choice',
            source: 'automatic' // Track that this was auto-detected
        };
    }

    return null;
}

function displayParsedQuestion(parsed) {
    parsedQuestion.style.display = 'block';

    const optionsHtml = parsed.options.map(option => `
        <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
            <div class="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center font-semibold text-sm">
                ${option.letter}
            </div>
            <div class="flex-1 text-sm">${formatMathExpressions(escapeHtml(option.text))}</div>
        </div>
    `).join('');

    const sourceIndicator = parsed.source === 'manual'
        ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Manual #options: detected</span>'
        : '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🤖 Auto-detected format</span>';

    questionCard.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-start mb-4">
                <div class="font-medium text-gray-900 flex-1 whitespace-pre-line">${formatMathExpressions(escapeHtml(parsed.prompt))}</div>
                ${sourceIndicator}
            </div>
            <div class="space-y-2">
                ${optionsHtml}
            </div>
        </div>
    `;
}

function showCorrectAnswerSelector(parsed) {
    correctAnswerSection.style.display = 'block';

    const optionsHtml = parsed.options.map(option => `
        <button onclick="selectCorrectAnswer('${option.letter}')" 
                class="correct-answer-btn px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
            ${option.letter}
        </button>
    `).join('');

    correctAnswerOptions.innerHTML = optionsHtml;
}

function selectCorrectAnswer(letter) {
    selectedCorrectAnswer = letter;

    // Update button styles
    const buttons = correctAnswerOptions.querySelectorAll('.correct-answer-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-green-100', 'border-green-300', 'text-green-800');
        btn.classList.add('border-gray-300');
    });

    // Highlight selected button
    const selectedBtn = Array.from(buttons).find(btn =>
        btn.getAttribute('onclick').includes(`'${letter}'`)
    );
    if (selectedBtn) {
        selectedBtn.classList.remove('border-gray-300');
        selectedBtn.classList.add('bg-green-100', 'border-green-300', 'text-green-800');
    }
}

function selectPreviewOption(letter) {
    // Remove previous selections
    const options = questionCard.querySelectorAll('[onclick*="selectPreviewOption"]');
    options.forEach(option => {
        option.classList.remove('bg-blue-100', 'border-blue-300');
        option.classList.add('border-gray-200');
    });

    // Highlight selected option
    const selectedOption = Array.from(options).find(option =>
        option.getAttribute('onclick').includes(`'${letter}'`)
    );
    if (selectedOption) {
        selectedOption.classList.remove('border-gray-200');
        selectedOption.classList.add('bg-blue-100', 'border-blue-300');
    }
}

// ===== SAVE QUESTIONS =====
function handleSaveQuestion() {
    const text = extractedText.value.trim();
    const tag = questionTag.value.trim();

    if (!text || text.includes('Processing') || text === 'No text could be extracted from this image.') {
        alert('Please extract text from an image first.');
        return;
    }

    if (!tag) {
        alert('Please add a tag for this question.');
        return;
    }

    // For multiple choice questions, require correct answer selection
    if (currentParsedQuestion && !selectedCorrectAnswer) {
        alert('Please select the correct answer for this multiple-choice question.');
        return;
    }

    const explanation = questionExplanation.value.trim();

    const question = {
        id: Date.now(),
        rawText: text,
        tag: tag,
        explanation: explanation || null,
        date: new Date().toLocaleDateString(),
        type: currentParsedQuestion ? 'multiple-choice' : 'text',
        parsedData: currentParsedQuestion || null,
        correctAnswer: selectedCorrectAnswer || null
    };

    const savedQuestions = getSavedQuestions();
    savedQuestions.unshift(question);
    localStorage.setItem('studyQuestions', JSON.stringify(savedQuestions));

    // Clear form
    questionTag.value = '';
    questionExplanation.value = '';
    extractedText.value = '';
    resultsSection.style.display = 'none';
    parsedQuestion.style.display = 'none';
    correctAnswerSection.style.display = 'none';
    saveBtn.style.display = 'none';
    parseBtn.style.display = 'none';
    imagePreview.innerHTML = '';
    imageInput.value = '';
    currentImage = null;
    currentParsedQuestion = null;
    selectedCorrectAnswer = null;
    extractBtn.disabled = true;

    loadSavedQuestions();

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successMsg.textContent = '✅ Question saved successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
}

// ===== QUESTION BANK =====
function getSavedQuestions() {
    const saved = localStorage.getItem('studyQuestions');
    return saved ? JSON.parse(saved) : [];
}

function loadSavedQuestions() {
    const questions = getSavedQuestions();
    questionCount.textContent = `${questions.length} questions saved`;

    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-4">📚</div>
                <p class="text-lg">No questions saved yet</p>
                <p class="text-sm">Upload an image to get started!</p>
            </div>
        `;
        return;
    }

    questionsList.innerHTML = questions.map(question => `
        <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
                <span class="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                    ${escapeHtml(question.tag)}
                </span>
                <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-500">${question.date}</span>
                    <button onclick="deleteQuestion(${question.id})" 
                            class="text-danger hover:bg-red-50 p-1 rounded transition-colors">
                        🗑️
                    </button>
                </div>
            </div>
            
            ${question.type === 'multiple-choice' && question.parsedData ?
            renderQuestionPreview(question.parsedData, question.correctAnswer, question.explanation) :
            `<div class="text-sm text-gray-700 bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">${escapeHtml(question.rawText)}</div>`
        }
        </div>
    `).join('');
}

function renderQuestionPreview(parsedData, correctAnswer = null, explanation = null) {
    const optionsHtml = parsedData.options.map(option => {
        const isCorrect = correctAnswer === option.letter;
        return `
            <div class="flex items-start space-x-2 text-sm ${isCorrect ? 'bg-green-50 p-2 rounded' : ''}">
                <span class="font-semibold ${isCorrect ? 'text-green-600' : 'text-primary'}">${option.letter})</span>
                <span class="${isCorrect ? 'text-green-800 font-medium' : ''}">${formatMathExpressions(escapeHtml(option.text))}</span>
                ${isCorrect ? '<span class="text-green-600 ml-2">✓</span>' : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="space-y-3">
            <div class="font-medium text-gray-900 whitespace-pre-line">${formatMathExpressions(escapeHtml(parsedData.prompt))}</div>
            <div class="space-y-1 pl-4">
                ${optionsHtml}
            </div>
            ${correctAnswer ? `
                <div class="mt-3 text-xs text-green-600 font-medium">
                    Correct Answer: ${correctAnswer}
                </div>
            ` : ''}
            ${explanation ? `
                <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="text-xs font-medium text-blue-800 mb-1">📝 Explanation:</div>
                    <div class="text-sm text-blue-700 whitespace-pre-line">${renderMarkdown(explanation)}</div>
                </div>
            ` : ''}
        </div>
    `;
}

function deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
        const questions = getSavedQuestions();
        const filteredQuestions = questions.filter(q => q.id !== id);
        localStorage.setItem('studyQuestions', JSON.stringify(filteredQuestions));
        loadSavedQuestions();
    }
}
// ===== PRACTICE MODE =====
function loadTagSelector() {
    const questions = getSavedQuestions();
    const tags = [...new Set(questions.map(q => q.tag))];

    if (tags.length === 0) {
        tagSelector.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-4">🚧</div>
                <h3 class="text-lg font-medium mb-2">Practice Mode Coming Soon</h3>
                <p class="text-sm">Upload some questions first to enable practice mode!</p>
            </div>
        `;
        startPracticeBtn.disabled = true;
        return;
    }

    // Show real tag selector
    tagSelector.innerHTML = `
        <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200">
                <input type="checkbox" id="selectAllTags" class="rounded border-gray-300 text-primary focus:ring-primary">
                <span class="text-sm font-medium">Select All Tags</span>
            </label>
            ${tags.map(tag => {
        const questionCount = questions.filter(q => q.tag === tag && q.type === 'multiple-choice').length;
        return `
                    <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input type="checkbox" value="${escapeHtml(tag)}" class="tag-checkbox rounded border-gray-300 text-primary focus:ring-primary">
                        <span class="text-sm">${escapeHtml(tag)}</span>
                        <span class="text-xs text-gray-500">(${questionCount} MC questions)</span>
                    </label>
                `;
    }).join('')}
        </div>
    `;

    // Add select all functionality
    setTimeout(() => {
        const selectAllCheckbox = document.getElementById('selectAllTags');
        const tagCheckboxes = document.querySelectorAll('.tag-checkbox');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function () {
                tagCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
            });
        }
    }, 100);

    startPracticeBtn.disabled = false;
    startPracticeBtn.textContent = 'Start Practice Session';
}

function startPracticeSession() {
    const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);
    const questionCountValue = practiceQuestionCount.value;

    if (selectedTags.length === 0) {
        alert('Please select at least one tag to practice.');
        return;
    }

    // Get questions for selected tags
    const allQuestions = getSavedQuestions();
    const availableQuestions = allQuestions.filter(q =>
        selectedTags.includes(q.tag) && q.type === 'multiple-choice' && q.parsedData && q.correctAnswer
    );

    if (availableQuestions.length === 0) {
        alert('No multiple-choice questions with correct answers found for the selected tags.');
        return;
    }

    // Shuffle and select questions
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    const questionCount = questionCountValue === 'all' ? shuffled.length : parseInt(questionCountValue);
    practiceQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Initialize practice state
    currentPracticeIndex = 0;
    practiceAnswers = practiceQuestions.map(() => ({
        selected: null,
        submitted: false,
        correct: null
    }));

    // Show practice session
    practiceSetup.style.display = 'none';
    practiceSession.style.display = 'block';

    // Update UI
    totalQuestions.textContent = practiceQuestions.length;
    updatePracticeDisplay();
}

function updatePracticeDisplay() {
    const question = practiceQuestions[currentPracticeIndex];
    const answer = practiceAnswers[currentPracticeIndex];

    currentQuestionNum.textContent = currentPracticeIndex + 1;

    // Update score display
    const submittedCount = practiceAnswers.filter(a => a.submitted).length;
    const correctCount = practiceAnswers.filter(a => a.correct === true).length;
    questionsAnswered.textContent = submittedCount;
    currentScore.textContent = correctCount;

    // Render question options
    const optionsHtml = question.parsedData.options.map(option => {
        let classes = 'flex items-start space-x-3 p-4 border-2 rounded-lg transition-all';
        let clickable = !answer.submitted;

        if (answer.submitted) {
            // After submission, show results
            if (option.letter === question.correctAnswer) {
                classes += ' bg-green-50 border-green-300 text-green-800';
            } else if (answer.selected === option.letter && option.letter !== question.correctAnswer) {
                classes += ' bg-red-50 border-red-300 text-red-800';
            } else {
                classes += ' border-gray-200 bg-gray-50';
            }
        } else {
            // Before submission, show selection
            if (answer.selected === option.letter) {
                classes += ' bg-blue-50 border-blue-300 cursor-pointer';
            } else {
                classes += ' border-gray-200 hover:bg-gray-50 cursor-pointer';
            }
        }

        return `
            <div class="${classes}" ${clickable ? `onclick="selectPracticeAnswer('${option.letter}')"` : ''}>
                <div class="w-8 h-8 border-2 border-current rounded-full flex items-center justify-center font-semibold text-sm">
                    ${option.letter}
                </div>
                <div class="flex-1">${formatMathExpressions(escapeHtml(option.text))}</div>
                ${answer.submitted && option.letter === question.correctAnswer ? '<div class="text-green-600 font-bold">✓</div>' : ''}
                ${answer.submitted && answer.selected === option.letter && option.letter !== question.correctAnswer ? '<div class="text-red-600 font-bold">✗</div>' : ''}
            </div>
        `;
    }).join('');

    // Submit button and result display
    let actionSection = '';
    if (!answer.submitted && answer.selected) {
        actionSection = `
            <button onclick="submitPracticeAnswer()" class="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-secondary transition-colors">
                Submit Answer
            </button>
        `;
    } else if (answer.submitted) {
        const isCorrect = answer.selected === question.correctAnswer;
        const explanationSection = question.explanation ? `
            <div class="mt-4">
                <button onclick="toggleExplanation(${currentPracticeIndex})" class="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
                    <span>🧠</span>
                    <span class="font-medium">See Explanation</span>
                    <span id="explanationToggle${currentPracticeIndex}">▼</span>
                </button>
                <div id="explanation${currentPracticeIndex}" class="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg" style="display: none;">
                    <div class="text-sm text-blue-800 prose prose-sm max-w-none">${renderMarkdown(question.explanation)}</div>
                </div>
            </div>
        ` : '';

        actionSection = `
            <div class="p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                <div class="flex items-center space-x-2">
                    <div class="text-2xl">${isCorrect ? '✅' : '❌'}</div>
                    <div>
                        <div class="font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}">
                            ${isCorrect ? 'Correct!' : 'Incorrect'}
                        </div>
                        <div class="text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}">
                            ${isCorrect ? 'Well done!' : `The correct answer is ${question.correctAnswer}`}
                        </div>
                    </div>
                </div>
                ${explanationSection}
            </div>
        `;
    }

    practiceQuestionCard.innerHTML = `
        <div class="space-y-6">
            <div class="text-lg font-medium text-gray-900 whitespace-pre-line">${formatMathExpressions(escapeHtml(question.parsedData.prompt))}</div>
            <div class="space-y-3">
                ${optionsHtml}
            </div>
            ${actionSection}
        </div>
    `;

    // Update navigation buttons
    prevQuestionBtn.disabled = currentPracticeIndex === 0;

    if (currentPracticeIndex === practiceQuestions.length - 1) {
        nextQuestionBtn.textContent = 'View Results';
        nextQuestionBtn.disabled = !answer.submitted;
    } else {
        nextQuestionBtn.textContent = 'Next Question';
        nextQuestionBtn.disabled = false;
    }
}

function selectPracticeAnswer(letter) {
    const answer = practiceAnswers[currentPracticeIndex];

    // Don't allow changing answer once submitted
    if (answer.submitted) return;

    answer.selected = letter;
    updatePracticeDisplay();
}

function submitPracticeAnswer() {
    const answer = practiceAnswers[currentPracticeIndex];
    const question = practiceQuestions[currentPracticeIndex];

    if (!answer.selected) return;

    answer.submitted = true;
    answer.correct = answer.selected === question.correctAnswer;

    updatePracticeDisplay();
}

function toggleExplanation(questionIndex) {
    const explanationDiv = document.getElementById(`explanation${questionIndex}`);
    const toggleIcon = document.getElementById(`explanationToggle${questionIndex}`);

    if (explanationDiv.style.display === 'none') {
        explanationDiv.style.display = 'block';
        toggleIcon.textContent = '▲';
    } else {
        explanationDiv.style.display = 'none';
        toggleIcon.textContent = '▼';
    }
}

function navigatePractice(direction) {
    if (direction === 1) {
        if (currentPracticeIndex === practiceQuestions.length - 1) {
            // Show results
            showPracticeResults();
            return;
        }
        currentPracticeIndex++;
    } else {
        if (currentPracticeIndex > 0) {
            currentPracticeIndex--;
        }
    }

    updatePracticeDisplay();
}

function showPracticeResults() {
    const totalQuestions = practiceQuestions.length;
    const correctAnswers = practiceAnswers.filter(a => a.correct === true).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    practiceSession.style.display = 'none';
    practiceResults.style.display = 'block';

    finalScore.textContent = `${correctAnswers}/${totalQuestions}`;
    finalPercentage.textContent = `${percentage}% Correct`;

    // Generate missed questions list
    const missedQuestions = practiceQuestions.filter((question, index) =>
        !practiceAnswers[index].correct
    );

    // Generate results summary by topic
    const tagResults = {};
    practiceQuestions.forEach((question, index) => {
        const tag = question.tag;
        if (!tagResults[tag]) {
            tagResults[tag] = { correct: 0, total: 0 };
        }
        tagResults[tag].total++;
        if (practiceAnswers[index].correct) {
            tagResults[tag].correct++;
        }
    });

    const tagSummaryHtml = Object.entries(tagResults).map(([tag, stats]) => {
        const tagPercentage = Math.round((stats.correct / stats.total) * 100);
        return `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="font-medium">${escapeHtml(tag)}</span>
                <span class="text-sm text-gray-600">${stats.correct}/${stats.total} (${tagPercentage}%)</span>
            </div>
        `;
    }).join('');

    const missedQuestionsHtml = missedQuestions.length > 0 ? `
        <div class="mt-6">
            <h3 class="font-semibold text-gray-900 mb-3">Questions You Missed:</h3>
            <div class="space-y-3">
                ${missedQuestions.map((question, index) => {
        const originalIndex = practiceQuestions.indexOf(question);
        const userAnswer = practiceAnswers[originalIndex].selected;
        return `
                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div class="font-medium text-red-900 mb-2 whitespace-pre-line">${formatMathExpressions(escapeHtml(question.parsedData.prompt))}</div>
                            <div class="text-sm space-y-1">
                                <div class="text-red-700">Your answer: <span class="font-medium">${userAnswer}</span></div>
                                <div class="text-green-700">Correct answer: <span class="font-medium">${question.correctAnswer}</span></div>
                                <div class="text-gray-600">Topic: ${escapeHtml(question.tag)}</div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    ` : '<div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">🎉 Perfect score! You got all questions correct!</div>';

    resultsSummary.innerHTML = `
        <h3 class="font-semibold text-gray-900 mb-3">Results by Topic:</h3>
        <div class="space-y-2 mb-4">
            ${tagSummaryHtml}
        </div>
        ${missedQuestionsHtml}
    `;
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMathExpressions(text) {
    if (!text) return text;

    return text
        // Replace superscripts: ^2 → ², ^3 → ³, etc.
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\^4/g, '⁴')
        .replace(/\^5/g, '⁵')
        .replace(/\^6/g, '⁶')
        .replace(/\^7/g, '⁷')
        .replace(/\^8/g, '⁸')
        .replace(/\^9/g, '⁹')
        .replace(/\^0/g, '⁰')
        .replace(/\^1/g, '¹')

        // Replace fractions: variable/variable → variable⁄variable
        // Matches patterns like: 2x/3, xy/12, a/b, 15/7, etc.
        .replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, '$1⁄$2');
}

function renderMarkdown(text) {
    if (!text) return '';

    // Use marked.js if available, otherwise simple fallback
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }

    // Simple fallback markdown rendering
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '• $1')
        .replace(/^\* (.+)$/gm, '• $1')
        .replace(/\n/g, '<br>');
}