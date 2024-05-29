# Colorated

### Yet another random color generator
- This uses [The Color API](https://www.thecolorapi.com), which currently doesn't require the use of an API key
- To see a working an example, visit [www.colorated.com](https://www.colorated.com)

## Features

### Random

#### Randomly generate 5 hex values and retrieve and display information for those 5 colors on the page
- If a hex value is entered in the input field, it will be ignored when Random is selected

#### Randomly generate 1 hex value and retrieve and display 5 colors and information on the page for any of the color schemes
- This will display the hex value that was randomly generated in the input field and retrieve the colors based on that color for the color scheme selected

### User Input

#### Retrieve and display 5 colors based on 1 hex value input for any of the color schemes
- If a hex value is entered in the input field, it will send the hex value to the API to retrieve 5 colors for the color scheme selected based on the color entered

## Color Schemes
- Monochrome
- Monochrome Dark
- Monochrome Light
- Analogic
- Complement
- Analogic Complement
- Triad
- Quad

## Color Information Retrieved

Next to each color value (not name) is a copy button to copy any of the color codes for pasting elsewhere

- Name
- HEX
- RGB
- HSL
- CMYK

## Warning
- The button to generate colors will disable if 30 requests have been made within 3 minutes
- If the hex value or the color scheme selected isn't changed, there will be no API request to generate a color scheme until one of those are changed after the initial request
