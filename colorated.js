// Color generator using The Color API: https://www.thecolorapi.com/
const button = document.getElementById('generate-colors');
const colorContainer = document.getElementById('color-container');
const colorSchemeSelect = document.getElementById('color-scheme-select');
const colorSearch = document.getElementById('hex-color');
const resetButton = document.getElementById('reset-button');
const notification = document.getElementById('notification');

let disabledTimestamp;
let lastSentColor;
let lastGeneratedColors;
let lastSelectedScheme;

// Function to generate a random value returning a hex format and name value
const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const colorName = `#${randomColor}`;
    return { hex: colorName, name: randomColor };
};

// Function to generate colors based on scheme selected
const generateColors = async (numColors, selectedScheme) => {
    if (!checkRequestLimit()) return;
    colorContainer.innerHTML = '';

    let colors = [];
    let hexColor = '';

    // If Random is selected, generate unique colors so the same color isn't displayed
    if (selectedScheme === 'random') {
        colors = await generateUniqueColors(numColors, selectedScheme);
    } else {
        // Use hex value in input field if one is entered
        hexColor = colorSearch.value.trim();

        // Generate random color if color scheme is selected and no hex value is entered
        if (!hexColor) {
            const randomColor = generateRandomColor();
            hexColor = randomColor.hex;
            colorSearch.value = hexColor;
            colorSearch.value = '';
        } else if (!isValidHexColor(hexColor)) {
            displayNotification(`Invalid hex value: ${hexColor}. # and a 6 character hex code required. Example: #A16E8C.`);
            return;
        }

        // Check if the color or scheme are the same as the previous to prevent API requests unnecessarily
        if (hexColor !== lastSentColor || selectedScheme !== lastSelectedScheme) {
            colors = await getColorInfo(hexColor, true, selectedScheme);
            colors = colors.slice(0, numColors);
            lastSentColor = hexColor;
            lastGeneratedColors = colors;
            lastSelectedScheme = selectedScheme;
            incrementRequestCount();
        } else {
            colors = lastGeneratedColors;
        }
    }

    displayColors(colors);
    colorSearch.value = hexColor;

};

// Function to generate colors until all 5 are unique (required by generateColors)
const generateUniqueColors = async (numColors, selectedScheme) => {
    const existingNames = new Set();
    let colors = [];

    while (colors.length < numColors) {
        const color = generateRandomColor();
        if (!existingNames.has(color.name)) {
            existingNames.add(color.name);
            colors.push(color);
        }
    }

    const colorPromises = colors.map(color => getColorInfo(color.hex, false, selectedScheme));
    colorResults = await Promise.all(colorPromises);
    incrementRequestCount();

    return colorResults;
};

