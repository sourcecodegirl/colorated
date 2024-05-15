const button = document.getElementById('generate-colors');
const colorContainer = document.getElementById('color-container');

let disabledTimestamp = null;
let previousColors = [];

// Function to generate a random value returning a hex format and name value
const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const colorName = `#${randomColor}`;
    return { hex: colorName, name: randomColor };
};

// Function to generate colors from random number
const generateColors = async (numColors) => {
    colorContainer.innerHTML = '';
    if (previousColors.length > 0) {
        previousColors = [];
    };
    const colorNames = [];
    const colorPromises = [];

    for (let i = 0; i < numColors; i++) {
        let color;
        do {
            color = generateRandomColor();
        } while (colorNames.includes(color.name));

        colorNames.push(color.name);
        colorPromises.push(getColorInfo(color.hex));
    }

    const colors = await Promise.all(colorPromises);
    previousColors = colors; // Save generated colors
    localStorage.setItem('previousColors', JSON.stringify(previousColors)); // Store generated colors to localStorage
    displayColors(colors);
};

// Function to validate hex color (required by getColorInfo)
const isValidHexColor = (color) => /^#[0-9A-F]{6}$/i.test(color);

// API call to send hex color to API and return values for the color
const getColorInfo = async (hexColor) => {
    if (!isValidHexColor(hexColor)) {
        console.error(`Invalid hex value: ${hexColor}`);
        return;
    }

    const apiUrl = 'https://www.thecolorapi.com/id';
    const params = new URLSearchParams({
        hex: hexColor,
        format: 'json'
    });
    const url = `${apiUrl}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Network response was bad for color: ${hexColor}`);
            return;
        }
        const data = await response.json();
        return {
            hex: hexColor,
            name: data.name.value,
            rgb: data.rgb.value,
            hsl: data.hsl.value,
            cmyk: data.cmyk.value
        };
    } catch (error) {
        console.error(`There was an error fetching colors: ${error}`);
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
        <p class="bold big">${name}</p>
        <hr>
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
            disableButtonTimed(remainingSeconds);
            displayColors(previousColors);
        } else {
            button.disabled = false;
        }
    } else {
        await generateColors(5);
    }
};

// EventListener to generate colors on load and enable the button (requires checkPrevColorsAndTime)
window.addEventListener('load', async () => {
    // Enables the button (This is necessary as the button is disabled initially to prevent the default active button and the noscript disabled button to both be displayed when JavaScript is disabled)
    button.style.display = 'inline-block';
    scrollUpDown(300, 500, 800);
    await checkPrevColorsAndTime();
});

// EventListener to show color container when JavaScript is enabled (This is necessary as the template is not displayed initially to prevent the template and the noscript block to both be displayed when JavaScript is disabled)
window.addEventListener('DOMContentLoaded', () => {
    colorContainer.style.display = 'flex';
});

// EventListener for button click to fetch new colors
button.addEventListener('click', async (event) => {
    event.preventDefault();
    scrollUpDown(300, 500, 800);
    disableButtonTimed();
});

// Function to disable the button until the countdown is complete (requires startCountdown)
const disableButtonTimed = async (secondsLeft = 30) => {
    button.disabled = true;
    button.textContent = 'refresh';
    button.title = `Respectfully wait ${secondsLeft} seconds before fetching new colors`;

    startCountdown(secondsLeft);

    disabledTimestamp = Date.now() - (30 - secondsLeft) * 1000;
    localStorage.setItem('disabledTimestamp', disabledTimestamp);

    await generateColors(5);
};

// Function to start the countdown timer for disabling the button to fetch new colors (requires enableButton)
const startCountdown = (secondsLeft) => {
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            button.title = `Respectfully wait ${secondsLeft} seconds before fetching new colors`;
        } else {
            clearInterval(countdownInterval);
            enableButton();
        }
    }, 1000);
};

// Function to enable the button to allow fetching of new colors
const enableButton = () => {
    button.disabled = false;
    button.textContent = 'refresh';
    button.title = 'Push to fetch colors';
};

// Alternative to disabling the button for a set time, maybe store additional colors in an array during initial call to the API and then display those in groups of 5 when a user clicks to fetch new colors to simulate a delay so the user isn't aware of the delay

// Check previous colors stored in localstorage and display those when refreshing page instead of displaying the colors from the placeholder template?

// Add user input to search for a color