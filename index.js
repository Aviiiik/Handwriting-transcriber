// DOM Elements
const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const transcribeBtn = document.getElementById('transcribe-btn');
const clearBtn = document.getElementById('clear-btn');
const proofreadBtn = document.getElementById('proofread-btn');

const resultsSection = document.getElementById('results-section');
const proofreadSection = document.getElementById('proofread-section');

const transcribedTextDiv = document.getElementById('transcribed-text');
const proofreadTextDiv = document.getElementById('proofread-text');

const loaderTranscribe = document.getElementById('loader-transcribe');
const loaderProofread = document.getElementById('loader-proofread');

const copyTranscribedBtn = document.getElementById('copy-transcribed-btn');
const copyProofreadBtn = document.getElementById('copy-proofread-btn');
const copyTranscribedMessage = document.getElementById('copy-transcribed-message');
const copyProofreadMessage = document.getElementById('copy-proofread-message');

// Transcribed Reader Elements
const pdfControlsSection = document.getElementById('pdf-controls-section');
const pageRangeInput = document.getElementById('page-range-input');
const pageReaderControls = document.getElementById('page-reader-controls'); // Transcribed controls
const prevPageBtn = document.getElementById('prev-page-btn'); // Transcribed prev
const nextPageBtn = document.getElementById('next-page-btn'); // Transcribed next
const pageCounter = document.getElementById('page-counter'); // Transcribed counter

// NEW Proofread Reader Elements
const proofreadPageControls = document.getElementById('proofread-page-controls');
const proofreadPrevPageBtn = document.getElementById('proofread-prev-page-btn');
const proofreadNextPageBtn = document.getElementById('proofread-next-page-btn');
const proofreadPageCounter = document.getElementById('proofread-page-counter');

// Drag and Drop Element
const dropZone = document.getElementById('drop-zone'); 

// Resource Generation Elements
const resourceGenerationSection = document.getElementById('resource-generation-section');
const studyMaterialBtn = document.getElementById('study-material-btn');
const researchPapersBtn = document.getElementById('research-papers-btn');
const loaderResources = document.getElementById('loader-resources');
const resourceOutputDiv = document.getElementById('resource-output');

// Book Reader Controls
const fontSizeSelect = document.getElementById('font-size');
const fontFamilySelect = document.getElementById('font-family');


// State Variables
let uploadedFileData = null;
let transcribedPages = [];
let proofreadPages = []; 
let transcribedPageIndex = 0; // Dedicated index for transcribed view
let proofreadPageIndex = 0; // Dedicated index for proofread view
let globalProofreadText = ''; 


// --- Core UI Functions ---

function updateTranscribedUI() {
    const dataArray = transcribedPages;
    const totalPages = dataArray.length;
    
    // Display content
    if (totalPages > 0) {
        if (transcribedPageIndex >= totalPages) transcribedPageIndex = 0;
        
        transcribedTextDiv.textContent = dataArray[transcribedPageIndex].content;
        
        // Update controls visibility and state
        if (totalPages > 1) {
            pageReaderControls.classList.remove('hidden');
            pageCounter.textContent = `Page ${transcribedPageIndex + 1} of ${totalPages} (Transcribed)`;
            prevPageBtn.disabled = transcribedPageIndex === 0;
            nextPageBtn.disabled = transcribedPageIndex === totalPages - 1;
        } else {
            pageReaderControls.classList.add('hidden');
        }
        proofreadBtn.disabled = false;
    } else {
        pageReaderControls.classList.add('hidden');
        proofreadBtn.disabled = true;
    }
}

function updateProofreadUI() {
    const dataArray = proofreadPages;
    const totalPages = dataArray.length;

    // Display content
    if (totalPages > 0) {
        if (proofreadPageIndex >= totalPages) proofreadPageIndex = 0;

        proofreadTextDiv.textContent = dataArray[proofreadPageIndex].content;
        
        // Update dedicated controls visibility and state
        if (totalPages > 1) {
            proofreadPageControls.classList.remove('hidden');
            proofreadPageCounter.textContent = `Page ${proofreadPageIndex + 1} of ${totalPages} (Proofread)`;
            proofreadPrevPageBtn.disabled = proofreadPageIndex === 0;
            proofreadNextPageBtn.disabled = proofreadPageIndex === totalPages - 1;
        } else {
            proofreadPageControls.classList.add('hidden');
        }
    } else {
        proofreadPageControls.classList.add('hidden');
    }

    // Resource generation section is visible only if proofreading is complete
    resourceGenerationSection.classList.toggle('hidden', globalProofreadText === '');
}


