const button = document.getElementById('generate-colors');
const colorContainer = document.getElementById('color-container');
const colorSchemeSelect = document.getElementById('color-scheme-select');

let disabledTimestamp = null;
let previousColors = [];

// Function to generate a random value returning a hex format and name value
const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const colorName = `#${randomColor}`;
    return { hex: colorName, name: randomColor };
};

// Function to generate colors from random number
const generateColors = async (numColors, selectedScheme) => {
    colorContainer.innerHTML = '';

    // Increment request counter
    const requestCount = parseInt(localStorage.getItem('requestCount')) || 0;
    localStorage.setItem('requestCount', requestCount + 1);

    // Check if request count exceeds limit within timeFrame
    const requestLimit = 25;
    const timeFrame = 5 * 60 * 1000;
    const currentTime = Date.now();
    const lastRequestTime = parseInt(localStorage.getItem('lastRequestTime')) || 0;

    if (currentTime - lastRequestTime < timeFrame) {
        if (requestCount >= requestLimit) {
            // Disable button if request limit is exceeded within timeFrame
            button.disabled = true;
            return;
        }
    } else {
        // Reset request count and last request time if timeFrame has passed since last request
        localStorage.setItem('requestCount', '1');
    }
    localStorage.setItem('lastRequestTime', currentTime);

    // Continue with generating colors and making API requests
    let colors = [];

    if (selectedScheme === 'random') {
        const existingNames = new Set(); // Set to store existing color names
        while (colors.length < numColors) {
            const color = generateRandomColor();
            if (!existingNames.has(color.name)) {
                existingNames.add(color.name);
                colors.push(color);
            }
        }
        const colorPromises = colors.map(color => getColorInfo(color.hex, false, selectedScheme));
        colors = await Promise.all(colorPromises);
    } else {
        // Fetch colors based on selected color scheme
        colors = await getColorInfo(generateRandomColor().hex, true, selectedScheme);
        colors = colors.slice(0, numColors);
    }

    previousColors = colors; // Save generated colors
    localStorage.setItem('previousColors', JSON.stringify(previousColors)); // Store generated colors to localStorage
    displayColors(colors);
};

// Function to validate hex color (required by getColorInfo)
const isValidHexColor = (color) => /^#[0-9A-F]{6}$/i.test(color);

