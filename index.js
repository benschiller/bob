// To run this code you need to install the following dependencies:
// npm install @google/genai node-fetch csv-parser dotenv

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BAXUS_API_BASE_URL = "http://services.baxus.co/api/bar/user/";
const DATASET_PATH = path.join(process.cwd(), 'dataset', '501 Bottle Dataset.csv');

function startThinkingIndicator(message) {
  const startTime = Date.now();
  let lastDisplay = '';

  const update = () => {
    const elapsed = Date.now() - startTime;
    const seconds = (elapsed / 1000).toFixed(2);
    const display = `${message} (${seconds} seconds elapsed)`;
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(display);
    lastDisplay = display;
  };

  update(); // Initial display
  const interval = setInterval(update, 50); // Update every 50ms for smoothness

  // Return a function to stop the timer and print the final time
  return () => {
    clearInterval(interval);
    const elapsed = Date.now() - startTime;
    const seconds = (elapsed / 1000).toFixed(2);
    const finalMessage = `${message} (${seconds} seconds elapsed)`;
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(finalMessage + '\n'); // Print and move to next line
  };
}

async function getUserBarData(username) {
  const url = `${BAXUS_API_BASE_URL}${username}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user bar data:", error);
    throw error;
  }
}

function loadBottleDataset(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    return records;
  } catch (error) {
    console.error("Error loading bottle dataset:", error);
    throw error;
  }
}

async function getCollectionAnalysis(userBarData) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const config = {
    tool_config: {
      tool_code: 'GOOGLE_SEARCH',
    },
    responseMimeType: 'text/plain',
    systemInstruction: "You are Bob, an AI agent and a whisky and spirits expert. Analyze the user's virtual bar data and provide a personalized taste profile summary.",
  };
  const model = 'gemini-2.5-flash-preview-04-17';

  // Construct the prompt for the LLM to analyze user bar data
  const prompt = `
Analyze the following user's virtual bar data, using Google Search results to find additional information about the bottles in their collection. Identify patterns in their preferences (spirit types, regions, styles, price points, age statements, etc.).
Provide a summary of the user's taste profile based on this analysis, incorporating insights from the search results.

User's Virtual Bar Data (JSON format):
${JSON.stringify(userBarData, null, 2)}

Provide the analysis in a clear, easy-to-read format, concluding with a sentence that transitions to personalized recommendations, such as "Next, let me prepare personalized recommendations."
`;

  const contents = [
    {
      role: 'user',
      parts: [
        { text: prompt },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let responseText = '';
    for await (const chunk of response) {
      responseText += chunk.text;
    }
    return responseText;

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    throw error;
  }
}

async function getRecommendations(userBarData, bottleDataset, analysis) { // Accept analysis result
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const config = {
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
    responseMimeType: 'text/plain',
    systemInstruction: "You are Bob, an AI agent and a whisky and spirits expert. Provide personalized bottle recommendations based on the user's taste profile and a dataset of available bottles.",
  };
  const model = 'gemini-2.5-flash-preview-04-17';

  // Construct the prompt for the LLM to generate recommendations
  const prompt = `
You have just analyzed the user's virtual bar and determined their taste profile is:
${analysis}

Based on this analysis and the provided dataset of 501 bottles, recommend 3-5 bottles.
Focus on providing personalized recommendations based on the user's existing collection, including both complementary and potentially contrasting suggestions to encourage exploration.
For each recommendation, provide a concise reason explaining why it's a good fit for the user based on their bar data and the bottle's characteristics.

User's Virtual Bar Data (JSON format):
${JSON.stringify(userBarData, null, 2)}

501 Bottle Dataset (CSV format - full data is available):
${Object.keys(bottleDataset[0]).join(',')}\n${bottleDataset.map(row => Object.values(row).join(',')).join('\n')}

Provide the recommendations in a clear, easy-to-read format, listing the bottle name and the personalized reasoning.

Example Output Format:
Recommendation 1: [Bottle Name]
Reason: [Personalized reasoning based on user data and bottle characteristics]

Recommendation 2: [Bottle Name]
Reason: [Personalized reasoning based on user data and bottle characteristics]

...
`;

  const contents = [
    {
      role: 'user',
      parts: [
        { text: prompt },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let responseText = '';
    for await (const chunk of response) {
      responseText += chunk.text;
    }
    return responseText;

  } catch (error) {
    console.error("Error calling Gemini API for recommendations:", error);
    throw error;
  }
}


async function main() {
  const username = process.argv[2]; // Get username from command line argument

  if (!username) {
    console.log("Please provide a username as a command line argument.");
    console.log("Usage: node index.js <username>");
    return;
  }

  console.log(`Fetching bar data for user: ${username}`);
  const userBarData = await getUserBarData(username);

  if (!userBarData || userBarData.length === 0) {
    console.log(`User "${username}" not found or has an empty bar.`);
    return;
  }

  console.log("\n--- User's Virtual Bar Contents ---");
  userBarData.forEach(item => {
    if (item.product && item.product.name) {
      console.log(`- ${item.product.name}`);
    }
  });
  console.log("------------------------------------");

  console.log("\nAnalyzing user bar data...");
  const stopThinking = startThinkingIndicator("Thinking");
  const analysis = await getCollectionAnalysis(userBarData);
  stopThinking();

  console.log("\n--- User Collection Analysis ---");
  console.log(analysis);
  console.log("------------------------------------");

  console.log("\nGenerating personalized recommendations...");
  const stopThinking2 = startThinkingIndicator("Thinking");
  const bottleDataset = loadBottleDataset(DATASET_PATH);

  if (!bottleDataset || bottleDataset.length === 0) {
    stopThinking2();
    console.log("501 bottle dataset not found or is empty.");
    return;
  }

  const recommendations = await getRecommendations(userBarData, bottleDataset, analysis); // Pass analysis result
  stopThinking2();

  console.log("\n--- Personalized Recommendations ---");
  console.log(recommendations);
  console.log("------------------------------------");
}

main();