function clearResults() {
    uploadedFileData = null;
    transcribedPages = [];
    proofreadPages = [];
    globalProofreadText = ''; 
    transcribedPageIndex = 0;
    proofreadPageIndex = 0;
    
    transcribeBtn.disabled = true;
    proofreadBtn.disabled = true;
    
    resultsSection.classList.add('hidden');
    proofreadSection.classList.add('hidden');
    resourceGenerationSection.classList.add('hidden');
    
    transcribedTextDiv.textContent = '';
    proofreadTextDiv.textContent = '';
    resourceOutputDiv.innerHTML = 'Resources will appear here.';
    copyTranscribedMessage.textContent = '';
    copyProofreadMessage.textContent = '';
    
    pageReaderControls.classList.add('hidden');
    proofreadPageControls.classList.add('hidden');
}


// --- Reusable File Handler ---
function handleFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedFileData = {
            data: event.target.result.split(',')[1],
            mimeType: file.type
        };
        transcribeBtn.disabled = false;
    };
    
    if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
        imagePreview.src = URL.createObjectURL(file);
        imagePreviewContainer.classList.remove('hidden');
        pdfControlsSection.classList.add('hidden');
        pageRangeInput.value = 'all';
    } else if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
        imagePreviewContainer.classList.add('hidden');
        pdfControlsSection.classList.remove('hidden');
    } else {
        alert("Unsupported file type. Please upload an image or a PDF.");
        imageUpload.value = '';
        return;
    }
    
    clearResults();
}

// --- Resource Formatting Helper (No Change) ---
function formatResources(markdown) {
    if (!markdown) return '';
    
    let html = markdown.replace(/^[\s\t]*[*-][\s\t]*/gm, '<li>');
    
    const firstLiIndex = html.indexOf('<li>');
    if (firstLiIndex !== -1) {
        const introText = html.substring(0, firstLiIndex);
        const listContent = html.substring(firstLiIndex);
        html = introText + '<ol>' + listContent + '</ol>';
    }
    
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<br><br><br>/g, '<br><br>');

    return html;
}


// --- API/Helper Functions (No Change) ---
async function callGeminiAPI(prompt, fileData = null, mimeType = null, endpointType = 'transcribe') {
    const parts = [{ text: prompt }];
    if (fileData && mimeType) {
        parts.push({ inlineData: { mimeType: mimeType, data: fileData } });
    }
    
    const requiresJson = (endpointType === 'transcribe' || endpointType === 'proofread');
    const generationConfig = {
        responseMimeType: "application/json",
    };

    const payload = { 
        contents: [{ parts: parts }],
        ...(requiresJson && { generationConfig: generationConfig })
    };
    
    const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorResult = {};
        try {
            errorResult = await response.json();
        } catch (e) {
            throw new Error(`API request failed with status ${response.status}.`);
        }
        
        if (errorResult.error) {
            throw new Error(errorResult.error);
        }
        
        throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
         if (result.candidates[0].content && result.candidates[0].content.parts &&
             result.candidates[0].content.parts.length > 0) {
             return result.candidates[0].content.parts[0].text;
         }
    }
    
    if (result.candidates && result.candidates[0].finishReason !== 'STOP') {
         throw new Error(`The model stopped processing for the following reason: ${result.candidates[0].finishReason}. This may be due to safety settings or an issue with the prompt.`);
    }

    throw new Error('Could not process the request. The response from the model was empty.');
}


// --- Event Listeners: Transcribe and Proofread ---

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

clearBtn.addEventListener('click', () => {
    imageUpload.value = '';
    imagePreview.src = '#';
    imagePreviewContainer.classList.add('hidden');
    pdfControlsSection.classList.add('hidden');
    pageRangeInput.value = 'all';
    clearResults();
});