// Function to validate hex color (required by getColorInfo) (credit: https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation)
const isValidHexColor = (color) => { return /^#[0-9A-F]{6}$/i.test(color) };

// API call to send randomly generated hex color(s) to selected color scheme or random and return values for the color(s)
const getColorInfo = async (hexColor, fetchColorScheme = false, selectedScheme) => {
    if (!isValidHexColor(hexColor)) {
        displayNotification(`Invalid hex value: ${hexColor}. # and a 6 character hex code required. Example: #A16E8C.`);
        return;
    }

    const apiUrl = fetchColorScheme ? 'https://www.thecolorapi.com/scheme' : 'https://www.thecolorapi.com/id';

    const params = new URLSearchParams({
        hex: hexColor,
        format: 'json',
        ...(fetchColorScheme && { mode: selectedScheme, count: '5' })
    });

    try {
        const response = await fetch(`${apiUrl}?${params}`);
        if (!response.ok) {
            displayNotification(`Network response not good for color: ${hexColor}. Status: ${response.status}`);
            return;
        }

        const data = await response.json();

        return fetchColorScheme
        ? data.colors.map(color => ({
            hex: color.hex.value,
            name: color.name.value,
            rgb: color.rgb.value,
            hsl: color.hsl.value,
            cmyk: color.cmyk.value
        }))
        : {
            hex: hexColor,
            name: data.name.value,
            rgb: data.rgb.value,
            hsl: data.hsl.value,
            cmyk: data.cmyk.value
        };
    } catch (error) {
        displayNotification(`There was an error fetching colors: ${error}`);
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
        <div><span class="bold">HEX:</span> <span class="copy-color">${hex}</span> <span class="material-symbols-outlined copy-button" title="Copy">content_copy</span></div>
        <div><span class="bold">RGB:</span> <span class="copy-color">${rgb}</span> <span class="material-symbols-outlined copy-button" title="Copy">content_copy</span></div>
        <div><span class="bold">HSL:</span> <span class="copy-color">${hsl}</span> <span class="material-symbols-outlined copy-button" title="Copy">content_copy</span></div>
        <div><span class="bold">CMYK:</span> <span class="copy-color">${cmyk}</span> <span class="material-symbols-outlined copy-button" title="Copy">content_copy</span></div>
        `;

        const textColor = getTextColor(color.hex);
        colorInfoDiv.style.color = textColor;

        colorSlot.appendChild(colorInfoDiv);
        colorContainer.appendChild(colorSlot);
    });

    displayCopyButtons();
};

// Function to dynamically change text color based on a dark or light color background (required by displayColors) (credit: https://gomakethings.com/dynamically-changing-the-text-color-based-on-background-color-contrast-with-vanilla-js/)
const getTextColor = (hexColor) => {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#222' : '#eee';
};

// Function to animate the scrolling up and down of the page in mobile view for user experience with defaults set (required by on load EventListener) (credit: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo)
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

// Function to check requests and limit and disable the button to prevent too many requests to the API (requires disableButtonTimed)
const checkRequestLimit = () => {
    const requestCount = parseInt(localStorage.getItem('requestCount')) || 0;
    const requestLimit = 30; // Number of requests allowed within the timeFrame
    const timeFrame = 3 * 60 * 1000; // 3 minutes
    const currentTime = Date.now();
    const lastRequestTime = parseInt(localStorage.getItem('lastRequestTime')) || 0;

    if (currentTime - lastRequestTime < timeFrame) {
        if (requestCount >= requestLimit) {
            button.disabled = true;
            disableButtonTimed(timeFrame - (currentTime - lastRequestTime));
            return false;
        }
    } else {
        localStorage.setItem('requestCount', '0');
        localStorage.setItem('lastRequestTime', currentTime);
    }

    return true;
};

// Function to increment the request count
const incrementRequestCount = () => {
    const requestCount = parseInt(localStorage.getItem('requestCount')) || 0;
    localStorage.setItem('requestCount', requestCount + 1);
};

// EventListener to generate colors on load and enable the button, dropdown, and input fields as they aren't displayed initially
window.addEventListener('load', () => {
    const displayElements = [button, resetButton, colorSchemeSelect, colorSearch];
    displayElements.forEach(element => {
        element.style.display = 'inline-block';
    });

    scrollUpDown(300, 500, 800);
});

// EventListener to show color container when JavaScript is enabled (This is necessary as the template is not displayed initially to prevent the template and the noscript block from both being displayed when JavaScript is disabled)
window.addEventListener('DOMContentLoaded', () => {
    colorContainer.style.display = 'flex';
});

// EventListener to generate and display colors on the page
button.addEventListener('click', async (event) => {
    event.preventDefault();
    window.scrollTo(0, 0);
    if (!checkRequestLimit()) return;

    const selectedScheme = colorSchemeSelect.value;
    let hexColor = '';

    if (selectedScheme !== 'random') {
        hexColor = colorSearch.value.trim();
        if (!hexColor) {
            const randomColor = generateRandomColor();
            hexColor = randomColor.hex;
        } else {
            if (!isValidHexColor(hexColor)) {
                displayNotification(`Invalid hex value: ${hexColor}. # and a 6 character hex code required. Example: #A16E8C.`);
                return;
            }
        }
    }

    await generateColors(5, selectedScheme);
});

// EventListener to reset values
resetButton.addEventListener('click', () => {
    event.preventDefault();
    if (colorSearch.value) {
        colorSearch.value = '';
        displayNotification(`Cleared color.`);
    } else {
        displayNotification(`No color found to clear.`)
    }
});

// EventListener to select all characters in the text input for easier entering of a new value
colorSearch.addEventListener('click', () => {
    colorSearch.select();
});

// Function to disable the button until the countdown is complete (requires startCountdown)
const disableButtonTimed = (timeFrame) => {
    button.disabled = true;
    button.textContent = 'palette';
    const timeInSeconds = Math.floor(timeFrame / 1000);
    const formattedTime = formatTime(timeInSeconds);
    button.title = `Please wait ${formattedTime} seconds before fetching new colors.`;
    displayNotification(`Too many requests in a short amount of time. Please wait ${formattedTime} seconds before fetching new colors.`);

    startCountdown(timeInSeconds);

    disabledTimestamp = Date.now() - (timeFrame / 1000);
    localStorage.setItem('disabledTimestamp', disabledTimestamp);
};

// Function to start the countdown timer for disabling the button to fetch new colors (requires enableButton)
const startCountdown = (secondsLeft) => {
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            const remainingTime = formatTime(secondsLeft);
            button.title = `Please wait ${remainingTime} before fetching new colors.`;
            displayNotification(`Too many requests in a short amount of time. Please wait ${remainingTime} before fetching new colors.`);
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
    hideNotification();
};

// Function to copy a color to the clipboard
const copyToClipboard = async (color) => {
    try {
        await navigator.clipboard.writeText(color);
        displayNotification(`${color} copied!`);
    } catch (error) {
        displayNotification(`Failed to copy the color: ${error}`);
        return;
    }
};

// Function with EventListener for the copy color to clipboard buttons (credit: https://www.youtube.com/watch?v=yks3_9Fij2s)
const displayCopyButtons = () => {
    document.querySelectorAll('.copy-button').forEach(copyButton => {
        copyButton.addEventListener('click', () => {
            const parentDiv = copyButton.closest('div');
            const colorToCopy = parentDiv.querySelector('.copy-color').innerText;
            copyToClipboard(colorToCopy);
        });
    });
};

// Load copy buttons
document.addEventListener('DOMContentLoaded', displayCopyButtons);

// Function to show notifications and errors
const displayNotification = (message) => {
    notification.innerText = message;
    notification.style.display = 'inline-block';

    if (!button.disabled) {
        setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
    }
};

// Function to hide notifications when the button is enabled
const hideNotification = () => {
    notification.style.display = 'none';
};