# Bob: Whisky and Spirits Recommendation Engine

This is a Node.js script that acts as "Bob", an AI agent and whisky and spirits expert. It fetches a user's virtual bar data from an external API, analyzes their collection using the Google GenAI API, and provides personalized bottle recommendations based on their taste profile and a predefined dataset of bottles.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js:** This project requires Node.js to run. You can download it from [nodejs.org](https://nodejs.org/). Node.js comes with npm (Node Package Manager).
*   **Google Cloud Project and API Key:** You need a Google Cloud project with the Gemini API enabled to obtain a `GEMINI_API_KEY`. Refer to the official Google Cloud documentation for instructions on setting up a project and getting an API key.

## Installation

1.  **Clone the Repository:** If you are working from a repository, clone it to your local machine.
    ```bash
    git clone https://github.com/benschiller/bob.git
    cd bob
    ```

2.  **Install Dependencies:** Navigate to the project directory in your terminal and install the required npm packages.
    ```bash
    npm install @google/genai node-fetch csv-parser dotenv
    ```

## Setup

1.  **Create a `.env` file:** In the root directory of the project, create a file named `.env`.
2.  **Add your Gemini API Key:** Open the `.env` file and add your Google GenAI API key in the following format:
    ```dotenv
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```
    Replace `YOUR_GEMINI_API_KEY` with the actual API key you obtained.

3.  **Obtain the Bottle Dataset:** The script requires a CSV file named `501 Bottle Dataset.csv` in a directory named `dataset` in the project root. Make sure this directory and file exist and contain the necessary data. You may need to create the `dataset` directory and place the CSV file inside it.
    ```bash
    mkdir dataset
    # Place your 501 Bottle Dataset.csv file inside the 'dataset' directory
    ```

## Usage

To run the script, execute the `index.js` file using Node.js and provide the username of the virtual bar you want to analyze as a command-line argument.

```bash
node index.js <username>
```

Replace `<username>` with the actual username.

For example, if you want to analyze the bar of a user named `benschiller`, you would run:

```bash
node index.js benschiller
```

The script will then:
1.  Fetch the user's virtual bar data.
2.  Analyze the collection and generate a taste profile summary.
3.  Generate personalized bottle recommendations based on the analysis and the provided dataset.
4.  Print the user's bar contents, the analysis, and the recommendations to the console.

## Demo

Hello. I am Ben. I like Bourbon. In my BoozApp virtual bar you will find Four Roses, E.H. Taylor, Michter's, and more. I built this recommendation engine to help me know what I don't know and expand my palette for America's Native Spirit.

Watch the demo video to see Bob in action:

[![Watch the demo video](https://img.youtube.com/vi/P8kOcnWl1rQ/0.jpg)](https://youtu.be/P8kOcnWl1rQ)