transcribeBtn.addEventListener('click', async () => {
    if (!uploadedFileData) return;

    resultsSection.classList.remove('hidden');
    // MODIFIED: Do NOT hide proofread section, just reset its state
    proofreadSection.classList.add('hidden'); 
    resourceGenerationSection.classList.add('hidden');
    transcribedTextDiv.textContent = 'Only if you ask nicely';
    loaderTranscribe.classList.remove('hidden');
    transcribeBtn.disabled = true;
    proofreadBtn.disabled = true;
    
    transcribedPages = [];
    proofreadPages = []; 
    globalProofreadText = ''; 
    transcribedPageIndex = 0; // Reset index
    proofreadPageIndex = 0; // Reset index

    try {
        const range = pageRangeInput.value.trim().toLowerCase();
        let prompt = `Transcribe the handwriting or text from the document. ${uploadedFileData.mimeType === 'application/pdf' ? `The document is a multi-page PDF. ONLY transcribe content for the following pages/range: **${range}**.` : 'Return all text from the image.'}
        Your output must be a single JSON object that strictly follows this structure: 
        {\\"transcription\\": [ {\\"page\\": "1", \\"content\\": "..."} ] } 
        The 'page' value should be the page number (as a string, starting at 1). The 'content' should be the full transcribed text for that page/image.`;

        const jsonText = await callGeminiAPI(prompt, uploadedFileData.data, uploadedFileData.mimeType, 'transcribe');
        
        const resultObject = JSON.parse(jsonText);

        if (resultObject.transcription && Array.isArray(resultObject.transcription)) {
            transcribedPages = resultObject.transcription.filter(p => p.content && p.content.trim() !== '');
            if (transcribedPages.length > 0) {
                updateTranscribedUI(); // Use dedicated update function
            } else {
                transcribedTextDiv.textContent = 'Transcription returned no text. Check the selected page range.';
            }
        } else {
            throw new Error("API response was not in the expected structured JSON format for transcription.");
        }

    } catch (error) {
        console.error('Error during transcription:', error);
        transcribedTextDiv.textContent = `Error: ${error.message}. Please check the console for details.`;
    } finally {
        loaderTranscribe.classList.add('hidden');
        transcribeBtn.disabled = false;
    }
});


// 4. Proofread Button
proofreadBtn.addEventListener('click', async () => {
    if (!transcribedPages || transcribedPages.length === 0) return;

    // MODIFIED: Show proofread section, but do not hide transcribed section
    proofreadSection.classList.remove('hidden'); 
    proofreadTextDiv.textContent = 'Proofreading all pages...';
    loaderProofread.classList.remove('hidden');
    proofreadBtn.disabled = true;
    
    resourceGenerationSection.classList.add('hidden');
    proofreadPages = []; 
    globalProofreadText = '';
    proofreadPageIndex = 0; // Reset proofread index

    try {
        const textToProofread = transcribedPages.map(p => `[PAGE ${p.page}]\n${p.content}`).join('\n\n---\n\n');

        const prompt = `You are a meticulous proofreader. Review the following text, which contains content from multiple pages delimited by "[PAGE X]" and "---". Correct all grammatical errors, spelling mistakes, and typos.
        Your output MUST be a single JSON object that strictly follows this structure, retaining the page numbers and corrected content for ONLY the pages provided:
        {\\"proofreading\\": [ {\\"page\\": "1", \\"content\\": "..."} ] } 
        The 'page' value must be the original page number (as a string). The 'content' should be the full corrected text for that page.

        Text to proofread: \n"${textToProofread}"`;
        
        const jsonText = await callGeminiAPI(prompt, null, null, 'proofread'); 
        
        const resultObject = JSON.parse(jsonText);

        if (resultObject.proofreading && Array.isArray(resultObject.proofreading)) {
            proofreadPages = resultObject.proofreading.filter(p => p.content && p.content.trim() !== '');
            
            if (proofreadPages.length > 0) {
                globalProofreadText = proofreadPages.map(p => p.content).join('\n\n');
                
                // Use dedicated update function for proofread view
                updateProofreadUI(); 
            } else {
                proofreadTextDiv.textContent = 'Proofreading returned no corrected text.';
            }
        } else {
            throw new Error("API response was not in the expected structured JSON format for proofreading.");
        }


    } catch (error) {
        console.error('Error during proofreading:', error);
        proofreadTextDiv.textContent = `Error: ${error.message}. Please check the console for details.`;
    } finally {
        loaderProofread.classList.add('hidden');
        proofreadBtn.disabled = false;
    }
});

