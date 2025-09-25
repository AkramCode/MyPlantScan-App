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
    maxTokens = 2000,
  }: {
    imageBase64: string;
    prompt: string;
    model?: string;
    maxTokens?: number;
  }): Promise<string> {
    const result = await this.postToBackend<BackendAIResponse>('/api/ai/analyze-image', {
      imageBase64,
      prompt,
      model,
      maxTokens,
    });

    return this.extractContent(result);
  }

  async identifyPlant(imageBase64: string): Promise<string> {

    const prompt = `You are a world-renowned botanist and plant taxonomist with 30+ years of field research experience. Analyze the supplied plant photo and return a single JSON object that strictly matches this schema:

{
  "plantName": "Primary common name",
  "scientificName": "Genus species",
  "confidence": 0.0,
  "description": "Detailed botanical description highlighting diagnostic traits, growth habit, mature size, and distinguishing features.",
  "careInstructions": "Comprehensive care guidance covering light, water, soil, temperature, humidity, fertilization, pruning, and repotting.",
  "commonNames": ["Other widely used common names"],
  "family": "Botanical family",
  "isEdible": true,
  "isToxic": false,
  "lightRequirements": "Lighting requirement",
  "waterRequirements": "Watering cadence or moisture preference",
  "soilType": "Preferred soil composition",
  "bloomTime": "Primary bloom period",
  "nativeRegion": "Geographic origin",
  "taxonomy": {
    "kingdom": "Plantae",
    "phylum": "Botanical division",
    "class": "Botanical class",
    "order": "Botanical order",
    "family": "Botanical family",
    "genus": "Genus",
    "species": "Species epithet"
  },
  "morphology": {
    "plantType": "Growth form (tree, shrub, herb, etc.)",
    "height": "Typical mature height or range",
    "leafShape": "Leaf shape",
    "leafArrangement": "Leaf arrangement",
    "flowerColor": ["Flower colors"],
    "fruitType": "Fruit type",
    "rootSystem": "Root system description"
  },
  "habitat": {
    "climate": "Typical climate",
    "soilPreference": "Soil preference",
    "moistureRequirement": "Moisture requirement",
    "temperatureRange": "Temperature range or USDA zone",
    "hardiness": "Hardiness notes"
  },
  "distribution": {
    "nativeRegions": ["Native regions or countries"],
    "introducedRegions": ["Notable introduced regions"],
    "altitudeRange": "Typical altitude range",
    "commonHabitats": ["Habitats where it thrives"]
  },
  "uses": {
    "medicinal": ["Medicinal uses"],
    "culinary": ["Culinary uses"],
    "ornamental": ["Ornamental uses"],
    "industrial": ["Industrial uses"],
    "ecological": ["Ecological roles"]
  },
  "conservationStatus": {
    "status": "LC|NT|VU|EN|CR|EW|EX|DD|NE",
    "statusDescription": "Explanation of the IUCN status",
    "threats": ["Key threats"],
    "protectionMeasures": ["Protection measures or guidance"]
  },
  "seasonality": {
    "bloomingSeason": ["Bloom seasons"],
    "fruitingSeason": ["Fruiting seasons"],
    "bestPlantingTime": ["Best planting windows"],
    "dormancyPeriod": "Dormancy notes"
  },
  "propagation": {
    "methods": ["Propagation techniques"],
    "difficulty": "Easy|Moderate|Difficult",
    "timeToMaturity": "Time from propagation to maturity",
    "specialRequirements": ["Notable propagation requirements"]
  },
  "companionPlants": ["Compatible companion plants"],
  "pests": ["Common pests"],
  "diseases": ["Common diseases"],
  "culturalSignificance": "Relevant symbolism or cultural notes",
  "interestingFacts": ["Compelling facts or trivia"]
}

Guidelines:
- Populate every field with the best verifiable information; prefer empty strings or arrays to placeholders such as "Unknown" or "N/A".
- Express measurements with units (e.g., "60-90 cm tall") and offer ranges when helpful.
- Only include botanically accurate details for the identified species.
- If confidence is below 0.7, still provide the most likely identification and acknowledge uncertainty in the prose.
- Respond with JSON only (no Markdown fences or commentary).`;

    return this.analyzeImage({
      imageBase64,
      prompt,
      model: GEMINI_MODELS.FLASH_IMAGE_PREVIEW,
      maxTokens: 2800,
    });
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
