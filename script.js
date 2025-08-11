const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const apiKeyInput = document.querySelector(".api-key-input");
const apiKeyToggle = document.querySelector(".api-key-toggle");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");
const generateBtn = document.querySelector(".generate-btn");

// Available OpenAI models for image generation
const openAIModels = [
  {
    id: "dall-e-3",
    name: "DALL-E 3 (Highest Quality)",
    maxCount: 1,
    supportedRatios: ["1/1", "16/9", "9/16"]
  },
  {
    id: "dall-e-2",
    name: "DALL-E 2 (Standard)",
    maxCount: 4,
    supportedRatios: ["1/1", "16/9", "9/16"]
  },
  {
    id: "dall-e-2-hd",
    name: "DALL-E 2 HD (Enhanced)",
    maxCount: 4,
    supportedRatios: ["1/1", "16/9", "9/16"]
  }
];

const examplePrompts = [
    "A magic forest glowing plants and fairy homes among gaint mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars Colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A japanese shrine during cherry blossom season with lanterns and misty mountains",
];

// Initialize the app
function initializeApp() {
    // Set theme based on saved preference or system default
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
    
    // Initialize model select dropdown
    modelSelect.innerHTML = '';
    openAIModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
    });
    
    // Update counts and ratios based on selected model
    updateSelects();
    
    // Load saved API key if exists
    const savedApiKey = localStorage.getItem("openai-api-key");
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
}

// Update count and ratio selects based on selected model
function updateSelects() {
    const selectedModelId = modelSelect.value;
    const selectedModel = openAIModels.find(m => m.id === selectedModelId);
    
    // Update count select
    countSelect.innerHTML = '';
    const maxCount = selectedModel ? selectedModel.maxCount : 4;
    for (let i = 1; i <= maxCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} Image${i > 1 ? 's' : ''}`;
        if (i === 1) option.selected = true;
        countSelect.appendChild(option);
    }
    
    // Update ratio select
    ratioSelect.innerHTML = '';
    const supportedRatios = selectedModel ? selectedModel.supportedRatios : ["1/1", "16/9", "9/16"];
    supportedRatios.forEach(ratio => {
        const option = document.createElement('option');
        option.value = ratio;
        option.textContent = 
            ratio === "1/1" ? "Square (1:1)" :
            ratio === "16/9" ? "Landscape (16:9)" :
            "Portrait (9:16)";
        if (ratio === "1/1") option.selected = true;
        ratioSelect.appendChild(option);
    });
}

// Toggle API key visibility
const toggleApiKeyVisibility = () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
    apiKeyToggle.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
};

// Switch between light and dark themes
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Calculate size for OpenAI API based on aspect ratio
const getOpenAIImageSize = (aspectRatio) => {
    switch (aspectRatio) {
        case "1/1": return "1024x1024";
        case "16/9": return "1792x1024";
        case "9/16": return "1024x1792";
        default: return "1024x1024";
    }
};

// Replace loading spinner with the actual image
const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;
    
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
        <img src="${imgUrl}" class="result-img" />
        <div class="img-overlay">
            <a href="${imgUrl}" class="img-download-btn" download="ai-image-${Date.now()}.png">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>
    `;
};

// Send requests to OpenAI API to create images
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText, apiKey) => {
    const API_URL = "https://api.openai.com/v1/images/generations";
    const size = getOpenAIImageSize(aspectRatio);
    generateBtn.setAttribute("disabled", "true");

    try {
        const response = await fetch(API_URL, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                model: selectedModel,
                prompt: promptText,
                n: imageCount,
                size: size,
                response_format: "url"
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to generate images");
        }

        const result = await response.json();
        
        // Update all image cards with the generated images
        result.data.forEach((imgData, i) => {
            updateImageCard(i, imgData.url);
        });

    } catch (error) {
        console.error("Error generating images:", error);
        
        // Show error on all image cards
        for (let i = 0; i < imageCount; i++) {
            const imgCard = document.getElementById(`img-card-${i}`);
            if (imgCard) {
                imgCard.classList.replace("loading", "error");
                imgCard.querySelector(".status-text").textContent = "Generation failed! " + (error.message || "Check console for details.");
            }
        }
    } finally {
        generateBtn.removeAttribute("disabled");
    }
};

// Create placeholder cards with loading spinner
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText, apiKey) => {
    gridGallery.innerHTML = "";

    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `
        <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
            <div class="status-container">
                <div class="spinner"></div>
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p class="status-text">Generating...</p>
            </div>
        </div>
        `;
    }

    generateImages(selectedModel, imageCount, aspectRatio, promptText, apiKey);
};

// Handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get Form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert("Please enter your OpenAI API key");
        return;
    }

    if (!promptText) {
        alert("Please enter a prompt");
        return;
    }

    // Save API key to localStorage
    localStorage.setItem("openai-api-key", apiKey);

    createImageCards(selectedModel, imageCount, aspectRatio, promptText, apiKey);
};

// Fill Prompt input with random example
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});

// Event listeners
promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
modelSelect.addEventListener("change", updateSelects);
apiKeyToggle.addEventListener("click", toggleApiKeyVisibility);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);