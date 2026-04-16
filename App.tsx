import { useEffect, useMemo, useRef, useState } from "react";
import {
  discoverSections,
  foodAliasMap,
  foodEntries,
  nonFoodLabels,
  planCopy,
  quickAddCategories,
  recipeDatabase,
  tierBadges,
  tierFeatures,
  tierRecipeLimits,
  tierRecipeViewLimits,
  tierSavedLimits,
  tierScanLimits,
  type FoodEntry,
  type Recipe,
  type Tier,
} from "./cooksnapData";

type AppTab = "home" | "recipes" | "planner" | "grocery" | "saved" | "profile";
type ScanMode = "visual" | "barcode";
type CameraStage = "closed" | "prepermission" | "denied" | "live" | "confirm";

type FridgeItem = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  source: "manual" | "scan" | "barcode" | "history" | "receipt";
  confidence?: number;
  addedAt: string;
};

type ScannedItem = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  confidence: number;
  source: "scan" | "barcode";
  thumbnail?: string;
};

type RecipeMatch = {
  recipe: Recipe;
  available: string[];
  missing: string[];
  score: number;
};

type Filters = {
  mealType: string;
  time: string;
  difficulty: string;
  cuisine: string;
  calorie: string;
  sort: string;
};

type PlannerSlot = {
  day: string;
  meal: string;
  recipeId: string | null;
};

type GroceryItem = {
  id: string;
  name: string;
  category: string;
  purchased: boolean;
};

type ProfilePrefs = {
  dietary: string[];
  allergies: string[];
  householdSize: number;
  skill: string;
  darkMode: boolean;
  autoScan: boolean;
  saveScannedPhotos: boolean;
  preferredCamera: "environment" | "user";
  units: "metric" | "imperial";
};