// 5. Resource Generation Logic
studyMaterialBtn.addEventListener('click', () => generateResources('study'));
researchPapersBtn.addEventListener('click', () => generateResources('research'));


async function generateResources(type) {
    if (!globalProofreadText || globalProofreadText.trim() === '' || globalProofreadText.startsWith('Error:')) {
        resourceOutputDiv.innerHTML = 'Please proofread the text first.';
        return;
    }
    
    resourceOutputDiv.innerHTML = 'Analyzing content and fetching links...';
    loaderResources.classList.remove('hidden');
    studyMaterialBtn.disabled = true;
    researchPapersBtn.disabled = true;

    try {
        let prompt;
        if (type === 'study') {
            prompt = `Using live search, analyze the main topic(s) of the ENTIRE combined document below and generate a numbered list of 5 **highly relevant and currently accessible** study material links (educational websites, videos, articles). Prioritize links from reliable, established sources (e.g., academic sites, major educational platforms). Return the output in Markdown format using links ([Link Text](URL)) for the list items. Text: "${globalProofreadText}"`;
        } else { 
            prompt = `Using live search, analyze the main topic(s) of the ENTIRE combined document below and generate a numbered list of 5 **recent (published within the last 5 years) and currently accessible** research paper titles or links (e.g., Google Scholar, institutional repository links). Return the output in Markdown format using links ([Title](URL)) for the list items. Text: "${globalProofreadText}"`;
        }

        const resourceContent = await callGeminiAPI(prompt, null, null, 'resource'); 
        
        resourceOutputDiv.innerHTML = formatResources(resourceContent.trim());

    } catch (error) {
        console.error(`Error generating ${type} resources:`, error);
        resourceOutputDiv.innerHTML = `Error generating resources: ${error.message}`;
    } finally {
        loaderResources.classList.add('hidden');
        studyMaterialBtn.disabled = false;
        researchPapersBtn.disabled = false;
    }
}

// 6. Book Reader Controls (Applies styles to the currently viewed page)
fontSizeSelect.addEventListener('change', (e) => {
    proofreadTextDiv.classList.remove('text-base', 'text-lg', 'text-xl');
    proofreadTextDiv.classList.add(e.target.value);
});

fontFamilySelect.addEventListener('change', (e) => {
    proofreadTextDiv.classList.remove('font-sans', 'font-serif-book', 'font-mono-code', 'font-georgia', 'font-verdana');
    if (e.target.value === 'font-sans') {
        proofreadTextDiv.classList.add('font-sans'); 
    } else {
        proofreadTextDiv.classList.add(e.target.value);
    }
});


// 7. Page Navigation Handlers

// Transcribed Page Navigation
prevPageBtn.addEventListener('click', () => {
    if (transcribedPageIndex > 0) {
        transcribedPageIndex--;
        updateTranscribedUI(); 
    }
});

nextPageBtn.addEventListener('click', () => {
    if (transcribedPageIndex < transcribedPages.length - 1) {
        transcribedPageIndex++;
        updateTranscribedUI(); 
    }
});

// NEW: Proofread Page Navigation
proofreadPrevPageBtn.addEventListener('click', () => {
    if (proofreadPageIndex > 0) {
        proofreadPageIndex--;
        updateProofreadUI(); 
    }
});

proofreadNextPageBtn.addEventListener('click', () => {
    if (proofreadPageIndex < proofreadPages.length - 1) {
        proofreadPageIndex++;
        updateProofreadUI(); 
    }
});


// 8. Copy Buttons
copyTranscribedBtn.addEventListener('click', () => {
    copyToClipboard(transcribedTextDiv.textContent, copyTranscribedMessage);
});

copyProofreadBtn.addEventListener('click', () => {
    copyToClipboard(proofreadTextDiv.textContent, copyProofreadMessage);
});

// 9. Drag and Drop Event Listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-pink-900/20', 'border-pink-500'); 
    dropZone.classList.remove('border-gray-600');
});

dropZone.addEventListener('dragleave', (e) => {
    dropZone.classList.remove('bg-pink-900/20', 'border-pink-500');
    dropZone.classList.add('border-gray-600');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-pink-900/20', 'border-pink-500');
    dropZone.classList.add('border-gray-600');

    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            handleFile(file);
        } else {
             alert("Unsupported file type dropped. Please upload an image or a PDF.");
        }
    }
});