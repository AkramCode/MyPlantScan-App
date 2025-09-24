import { PlantIdentification, UserPlant } from '@/types/plant';

// Mock plant identifications
export const mockIdentifications: PlantIdentification[] = [
  {
    id: '1',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    imageUri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
    plantName: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    confidence: 0.95,
    description: 'The Monstera deliciosa, also known as the Swiss cheese plant, is a species of flowering plant native to tropical forests of southern Mexico. It is a popular houseplant known for its large, glossy, heart-shaped leaves with natural holes.',
    careInstructions: 'Provide bright, indirect light and water when the top inch of soil feels dry. Prefers high humidity and temperatures between 65-80°F. Support with a moss pole for climbing.',
    commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron', 'Ceriman'],
    family: 'Araceae',
    isEdible: true,
    isToxic: true,
    lightRequirements: 'Bright indirect light',
    waterRequirements: 'Medium',
    soilType: 'Well-draining potting mix',
    bloomTime: 'Rarely indoors',
    nativeRegion: 'Central America',
    taxonomy: {
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      class: 'Liliopsida',
      order: 'Alismatales',
      family: 'Araceae',
      genus: 'Monstera',
      species: 'M. deliciosa'
    },
    morphology: {
      plantType: 'Climbing vine',
      height: '3-20 feet indoors',
      leafShape: 'Heart-shaped with fenestrations',
      leafArrangement: 'Alternate',
      flowerColor: ['Cream', 'White'],
      fruitType: 'Berry',
      rootSystem: 'Aerial and terrestrial roots'
    },
    habitat: {
      climate: 'Tropical',
      soilPreference: 'Rich, well-draining',
      moistureRequirement: 'Moderate to high',
      temperatureRange: '65-80°F (18-27°C)',
      hardiness: 'USDA zones 10-12'
    },
    distribution: {
      nativeRegions: ['Southern Mexico', 'Panama'],
      introducedRegions: ['Hawaii', 'Florida', 'Australia'],
      altitudeRange: '0-1000m',
      commonHabitats: ['Rainforest understory', 'Riverbanks']
    },
    uses: {
      medicinal: ['Traditional wound healing'],
      culinary: ['Ripe fruit (when properly prepared)'],
      ornamental: ['Indoor houseplant', 'Landscape specimen'],
      industrial: [],
      ecological: ['Wildlife food source']
    },
    conservationStatus: {
      status: 'LC',
      statusDescription: 'Least Concern',
      threats: ['Habitat loss'],
      protectionMeasures: ['Cultivation programs']
    },
    seasonality: {
      bloomingSeason: ['Spring', 'Summer'],
      fruitingSeason: ['Year-round in tropics'],
      bestPlantingTime: ['Spring'],
      dormancyPeriod: 'Winter (reduced growth)'
    },
    propagation: {
      methods: ['Stem cuttings', 'Air layering'],
      difficulty: 'Easy',
      timeToMaturity: '2-3 years',
      specialRequirements: ['High humidity for rooting']
    },
    companionPlants: ['Pothos', 'Philodendron', 'Peace Lily'],
    pests: ['Spider mites', 'Scale insects', 'Mealybugs'],
    diseases: ['Root rot', 'Leaf spot'],
    culturalSignificance: 'Symbol of prosperity in feng shui',
    interestingFacts: [
      'Leaves develop holes as they mature',
      'Can live over 40 years',
      'Fruit takes over a year to ripen',
      'Natural air purifier'
    ]
  },
  {
    id: '2',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    imageUri: 'https://images.unsplash.com/photo-1509423350716-97f2360af2e4?w=400&h=400&fit=crop',
    plantName: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata',
    confidence: 0.92,
    description: 'Snake plants are evergreen perennials that can grow anywhere from 8 inches to 12 feet high. Their sword-like leaves are approximately two feet long. The foliage is stiff, broad, and upright, in a dark green color variegated with white and yellow striping.',
    careInstructions: 'Very low maintenance. Water sparingly, allowing soil to dry completely between waterings. Tolerates low light but prefers bright, indirect light. Avoid overwatering.',
    commonNames: ['Mother-in-Law\'s Tongue', 'Viper\'s Bowstring Hemp', 'Saint George\'s Sword'],
    family: 'Asparagaceae',
    isEdible: false,
    isToxic: true,
    lightRequirements: 'Low to bright indirect light',
    waterRequirements: 'Low',
    soilType: 'Well-draining cactus mix',
    bloomTime: 'Spring (rare indoors)',
    nativeRegion: 'West Africa',
    taxonomy: {
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      class: 'Liliopsida',
      order: 'Asparagales',
      family: 'Asparagaceae',
      genus: 'Sansevieria',
      species: 'S. trifasciata'
    },
    morphology: {
      plantType: 'Succulent perennial',
      height: '1-4 feet',
      leafShape: 'Sword-like',
      leafArrangement: 'Rosette',
      flowerColor: ['White', 'Greenish-white'],
      fruitType: 'Berry',
      rootSystem: 'Rhizomatous'
    },
    habitat: {
      climate: 'Arid to semi-arid',
      soilPreference: 'Sandy, well-draining',
      moistureRequirement: 'Low',
      temperatureRange: '60-85°F (15-29°C)',
      hardiness: 'USDA zones 9-11'
    },
    distribution: {
      nativeRegions: ['West Africa', 'Nigeria', 'Congo'],
      introducedRegions: ['Worldwide as houseplant'],
      altitudeRange: '0-500m',
      commonHabitats: ['Rocky outcrops', 'Dry woodlands']
    },
    uses: {
      medicinal: ['Traditional wound treatment', 'Anti-inflammatory'],
      culinary: [],
      ornamental: ['Indoor plant', 'Xeriscaping'],
      industrial: ['Fiber production historically'],
      ecological: ['Drought-tolerant landscaping']
    },
    conservationStatus: {
      status: 'LC',
      statusDescription: 'Least Concern',
      threats: ['Over-collection in wild'],
      protectionMeasures: ['Widespread cultivation']
    },
    seasonality: {
      bloomingSeason: ['Spring'],
      fruitingSeason: ['Summer'],
      bestPlantingTime: ['Spring', 'Summer'],
      dormancyPeriod: 'Winter (minimal growth)'
    },
    propagation: {
      methods: ['Leaf cuttings', 'Division', 'Rhizome separation'],
      difficulty: 'Easy',
      timeToMaturity: '1-2 years',
      specialRequirements: ['Allow cuttings to callus before planting']
    },
    companionPlants: ['ZZ Plant', 'Aloe', 'Jade Plant'],
    pests: ['Mealybugs', 'Spider mites'],
    diseases: ['Root rot', 'Leaf rot'],
    culturalSignificance: 'Believed to bring good luck and purify air',
    interestingFacts: [
      'Can survive months without water',
      'Produces oxygen at night',
      'NASA air-purifying plant',
      'Can propagate from single leaf'
    ]
  },
  {
    id: '3',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    imageUri: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop',
    plantName: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    confidence: 0.88,
    description: 'The fiddle-leaf fig is a popular indoor tree featuring very large, heavily veined, violin-shaped leaves that grow upright on a sleek trunk. It can grow up to 6 feet or more indoors.',
    careInstructions: 'Requires bright, filtered light. Water when top inch of soil is dry. Prefers consistent watering schedule and high humidity. Rotate regularly for even growth.',
    commonNames: ['Fiddle Leaf Fig', 'Banjo Fig'],
    family: 'Moraceae',
    isEdible: false,
    isToxic: true,
    lightRequirements: 'Bright indirect light',
    waterRequirements: 'Medium',
    soilType: 'Well-draining potting mix',
    bloomTime: 'Rarely indoors',
    nativeRegion: 'Western Africa',
    taxonomy: {
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      class: 'Magnoliopsida',
      order: 'Rosales',
      family: 'Moraceae',
      genus: 'Ficus',
      species: 'F. lyrata'
    },
    morphology: {
      plantType: 'Tree',
      height: '6-10 feet indoors, 50+ feet outdoors',
      leafShape: 'Fiddle-shaped (lyrate)',
      leafArrangement: 'Alternate',
      flowerColor: ['Inconspicuous'],
      fruitType: 'Fig',
      rootSystem: 'Extensive, potentially invasive'
    },
    habitat: {
      climate: 'Tropical',
      soilPreference: 'Rich, well-draining',
      moistureRequirement: 'Moderate',
      temperatureRange: '65-75°F (18-24°C)',
      hardiness: 'USDA zones 10-12'
    },
    distribution: {
      nativeRegions: ['Western Africa', 'Sierra Leone', 'Cameroon'],
      introducedRegions: ['Worldwide as houseplant'],
      altitudeRange: '0-1500m',
      commonHabitats: ['Lowland rainforests']
    },
    uses: {
      medicinal: ['Traditional bark preparations'],
      culinary: [],
      ornamental: ['Indoor tree', 'Landscape specimen'],
      industrial: ['Timber in native range'],
      ecological: ['Wildlife habitat']
    },
    conservationStatus: {
      status: 'LC',
      statusDescription: 'Least Concern',
      threats: ['Deforestation'],
      protectionMeasures: ['Protected in some reserves']
    },
    seasonality: {
      bloomingSeason: ['Year-round in tropics'],
      fruitingSeason: ['Year-round in tropics'],
      bestPlantingTime: ['Spring'],
      dormancyPeriod: 'Winter (slower growth)'
    },
    propagation: {
      methods: ['Stem cuttings', 'Air layering'],
      difficulty: 'Moderate',
      timeToMaturity: '3-5 years',
      specialRequirements: ['High humidity', 'Consistent moisture']
    },
    companionPlants: ['Rubber Plant', 'Bird of Paradise', 'Monstera'],
    pests: ['Scale insects', 'Mealybugs', 'Spider mites'],
    diseases: ['Root rot', 'Leaf drop', 'Bacterial infections'],
    culturalSignificance: 'Popular architectural plant in modern design',
    interestingFacts: [
      'Leaves can grow up to 18 inches long',
      'Sensitive to environmental changes',
      'Can live for decades with proper care',
      'Produces latex when cut'
    ]
  },
  {
    id: '4',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    imageUri: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=400&fit=crop',
    plantName: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    confidence: 0.91,
    description: 'Peace lilies are tropical plants that thrive indoors. They have dark green leaves and elegant white flowers. They are known for their air-purifying qualities and ability to bloom indoors.',
    careInstructions: 'Prefers low to medium light. Keep soil consistently moist but not waterlogged. Enjoys high humidity. Remove spent flowers to encourage new blooms.',
    commonNames: ['Peace Lily', 'White Sails', 'Spathe Flower'],
    family: 'Araceae',
    isEdible: false,
    isToxic: true,
    lightRequirements: 'Low to medium indirect light',
    waterRequirements: 'Medium to high',
    soilType: 'Well-draining potting mix',
    bloomTime: 'Spring and summer',
    nativeRegion: 'Tropical Americas',
    taxonomy: {
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      class: 'Liliopsida',
      order: 'Alismatales',
      family: 'Araceae',
      genus: 'Spathiphyllum',
      species: 'S. wallisii'
    },
    morphology: {
      plantType: 'Herbaceous perennial',
      height: '1-3 feet',
      leafShape: 'Lanceolate',
      leafArrangement: 'Basal rosette',
      flowerColor: ['White', 'Cream'],
      fruitType: 'Berry',
      rootSystem: 'Fibrous'
    },
    habitat: {
      climate: 'Tropical',
      soilPreference: 'Moist, well-draining',
      moistureRequirement: 'High',
      temperatureRange: '65-80°F (18-27°C)',
      hardiness: 'USDA zones 11-12'
    },
    distribution: {
      nativeRegions: ['Colombia', 'Venezuela', 'Tropical Americas'],
      introducedRegions: ['Worldwide as houseplant'],
      altitudeRange: '0-1000m',
      commonHabitats: ['Rainforest floor', 'Stream banks']
    },
    uses: {
      medicinal: ['Traditional respiratory treatments'],
      culinary: [],
      ornamental: ['Indoor flowering plant', 'Shade gardens'],
      industrial: [],
      ecological: ['Air purification']
    },
    conservationStatus: {
      status: 'LC',
      statusDescription: 'Least Concern',
      threats: ['Habitat destruction'],
      protectionMeasures: ['Widespread cultivation']
    },
    seasonality: {
      bloomingSeason: ['Spring', 'Summer', 'Fall'],
      fruitingSeason: ['After flowering'],
      bestPlantingTime: ['Spring'],
      dormancyPeriod: 'Winter (reduced flowering)'
    },
    propagation: {
      methods: ['Division', 'Seed'],
      difficulty: 'Easy',
      timeToMaturity: '1-2 years',
      specialRequirements: ['High humidity', 'Warm temperatures']
    },
    companionPlants: ['Monstera', 'Pothos', 'Philodendron'],
    pests: ['Aphids', 'Mealybugs', 'Scale insects'],
    diseases: ['Root rot', 'Leaf blight'],
    culturalSignificance: 'Symbol of peace and purity',
    interestingFacts: [
      'NASA top air-purifying plant',
      'Flowers are actually modified leaves',
      'Can bloom multiple times per year',
      'Drooping leaves indicate watering needs'
    ]
  },
  {
    id: '5',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
    imageUri: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    plantName: 'Rubber Plant',
    scientificName: 'Ficus elastica',
    confidence: 0.89,
    description: 'The rubber plant is a popular houseplant with thick, glossy, dark green leaves. It can grow quite large indoors and is known for being relatively easy to care for.',
    careInstructions: 'Prefers bright, indirect light. Water when top inch of soil is dry. Wipe leaves regularly to keep them glossy. Can tolerate some neglect.',
    commonNames: ['Rubber Tree', 'Indian Rubber Bush', 'Rubber Fig'],
    family: 'Moraceae',
    isEdible: false,
    isToxic: true,
    lightRequirements: 'Bright indirect light',
    waterRequirements: 'Medium',
    soilType: 'Well-draining potting mix',
    bloomTime: 'Rarely indoors',
    nativeRegion: 'India and Southeast Asia',
    taxonomy: {
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      class: 'Magnoliopsida',
      order: 'Rosales',
      family: 'Moraceae',
      genus: 'Ficus',
      species: 'F. elastica'
    },
    morphology: {
      plantType: 'Tree',
      height: '6-10 feet indoors, 100+ feet outdoors',
      leafShape: 'Oval to elliptic',
      leafArrangement: 'Alternate',
      flowerColor: ['Inconspicuous'],
      fruitType: 'Fig',
      rootSystem: 'Extensive aerial and ground roots'
    },
    habitat: {
      climate: 'Tropical to subtropical',
      soilPreference: 'Well-draining, fertile',
      moistureRequirement: 'Moderate',
      temperatureRange: '60-80°F (15-27°C)',
      hardiness: 'USDA zones 10-12'
    },
    distribution: {
      nativeRegions: ['India', 'Nepal', 'Bhutan', 'Myanmar', 'China', 'Malaysia'],
      introducedRegions: ['Worldwide as houseplant', 'Florida', 'Hawaii'],
      altitudeRange: '0-1500m',
      commonHabitats: ['Tropical forests', 'Riverbanks']
    },
    uses: {
      medicinal: ['Traditional latex applications', 'Anti-inflammatory'],
      culinary: [],
      ornamental: ['Indoor tree', 'Landscape specimen'],
      industrial: ['Historical rubber production', 'Timber'],
      ecological: ['Wildlife habitat', 'Erosion control']
    },
    conservationStatus: {
      status: 'LC',
      statusDescription: 'Least Concern',
      threats: ['Deforestation in native range'],
      protectionMeasures: ['Widespread cultivation']
    },
    seasonality: {
      bloomingSeason: ['Year-round in tropics'],
      fruitingSeason: ['Year-round in tropics'],
      bestPlantingTime: ['Spring', 'Early summer'],
      dormancyPeriod: 'Winter (slower growth)'
    },
    propagation: {
      methods: ['Stem cuttings', 'Air layering', 'Leaf-bud cuttings'],
      difficulty: 'Easy',
      timeToMaturity: '2-3 years',
      specialRequirements: ['Warm temperatures', 'High humidity for rooting']
    },
    companionPlants: ['Fiddle Leaf Fig', 'Bird of Paradise', 'Dracaena'],
    pests: ['Scale insects', 'Mealybugs', 'Thrips'],
    diseases: ['Root rot', 'Leaf spot', 'Sooty mold'],
    culturalSignificance: 'Sacred in Hinduism and Buddhism',
    interestingFacts: [
      'Source of natural rubber historically',
      'Can live for hundreds of years',
      'Produces milky latex when cut',
      'National tree of India'
    ]
  }
];

// Mock user plants (saved to garden)
export const mockUserPlants: UserPlant[] = [
  {
    id: 'user-1',
    plantName: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    imageUri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    lastWatered: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    notes: 'Growing beautifully in the living room corner',
    location: 'Living Room',
    identificationId: '1'
  },
  {
    id: 'user-2',
    plantName: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata',
    imageUri: 'https://images.unsplash.com/photo-1509423350716-97f2360af2e4?w=400&h=400&fit=crop',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    lastWatered: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
    notes: 'Very low maintenance, perfect for beginners',
    location: 'Bedroom',
    identificationId: '2'
  },
  {
    id: 'user-3',
    plantName: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    imageUri: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=400&fit=crop',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
    lastWatered: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    notes: 'Bloomed twice this month!',
    location: 'Kitchen',
    identificationId: '4'
  }
];