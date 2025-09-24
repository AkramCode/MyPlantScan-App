// OpenRouter API service for Gemini models

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Available Gemini models on OpenRouter
export const GEMINI_MODELS = {
  FLASH_IMAGE_PREVIEW: 'google/gemini-2.5-flash-image-preview',
  FLASH: 'google/gemini-2.0-flash-exp',
  PRO: 'google/gemini-pro',
  VISION: 'google/gemini-pro-vision',
  FLASH_1_5: 'google/gemini-1.5-flash',
  PRO_1_5: 'google/gemini-1.5-pro',
} as const;

class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = OPENROUTER_API_KEY || '';
    this.baseUrl = OPENROUTER_BASE_URL;
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your environment variables.');
    }
  }

  async generateText({
    model = GEMINI_MODELS.FLASH_IMAGE_PREVIEW,
    messages,
    maxTokens = 4000,
    temperature = 0.7,
  }: {
    model?: string;
    messages: OpenRouterMessage[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    const request: OpenRouterRequest = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: 1,
    };

    console.log('OpenRouter request:', {
      model,
      messageCount: messages.length,
      maxTokens,
      temperature,
    });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://myplantscan.app',
          'X-Title': 'MyPlantScan',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API request failed: ${response.status} - ${errorText}`);
      }

      const result: OpenRouterResponse = await response.json();
      
      if (!result.choices || result.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return result.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async analyzeImage({
    imageBase64,
    prompt,
    model = GEMINI_MODELS.FLASH_IMAGE_PREVIEW,
  }: {
    imageBase64: string;
    prompt: string;
    model?: string;
  }): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    return this.generateText({ model, messages });
  }

  async identifyPlant(imageBase64: string): Promise<string> {
    const prompt = `You are a world-renowned botanist and plant taxonomist with 30+ years of experience in plant identification. Using advanced vision capabilities, analyze this plant image with extreme precision.

Provide a comprehensive plant identification in valid JSON format with the following structure:

{
  "commonName": "Primary common name",
  "scientificName": "Genus species",
  "family": "Plant family name",
  "confidence": 0.95,
  "description": "Detailed botanical description including morphological characteristics, growth habits, size at maturity, and distinguishing features that confirm identification",
  "careInstructions": "Comprehensive care guide including light, water, soil, temperature, humidity, fertilization, and seasonal care requirements",
  "commonNames": ["Alternative common names"],
  "nativeRegion": "Geographic origin",
  "lightRequirement": "Bright indirect light/Direct sunlight/Low light/Partial shade",
  "wateringFrequency": "Daily/Every 2-3 days/Weekly/Bi-weekly/Monthly",
  "soilType": "Well-draining/Moist/Wet/Sandy/Clay/Loamy/Rocky",
  "toxicity": "Non-toxic/Mildly toxic/Toxic/Highly toxic",
  "bloomingSeason": "Spring/Summer/Fall/Winter/Year-round/Rarely blooms",
  "matureSize": "Height and spread at maturity",
  "growthRate": "Slow/Moderate/Fast",
  "hardiness": "USDA zones or temperature range"
}

Be extremely accurate and provide only valid JSON. If uncertain about identification, indicate lower confidence score.`;

    return this.analyzeImage({ imageBase64, prompt });
  }

  async analyzeHealth(imageBase64: string): Promise<string> {
    const prompt = `You are an expert plant pathologist and diagnostician with decades of experience in plant health assessment. Analyze this plant image for health conditions, diseases, pests, and overall wellness.

Provide a comprehensive health analysis in valid JSON format:

{
  "overallHealth": "excellent|good|fair|poor",
  "diagnosis": {
    "primaryCondition": "Main health condition or disease name with specific details",
    "severity": "mild|moderate|severe",
    "confidence": 0.85,
    "prognosis": "excellent|good|fair|poor"
  },
  "symptoms": {
    "visible": ["List of visible symptoms observed"],
    "environmental": ["Environmental stress indicators"]
  },
  "treatment": {
    "immediate": ["Urgent actions needed"],
    "ongoing": ["Long-term care adjustments"],
    "preventive": ["Prevention measures"]
  },
  "monitoring": {
    "checkFrequency": "How often to monitor (e.g., 'Daily for 1 week, then weekly')",
    "keyIndicators": ["What to watch for during recovery"]
  },
  "recommendations": {
    "environmental": ["Light, humidity, temperature adjustments"],
    "care": ["Watering, fertilizing, pruning changes"],
    "products": ["Specific treatments or products if needed"]
  }
}

Be thorough and provide actionable advice. If the plant appears healthy, still provide preventive care recommendations.`;

    return this.analyzeImage({ imageBase64, prompt });
  }
}

export const openRouterService = new OpenRouterService();
export default openRouterService;