// API call to send hex color to API and return values for the color
const getColorInfo = async (hexColor, fetchColorScheme = false, selectedScheme) => {
    if (!isValidHexColor(hexColor)) {
        const errorMessage = `Invalid hex value: ${hexColor}`;
        console.error(errorMessage);
        appendErrorMessage(errorMessage);
        return;
    }

    const apiUrl = fetchColorScheme ? 'https://www.thecolorapi.com/scheme' : 'https://www.thecolorapi.com/id';

    const params = new URLSearchParams({
        hex: hexColor,
        format: 'json'
    });

    if (fetchColorScheme) {
        params.set('mode', selectedScheme);
        params.set('count', '5');
    }

    const url = `${apiUrl}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorMessage = `Network response was bad for color: ${hexColor} - Status: ${response.status}`;
            console.error(errorMessage);
            appendErrorMessage(errorMessage);
            return;
        }
        const data = await response.json();
        if (fetchColorScheme) {
            return data.colors.map(color => ({
                hex: color.hex.value,
                name: color.name.value,
                rgb: color.rgb.value,
                hsl: color.hsl.value,
                cmyk: color.cmyk.value
            }));
        } else {
            return {
                hex: hexColor,
                name: data.name.value,
                rgb: data.rgb.value,
                hsl: data.hsl.value,
                cmyk: data.cmyk.value
            };
        }
    } catch (error) {
        const errorMessage = `There was an error fetching colors: ${error}`;
        console.error(errorMessage);
        appendErrorMessage(errorMessage);
    }
};

// Function to display colors on the page in the color info block
const displayColors = colors => {
    colors.forEach(color => {
        const {hex, name, rgb, hsl, cmyk } = color;

        const colorSlot = document.createElement('div');
        colorSlot.classList.add('color-slot');
        colorSlot.style.backgroundColor = hex;

        const colorInfoDiv = document.createElement('div');
        colorInfoDiv.classList.add('color-info');
        colorInfoDiv.innerHTML = `
        <h3>${name}</h3>
        <p><span class="bold">HEX:</span> ${hex}</p>
        <p><span class="bold">RGB:</span> ${rgb}</p>
        <p><span class="bold">HSL:</span> ${hsl}</p>
        <p><span class="bold">CMYK:</span> ${cmyk}</p>
        `;

        const textColor = getTextColor(color.hex);
        colorInfoDiv.style.color = textColor;

        colorSlot.appendChild(colorInfoDiv);
        colorContainer.appendChild(colorSlot);
    });
};

// Function to determine text color based on a dark or light color background (required by displayColors)
const getTextColor = (hexColor) => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#222' : '#eee';
};

// Function to animate the scrolling up and down of the page in mobile view for user experience with defaults set (required by button click EventListener and on load EventListener)
const scrollUpDown = (position = 300, delayUp = 500, delayDown = 800) => {
    window.scrollTo(0, 0);

    setTimeout(() => {
        window.scrollTo({
            top: position,
            behavior: 'smooth'
        });

        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, delayDown);
    }, delayUp);
};

// Function to check colors were saved and countdown active for disabled button (requires disableButtonTimed, displayColors, generateColors)
const checkPrevColorsAndTime = async () => {
    const savedColors = localStorage.getItem('previousColors');
    const savedTimestamp = localStorage.getItem('disabledTimestamp');
    
    if (savedColors && savedTimestamp) {
        previousColors = JSON.parse(savedColors);
        disabledTimestamp = parseInt(savedTimestamp);

        const elapsedTime = Math.floor((Date.now() - disabledTimestamp) / 1000);
        
        if (elapsedTime < 30) {
            const remainingSeconds = 30 - elapsedTime;
            await disableButtonTimed(remainingSeconds);
            displayColors(previousColors);
        } else {
            button.disabled = false;
        }
    }
};

// Function to display error messages in the error-message div
const appendErrorMessage = (errorMessage) => {
    const errorMessageDiv = document.querySelector('.error-message');
    const p = document.createElement('p');
    p.textContent = errorMessage;
    errorMessageDiv.appendChild(p);
};

// EventListener to generate colors on load and enable the button (requires checkPrevColorsAndTime)
window.addEventListener('load', async () => {
    // Enables the button (This is necessary as the button is disabled initially to prevent the default active button and the noscript disabled button from both being displayed when JavaScript is disabled)
    button.style.display = 'inline-block';
    scrollUpDown(300, 500, 800);
    await checkPrevColorsAndTime();
});

// EventListener to show color container when JavaScript is enabled (This is necessary as the template is not displayed initially to prevent the template and the noscript block from both being displayed when JavaScript is disabled)
window.addEventListener('DOMContentLoaded', () => {
    colorContainer.style.display = 'flex';
});

button.addEventListener('click', async (event) => {
    event.preventDefault();
    scrollUpDown(300, 500, 800);
    const requestCount = parseInt(localStorage.getItem('requestCount')) || 0;
    const requestLimit = 30; // Number of requests allowed within the timeFrame
    const timeFrame = 3 * 60 * 1000; // 5 minutes
    const currentTime = Date.now();
    const lastRequestTime = parseInt(localStorage.getItem('lastRequestTime')) || 0;
    if (currentTime - lastRequestTime < timeFrame && requestCount >= requestLimit) {
        disableButtonTimed(timeFrame); // Pass the time frame directly
    } else {
        const selectedScheme = colorSchemeSelect.value;
        await generateColors(5, selectedScheme);
    }
});

// Function to disable the button until the countdown is complete (requires startCountdown)
const disableButtonTimed = async (timeFrame) => {
    button.disabled = true;
    button.textContent = 'refresh';
    button.title = `Respectfully wait ${timeFrame / 1000} seconds before fetching new colors`;

    startCountdown(timeFrame / 1000); // Convert timeFrame to seconds

    disabledTimestamp = Date.now() - (timeFrame / 1000); // Set the disabledTimestamp to the current time
    localStorage.setItem('disabledTimestamp', disabledTimestamp);
};

// Function to start the countdown timer for disabling the button to fetch new colors (requires enableButton)
const startCountdown = (secondsLeft) => {
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            const remainingTime = formatTime(secondsLeft);
            button.title = `Respectfully wait ${remainingTime} before fetching new colors`;
        } else {
            clearInterval(countdownInterval);
            enableButton();
        }
    }, 1000);
};

// Function to format remaining time into minutes and seconds
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Function to enable the button to allow fetching of new colors
const enableButton = () => {
    button.disabled = false;
    button.textContent = 'refresh';
    button.title = 'Push to fetch colors';
};