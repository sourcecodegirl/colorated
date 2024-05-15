const button = document.getElementById('generate-colors');
const colorContainer = document.getElementById('color-container');

// Function to generate a random value returning a hex format and name value
const generateRandomColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const colorName = `#${randomColor}`;
    return { hex: colorName, name: randomColor };
};

// Function to generate colors from random number
const generateColors = async (numColors) => {
    colorContainer.innerHTML = '';
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
    displayColors(colors);
};

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
            throw new Error(`Network response was bad`);
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

// Function to validate hex color
const isValidHexColor = (color) => /^#[0-9A-F]{6}$/i.test(color);

// Function to display colors on the page
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

        const textColor = hex;
        colorInfoDiv.style.color = textColor;

        colorSlot.appendChild(colorInfoDiv);
        colorContainer.appendChild(colorSlot);
    });
};

// Determine text color based on a dark or light color background?

// EventListener to show color container when JavaScript is enabled
window.addEventListener('DOMContentLoaded', function () {
    colorContainer.style.display = 'flex';
});

// EventListener to generate colors on load
window.addEventListener('load', async () => {
    button.style.display = 'inline-block';
    button.disabled = false;
    await generateColors(5);
});

// EventListener for button click to fetch new colors
button.addEventListener('click', async function(event) {
    event.preventDefault();
    await generateColors(5);
})

// Disable button to fetch new colors for a set time to prevent frequent calls to the API or store additional colors in an array when initially making a call to the API for the 5 that are displayed and then display those when a user clicks to fetch new colors to simulate a delay?

// Check previous colors stored?