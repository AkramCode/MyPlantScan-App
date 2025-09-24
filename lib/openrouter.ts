import 'react-native-url-polyfill/auto';

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

interface BackendAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const DEFAULT_BACKEND_URL = 'https://myplantscan-backend.vercel.app';

const getBackendBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_BACKEND_URL;
};

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendBaseUrl();
  }

  private async postToBackend<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend AI request failed:', {
          url,
          status: response.status,
          error: errorText,
        });
        throw new Error(`AI request failed (${response.status}): ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error('Error calling backend AI service:', error);
      throw error;
    }
  }

  private extractContent(response: BackendAIResponse): string {
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No AI response content received from backend');
    }
    return content;
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
    const request: OpenRouterRequest = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: 1,
    };

    console.log('Sending chat request to backend AI service:', {
      model,
      messageCount: messages.length,
      maxTokens,
      temperature,
    });

    const result = await this.postToBackend<BackendAIResponse>('/api/ai/chat', request);
    return this.extractContent(result);
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
    const result = await this.postToBackend<BackendAIResponse>('/api/ai/analyze-image', {
      imageBase64,
      prompt,
      model,
    });

    return this.extractContent(result);
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

    const result = await this.postToBackend<BackendAIResponse>('/api/health/report', {
      imageBase64,
      prompt,
      model: GEMINI_MODELS.FLASH_IMAGE_PREVIEW,
    });

    return this.extractContent(result);
  }
}

export const openRouterService = new OpenRouterService();
export default openRouterService;
