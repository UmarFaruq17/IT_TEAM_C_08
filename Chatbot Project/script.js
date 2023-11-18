// Create a speech recognition object
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;

const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const voiceBtn = document.querySelector(".voice-btn");

let userMessage = null; // Variable to store user's message
const API_KEY = "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"; // Paste your API key here
const inputInitHeight = chatInput.scrollHeight;

// Function to start microphone recording
function startRecording() {
    recognition.start();
    console.log('Listening...');
}

// Event listener for speech recognition end
recognition.onend = () => {
    console.log('Listening...');
};

// Event listener for speech recognition result
recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;

    // After setting the transcript, initiate the chat
    handleChat();
};

// Event listener for speech recognition error
recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    const errorMessage = "Speech recognition error. Please try again.";
    chatbox.appendChild(createChatLi(errorMessage, "incoming"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
};

// Function to send microphone query directly
function sendMicrophoneQuery() {
    startRecording();
}

// Create a chat <li> element with passed message and className
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

// Generate response from the chatbot and convert it to audio
const generateResponse = (chatElement) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector("p");

    // Limit the length of the user's message
    const truncatedUserMessage = userMessage.substring(0, 255);

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: truncatedUserMessage }],
        })
    }

    fetch(API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            const responseText = data.choices[0].message.content.trim();

            // Display the text response in the chatbox
            messageElement.textContent = responseText;

            // Convert the text response to speech
            speakResponse(responseText);
        })
        .catch(() => {
            messageElement.classList.add("error");
            messageElement.textContent = "Oops! Something went wrong. Please try again.";
        })
        .finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}

// Function to speak the text response and initiate chat after speaking
const speakResponse = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
        // After speaking, send the microphone query and generate response
        sendMicrophoneQuery();
    };

    // Optionally, you can configure additional properties of the utterance
    // utterance.volume = 1; // Volume (0 to 1)
    // utterance.rate = 1;   // Speaking rate (0.1 to 10)
    // utterance.pitch = 1;  // Pitch (0 to 2)

    // Speak the text
    synth.speak(utterance);
}

// Handle user input and initiate chat
const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Reduce the timeout duration
    setTimeout(() => {
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
    }, 300); // Adjust the timeout duration as needed
}

// Event listeners
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const voiceBtn = document.querySelector(".voice-btn");
    voiceBtn.style.display = 'block';
    voiceBtn.addEventListener('click', sendMicrophoneQuery); // Change to sendMicrophoneQuery
} else {
    alert('Speech recognition is not supported in this browser.');
}

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
