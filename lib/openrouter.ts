import 'react-native-url-polyfill/auto';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }[];
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  [key: string]: unknown;
}

type BackendAIContentPart = {
  type?: string;
  text?: string;
  image_url?: {
    url?: string;
  };
};

interface BackendAIResponse {
  choices?: {
    message?: {
      content?: string | BackendAIContentPart | BackendAIContentPart[];
    };
  }[];
}
const DEFAULT_BACKEND_URL = 'https://myplantscan.com';

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
    const rawContent = response.choices?.[0]?.message?.content;

    if (rawContent == null) {
      throw new Error('No AI response content received from backend');
    }

    if (typeof rawContent === 'string') {
      return rawContent;
    }

    if (Array.isArray(rawContent)) {
      const textParts = (rawContent as Array<string | BackendAIContentPart>)
        .map(part => {
          if (typeof part === 'string') {
            return part.trim();
          }

          if (Array.isArray(part)) {
            return '';
          }

          if (part && typeof part === 'object') {
            const maybeText = (part as { text?: unknown }).text;
            if (typeof maybeText === 'string') {
              const trimmedValue = maybeText.trim();
              if (trimmedValue.length > 0) {
                return trimmedValue;
              }
            }
          }

          return '';
        })
        .filter(segment => segment.length > 0);

      if (textParts.length > 0) {
        return textParts.join('\n');
      }

      throw new Error('AI response content did not include any textual data');
    }

    if (typeof rawContent === 'object' && rawContent && typeof (rawContent as BackendAIContentPart).text === 'string') {
      const trimmed = ((rawContent as BackendAIContentPart).text ?? '').trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    throw new Error('Unsupported AI response content format received from backend');
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

  async analyzeHealth({
    imageBase64,
    plantName,
    scientificName,
    model = GEMINI_MODELS.FLASH_IMAGE_PREVIEW,
    maxTokens = 2200,
  }: {
    imageBase64: string;
    plantName?: string;
    scientificName?: string;
    model?: string;
    maxTokens?: number;
  }): Promise<string> {
    const contextLines: string[] = [];

    if (typeof plantName === 'string' && plantName.trim().length > 0) {
      contextLines.push(`Likely common name: ${plantName.trim()}`);
    }

    if (typeof scientificName === 'string' && scientificName.trim().length > 0) {
      contextLines.push(`Likely scientific name: ${scientificName.trim()}`);
    }

    const contextBlock =
      contextLines.length > 0
        ? `Known context:
${contextLines.map(line => '- ' + line).join('\n')}

`
        : '';

    const prompt = `${contextBlock}You are an expert plant pathologist and diagnostician with decades of experience evaluating ornamental and crop species. Analyze the provided plant photo and respond with a single JSON object that strictly matches this schema:

{
  "plantName": "Common name if identifiable",
  "scientificName": "Genus species if identifiable",
  "healthStatus": "healthy|diseased|pest|nutrient_deficiency|overwatered|underwatered",
  "severity": "low|medium|high",
  "issues": ["Concise list of the most critical issues"],
  "recommendations": ["High-level care priorities in plain language"],
  "diagnosis": {
    "primaryCondition": "Primary condition with short justification",
    "secondaryConditions": ["Notable secondary findings"],
    "affectedParts": ["Anatomical areas impacted"],
    "progressionStage": "early|moderate|advanced",
    "prognosis": "excellent|good|fair|poor"
  },
  "symptoms": {
    "visual": ["Visible symptoms from the image"],
    "physical": ["Likely tactile or structural symptoms"],
    "environmental": ["Environmental or cultural stress signals"]
  },
  "treatment": {
    "immediate": ["Actions to take right away"],
    "shortTerm": ["Care adjustments for the next 2-4 weeks"],
    "longTerm": ["Long-term cultural improvements"],
    "preventive": ["Preventive habits or monitoring"]
  },
  "causes": {
    "primary": "Probable root cause",
    "contributing": ["Secondary contributing factors"],
    "environmental": ["Environmental influences"]
  },
  "monitoring": {
    "checkFrequency": "Suggested monitoring cadence",
    "keyIndicators": ["What to watch while recovering"],
    "recoveryTimeframe": "Expected timeframe to see improvement"
  },
  "riskFactors": ["Known risks that can worsen the issue"]
}

Guidelines:
- Populate every field with evidence-based, botanically accurate information derived from the image.
- Prefer empty strings or empty arrays when information is unknowable; never use placeholders like "Unknown" or "N/A".
- Tailor treatment and recommendations to the identified condition, including actionable specifics (products, concentrations, scheduling) when appropriate.
- Ensure terminology is accessible to home gardeners while remaining precise.
- Respond with JSON only (no Markdown fences or commentary).`;

    const result = await this.postToBackend<BackendAIResponse>('/api/health/report', {
      imageBase64,
      prompt,
      model,
      maxTokens,
    });

    return this.extractContent(result);
  }
}

export const openRouterService = new OpenRouterService();
export default openRouterService;
