type VisionLabel = { description?: string; score?: number; name?: string };

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (
          source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap
        ) => Promise<Array<{ rawValue?: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

const STORAGE_KEYS = {
  tier: "cooksnap-tier",
  ingredients: "cooksnap-ingredients",
  saved: "cooksnap-saved",
  grocery: "cooksnap-grocery",
  planner: "cooksnap-planner",
  history: "cooksnap-history",
  prefs: "cooksnap-prefs",
  visionKey: "cooksnap-vision-key",
  views: "cooksnap-recipe-views",
  scans: "cooksnap-scan-counts",
};

const mealDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Low-Carb",
  "Nut-Free",
  "Halal",
  "Kosher",
];
const allergyOptions = ["Nuts", "Shellfish", "Eggs", "Soy", "Wheat", "Fish", "Milk"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function normalizeTerm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function buildDefaultPlanner(): PlannerSlot[] {
  return mealDays.flatMap((day) => mealTypes.map((meal) => ({ day, meal, recipeId: null })));
}

function inferFoodEntry(label: string): FoodEntry | null {
  const normalized = normalizeTerm(label);
  if (!normalized || nonFoodLabels.includes(normalized)) return null;
  if (foodAliasMap[normalized]) return foodAliasMap[normalized];

  const exactAlias = Object.entries(foodAliasMap).find(([alias]) => alias === normalized);
  if (exactAlias) return exactAlias[1];

  const partialMatch = Object.entries(foodAliasMap)
    .filter(([alias]) => normalized.includes(alias) || alias.includes(normalized))
    .sort((a, b) => b[0].length - a[0].length)[0];

  return partialMatch ? partialMatch[1] : null;
}

function getConfidenceLabel(score: number) {
  if (score >= 0.9) return "High ✅";
  if (score >= 0.76) return "Medium 🟡";
  return "Low ⚠️";
}

function calculateBrightness(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return 0.5;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return total / (data.length / 4) / 255;
}

function detectBlurEstimate(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return 1;
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let variation = 0;
  for (let y = 1; y < height; y += 8) {
    for (let x = 1; x < width; x += 8) {
      const i = (y * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const top = ((y - 1) * width + x) * 4;
      const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const leftIntensity = (data[left] + data[left + 1] + data[left + 2]) / 3;
      const topIntensity = (data[top] + data[top + 1] + data[top + 2]) / 3;
      variation += Math.abs(intensity - leftIntensity) + Math.abs(intensity - topIntensity);
    }
  }
  return variation / ((width / 8) * (height / 8));
}

function matchesDiet(recipe: Recipe, dietary: string[], allergies: string[]) {
  const allergyFail = allergies.some((allergy) =>
    recipe.allergens.map((item) => item.toLowerCase()).includes(allergy.toLowerCase())
  );
  if (allergyFail) return false;

  const normalizedDiet = dietary.map((item) => item.toLowerCase());
  if (normalizedDiet.includes("vegetarian") && !recipe.dietaryFlags.some((flag) => flag.toLowerCase() === "vegetarian")) {
    return false;
  }
  if (normalizedDiet.includes("vegan") && !recipe.dietaryFlags.some((flag) => flag.toLowerCase() === "vegan")) {
    return false;
  }
  if (normalizedDiet.includes("gluten-free") && !recipe.dietaryFlags.some((flag) => flag.toLowerCase() === "gluten-free")) {
    return false;
  }
  return true;
}

function groupedResults(matches: RecipeMatch[]) {
  return {
    perfect: matches.filter((item) => item.score >= 100),
    almost: matches.filter((item) => item.score >= 70 && item.score < 100),
    trip: matches.filter((item) => item.score < 70),
  };
}

function firstWord(text: string) {
  return text.split(" ")[0] ?? text;
}

export default function App() {
  const [tier, setTier] = useState<Tier>(() => readStorage<Tier>(STORAGE_KEYS.tier, "free"));
  const [tab, setTab] = useState<AppTab>("home");
  const [ingredients, setIngredients] = useState<FridgeItem[]>(() => readStorage(STORAGE_KEYS.ingredients, []));
  const [savedRecipes, setSavedRecipes] = useState<string[]>(() => readStorage(STORAGE_KEYS.saved, []));
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() => readStorage(STORAGE_KEYS.grocery, []));
  const [planner, setPlanner] = useState<PlannerSlot[]>(() => readStorage(STORAGE_KEYS.planner, buildDefaultPlanner()));
  const [scanHistory, setScanHistory] = useState<FridgeItem[]>(() => readStorage(STORAGE_KEYS.history, []));
  const [visionApiKey, setVisionApiKey] = useState<string>(() => {
    const envKey = (globalThis as { __COOKSNAP_VISION_KEY__?: string }).__COOKSNAP_VISION_KEY__ ?? "";
    return readStorage(STORAGE_KEYS.visionKey, envKey);
  });
  const [dailyRecipeViews, setDailyRecipeViews] = useState<Record<string, number>>(() => readStorage(STORAGE_KEYS.views, {}));
  const [dailyScans, setDailyScans] = useState<Record<string, number>>(() => readStorage(STORAGE_KEYS.scans, {}));
  const [prefs, setPrefs] = useState<ProfilePrefs>(() =>
    readStorage(STORAGE_KEYS.prefs, {
      dietary: [],
      allergies: [],
      householdSize: 2,
      skill: "Beginner",
      darkMode: false,
      autoScan: false,
      saveScannedPhotos: false,
      preferredCamera: "environment",
      units: "imperial",
    })
  );
  const [manualInput, setManualInput] = useState("");
  const [searchResultsActive, setSearchResultsActive] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    mealType: "all",
    time: "all",
    difficulty: "all",
    cuisine: "all",
    calorie: "all",
    sort: "best",
  });
  const [cameraStage, setCameraStage] = useState<CameraStage>("closed");
  const [scanMode, setScanMode] = useState<ScanMode>("visual");
  const [autoScan, setAutoScan] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [pendingScans, setPendingScans] = useState<ScannedItem[]>([]);
  const [scanMessage, setScanMessage] = useState("Point at a food item");
  const [scanBanner, setScanBanner] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [showUpgradeReason, setShowUpgradeReason] = useState("");
  const [manualGroceryInput, setManualGroceryInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(quickAddCategories[0].category);
  const [receiptText, setReceiptText] = useState("");
  const [showDiscover, setShowDiscover] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanTimer = useRef<number | null>(null);
  const mobileNetModelRef = useRef<any>(null);

  const scanCountToday = dailyScans[todayKey()] ?? 0;
  const scanLimit = tierScanLimits[tier];
  const recipeViewCountToday = dailyRecipeViews[todayKey()] ?? 0;
  const recipeViewLimit = tierRecipeViewLimits[tier];
  const savedLimit = tierSavedLimits[tier];

  useEffect(() => saveStorage(STORAGE_KEYS.tier, tier), [tier]);
  useEffect(() => saveStorage(STORAGE_KEYS.ingredients, ingredients), [ingredients]);
  useEffect(() => saveStorage(STORAGE_KEYS.saved, savedRecipes), [savedRecipes]);
  useEffect(() => saveStorage(STORAGE_KEYS.grocery, groceryList), [groceryList]);
  useEffect(() => saveStorage(STORAGE_KEYS.planner, planner), [planner]);
  useEffect(() => saveStorage(STORAGE_KEYS.history, scanHistory), [scanHistory]);
  useEffect(() => saveStorage(STORAGE_KEYS.visionKey, visionApiKey), [visionApiKey]);
  useEffect(() => saveStorage(STORAGE_KEYS.views, dailyRecipeViews), [dailyRecipeViews]);
  useEffect(() => saveStorage(STORAGE_KEYS.scans, dailyScans), [dailyScans]);
  useEffect(() => saveStorage(STORAGE_KEYS.prefs, prefs), [prefs]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.darkMode);
  }, [prefs.darkMode]);

  useEffect(() => {
    if (cameraStage !== "live" || !autoScan) {
      if (autoScanTimer.current) window.clearInterval(autoScanTimer.current);
      autoScanTimer.current = null;
      return;
    }

    autoScanTimer.current = window.setInterval(() => {
      void performScan();
    }, 2200);

    return () => {
      if (autoScanTimer.current) window.clearInterval(autoScanTimer.current);
      autoScanTimer.current = null;
    };
  }, [cameraStage, autoScan]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const ingredientSuggestions = useMemo(() => {
    const term = normalizeTerm(manualInput);
    if (!term) return foodEntries.slice(0, 8);
    return foodEntries
      .filter((entry) => normalizeTerm(entry.standardName).includes(term) || entry.aliases.some((alias) => alias.includes(term)))
      .slice(0, 10);
  }, [manualInput]);

  const matches = useMemo(() => {
    const owned = new Set(ingredients.map((item) => item.name.toLowerCase()));
    const filtered = recipeDatabase.filter((recipe) => matchesDiet(recipe, prefs.dietary, prefs.allergies));

    const withScores = filtered.map((recipe) => {
      const relevantIngredients = recipe.ingredients.filter(
        (ingredient) => !["salt", "black pepper", "olive oil", "water"].includes(ingredient.name.toLowerCase())
      );
      const available = relevantIngredients
        .filter((ingredient) => owned.has(ingredient.name.toLowerCase()))
        .map((ingredient) => ingredient.name);
      const missing = relevantIngredients
        .filter((ingredient) => !owned.has(ingredient.name.toLowerCase()))
        .map((ingredient) => ingredient.name);
      const score = relevantIngredients.length
        ? Math.round((available.length / relevantIngredients.length) * 100)
        : 0;

      return { recipe, available, missing, score };
    });

    const filteredByControls = withScores.filter(({ recipe }) => {
      if (filters.mealType !== "all" && !recipe.mealType.includes(filters.mealType as any)) return false;
      if (filters.time === "under15" && recipe.totalTime > 15) return false;
      if (filters.time === "under30" && recipe.totalTime > 30) return false;
      if (filters.time === "under60" && recipe.totalTime > 60) return false;
      if (filters.difficulty !== "all" && recipe.difficulty !== filters.difficulty) return false;
      if (filters.cuisine !== "all" && recipe.cuisine !== filters.cuisine) return false;
      if (filters.calorie === "low" && recipe.calories > 450) return false;
      if (filters.calorie === "high-protein" && recipe.nutrition.protein < 25) return false;
      if (tier !== "premium" && recipe.isPremiumOnly) return false;
      return true;
    });

    filteredByControls.sort((a, b) => {
      if (filters.sort === "quickest") return a.recipe.totalTime - b.recipe.totalTime;
      if (filters.sort === "popular") return b.recipe.popularity - a.recipe.popularity;
      if (filters.sort === "fewest") return a.missing.length - b.missing.length;
      return b.score - a.score || b.recipe.popularity - a.recipe.popularity;
    });

    return filteredByControls.slice(0, tierRecipeLimits[tier]);
  }, [ingredients, filters, prefs.allergies, prefs.dietary, tier]);

  const resultGroups = useMemo(() => groupedResults(matches), [matches]);
  const selectedRecipe = recipeDatabase.find((recipe) => recipe.id === selectedRecipeId) ?? null;

  const scannedCountLabel = `${pendingScans.length} item${pendingScans.length === 1 ? "" : "s"} scanned`;
  const scanRemaining = scanLimit >= 999 ? "Unlimited scans" : `${Math.max(0, scanLimit - scanCountToday)} scans remaining today`;

  async function ensureMobileNet() {
    if (mobileNetModelRef.current) return mobileNetModelRef.current;
    const mobilenet = await import("@tensorflow-models/mobilenet");
    await import("@tensorflow/tfjs");
    mobileNetModelRef.current = await mobilenet.load();
    return mobileNetModelRef.current;
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    setCameraError("");
    setScanBanner("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: prefs.preferredCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStage("live");
    } catch {
      setCameraStage("denied");
      setCameraError("Camera permission denied. Open browser settings and allow camera access for CookSnap.");
    }
  }

  function openScanner() {
    setPendingScans([]);
    setCameraError("");
    setScanMessage("Point at a food item");
    setCameraStage("prepermission");
    setTab("home");
  }

  function closeScanner() {
    stopCamera();
    setCameraStage("closed");
    setAutoScan(false);
    setIsScanning(false);
    setScanBanner("");
  }

  function incrementDailyScans() {
    setDailyScans((current) => ({ ...current, [todayKey()]: (current[todayKey()] ?? 0) + 1 }));
  }

  function incrementRecipeViews() {
    setDailyRecipeViews((current) => ({ ...current, [todayKey()]: (current[todayKey()] ?? 0) + 1 }));
  }

  function addIngredient(entry: FoodEntry, source: FridgeItem["source"] = "manual", confidence?: number) {
    setIngredients((current) => {
      if (current.some((item) => item.name === entry.standardName)) return current;
      return [
        {
          id: uid("ingredient"),
          name: entry.standardName,
          category: entry.category,
          emoji: entry.emoji,
          source,
          confidence,
          addedAt: new Date().toISOString(),
        },
        ...current,
      ];
    });
  }

  function addPendingToFridge() {
    const newHistory: FridgeItem[] = [];
    pendingScans.forEach((item) => {
      const entry = inferFoodEntry(item.name);
      if (!entry) return;
      addIngredient(entry, item.source === "barcode" ? "barcode" : "scan", item.confidence);
      newHistory.push({
        id: uid("history"),
        name: item.name,
        category: item.category,
        emoji: item.emoji,
        source: item.source === "barcode" ? "barcode" : "scan",
        confidence: item.confidence,
        addedAt: new Date().toISOString(),
      });
    });
    setScanHistory((current) => [...newHistory, ...current].slice(0, 20));
    closeScanner();
  }

  function removeIngredient(id: string) {
    setIngredients((current) => current.filter((item) => item.id !== id));
  }

  function tryManualAdd(name: string) {
    const entry = inferFoodEntry(name);
    if (!entry) return;
    addIngredient(entry, "manual", 1);
    setManualInput("");
  }

  async function getCanvasSnapshot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) throw new Error("Camera not ready.");

    const naturalWidth = video.videoWidth || 1280;
    const naturalHeight = video.videoHeight || 720;
    const scale = Math.min(1024 / naturalWidth, 1024 / naturalHeight, 1);
    canvas.width = Math.round(naturalWidth * scale);
    canvas.height = Math.round(naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function analyzeWithVision(base64Content: string) {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Content },
            features: [
              { type: "LABEL_DETECTION", maxResults: 15 },
              { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const json = await response.json();
    const payload = json.responses?.[0] ?? {};
    const labels: VisionLabel[] = [
      ...(payload.labelAnnotations ?? []).map((item: any) => ({ description: item.description, score: item.score })),
      ...(payload.localizedObjectAnnotations ?? []).map((item: any) => ({ description: item.name, score: item.score })),
    ];
    return labels;
  }

  async function analyzeWithMobileNet(canvas: HTMLCanvasElement) {
    const model = await ensureMobileNet();
    const predictions = await model.classify(canvas, 6);
    return predictions.map((prediction: any) => ({ description: prediction.className, score: prediction.probability }));
  }

  function mapVisionLabels(labels: VisionLabel[], source: "scan" | "barcode", thumbnail?: string) {
    const matches = labels
      .flatMap((label) => {
        const score = label.score ?? 0;
        if (score < 0.7) return [];
        const description = label.description ?? label.name ?? "";
        const entry = inferFoodEntry(description);
        if (!entry) return [];
        return [
          {
            id: uid("scan"),
            name: entry.standardName,
            category: entry.category,
            emoji: entry.emoji,
            confidence: Number(score.toFixed(2)),
            source,
            thumbnail,
          } satisfies ScannedItem,
        ];
      })
      .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index);

    return matches;
  }

  async function ensureBarcodeDetector() {
    if ("BarcodeDetector" in window && window.BarcodeDetector) return window.BarcodeDetector;
    await import("barcode-detector");
    return window.BarcodeDetector;
  }

  async function lookupBarcodeProduct(code: string) {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (!response.ok) throw new Error("Open Food Facts lookup failed.");
    const json = await response.json();
    const productName = json.product?.product_name || json.product?.generic_name || json.product?.brands || code;
    return productName as string;
  }

  async function performBarcodeScan(canvas: HTMLCanvasElement, thumbnail: string) {
    const Detector = await ensureBarcodeDetector();
    const detector = new Detector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
    });
    const results = await detector.detect(canvas);
    const barcode = results[0]?.rawValue;
    if (!barcode) throw new Error("No barcode detected. Move closer and center the code.");
    const productName = await lookupBarcodeProduct(barcode);
    const entry = inferFoodEntry(productName) ?? inferFoodEntry(firstWord(productName));
    if (!entry) {
      return [
        {
          id: uid("barcode"),
          name: productName,
          category: "Pantry",
          emoji: "📦",
          confidence: 0.86,
          source: "barcode" as const,
          thumbnail,
        },
      ];
    }
    return [
      {
        id: uid("barcode"),
        name: entry.standardName,
        category: entry.category,
        emoji: entry.emoji,
        confidence: 0.92,
        source: "barcode" as const,
        thumbnail,
      },
    ];
  }

  async function performReceiptScanFromText() {
    if (tier !== "premium") {
      setShowUpgradeReason("Receipt scanning is a Premium feature.");
      setPaywallOpen(true);
      return;
    }
    const labels = receiptText
      .split(/\n|,|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ description: line, score: 0.95 }));
    const receiptItems = mapVisionLabels(labels, "scan");
    setPendingScans(receiptItems);
    setCameraStage("confirm");
  }

  async function performScan() {
    if (isScanning || cameraStage !== "live") return;
    if (scanCountToday >= scanLimit) {
      setShowUpgradeReason(
        tier === "free"
          ? "You've used all 3 scans today. Upgrade to Common for 15 daily scans."
          : "Need more scans? Premium gives you unlimited scanning and receipt capture."
      );
      setPaywallOpen(true);
      setScanMessage("Daily scan limit reached");
      return;
    }

    setIsScanning(true);
    setCameraError("");
    setScanMessage("Scanning frame...");

    try {
      const canvas = await getCanvasSnapshot();
      const brightness = calculateBrightness(canvas);
      const blurScore = detectBlurEstimate(canvas);
      if (brightness < 0.2) throw new Error("It's too dark. Try turning on the flash ⚡ or move closer to light.");
      if (blurScore < 10) throw new Error("Photo is blurry. Hold steady and try again 📸");

      const thumbnail = canvas.toDataURL("image/jpeg", 0.76);
      const base64Content = thumbnail.split(",")[1] ?? "";
      incrementDailyScans();

      if (scanMode === "barcode") {
        const found = await performBarcodeScan(canvas, thumbnail);
        setPendingScans((current) => [...current, ...found].filter((item, index, arr) => arr.findIndex((c) => c.name === item.name) === index));
        setScanMessage(`${found[0]?.name ?? "Barcode found"} added`);
        setCameraStage("confirm");
        if (navigator.vibrate) navigator.vibrate(70);
        setIsScanning(false);
        return;
      }

      let labels: VisionLabel[] = [];
      if (visionApiKey.trim()) {
        try {
          labels = await analyzeWithVision(base64Content);
          setScanBanner("Option A active — Google Vision API");
        } catch {
          setScanBanner("Vision API unavailable. Switched to on-device browser fallback.");
          labels = await analyzeWithMobileNet(canvas);
        }
      } else {
        setScanBanner("No Vision API key set. Using browser on-device fallback.");
        labels = await analyzeWithMobileNet(canvas);
      }

      const found = mapVisionLabels(labels, "scan", thumbnail);
      if (!found.length) {
        throw new Error("We couldn't find any food items. Try getting closer or add manually.");
      }

      setPendingScans((current) => [...current, ...found].filter((item, index, arr) => arr.findIndex((c) => c.name === item.name) === index));
      setScanMessage(`${found[0].name} • ${Math.round(found[0].confidence * 100)}% confidence`);
      setCameraStage("confirm");
      if (navigator.vibrate) navigator.vibrate(70);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Scan failed. Please try again.");
      setScanMessage("Not sure what this is 🤔");
    } finally {
      setIsScanning(false);
    }
  }

  function toggleSaveRecipe(recipeId: string) {
    setSavedRecipes((current) => {
      const alreadySaved = current.includes(recipeId);
      if (!alreadySaved && current.length >= savedLimit) {
        setShowUpgradeReason(
          tier === "free"
            ? "Free users can save up to 5 recipes. Upgrade for bigger collections."
            : "Common users can save up to 50 recipes. Premium unlocks unlimited saves and notes."
        );
        setPaywallOpen(true);
        return current;
      }
      return alreadySaved ? current.filter((id) => id !== recipeId) : [recipeId, ...current];
    });
  }

  function openRecipe(recipeId: string) {
    if (recipeViewCountToday >= recipeViewLimit) {
      setShowUpgradeReason(
        tier === "free"
          ? "Free users can view 3 full recipe details per day. Upgrade to keep cooking."
          : "Common users can view 15 full recipe details per day. Premium unlocks unlimited recipe views."
      );
      setPaywallOpen(true);
      return;
    }
    incrementRecipeViews();
    setSelectedRecipeId(recipeId);
  }

  function addMissingToGrocery(missing: string[]) {
    setGroceryList((current) => {
      const next = [...current];
      missing.forEach((name) => {
        if (next.some((item) => item.name === name)) return;
        const entry = inferFoodEntry(name);
        next.push({
          id: uid("grocery"),
          name,
          category: entry?.category ?? "Pantry",
          purchased: false,
        });
      });
      return next;
    });
    setTab("grocery");
  }

  function assignPlanner(recipeId: string, slot: PlannerSlot) {
    if (tier === "free") {
      setShowUpgradeReason("Meal Planner is available on Common and Premium.");
      setPaywallOpen(true);
      return;
    }
    setPlanner((current) =>
      current.map((item) =>
        item.day === slot.day && item.meal === slot.meal ? { ...item, recipeId } : item
      )
    );
  }

  function autoPlanWeek() {
    if (tier !== "premium") {
      setShowUpgradeReason("AI Auto-Plan My Week is a Premium feature.");
      setPaywallOpen(true);
      return;
    }
    const candidates = [...matches].slice(0, 7);
    setPlanner((current) =>
      current.map((slot, index) => ({
        ...slot,
        recipeId: candidates[index % Math.max(candidates.length, 1)]?.recipe.id ?? null,
      }))
    );
  }

  const homeStats = {
    ingredients: ingredients.length,
    scanCount: scanCountToday,
    saved: savedRecipes.length,
    recipesFound: matches.length,
  };

  const discoverCards = discoverSections.map((section) => ({
    ...section,
    recipes: section.recipeIds
      .map((id) => recipeDatabase.find((recipe) => recipe.id === id))
      .filter(Boolean) as Recipe[],
  }));

  return (
    <div className={`min-h-screen bg-[radial-gradient(circle_at_top,_rgba(231,76,60,0.08),_transparent_30%),linear-gradient(180deg,#fffdf8_0%,#fff7f3_45%,#fffdfb_100%)] text-slate-900 ${prefs.darkMode ? "dark" : ""}`}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white/85 shadow-[0_20px_60px_rgba(44,62,80,0.12)] backdrop-blur dark:bg-slate-950/95 dark:text-slate-50">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 pb-4 pt-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">CookSnap</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {tab === "home" && "My Fridge 🧊"}
                {tab === "recipes" && (showDiscover ? "Discover 🌍" : "Recipes You Can Make 🍳")}
                {tab === "planner" && "Meal Planner 📅"}
                {tab === "grocery" && "Grocery List 🛒"}
                {tab === "saved" && "My Recipes ❤️"}
                {tab === "profile" && "Profile & Settings"}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Snap your fridge. Get recipes.</p>
            </div>
            <button
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 shadow-sm dark:border-amber-400/20 dark:bg-amber-300/10 dark:text-amber-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{tierBadges[tier] || "🙂"}</span>
                <div>
                  <p className="capitalize text-slate-800 dark:text-white">{tier}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">{tier === "premium" ? "Gold member" : tier === "common" ? "Silver member" : "Upgrade"}</p>
                </div>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-32 pt-5">
          {tab === "home" && (
            <section className="space-y-5">
              <div className="rounded-[28px] bg-gradient-to-br from-[#fff1eb] via-white to-[#eefaf3] p-5 shadow-sm ring-1 ring-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:ring-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Waste less. Cook more.</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Scan ingredients with your camera or add them manually to unlock recipes that use only what you already have.
                    </p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E74C3C] text-2xl text-white shadow-lg shadow-[#E74C3C]/20">
                    📸
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <StatCard label="Ingredients" value={String(homeStats.ingredients)} accent="red" />
                  <StatCard label="Scans today" value={scanLimit >= 999 ? `${homeStats.scanCount}+` : `${homeStats.scanCount}/${scanLimit}`} accent="green" />
                  <StatCard label="Saved" value={String(homeStats.saved)} accent="slate" />
                  <StatCard label="Recipes ready" value={String(homeStats.recipesFound)} accent="gold" />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <span className="text-lg">🔎</span>
                  <input
                    value={manualInput}
                    onChange={(event) => setManualInput(event.target.value)}
                    placeholder="Type an ingredient like chicken, rice, tomato..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {ingredientSuggestions.map((entry) => (
                    <button
                      key={entry.standardName}
                      type="button"
                      onClick={() => tryManualAdd(entry.standardName)}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#E74C3C] hover:text-[#E74C3C] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {entry.emoji} {entry.standardName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={openScanner}
                  className="rounded-[24px] bg-[#E74C3C] px-4 py-4 text-left text-white shadow-lg shadow-[#E74C3C]/25 transition hover:-translate-y-0.5"
                >
                  <p className="text-lg font-bold">📸 Scan Ingredients</p>
                  <p className="mt-1 text-sm text-white/80">Open live camera + barcode scan</p>
                </button>
                <button
                  type="button"
                  onClick={() => setManualInput("")}
                  className="rounded-[24px] border border-[#27AE60]/25 bg-[#27AE60]/10 px-4 py-4 text-left text-[#1D7E45] transition hover:-translate-y-0.5 dark:text-emerald-300"
                >
                  <p className="text-lg font-bold">⌨️ Add Manually</p>
                  <p className="mt-1 text-sm text-[#1D7E45]/80 dark:text-emerald-300/80">Autocomplete from 500+ food labels</p>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Quick add</h3>
                  <span className="text-xs text-slate-500">Tap to expand</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickAddCategories.map((chip) => (
                    <button
                      key={chip.category}
                      type="button"
                      onClick={() => setActiveCategory(chip.category)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeCategory === chip.category
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {chip.emoji} {chip.category}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickAddCategories
                    .find((item) => item.category === activeCategory)
                    ?.items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => tryManualAdd(item)}
                        className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-[#27AE60] hover:text-[#27AE60] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        + {item}
                      </button>
                    ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Current ingredients</h3>
                    <p className="text-sm text-slate-500">You have {ingredients.length} ingredients added</p>
                  </div>
                  {tier === "premium" && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                      Smart Fridge active
                    </span>
                  )}
                </div>
                {ingredients.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ingredients.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => removeIngredient(item.id)}
                        className="ingredient-chip inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-[#E74C3C] hover:text-[#E74C3C] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span>{item.emoji}</span>
                        <span>{item.name}</span>
                        <span className="text-slate-400">✕</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState emoji="🧺" title="Your fridge is empty" body="Add a few ingredients manually or use the scanner to get recipe matches." />
                )}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Recently scanned items</h3>
                  <span className="text-xs text-slate-400">Last 20</span>
                </div>
                {scanHistory.length ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {scanHistory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const entry = inferFoodEntry(item.name);
                          if (entry) addIngredient(entry, "history", item.confidence);
                        }}
                        className="shrink-0 rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm dark:border-slate-700"
                      >
                        <p className="font-semibold">{item.emoji} {item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Tap to re-add</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No scan history yet. Your last confirmed scans will appear here.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchResultsActive(true);
                  setShowDiscover(false);
                  setTab("recipes");
                }}
                className="w-full rounded-[24px] bg-[#E74C3C] px-5 py-4 text-center text-lg font-bold text-white shadow-lg shadow-[#E74C3C]/30"
              >
                Find Recipes 🍳
              </button>
            </section>
          )}

          {tab === "recipes" && (
            <section className="space-y-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscover(false);
                    setSearchResultsActive(true);
                  }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                    !showDiscover ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  Recipe Results
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscover(true)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                    showDiscover ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  Discover
                </button>
              </div>

              {!showDiscover ? (
                <>
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <SelectField label="Meal" value={filters.mealType} onChange={(value) => setFilters((current) => ({ ...current, mealType: value }))} options={["all", "breakfast", "lunch", "dinner", "snack", "dessert"]} />
                      <SelectField label="Cook time" value={filters.time} onChange={(value) => setFilters((current) => ({ ...current, time: value }))} options={["all", "under15", "under30", "under60"]} />
                      <SelectField label="Difficulty" value={filters.difficulty} onChange={(value) => setFilters((current) => ({ ...current, difficulty: value }))} options={["all", "easy", "medium", "hard"]} />
                      <SelectField label="Sort" value={filters.sort} onChange={(value) => setFilters((current) => ({ ...current, sort: value }))} options={["best", "quickest", "popular", "fewest"]} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <SelectField
                        label="Cuisine"
                        value={filters.cuisine}
                        onChange={(value) => {
                          if (tier === "free" && value !== "all") {
                            setShowUpgradeReason("Cuisine filters unlock on Common and Premium.");
                            setPaywallOpen(true);
                            return;
                          }
                          setFilters((current) => ({ ...current, cuisine: value }));
                        }}
                        options={["all", ...Array.from(new Set(recipeDatabase.map((recipe) => recipe.cuisine))).sort()]}
                      />
                      <SelectField
                        label="Nutrition"
                        value={filters.calorie}
                        onChange={(value) => {
                          if (tier !== "premium" && value !== "all") {
                            setShowUpgradeReason("Calorie and macro filters are Premium features.");
                            setPaywallOpen(true);
                            return;
                          }
                          setFilters((current) => ({ ...current, calorie: value }));
                        }}
                        options={["all", "low", "high-protein"]}
                      />
                    </div>
                  </div>

                  {!searchResultsActive ? (
                    <EmptyState emoji="🍳" title="Ready to match recipes" body="Go back to My Fridge, add ingredients, then tap Find Recipes." />
                  ) : (
                    <div className="space-y-5">
                      <RecipeSection title="✅ Perfect Matches" subtitle="Every ingredient is already in your fridge" items={resultGroups.perfect} savedRecipes={savedRecipes} onSave={toggleSaveRecipe} onOpen={openRecipe} />
                      <RecipeSection title="🟡 Almost There" subtitle="Missing 1-2 ingredients" items={resultGroups.almost} savedRecipes={savedRecipes} onSave={toggleSaveRecipe} onOpen={openRecipe} />
                      <RecipeSection title="🔴 Worth a Trip" subtitle="Still relevant if you’re okay with a quick store run" items={resultGroups.trip} savedRecipes={savedRecipes} onSave={toggleSaveRecipe} onOpen={openRecipe} />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {discoverCards.map((section) => (
                    <div key={section.title} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{section.title}</h3>
                          <p className="text-sm text-slate-500">{section.subtitle}</p>
                        </div>
                        {section.title.includes("Chef") && tier !== "premium" && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">Premium</span>
                        )}
                      </div>
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                        {section.recipes.map((recipe) => (
                          <button
                            key={recipe.id}
                            type="button"
                            onClick={() => openRecipe(recipe.id)}
                            className="w-60 shrink-0 overflow-hidden rounded-[20px] border border-slate-200 text-left shadow-sm dark:border-slate-800"
                          >
                            <img src={recipe.image} alt={recipe.title} className="h-32 w-full object-cover" />
                            <div className="p-3">
                              <p className="font-semibold">{recipe.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{recipe.cuisine} • {recipe.totalTime} min</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "planner" && (
            <section className="space-y-5">
              <div className="rounded-[24px] bg-gradient-to-r from-[#fff5ef] to-[#fffdf7] p-4 ring-1 ring-slate-100 dark:from-slate-900 dark:to-slate-950 dark:ring-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Weekly plan</h3>
                    <p className="text-sm text-slate-500">Drag-and-drop is simplified here into quick assign menus for mobile speed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={autoPlanWeek}
                    className="rounded-full bg-[#27AE60] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Auto-Plan ✨
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {mealDays.map((day) => (
                  <div key={day} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{day}</h4>
                    <div className="mt-3 space-y-3">
                      {planner
                        .filter((slot) => slot.day === day)
                        .map((slot) => {
                          const recipe = recipeDatabase.find((item) => item.id === slot.recipeId) ?? null;
                          return (
                            <div key={`${slot.day}-${slot.meal}`} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">{slot.meal}</p>
                                  <p className="text-sm text-slate-500">{recipe ? recipe.title : "No meal assigned"}</p>
                                </div>
                                <select
                                  value={slot.recipeId ?? ""}
                                  onChange={(event) => assignPlanner(event.target.value, slot)}
                                  className="max-w-[11rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                                >
                                  <option value="">Select recipe</option>
                                  {savedRecipes
                                    .map((id) => recipeDatabase.find((recipe) => recipe.id === id))
                                    .filter(Boolean)
                                    .map((recipe) => (
                                      <option value={recipe!.id} key={recipe!.id}>
                                        {recipe!.title}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "grocery" && (
            <section className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-2">
                  <input
                    value={manualGroceryInput}
                    onChange={(event) => setManualGroceryInput(event.target.value)}
                    placeholder="Add grocery item"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualGroceryInput.trim()) return;
                      const entry = inferFoodEntry(manualGroceryInput);
                      setGroceryList((current) => [
                        ...current,
                        {
                          id: uid("grocery"),
                          name: entry?.standardName ?? manualGroceryInput.trim(),
                          category: entry?.category ?? "Pantry",
                          purchased: false,
                        },
                      ]);
                      setManualGroceryInput("");
                    }}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                  >
                    Add
                  </button>
                </div>
              </div>
              {groceryList.length ? (
                <div className="space-y-3">
                  {Object.entries(
                    groceryList.reduce<Record<string, GroceryItem[]>>((acc, item) => {
                      acc[item.category] = [...(acc[item.category] ?? []), item];
                      return acc;
                    }, {})
                  ).map(([category, items]) => (
                    <div key={category} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{category}</h3>
                        <p className="text-xs text-slate-400">{items.length} items</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {items.map((item) => (
                          <label key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={item.purchased}
                                onChange={() =>
                                  setGroceryList((current) =>
                                    current.map((entry) =>
                                      entry.id === item.id ? { ...entry, purchased: !entry.purchased } : entry
                                    )
                                  )
                                }
                              />
                              <span className={item.purchased ? "text-slate-400 line-through" : ""}>{item.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setGroceryList((current) => current.filter((entry) => entry.id !== item.id))}
                              className="text-slate-400"
                            >
                              ✕
                            </button>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="rounded-[24px] border border-slate-200 bg-[#fff8ef] p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-amber-300/10 dark:text-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Estimated total</p>
                      <p className="text-lg font-bold">
                        {tier === "premium" ? `$${(groceryList.length * 2.25).toFixed(2)}` : "Upgrade for cost estimate"}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                        Share List
                      </button>
                      <button
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-700"
                        onClick={() => setGroceryList((current) => current.filter((item) => !item.purchased))}
                      >
                        Clear Purchased
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState emoji="🛒" title="No groceries yet" body="Add missing ingredients from recipes or create a list manually here." />
              )}
            </section>
          )}

          {tab === "saved" && (
            <section className="space-y-5">
              <div className="rounded-[24px] bg-gradient-to-r from-[#fff4ef] to-[#fff9f1] p-4 ring-1 ring-slate-100 dark:from-slate-900 dark:to-slate-950 dark:ring-slate-800">
                <h3 className="text-lg font-semibold">Collections</h3>
                <p className="mt-1 text-sm text-slate-500">Quick Meals • Meal Prep • Date Night</p>
                {tier === "premium" && <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">Premium notes, cooking history, and custom folders unlocked.</p>}
              </div>
              {savedRecipes.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {savedRecipes
                    .map((id) => recipeDatabase.find((recipe) => recipe.id === id))
                    .filter(Boolean)
                    .map((recipe) => (
                      <button
                        key={recipe!.id}
                        type="button"
                        onClick={() => openRecipe(recipe!.id)}
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <img src={recipe!.image} alt={recipe!.title} className="h-32 w-full object-cover" />
                        <div className="p-3">
                          <p className="font-semibold leading-5">{recipe!.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{recipe!.totalTime} min • {recipe!.cuisine}</p>
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <EmptyState emoji="❤️" title="No saved recipes yet" body="Tap the heart on recipe cards to build your personal cookbook." />
              )}
            </section>
          )}

          {tab === "profile" && (
            <section className="space-y-5">
              <div className="rounded-[28px] bg-gradient-to-br from-[#fff2ed] via-white to-[#fff9e6] p-5 shadow-sm ring-1 ring-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:ring-slate-800">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-slate-900 text-2xl text-white dark:bg-white dark:text-slate-900">
                    {tier === "premium" ? "👑" : tier === "common" ? "🥈" : "🙂"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Alex Home Cook {tierBadges[tier]}</h3>
                    <p className="text-sm text-slate-500">alex@cooksnap.app</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{tier} plan</p>
                  </div>
                </div>
              </div>

              <SettingsGroup title="Dietary Preferences">
                <ToggleChips values={prefs.dietary} options={dietaryOptions} onToggle={(value) => setPrefs((current) => ({ ...current, dietary: current.dietary.includes(value) ? current.dietary.filter((item) => item !== value) : [...current.dietary, value] }))} />
              </SettingsGroup>

              <SettingsGroup title="Allergies">
                <ToggleChips values={prefs.allergies} options={allergyOptions} onToggle={(value) => setPrefs((current) => ({ ...current, allergies: current.allergies.includes(value) ? current.allergies.filter((item) => item !== value) : [...current.allergies, value] }))} />
              </SettingsGroup>

              <SettingsGroup title="Camera & App Settings">
                <div className="space-y-3 text-sm">
                  <SettingRow label="Default auto-scan" value={prefs.autoScan ? "On" : "Off"} onClick={() => setPrefs((current) => ({ ...current, autoScan: !current.autoScan }))} />
                  <SettingRow label="Save scanned photos" value={prefs.saveScannedPhotos ? "On" : "Off"} onClick={() => setPrefs((current) => ({ ...current, saveScannedPhotos: !current.saveScannedPhotos }))} />
                  <SettingRow label="Dark mode" value={prefs.darkMode ? "On" : "Off"} onClick={() => setPrefs((current) => ({ ...current, darkMode: !current.darkMode }))} />
                  <SettingRow label="Units" value={prefs.units} onClick={() => setPrefs((current) => ({ ...current, units: current.units === "imperial" ? "metric" : "imperial" }))} />
                </div>
              </SettingsGroup>

              <SettingsGroup title="Vision API Key (Option A)">
                <p className="text-sm text-slate-500">Paste your Google Cloud Vision API key to power live ingredient recognition. If empty, CookSnap falls back to on-device browser classification.</p>
                <input
                  value={visionApiKey}
                  onChange={(event) => setVisionApiKey(event.target.value)}
                  placeholder="AIza..."
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                />
              </SettingsGroup>

              <SettingsGroup title="Stats dashboard">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Ingredients scanned" value={String(scanHistory.length)} accent="red" />
                  <StatCard label="Recipes viewed" value={String(recipeViewCountToday)} accent="green" />
                  <StatCard label="Money saved" value={`$${(ingredients.length * 1.8).toFixed(0)}`} accent="gold" />
                  <StatCard label="Food waste prevented" value={`${(ingredients.length * 0.18).toFixed(1)}kg`} accent="slate" />
                </div>
              </SettingsGroup>
            </section>
          )}
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          {[
            ["home", "🏠", "Fridge"],
            ["recipes", "🍳", "Recipes"],
            ["planner", "📅", "Planner"],
            ["grocery", "🛒", "Grocery"],
            ["saved", "❤️", "Saved"],
            ["profile", "⚙️", "Profile"],
          ].map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value as AppTab)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold ${
                tab === value ? "text-[#E74C3C]" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {cameraStage !== "closed" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          {cameraStage === "prepermission" && (
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-end p-5">
              <div className="rounded-[32px] bg-white p-6 shadow-2xl dark:bg-slate-950">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#E74C3C]/10 text-3xl">📸</div>
                <h2 className="mt-5 text-center text-2xl font-bold text-slate-900 dark:text-white">CookSnap needs your camera 📸</h2>
                <p className="mt-3 text-center text-sm leading-6 text-slate-500">
                  Point your camera at ingredients and we'll recognize them instantly. We never store your photos on a server.
                </p>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoScan(prefs.autoScan);
                      void startCamera();
                    }}
                    className="w-full rounded-[22px] bg-[#E74C3C] px-5 py-4 text-base font-bold text-white"
                  >
                    Allow Camera Access
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraStage("closed");
                      setTab("home");
                    }}
                    className="w-full rounded-[22px] border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
                  >
                    Enter Manually Instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {cameraStage === "denied" && (
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-end p-5">
              <div className="rounded-[32px] bg-white p-6 shadow-2xl dark:bg-slate-950">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Camera access blocked</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">{cameraError || "Please allow camera access in your browser settings, then try again."}</p>
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={() => setCameraStage("prepermission")} className="flex-1 rounded-[20px] bg-[#E74C3C] px-4 py-3 text-sm font-semibold text-white">Try again</button>
                  <button type="button" onClick={closeScanner} className="flex-1 rounded-[20px] border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">Close</button>
                </div>
              </div>
            </div>
          )}

          {(cameraStage === "live" || cameraStage === "confirm") && (
            <div className="mx-auto flex min-h-screen max-w-md flex-col bg-black">
              <div className="relative flex-1 overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

                <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 pt-6 text-white">
                  <button type="button" onClick={closeScanner} className="rounded-full bg-white/15 px-3 py-2 text-lg backdrop-blur">←</button>
                  <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur">{scannedCountLabel}</div>
                  <button
                    type="button"
                    onClick={() => setFlashEnabled((current) => !current)}
                    className={`rounded-full px-3 py-2 text-lg backdrop-blur ${flashEnabled ? "bg-[#F1C40F] text-slate-900" : "bg-white/15 text-white"}`}
                  >
                    ⚡
                  </button>
                </div>

                <div className="absolute left-0 right-0 top-20 flex justify-center">
                  <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur">{scanRemaining}</div>
                </div>

                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2">
                  <div className={`scan-frame relative rounded-[32px] border-2 ${cameraError ? "border-orange-300" : pendingScans.length ? "border-[#27AE60]" : "border-white/80"} h-72 overflow-hidden`}>
                    {isScanning && <div className="scan-line absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#27AE60] to-transparent" />}
                    <div className="absolute inset-0 grid place-items-center text-center text-white">
                      <div className="space-y-2 rounded-3xl bg-black/35 px-5 py-4 backdrop-blur-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{scanMode === "visual" ? "Visual scan" : "Barcode scan"}</p>
                        <p className="text-lg font-semibold">{scanMessage}</p>
                        {scanBanner && <p className="text-xs text-emerald-200">{scanBanner}</p>}
                        {cameraError && <p className="text-xs text-orange-200">{cameraError}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScanMode("visual")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${scanMode === "visual" ? "bg-white text-slate-900" : "bg-white/15 text-white"}`}
                    >
                      Visual Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanMode("barcode")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${scanMode === "barcode" ? "bg-white text-slate-900" : "bg-white/15 text-white"}`}
                    >
                      Barcode Scan
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full bg-white/15 px-3 py-2 text-sm backdrop-blur">
                      Auto-Scan
                      <button
                        type="button"
                        onClick={() => setAutoScan((current) => !current)}
                        className={`ml-3 rounded-full px-3 py-1 text-xs font-semibold ${autoScan ? "bg-[#27AE60] text-white" : "bg-white/20 text-white"}`}
                      >
                        {autoScan ? "On" : "Off"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void performScan()}
                      disabled={isScanning}
                      className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#E74C3C] text-3xl shadow-2xl shadow-[#E74C3C]/30 disabled:opacity-60"
                    >
                      ●
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraStage("confirm")}
                      className="rounded-full bg-[#27AE60] px-4 py-3 text-sm font-bold text-white"
                    >
                      Done ✅
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {pendingScans.map((item) => (
                      <div key={item.id} className="flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm backdrop-blur">
                        <span>{item.emoji}</span>
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() => setPendingScans((current) => current.filter((entry) => entry.id !== item.id))}
                          className="text-white/70"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {tier === "premium" && (
                    <div className="mt-4 rounded-2xl bg-amber-300/15 px-4 py-3 text-sm text-amber-100 backdrop-blur">
                      Premium unlocked: batch scan, receipt scan, and fridge shelf capture.
                    </div>
                  )}
                </div>
              </div>

              {cameraStage === "confirm" && (
                <div className="max-h-[46vh] overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-5 text-slate-900 dark:bg-slate-950 dark:text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Confirm detected items</h3>
                      <p className="text-sm text-slate-500">Edit, remove, or add more before sending to My Fridge.</p>
                    </div>
                    <button type="button" onClick={() => setCameraStage("live")} className="rounded-full border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">Add More</button>
                  </div>
                  {pendingScans.length ? (
                    <div className="space-y-3">
                      {pendingScans.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-[22px] border border-slate-200 p-3 dark:border-slate-800">
                          {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-900">{item.emoji}</div>}
                          <div className="min-w-0 flex-1">
                            <input
                              value={item.name}
                              onChange={(event) =>
                                setPendingScans((current) =>
                                  current.map((entry) =>
                                    entry.id === item.id ? { ...entry, name: event.target.value } : entry
                                  )
                                )
                              }
                              className="w-full bg-transparent text-base font-semibold outline-none"
                            />
                            <p className="mt-1 text-sm text-slate-500">{item.category} • {getConfidenceLabel(item.confidence)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingScans((current) => current.filter((entry) => entry.id !== item.id))}
                            className="rounded-full bg-slate-100 px-3 py-2 text-sm dark:bg-slate-900"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState emoji="🤔" title="No confirmed items yet" body="Capture another frame, try barcode mode, or add ingredients manually." />
                  )}
                  <div className="mt-4 rounded-[22px] border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">Premium receipt scan</h4>
                        <p className="text-sm text-slate-500">Paste receipt lines to simulate text extraction and map them to ingredients.</p>
                      </div>
                      {tier !== "premium" && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">Premium</span>}
                    </div>
                    <textarea
                      value={receiptText}
                      onChange={(event) => setReceiptText(event.target.value)}
                      placeholder="MILK&#10;BANANAS&#10;SPINACH&#10;CHICKEN BREAST"
                      className="mt-3 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    />
                    <button type="button" onClick={() => void performReceiptScanFromText()} className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                      Parse receipt items
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={addPendingToFridge}
                    className="mt-5 w-full rounded-[22px] bg-[#27AE60] px-5 py-4 text-base font-bold text-white"
                  >
                    Add to My Fridge
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedRecipe && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-0 backdrop-blur-sm">
          <div className="mx-auto min-h-screen max-w-md bg-white dark:bg-slate-950">
            <div className="relative">
              <img src={selectedRecipe.image} alt={selectedRecipe.title} className="h-72 w-full object-cover" />
              <button type="button" onClick={() => setSelectedRecipeId(null)} className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur">←</button>
              <button type="button" onClick={() => toggleSaveRecipe(selectedRecipe.id)} className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur">
                {savedRecipes.includes(selectedRecipe.id) ? "❤️" : "🤍"}
              </button>
            </div>
            <div className="space-y-5 px-5 pb-10 pt-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                  <span>{selectedRecipe.cuisine}</span>
                  {selectedRecipe.isPremiumOnly && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">Premium</span>}
                </div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{selectedRecipe.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <Badge>⏱ {selectedRecipe.totalTime} min</Badge>
                  <Badge>🍽 {selectedRecipe.servings} servings</Badge>
                  <Badge>📊 {selectedRecipe.difficulty}</Badge>
                  <Badge>🔥 {selectedRecipe.calories} cal</Badge>
                  {tier === "premium" && <Badge>💰 ${selectedRecipe.estimatedCost.toFixed(2)}</Badge>}
                  {tier === "premium" && <Badge>🥩 {selectedRecipe.nutrition.protein}g protein</Badge>}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ingredients</h3>
                  {tier !== "free" ? (
                    <div className="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-800">Serving adjuster available</div>
                  ) : (
                    <div className="rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-800">Fixed servings</div>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {selectedRecipe.ingredients.map((ingredient) => {
                    const hasIt = ingredients.some((item) => item.name === ingredient.name);
                    return (
                      <div key={ingredient.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                        <div>
                          <p className="font-medium">{ingredient.quantity} {ingredient.unit} {ingredient.name}</p>
                          {tier !== "free" && ingredient.substitutes?.length ? (
                            <p className="mt-1 text-xs text-slate-500">Substitutes: {ingredient.substitutes.join(", ")}</p>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${hasIt ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200"}`}>
                          {hasIt ? "✅ Have it" : "Missing"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => addMissingToGrocery(selectedRecipe.ingredients.filter((ingredient) => !ingredients.some((item) => item.name === ingredient.name)).map((ingredient) => ingredient.name))}
                  className="mt-4 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Add missing to grocery list
                </button>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-lg font-semibold">Instructions</h3>
                <div className="mt-3 space-y-3">
                  {selectedRecipe.instructions.map((step) => (
                    <label key={step.step} className="flex gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                      <input type="checkbox" className="mt-1" />
                      <div>
                        <p className="font-semibold">Step {step.step}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
                        {step.tipText && <p className="mt-2 text-xs text-slate-500">Tip: {step.tipText}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-lg font-semibold">Nutrition Info</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <StatCard label="Protein" value={`${selectedRecipe.nutrition.protein}g`} accent="green" />
                  <StatCard label="Carbs" value={`${selectedRecipe.nutrition.carbs}g`} accent="red" />
                  <StatCard label="Fat" value={`${selectedRecipe.nutrition.fat}g`} accent="gold" />
                  <StatCard label="Fiber" value={`${selectedRecipe.nutrition.fiber}g`} accent="slate" />
                </div>
                {tier === "premium" && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    Detailed sodium, sugar, and premium macro charts are available on Premium nutrition tracking.
                  </div>
                )}
              </div>

              {tier === "premium" && (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-300/10">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chef's Tips</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {selectedRecipe.chefTips.map((tip) => (
                      <li key={tip}>• {tip}</li>
                    ))}
                  </ul>
                  {selectedRecipe.winePairing && <p className="mt-3 text-sm font-medium">Wine & drink pairing: {selectedRecipe.winePairing}</p>}
                </div>
              )}

              <div className="sticky bottom-4 flex gap-2 rounded-[24px] bg-white/95 p-3 shadow-xl backdrop-blur dark:bg-slate-950/95">
                <button type="button" onClick={() => toggleSaveRecipe(selectedRecipe.id)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">❤️ Save</button>
                <button type="button" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">📤 Share</button>
                <button type="button" onClick={() => addMissingToGrocery(selectedRecipe.ingredients.map((ingredient) => ingredient.name))} className="flex-1 rounded-2xl bg-[#E74C3C] px-4 py-3 text-sm font-semibold text-white">🛒 Grocery</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paywallOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 p-5 backdrop-blur-sm">
          <div className="mx-auto max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-slate-950">
            <div className="relative bg-[linear-gradient(135deg,rgba(231,76,60,0.92),rgba(241,196,15,0.88)),url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center p-6 text-white">
              <button type="button" onClick={() => setPaywallOpen(false)} className="absolute right-4 top-4 rounded-full bg-black/20 px-3 py-2 text-sm">✕</button>
              <h2 className="text-3xl font-bold">Choose Your Plan 🍽</h2>
              <p className="mt-2 max-w-sm text-sm text-white/90">{showUpgradeReason || "Unlock more scans, smarter planning, and premium cooking tools."}</p>
              <div className="mt-4 inline-flex rounded-full bg-white/15 p-1 text-sm backdrop-blur">
                <button type="button" onClick={() => setAnnualBilling(false)} className={`rounded-full px-4 py-2 font-semibold ${!annualBilling ? "bg-white text-slate-900" : "text-white"}`}>Monthly</button>
                <button type="button" onClick={() => setAnnualBilling(true)} className={`rounded-full px-4 py-2 font-semibold ${annualBilling ? "bg-white text-slate-900" : "text-white"}`}>Annual</button>
              </div>
            </div>
            <div className="space-y-3 p-5">
              {(["free", "common", "premium"] as Tier[]).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => {
                    setTier(plan);
                    setPaywallOpen(false);
                    setShowUpgradeReason("");
                  }}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    tier === plan ? "border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-900" : "border-slate-200 bg-white hover:border-[#E74C3C] dark:border-slate-800 dark:bg-slate-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{plan === "free" ? "FREE" : plan === "common" ? "⭐ COMMON" : "👑 PREMIUM"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {plan === "free"
                          ? "$0"
                          : plan === "common"
                            ? annualBilling
                              ? "$24.99/year"
                              : "$2.99/month"
                            : annualBilling
                              ? "$39.99/year"
                              : "$4.99/month"}
                      </p>
                    </div>
                    {plan === "common" && <span className="rounded-full bg-[#E74C3C] px-3 py-1 text-xs font-semibold text-white">Most Popular</span>}
                    {plan === "premium" && <span className="rounded-full bg-[#F1C40F] px-3 py-1 text-xs font-semibold text-slate-900">Best Value</span>}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {planCopy[plan].perks.map((perk) => (
                      <li key={perk}>• {perk}</li>
                    ))}
                  </ul>
                </button>
              ))}
              <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-3">Feature</th>
                      <th className="px-3 py-3">Free</th>
                      <th className="px-3 py-3">Common</th>
                      <th className="px-3 py-3">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierFeatures.map((row) => (
                      <tr key={row.feature} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="px-3 py-3 font-medium">{row.feature}</td>
                        <td className="px-3 py-3">{row.free}</td>
                        <td className="px-3 py-3">{row.common}</td>
                        <td className="px-3 py-3">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setPaywallOpen(false)} className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">Maybe Later</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "red" | "green" | "gold" | "slate" }) {
  const accents = {
    red: "from-rose-50 to-white text-rose-600 ring-rose-100 dark:from-rose-400/10 dark:to-slate-900 dark:text-rose-200 dark:ring-rose-400/10",
    green: "from-emerald-50 to-white text-emerald-600 ring-emerald-100 dark:from-emerald-400/10 dark:to-slate-900 dark:text-emerald-200 dark:ring-emerald-400/10",
    gold: "from-amber-50 to-white text-amber-600 ring-amber-100 dark:from-amber-400/10 dark:to-slate-900 dark:text-amber-200 dark:ring-amber-400/10",
    slate: "from-slate-50 to-white text-slate-700 ring-slate-100 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100 dark:ring-slate-700",
  };
  return (
    <div className={`rounded-[20px] bg-gradient-to-br p-3 ring-1 ${accents[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-800">{children}</span>;
}

function RecipeSection({
  title,
  subtitle,
  items,
  savedRecipes,
  onSave,
  onOpen,
}: {
  title: string;
  subtitle: string;
  items: RecipeMatch[];
  savedRecipes: string[];
  onSave: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {items.length ? (
        items.map(({ recipe, available, missing, score }) => (
          <div key={recipe.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <img src={recipe.image} alt={recipe.title} className="h-44 w-full object-cover" />
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold leading-6">{recipe.title}</h4>
                  <p className="mt-1 text-sm text-slate-500">{recipe.totalTime} min • {recipe.difficulty} • {recipe.cuisine}</p>
                </div>
                <button type="button" onClick={() => onSave(recipe.id)} className="text-2xl">
                  {savedRecipes.includes(recipe.id) ? "❤️" : "🤍"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                  You have {available.length}/{recipe.ingredients.length} ingredients ({score}%)
                </span>
                {recipe.isPremiumOnly && <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">Premium</span>}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Popularity {recipe.popularity}</span>
              </div>
              <p className="text-sm text-rose-500">
                Missing: {missing.length ? missing.join(", ") : "Nothing — perfect match!"}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => onOpen(recipe.id)} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">View Recipe</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyState emoji="🥘" title="No recipes in this section yet" body="Add a few more ingredients or relax filters to see better matches." />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ToggleChips({ values, options, onToggle }: { values: string[]; options: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`rounded-full px-3 py-2 text-sm font-medium ${
            values.includes(option)
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SettingRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-3 text-left dark:border-slate-800">
      <span>{label}</span>
      <span className="font-semibold text-slate-500">{value}</span>
    </button>
  );
}
