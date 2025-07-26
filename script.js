const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");
const generateBtn = document.querySelector(".generate-btn");

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

// Set theme based on saved preference or system default
(()=> {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme",isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon" ;
})();

// Switch between light and dark themes
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme",isDarkTheme ? "dark":"light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon" ;
};


// Calculate width/height based on choosen ratio
const getImageDimensions = (aspectRatio, baseSize=512) => {
    const [width,height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize/Math.sqrt(width*height);

    let calcualtedWidth = Math.round(width*scaleFactor);
    let calcualtedHeight = Math.round(height*scaleFactor);

    // Ensure dimensions are mutiples of 16 (AI model requirements)
    calcualtedWidth = Math.floor(calcualtedWidth/16)*16;    
    calcualtedHeight = Math.floor(calcualtedHeight/16)*16;

    return {width:calcualtedWidth,height:calcualtedHeight};
};

// Replace loading spinner with the actual image
const updateImageCard = (imgIndex,imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;
    
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
                <img src="${imgUrl}" class="result-img" />
                <div class="img-overlay">
                    <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                        <i class="fa-solid fa-download"></i>
                    </a>
                </div>
                `;

};

// Send requests to Hugging Face API to create images
const generateImages = async (selectedModel,imageCount,aspectRatio,promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const {width,height} = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled","true");

    // Create an array of image generation promises
    const imagePromises = Array.from({length: imageCount}, async(_,i) => {
        // Send request to the AI model API
        try{
            const response = await fetch(MODEL_URL,{
                headers:{
                    Authorization: `Bearer your api key`,
                    "Content-Type": "application/json",
                    "x-use-cache":"false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: {width,height},
                }),
            });

            if(!response.ok) throw new Error((await response.json())?.error);

            // Convert response to an image URL and update the image card
            const result = await response.blob();
            updateImageCard(i,URL.createObjectURL(result));

        }catch(error){
            console.log(error);
            const imgCard = document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading","error");
            imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
        }
    })

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");

};

// Create placeholder cards with loading spinner
const createImageCards = (selectedModel,imageCount,aspectRatio,promptText) => {
    gridGallery.innerHTML = "";

    for(let i=0; i<imageCount; i++){
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

    generateImages(selectedModel,imageCount,aspectRatio,promptText);
};

// Handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get Form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(selectedModel,imageCount,aspectRatio,promptText);
};

// Fill Prompt input with random example
promptBtn.addEventListener("click",()=>{
    const prompt = examplePrompts[Math.floor(Math.random()*examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);

themeToggle.addEventListener("click",toggleTheme);