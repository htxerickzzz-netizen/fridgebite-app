export type Tier = "free" | "common" | "premium";
export type Category =
  | "Proteins"
  | "Vegetables"
  | "Fruits"
  | "Dairy"
  | "Grains"
  | "Pantry"
  | "Spices"
  | "Canned"
  | "Herbs"
  | "Frozen";

export type FoodEntry = {
  standardName: string;
  category: Category;
  emoji: string;
  shelfLifeDays: number;
  aliases: string[];
};

export type RecipeIngredient = {
  name: string;
  quantity: string;
  unit: string;
  category: Category;
  substitutes?: string[];
};

export type RecipeStep = {
  step: number;
  text: string;
  timerMinutes?: number | null;
  tipText?: string | null;
};

export type Recipe = {
  id: string;
  title: string;
  image: string;
  cuisine: string;
  mealType: Array<"breakfast" | "lunch" | "dinner" | "snack" | "dessert">;
  difficulty: "easy" | "medium" | "hard";
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  calories: number;
  estimatedCost: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  ingredients: RecipeIngredient[];
  instructions: RecipeStep[];
  chefTips: string[];
  commonMistakes: string[];
  platingTips?: string | null;
  winePairing?: string | null;
  drinkPairing?: string | null;
  tags: string[];
  allergens: string[];
  dietaryFlags: string[];
  isPremiumOnly: boolean;
  popularity: number;
  averageRating: number;
  totalReviews: number;
};

const produceItems: Array<[string, string, number, string[]]> = [
  ["Apple", "🍎", 28, ["apple", "red apple", "green apple", "granny smith", "gala apple"]],
  ["Banana", "🍌", 6, ["banana", "ripe banana", "yellow banana", "plantain"]],
  ["Orange", "🍊", 18, ["orange", "navel orange", "mandarin", "clementine"]],
  ["Lemon", "🍋", 21, ["lemon", "fresh lemon", "lemon fruit"]],
  ["Lime", "🍋", 21, ["lime", "green lime"]],
  ["Avocado", "🥑", 5, ["avocado", "ripe avocado", "hass avocado"]],
  ["Strawberries", "🍓", 5, ["strawberry", "strawberries", "berry"]],
  ["Blueberries", "🫐", 7, ["blueberry", "blueberries"]],
  ["Grapes", "🍇", 10, ["grape", "grapes", "red grapes", "green grapes"]],
  ["Peach", "🍑", 6, ["peach", "fresh peach"]],
  ["Pear", "🍐", 8, ["pear", "bosc pear", "anjou pear"]],
  ["Pineapple", "🍍", 7, ["pineapple", "fresh pineapple"]],
  ["Watermelon", "🍉", 7, ["watermelon"]],
  ["Tomato", "🍅", 7, ["tomato", "tomatoes", "roma tomato", "cherry tomato", "heirloom tomato"]],
  ["Cucumber", "🥒", 8, ["cucumber", "english cucumber"]],
  ["Bell Pepper", "🫑", 7, ["bell pepper", "red bell pepper", "green pepper", "yellow pepper"]],
  ["Chili Pepper", "🌶️", 7, ["chili", "chili pepper", "jalapeno", "serrano pepper"]],
  ["Broccoli", "🥦", 6, ["broccoli", "broccoli crown"]],
  ["Cauliflower", "🥦", 6, ["cauliflower"]],
  ["Carrot", "🥕", 21, ["carrot", "baby carrot"]],
  ["Onion", "🧅", 30, ["onion", "yellow onion", "red onion", "white onion"]],
  ["Garlic", "🧄", 45, ["garlic", "garlic bulb"]],
  ["Potato", "🥔", 30, ["potato", "russet potato", "gold potato", "baby potato"]],
  ["Sweet Potato", "🍠", 30, ["sweet potato", "yam"]],
  ["Lettuce", "🥬", 6, ["lettuce", "romaine", "iceberg lettuce"]],
  ["Spinach", "🥬", 5, ["spinach", "baby spinach"]],
  ["Kale", "🥬", 6, ["kale"]],
  ["Mushrooms", "🍄", 6, ["mushroom", "mushrooms", "button mushroom", "cremini"]],
  ["Corn", "🌽", 5, ["corn", "corn cob", "sweet corn"]],
  ["Zucchini", "🥒", 6, ["zucchini", "courgette"]],
  ["Eggplant", "🍆", 6, ["eggplant", "aubergine"]],
  ["Celery", "🥬", 14, ["celery", "celery stalk"]],
  ["Green Beans", "🫛", 7, ["green beans", "string beans"]],
  ["Peas", "🫛", 7, ["peas", "green peas"]],
  ["Cabbage", "🥬", 21, ["cabbage", "green cabbage", "red cabbage"]],
  ["Brussels Sprouts", "🥬", 7, ["brussels sprouts", "sprouts"]],
  ["Asparagus", "🥬", 5, ["asparagus"]],
  ["Radish", "🥬", 7, ["radish", "radishes"]],
  ["Beets", "🥬", 14, ["beet", "beets"]],
  ["Butternut Squash", "🎃", 30, ["butternut squash", "squash"]],
];

const proteinItems: Array<[string, string, number, string[]]> = [
  ["Chicken", "🍗", 2, ["chicken", "raw chicken", "whole chicken"]],
  ["Chicken Breast", "🍗", 2, ["chicken breast", "skinless chicken breast"]],
  ["Ground Beef", "🥩", 2, ["ground beef", "minced beef"]],
  ["Beef Steak", "🥩", 3, ["steak", "beef steak", "sirloin"]],
  ["Pork", "🥩", 3, ["pork", "pork chop"]],
  ["Bacon", "🥓", 7, ["bacon", "bacon strips"]],
  ["Sausage", "🌭", 4, ["sausage", "breakfast sausage", "italian sausage"]],
  ["Shrimp", "🦐", 2, ["shrimp", "prawn", "prawns"]],
  ["Salmon", "🐟", 2, ["salmon", "salmon fillet"]],
  ["Tuna", "🐟", 3, ["tuna", "ahi tuna"]],
  ["Cod", "🐟", 2, ["cod", "white fish"]],
  ["Eggs", "🥚", 21, ["egg", "eggs", "carton of eggs"]],
  ["Tofu", "🧊", 7, ["tofu", "firm tofu", "silken tofu"]],
  ["Chickpeas", "🫘", 365, ["chickpeas", "garbanzo beans"]],
  ["Black Beans", "🫘", 365, ["black beans", "beans"]],
  ["Lentils", "🫘", 365, ["lentils", "brown lentils", "red lentils"]],
  ["Turkey", "🍗", 2, ["turkey", "ground turkey"]],
];

const dairyItems: Array<[string, string, number, string[]]> = [
  ["Milk", "🥛", 7, ["milk", "whole milk", "skim milk", "milk bottle"]],
  ["Yogurt", "🥛", 14, ["yogurt", "greek yogurt"]],
  ["Butter", "🧈", 30, ["butter", "salted butter", "unsalted butter"]],
  ["Cheese", "🧀", 20, ["cheese", "sliced cheese"]],
  ["Cheddar Cheese", "🧀", 20, ["cheddar", "cheddar cheese"]],
  ["Mozzarella", "🧀", 12, ["mozzarella", "fresh mozzarella"]],
  ["Parmesan", "🧀", 30, ["parmesan", "parmigiano"]],
  ["Cream Cheese", "🧀", 20, ["cream cheese"]],
  ["Heavy Cream", "🥛", 10, ["cream", "heavy cream", "double cream"]],
  ["Sour Cream", "🥛", 14, ["sour cream"]],
  ["Feta", "🧀", 20, ["feta", "feta cheese"]],
  ["Ricotta", "🧀", 10, ["ricotta"]],
];

const grainItems: Array<[string, string, number, string[]]> = [
  ["Rice", "🍚", 365, ["rice", "white rice", "brown rice", "jasmine rice"]],
  ["Pasta", "🍝", 365, ["pasta", "spaghetti", "penne", "fusilli", "macaroni"]],
  ["Bread", "🍞", 6, ["bread", "loaf", "sourdough", "white bread", "whole wheat bread"]],
  ["Tortillas", "🌮", 14, ["tortilla", "tortillas", "flour tortilla", "corn tortilla"]],
  ["Oats", "🥣", 365, ["oats", "rolled oats", "oatmeal"]],
  ["Quinoa", "🍚", 365, ["quinoa"]],
  ["Couscous", "🍚", 365, ["couscous"]],
  ["Noodles", "🍜", 365, ["noodles", "egg noodles", "ramen noodles"]],
  ["Breadcrumbs", "🍞", 365, ["breadcrumbs", "bread crumbs"]],
  ["Flour", "🌾", 365, ["flour", "all purpose flour"]],
];

const pantryItems: Array<[string, string, number, string[]]> = [
  ["Olive Oil", "🫒", 365, ["olive oil", "extra virgin olive oil"]],
  ["Soy Sauce", "🥫", 365, ["soy sauce"]],
  ["Sugar", "🍬", 365, ["sugar", "white sugar", "brown sugar"]],
  ["Honey", "🍯", 365, ["honey"]],
  ["Peanut Butter", "🥜", 120, ["peanut butter"]],
  ["Jam", "🍓", 180, ["jam", "strawberry jam"]],
  ["Tomato Sauce", "🥫", 365, ["tomato sauce", "marinara", "pasta sauce"]],
  ["Coconut Milk", "🥥", 365, ["coconut milk"]],
  ["Chicken Broth", "🥣", 365, ["chicken broth", "stock"]],
  ["Vegetable Broth", "🥣", 365, ["vegetable broth"]],
  ["Mayonnaise", "🥫", 120, ["mayonnaise", "mayo"]],
  ["Mustard", "🥫", 180, ["mustard", "dijon mustard"]],
  ["Vinegar", "🥫", 365, ["vinegar", "apple cider vinegar"]],
  ["Sesame Oil", "🫒", 365, ["sesame oil"]],
  ["Maple Syrup", "🍁", 365, ["maple syrup"]],
  ["Salsa", "🥫", 60, ["salsa"]],
  ["Pesto", "🌿", 30, ["pesto"]],
];

const spicesItems: Array<[string, string, number, string[]]> = [
  ["Salt", "🧂", 365, ["salt", "sea salt"]],
  ["Black Pepper", "🧂", 365, ["black pepper", "pepper"]],
  ["Paprika", "🧂", 365, ["paprika"]],
  ["Cumin", "🧂", 365, ["cumin"]],
  ["Cinnamon", "🧂", 365, ["cinnamon"]],
  ["Chili Flakes", "🧂", 365, ["chili flakes", "red pepper flakes"]],
  ["Garlic Powder", "🧂", 365, ["garlic powder"]],
  ["Onion Powder", "🧂", 365, ["onion powder"]],
  ["Italian Seasoning", "🧂", 365, ["italian seasoning"]],
  ["Curry Powder", "🧂", 365, ["curry powder"]],
  ["Taco Seasoning", "🧂", 365, ["taco seasoning"]],
  ["Vanilla Extract", "🧁", 365, ["vanilla", "vanilla extract"]],
];

const cannedItems: Array<[string, string, number, string[]]> = [
  ["Canned Tomatoes", "🥫", 365, ["canned tomatoes", "diced tomatoes", "crushed tomatoes"]],
  ["Tuna Can", "🥫", 365, ["canned tuna", "tuna can"]],
  ["Corn Can", "🥫", 365, ["canned corn"]],
  ["Beans Can", "🥫", 365, ["canned beans", "bean can"]],
  ["Soup Can", "🥫", 365, ["soup can", "canned soup"]],
  ["Coconut Milk Can", "🥫", 365, ["coconut milk can"]],
];

const herbItems: Array<[string, string, number, string[]]> = [
  ["Basil", "🌿", 6, ["basil", "fresh basil"]],
  ["Parsley", "🌿", 6, ["parsley", "fresh parsley"]],
  ["Cilantro", "🌿", 6, ["cilantro", "coriander leaves"]],
  ["Rosemary", "🌿", 7, ["rosemary"]],
  ["Thyme", "🌿", 7, ["thyme"]],
  ["Mint", "🌿", 5, ["mint", "fresh mint"]],
  ["Green Onion", "🌿", 7, ["green onion", "spring onion", "scallion"]],
];

const frozenItems: Array<[string, string, number, string[]]> = [
  ["Frozen Peas", "🧊", 180, ["frozen peas"]],
  ["Frozen Broccoli", "🧊", 180, ["frozen broccoli"]],
  ["Frozen Berries", "🧊", 180, ["frozen berries"]],
  ["Frozen Spinach", "🧊", 180, ["frozen spinach"]],
  ["Frozen Pizza", "🧊", 120, ["frozen pizza"]],
];

function buildCategory(
  category: Category,
  items: Array<[string, string, number, string[]]>
): FoodEntry[] {
  return items.map(([standardName, emoji, shelfLifeDays, aliases]) => {
    const generated = new Set<string>();
    aliases.forEach((alias) => {
      generated.add(alias.toLowerCase());
      generated.add(`fresh ${alias.toLowerCase()}`);
      generated.add(`raw ${alias.toLowerCase()}`);
      generated.add(`organic ${alias.toLowerCase()}`);
      generated.add(`${alias.toLowerCase()} ingredient`);
      generated.add(`${alias.toLowerCase()} food`);
    });
    generated.add(standardName.toLowerCase());
    generated.add(`whole ${standardName.toLowerCase()}`);
    generated.add(`sliced ${standardName.toLowerCase()}`);
    generated.add(`chopped ${standardName.toLowerCase()}`);

    return {
      standardName,
      category,
      emoji,
      shelfLifeDays,
      aliases: [...generated],
    };
  });
}

export const foodEntries: FoodEntry[] = [
  ...buildCategory("Fruits", produceItems.slice(0, 13)),
  ...buildCategory("Vegetables", produceItems.slice(13)),
  ...buildCategory("Proteins", proteinItems),
  ...buildCategory("Dairy", dairyItems),
  ...buildCategory("Grains", grainItems),
  ...buildCategory("Pantry", pantryItems),
  ...buildCategory("Spices", spicesItems),
  ...buildCategory("Canned", cannedItems),
  ...buildCategory("Herbs", herbItems),
  ...buildCategory("Frozen", frozenItems),
];

export const foodAliasMap = foodEntries.reduce<Record<string, FoodEntry>>((acc, entry) => {
  entry.aliases.forEach((alias) => {
    acc[alias] = entry;
  });
  return acc;
}, {});

export const nonFoodLabels = [
  "food",
  "dish",
  "cuisine",
  "ingredient",
  "produce",
  "natural foods",
  "table",
  "tableware",
  "plate",
  "bowl",
  "cutting board",
  "kitchen",
  "hand",
  "finger",
  "person",
  "countertop",
  "refrigerator",
  "shelf",
  "container",
  "packaging",
  "bag",
  "plastic",
  "wood",
  "metal",
  "background",
  "indoor",
  "recipe",
  "meal",
  "cooking",
  "vegetable",
  "fruit",
  "meat",
  "snack",
  "staple food",
  "comfort food",
  "superfood",
  "whole food",
  "plant",
  "leaf",
  "close-up",
  "macro photography",
  "still life",
  "freshness",
];

export const pantryStaples = [
  "Salt",
  "Black Pepper",
  "Olive Oil",
  "Water",
  "Sugar",
  "Garlic Powder",
  "Onion Powder",
];

export const quickAddCategories: Array<{ category: Category; emoji: string; items: string[] }> = [
  { category: "Proteins", emoji: "🍗", items: ["Chicken", "Eggs", "Tofu", "Ground Beef", "Salmon", "Shrimp"] },
  { category: "Vegetables", emoji: "🥦", items: ["Tomato", "Onion", "Garlic", "Broccoli", "Carrot", "Spinach"] },
  { category: "Fruits", emoji: "🍎", items: ["Apple", "Banana", "Lemon", "Avocado", "Strawberries", "Blueberries"] },
  { category: "Dairy", emoji: "🧀", items: ["Milk", "Cheese", "Cheddar Cheese", "Mozzarella", "Butter", "Yogurt"] },
  { category: "Grains", emoji: "🍚", items: ["Rice", "Pasta", "Bread", "Tortillas", "Oats", "Quinoa"] },
  { category: "Pantry", emoji: "🫙", items: ["Olive Oil", "Soy Sauce", "Tomato Sauce", "Honey", "Chicken Broth", "Salsa"] },
  { category: "Spices", emoji: "🧂", items: ["Salt", "Black Pepper", "Paprika", "Cumin", "Italian Seasoning", "Curry Powder"] },
  { category: "Canned", emoji: "🥫", items: ["Canned Tomatoes", "Tuna Can", "Corn Can", "Beans Can", "Soup Can", "Coconut Milk Can"] },
];

const heroImages = {
  pasta:
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
  chicken:
    "https://images.unsplash.com/photo-1604908554165-e5901ef1b8a5?auto=format&fit=crop&w=1200&q=80",
  salad:
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
  breakfast:
    "https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?auto=format&fit=crop&w=1200&q=80",
  curry:
    "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=1200&q=80",
  soup:
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
  seafood:
    "https://images.unsplash.com/photo-1563379091339-03246963d29a?auto=format&fit=crop&w=1200&q=80",
  sandwich:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
  dessert:
    "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=1200&q=80",
};

function recipe(
  id: string,
  title: string,
  image: string,
  cuisine: string,
  mealType: Recipe["mealType"],
  difficulty: Recipe["difficulty"],
  prepTime: number,
  cookTime: number,
  servings: number,
  calories: number,
  estimatedCost: number,
  ingredients: RecipeIngredient[],
  instructions: string[],
  chefTips: string[],
  tags: string[],
  allergens: string[] = [],
  dietaryFlags: string[] = [],
  isPremiumOnly = false,
  drinkPairing?: string
): Recipe {
  return {
    id,
    title,
    image,
    cuisine,
    mealType,
    difficulty,
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    servings,
    calories,
    estimatedCost,
    nutrition: {
      protein: Math.max(10, Math.round(calories * 0.08)),
      carbs: Math.max(12, Math.round(calories * 0.11)),
      fat: Math.max(8, Math.round(calories * 0.04)),
      fiber: Math.max(3, Math.round(calories * 0.01)),
      sugar: Math.max(2, Math.round(calories * 0.008)),
      sodium: 350 + Math.round(estimatedCost * 80),
    },
    ingredients,
    instructions: instructions.map((text, index) => ({
      step: index + 1,
      text,
      timerMinutes: index === instructions.length - 1 ? 5 : null,
      tipText: chefTips[index % chefTips.length] ?? null,
    })),
    chefTips,
    commonMistakes: [
      "Overcrowding the pan can make ingredients steam instead of brown.",
      "Taste before serving and adjust salt or acidity at the end.",
    ],
    platingTips: "Finish with a bright herb, citrus, or drizzle of oil for a restaurant look.",
    winePairing: mealType.includes("dinner") ? "Crisp Sauvignon Blanc or light Pinot Noir" : null,
    drinkPairing,
    tags,
    allergens,
    dietaryFlags,
    isPremiumOnly,
    popularity: 72 + Math.round(Math.random() * 25),
    averageRating: 4.1 + Math.random() * 0.8,
    totalReviews: 38 + Math.round(Math.random() * 420),
  };
}

export const recipes: Recipe[] = [
  recipe(
    "pasta-tomato-basil",
    "Tomato Basil Pantry Pasta",
    heroImages.pasta,
    "Italian",
    ["lunch", "dinner"],
    "easy",
    10,
    15,
    2,
    480,
    5.5,
    [
      { name: "Pasta", quantity: "8", unit: "oz", category: "Grains", substitutes: ["Noodles", "Rice"] },
      { name: "Tomato Sauce", quantity: "1", unit: "cup", category: "Pantry", substitutes: ["Canned Tomatoes"] },
      { name: "Garlic", quantity: "2", unit: "cloves", category: "Vegetables", substitutes: ["Garlic Powder"] },
      { name: "Basil", quantity: "6", unit: "leaves", category: "Herbs", substitutes: ["Italian Seasoning"] },
      { name: "Olive Oil", quantity: "1", unit: "tbsp", category: "Pantry" },
      { name: "Parmesan", quantity: "2", unit: "tbsp", category: "Dairy", substitutes: ["Cheese"] },
    ],
    [
      "Boil the pasta in salted water until tender and reserve a splash of cooking water.",
      "Warm olive oil with garlic, then stir in tomato sauce and simmer for 5 minutes.",
      "Toss pasta with the sauce, basil, and parmesan until glossy.",
    ],
    ["Use pasta water to make the sauce cling beautifully.", "Add basil off the heat to keep it bright.", "Finish with extra parmesan right before serving."],
    ["quick", "budget", "vegetarian"],
    ["milk", "wheat"],
    ["vegetarian"],
    false,
    "Sparkling water with lemon"
  ),
  recipe(
    "chicken-rice-bowl",
    "Chicken Broccoli Rice Bowl",
    heroImages.chicken,
    "American",
    ["lunch", "dinner"],
    "easy",
    12,
    18,
    2,
    520,
    7.4,
    [
      { name: "Chicken Breast", quantity: "1", unit: "lb", category: "Proteins", substitutes: ["Chicken", "Tofu"] },
      { name: "Rice", quantity: "1", unit: "cup", category: "Grains", substitutes: ["Quinoa"] },
      { name: "Broccoli", quantity: "2", unit: "cups", category: "Vegetables", substitutes: ["Frozen Broccoli"] },
      { name: "Soy Sauce", quantity: "2", unit: "tbsp", category: "Pantry" },
      { name: "Garlic", quantity: "2", unit: "cloves", category: "Vegetables" },
      { name: "Sesame Oil", quantity: "1", unit: "tsp", category: "Pantry", substitutes: ["Olive Oil"] },
    ],
    [
      "Cook rice according to package directions.",
      "Sear sliced chicken until browned and cooked through.",
      "Add broccoli, garlic, soy sauce, and a splash of water, then cover briefly.",
      "Serve the chicken mixture over fluffy rice.",
    ],
    ["Slice chicken evenly so it cooks at the same speed.", "Keep broccoli slightly crisp for the best texture.", "A drizzle of sesame oil adds takeout-style aroma."],
    ["high-protein", "meal-prep"]
  ),
  recipe(
    "veggie-omelette",
    "Loaded Veggie Omelette",
    heroImages.breakfast,
    "French",
    ["breakfast", "lunch"],
    "easy",
    8,
    10,
    1,
    330,
    4.2,
    [
      { name: "Eggs", quantity: "3", unit: "large", category: "Proteins" },
      { name: "Spinach", quantity: "1", unit: "cup", category: "Vegetables", substitutes: ["Kale"] },
      { name: "Mushrooms", quantity: "0.5", unit: "cup", category: "Vegetables" },
      { name: "Cheddar Cheese", quantity: "0.25", unit: "cup", category: "Dairy", substitutes: ["Cheese"] },
      { name: "Butter", quantity: "1", unit: "tsp", category: "Dairy", substitutes: ["Olive Oil"] },
    ],
    [
      "Whisk eggs with a pinch of salt and pepper.",
      "Sauté mushrooms and spinach in butter until softened.",
      "Pour in eggs, cook gently, add cheese, then fold and finish.",
    ],
    ["Low heat makes omelettes tender, not rubbery.", "Cook the vegetables first so the eggs stay fluffy.", "Slide onto a warm plate to finish setting gently."],
    ["breakfast", "low-carb"],
    ["eggs", "milk"],
    ["vegetarian"]
  ),
  recipe(
    "salmon-lemon-skillet",
    "Lemon Garlic Salmon Skillet",
    heroImages.seafood,
    "Mediterranean",
    ["dinner"],
    "medium",
    10,
    14,
    2,
    460,
    11.8,
    [
      { name: "Salmon", quantity: "2", unit: "fillets", category: "Proteins" },
      { name: "Lemon", quantity: "1", unit: "whole", category: "Fruits" },
      { name: "Garlic", quantity: "3", unit: "cloves", category: "Vegetables" },
      { name: "Butter", quantity: "1", unit: "tbsp", category: "Dairy" },
      { name: "Parsley", quantity: "2", unit: "tbsp", category: "Herbs", substitutes: ["Basil"] },
      { name: "Asparagus", quantity: "1", unit: "bunch", category: "Vegetables", substitutes: ["Green Beans"] },
    ],
    [
      "Season salmon and sear skin-side down until crisp.",
      "Add asparagus to the pan and cook until bright green.",
      "Stir in butter, garlic, lemon juice, and parsley, then spoon over the fish.",
    ],
    ["Let salmon sit a few minutes before cooking so it sears evenly.", "Do not move the fillets too early.", "Finish with lemon zest for extra freshness."],
    ["premium-feel", "weeknight"]
  ),
  recipe(
    "tofu-stir-fry",
    "Fast Tofu Veggie Stir-Fry",
    heroImages.curry,
    "Asian",
    ["lunch", "dinner"],
    "easy",
    12,
    12,
    2,
    410,
    6.1,
    [
      { name: "Tofu", quantity: "14", unit: "oz", category: "Proteins" },
      { name: "Bell Pepper", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Broccoli", quantity: "2", unit: "cups", category: "Vegetables" },
      { name: "Soy Sauce", quantity: "2", unit: "tbsp", category: "Pantry" },
      { name: "Garlic", quantity: "2", unit: "cloves", category: "Vegetables" },
      { name: "Rice", quantity: "1", unit: "cup", category: "Grains" },
    ],
    [
      "Press tofu briefly, cube it, and pan-sear until golden.",
      "Stir-fry vegetables until crisp-tender.",
      "Return tofu, add soy sauce and garlic, then serve over rice.",
    ],
    ["Dry tofu well for better browning.", "Cook vegetables over high heat to keep color and crunch.", "Add sauce at the end to avoid sogginess."],
    ["vegan", "meal-prep"],
    ["soy"],
    ["vegan"]
  ),
  recipe(
    "avocado-toast-egg",
    "Avocado Toast with Jammy Eggs",
    heroImages.breakfast,
    "Californian",
    ["breakfast", "snack"],
    "easy",
    6,
    8,
    2,
    350,
    4.8,
    [
      { name: "Bread", quantity: "2", unit: "slices", category: "Grains" },
      { name: "Avocado", quantity: "1", unit: "whole", category: "Fruits" },
      { name: "Eggs", quantity: "2", unit: "large", category: "Proteins" },
      { name: "Lemon", quantity: "0.5", unit: "whole", category: "Fruits" },
      { name: "Chili Flakes", quantity: "1", unit: "pinch", category: "Spices", substitutes: ["Black Pepper"] },
    ],
    [
      "Boil eggs for 7 minutes and cool in water.",
      "Toast bread and mash avocado with lemon and salt.",
      "Top toast with avocado, halved eggs, and chili flakes.",
    ],
    ["A squeeze of lemon keeps avocado bright.", "Use sturdy bread so toppings stay neat.", "Jammy eggs make the toast feel indulgent."],
    ["quick", "breakfast"]
  ),
  recipe(
    "greek-salad-bowl",
    "Greek Chickpea Salad Bowl",
    heroImages.salad,
    "Mediterranean",
    ["lunch", "dinner"],
    "easy",
    15,
    0,
    2,
    390,
    5.2,
    [
      { name: "Chickpeas", quantity: "1", unit: "can", category: "Proteins" },
      { name: "Cucumber", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Tomato", quantity: "2", unit: "whole", category: "Vegetables" },
      { name: "Feta", quantity: "0.5", unit: "cup", category: "Dairy" },
      { name: "Olive Oil", quantity: "1", unit: "tbsp", category: "Pantry" },
      { name: "Lemon", quantity: "1", unit: "whole", category: "Fruits" },
      { name: "Parsley", quantity: "2", unit: "tbsp", category: "Herbs" },
    ],
    [
      "Drain chickpeas and combine with chopped cucumber and tomato.",
      "Whisk lemon juice with olive oil, salt, and pepper.",
      "Toss everything together and finish with feta and parsley.",
    ],
    ["Salt the tomatoes right before serving.", "Rinse chickpeas well for a cleaner flavor.", "Add feta last so it stays chunky."],
    ["no-cook", "vegetarian"],
    ["milk"],
    ["vegetarian", "gluten-free"]
  ),
  recipe(
    "chicken-fajita-wraps",
    "Chicken Fajita Wraps",
    heroImages.chicken,
    "Mexican",
    ["lunch", "dinner"],
    "easy",
    12,
    15,
    3,
    540,
    8.3,
    [
      { name: "Chicken", quantity: "1", unit: "lb", category: "Proteins" },
      { name: "Bell Pepper", quantity: "2", unit: "whole", category: "Vegetables" },
      { name: "Onion", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Tortillas", quantity: "6", unit: "small", category: "Grains" },
      { name: "Taco Seasoning", quantity: "1", unit: "tbsp", category: "Spices", substitutes: ["Paprika", "Cumin"] },
      { name: "Sour Cream", quantity: "0.25", unit: "cup", category: "Dairy" },
    ],
    [
      "Cook sliced chicken with taco seasoning until browned.",
      "Sauté peppers and onions until lightly charred.",
      "Warm tortillas and fill with the chicken mixture and sour cream.",
    ],
    ["Let the pan get hot before adding peppers for a smoky edge.", "Slice everything evenly for better wraps.", "Serve with lime if you have it."],
    ["family", "weeknight"],
    ["milk", "wheat"]
  ),
  recipe(
    "mushroom-risotto",
    "Creamy Mushroom Risotto",
    heroImages.pasta,
    "Italian",
    ["dinner"],
    "medium",
    10,
    28,
    2,
    510,
    6.8,
    [
      { name: "Rice", quantity: "1", unit: "cup", category: "Grains" },
      { name: "Mushrooms", quantity: "2", unit: "cups", category: "Vegetables" },
      { name: "Onion", quantity: "0.5", unit: "whole", category: "Vegetables" },
      { name: "Garlic", quantity: "2", unit: "cloves", category: "Vegetables" },
      { name: "Parmesan", quantity: "0.33", unit: "cup", category: "Dairy" },
      { name: "Butter", quantity: "1", unit: "tbsp", category: "Dairy" },
      { name: "Vegetable Broth", quantity: "4", unit: "cups", category: "Pantry" },
    ],
    [
      "Cook onion and mushrooms until deeply golden.",
      "Add rice and garlic, then ladle in warm broth a little at a time.",
      "Finish with butter and parmesan when creamy and tender.",
    ],
    ["Warm broth keeps the risotto creamy.", "Stir often, not constantly.", "Use good parmesan for the best finish."],
    ["comfort-food", "vegetarian"],
    ["milk"],
    ["vegetarian"],
    true,
    "Sparkling water or dry white wine"
  ),
  recipe(
    "caprese-melt",
    "Caprese Sandwich Melt",
    heroImages.sandwich,
    "Italian",
    ["lunch"],
    "easy",
    8,
    8,
    1,
    420,
    4.9,
    [
      { name: "Bread", quantity: "2", unit: "slices", category: "Grains" },
      { name: "Tomato", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Mozzarella", quantity: "3", unit: "slices", category: "Dairy" },
      { name: "Basil", quantity: "4", unit: "leaves", category: "Herbs" },
      { name: "Butter", quantity: "1", unit: "tsp", category: "Dairy" },
    ],
    [
      "Layer tomato, mozzarella, and basil between bread.",
      "Butter the outside and toast in a skillet until golden.",
      "Slice and serve immediately while the cheese is melty.",
    ],
    ["Pat tomato dry so the bread stays crisp.", "Cover the pan briefly to melt the cheese faster.", "Add a swipe of pesto for extra flavor."],
    ["sandwich", "vegetarian"],
    ["milk", "wheat"],
    ["vegetarian"]
  ),
  recipe(
    "shakshuka-skillet",
    "Skillet Shakshuka",
    heroImages.soup,
    "Middle Eastern",
    ["breakfast", "dinner"],
    "medium",
    10,
    20,
    2,
    360,
    5.6,
    [
      { name: "Eggs", quantity: "4", unit: "large", category: "Proteins" },
      { name: "Tomato Sauce", quantity: "1.5", unit: "cups", category: "Pantry", substitutes: ["Canned Tomatoes"] },
      { name: "Onion", quantity: "1", unit: "small", category: "Vegetables" },
      { name: "Bell Pepper", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Paprika", quantity: "1", unit: "tsp", category: "Spices" },
      { name: "Cumin", quantity: "0.5", unit: "tsp", category: "Spices" },
    ],
    [
      "Cook onion and pepper until soft and sweet.",
      "Stir in tomato sauce and spices and simmer until slightly thickened.",
      "Crack in eggs, cover, and cook until the whites are just set.",
    ],
    ["Use a spoon to make little wells for the eggs.", "Keep the sauce simmering, not boiling hard.", "Serve with crusty bread to scoop everything up."],
    ["one-pan", "protein"]
  ),
  recipe(
    "broccoli-fried-rice",
    "Broccoli Egg Fried Rice",
    heroImages.curry,
    "Asian",
    ["lunch", "dinner"],
    "easy",
    8,
    10,
    2,
    430,
    4.7,
    [
      { name: "Rice", quantity: "2", unit: "cups cooked", category: "Grains" },
      { name: "Eggs", quantity: "2", unit: "large", category: "Proteins" },
      { name: "Broccoli", quantity: "1", unit: "cup", category: "Vegetables", substitutes: ["Frozen Broccoli"] },
      { name: "Carrot", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Soy Sauce", quantity: "1.5", unit: "tbsp", category: "Pantry" },
      { name: "Green Onion", quantity: "2", unit: "stalks", category: "Herbs" },
    ],
    [
      "Scramble eggs in a hot pan and set aside.",
      "Stir-fry broccoli and carrot until crisp-tender.",
      "Add rice, soy sauce, and eggs, then toss until hot and fragrant.",
    ],
    ["Day-old rice fries best.", "Use high heat for a slightly smoky flavor.", "Green onion brightens the whole dish."],
    ["leftovers", "quick"]
  ),
  recipe(
    "banana-oat-pancakes",
    "Banana Oat Blender Pancakes",
    heroImages.breakfast,
    "American",
    ["breakfast", "dessert"],
    "easy",
    5,
    10,
    2,
    300,
    3.9,
    [
      { name: "Banana", quantity: "1", unit: "whole", category: "Fruits" },
      { name: "Eggs", quantity: "2", unit: "large", category: "Proteins" },
      { name: "Oats", quantity: "1", unit: "cup", category: "Grains" },
      { name: "Cinnamon", quantity: "0.5", unit: "tsp", category: "Spices" },
      { name: "Maple Syrup", quantity: "2", unit: "tbsp", category: "Pantry", substitutes: ["Honey"] },
    ],
    [
      "Blend banana, eggs, oats, and cinnamon until smooth.",
      "Cook small pancakes on a lightly greased skillet.",
      "Serve warm with maple syrup.",
    ],
    ["Let the batter sit for a minute so the oats hydrate.", "Keep pancakes small so they flip easily.", "Add berries if you have them."],
    ["kid-friendly", "breakfast"],
    ["eggs"],
    ["gluten-free"]
  ),
  recipe(
    "chickpea-curry",
    "Creamy Chickpea Coconut Curry",
    heroImages.curry,
    "Indian",
    ["dinner"],
    "medium",
    10,
    20,
    3,
    470,
    6.2,
    [
      { name: "Chickpeas", quantity: "1", unit: "can", category: "Proteins" },
      { name: "Coconut Milk", quantity: "1", unit: "can", category: "Pantry", substitutes: ["Coconut Milk Can"] },
      { name: "Onion", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Garlic", quantity: "3", unit: "cloves", category: "Vegetables" },
      { name: "Curry Powder", quantity: "1.5", unit: "tbsp", category: "Spices" },
      { name: "Rice", quantity: "1", unit: "cup", category: "Grains" },
      { name: "Spinach", quantity: "2", unit: "cups", category: "Vegetables" },
    ],
    [
      "Cook onion and garlic until soft and fragrant.",
      "Add curry powder, chickpeas, and coconut milk and simmer gently.",
      "Stir in spinach until wilted and serve over rice.",
    ],
    ["Bloom the curry powder briefly in the pan for fuller flavor.", "Simmer gently so the coconut milk stays silky.", "Lemon or lime at the end brightens the curry."],
    ["vegan", "comfort-food"],
    [],
    ["vegan", "gluten-free"]
  ),
  recipe(
    "shrimp-garlic-noodles",
    "Garlic Shrimp Noodles",
    heroImages.seafood,
    "Asian",
    ["dinner"],
    "easy",
    8,
    12,
    2,
    500,
    8.6,
    [
      { name: "Shrimp", quantity: "1", unit: "lb", category: "Proteins" },
      { name: "Noodles", quantity: "8", unit: "oz", category: "Grains", substitutes: ["Pasta"] },
      { name: "Garlic", quantity: "4", unit: "cloves", category: "Vegetables" },
      { name: "Soy Sauce", quantity: "2", unit: "tbsp", category: "Pantry" },
      { name: "Butter", quantity: "1", unit: "tbsp", category: "Dairy" },
      { name: "Green Onion", quantity: "2", unit: "stalks", category: "Herbs" },
    ],
    [
      "Cook noodles until just tender.",
      "Sear shrimp quickly with butter and garlic.",
      "Toss with noodles, soy sauce, and green onion until glossy.",
    ],
    ["Shrimp cooks very quickly, so pull it off as soon as it turns pink.", "Reserve a little noodle water for the sauce.", "A squeeze of lemon is great here."],
    ["seafood", "quick"],
    ["shellfish", "milk", "wheat"]
  ),
  recipe(
    "pesto-grilled-cheese",
    "Pesto Grilled Cheese",
    heroImages.sandwich,
    "Italian",
    ["lunch", "snack"],
    "easy",
    5,
    8,
    1,
    410,
    4.0,
    [
      { name: "Bread", quantity: "2", unit: "slices", category: "Grains" },
      { name: "Cheese", quantity: "2", unit: "slices", category: "Dairy", substitutes: ["Cheddar Cheese", "Mozzarella"] },
      { name: "Pesto", quantity: "1", unit: "tbsp", category: "Pantry", substitutes: ["Basil"] },
      { name: "Butter", quantity: "1", unit: "tsp", category: "Dairy" },
    ],
    [
      "Spread pesto inside the bread and add cheese.",
      "Butter the outside and toast until golden and melty.",
      "Serve with tomato slices or soup if you have them.",
    ],
    ["Low heat melts the cheese before the bread gets too dark.", "Use enough butter for an even crust.", "Let it rest 1 minute before slicing."],
    ["comfort-food", "vegetarian"],
    ["milk", "wheat"],
    ["vegetarian"]
  ),
  recipe(
    "tomato-soup-toast",
    "Roasty Tomato Soup",
    heroImages.soup,
    "American",
    ["lunch", "dinner"],
    "easy",
    8,
    18,
    3,
    290,
    4.4,
    [
      { name: "Canned Tomatoes", quantity: "1", unit: "can", category: "Canned", substitutes: ["Tomato Sauce"] },
      { name: "Onion", quantity: "1", unit: "whole", category: "Vegetables" },
      { name: "Garlic", quantity: "2", unit: "cloves", category: "Vegetables" },
      { name: "Heavy Cream", quantity: "0.25", unit: "cup", category: "Dairy", substitutes: ["Milk"] },
      { name: "Basil", quantity: "4", unit: "leaves", category: "Herbs" },
      { name: "Vegetable Broth", quantity: "1.5", unit: "cups", category: "Pantry" },
    ],
    [
      "Cook onion and garlic until sweet and translucent.",
      "Add tomatoes and broth and simmer for 15 minutes.",
      "Blend until smooth and finish with cream and basil.",
    ],
    ["Simmer long enough to soften the tomato acidity.", "Blend carefully and vent if the soup is very hot.", "Swirl cream in at the end for a silky finish."],
    ["soup", "vegetarian"],
    ["milk"],
    ["vegetarian"]
  ),
  recipe(
    "beef-taco-bowls",
    "Beef Taco Rice Bowls",
    heroImages.chicken,
    "Mexican",
    ["dinner"],
    "easy",
    10,
    14,
    3,
    560,
    7.9,
    [
      { name: "Ground Beef", quantity: "1", unit: "lb", category: "Proteins" },
      { name: "Rice", quantity: "1", unit: "cup", category: "Grains" },
      { name: "Corn", quantity: "1", unit: "cup", category: "Vegetables", substitutes: ["Corn Can"] },
      { name: "Tomato", quantity: "2", unit: "whole", category: "Vegetables" },
      { name: "Salsa", quantity: "0.5", unit: "cup", category: "Pantry" },
      { name: "Taco Seasoning", quantity: "1", unit: "tbsp", category: "Spices" },
    ],
    [
      "Cook rice until fluffy.",
      "Brown ground beef with taco seasoning.",
      "Build bowls with rice, beef, corn, tomato, and salsa.",
    ],
    ["Drain extra fat for a cleaner bowl.", "Warm the salsa slightly for extra flavor.", "Add avocado if you have one."],
    ["family", "meal-prep"]
  ),
  recipe(
    "yogurt-berry-parfait",
    "Berry Yogurt Parfait",
    heroImages.dessert,
    "American",
    ["breakfast", "snack", "dessert"],
    "easy",
    5,
    0,
    1,
    240,
    3.4,
    [
      { name: "Yogurt", quantity: "1", unit: "cup", category: "Dairy" },
      { name: "Strawberries", quantity: "0.5", unit: "cup", category: "Fruits", substitutes: ["Blueberries", "Frozen Berries"] },
      { name: "Blueberries", quantity: "0.5", unit: "cup", category: "Fruits" },
      { name: "Honey", quantity: "1", unit: "tbsp", category: "Pantry" },
      { name: "Oats", quantity: "0.25", unit: "cup", category: "Grains" },
    ],
    [
      "Layer yogurt with berries and oats in a glass.",
      "Drizzle with honey and serve chilled.",
    ],
    ["Use thick yogurt so the layers stay pretty.", "Toast oats for extra crunch if you like.", "Add banana to make it more filling."],
    ["snack", "healthy"],
    ["milk"],
    ["vegetarian", "gluten-free"]
  ),
  recipe(
    "premium-cod-herb",
    "Herb Crusted Cod with Lemon Butter",
    heroImages.seafood,
    "Mediterranean",
    ["dinner"],
    "medium",
    12,
    18,
    2,
    430,
    12.5,
    [
      { name: "Cod", quantity: "2", unit: "fillets", category: "Proteins" },
      { name: "Breadcrumbs", quantity: "0.5", unit: "cup", category: "Grains" },
      { name: "Parsley", quantity: "2", unit: "tbsp", category: "Herbs" },
      { name: "Lemon", quantity: "1", unit: "whole", category: "Fruits" },
      { name: "Butter", quantity: "2", unit: "tbsp", category: "Dairy" },
      { name: "Garlic", quantity: "2", unit: "cloves", category: "Vegetables" },
    ],
    [
      "Coat cod with herb breadcrumbs.",
      "Bake until the fish flakes easily.",
      "Spoon over lemon garlic butter before serving.",
    ],
    ["Press the crust gently so it adheres.", "Do not overbake the cod.", "Serve with greens for balance."],
    ["chef-special", "premium"],
    ["milk", "wheat", "fish"],
    [],
    true,
    "Crisp mineral water or citrus spritz"
  ),
  recipe(
    "premium-steak-peppers",
    "Peppercorn Steak Skillet",
    heroImages.chicken,
    "French",
    ["dinner"],
    "hard",
    15,
    16,
    2,
    610,
    15.2,
    [
      { name: "Beef Steak", quantity: "2", unit: "steaks", category: "Proteins" },
      { name: "Butter", quantity: "2", unit: "tbsp", category: "Dairy" },
      { name: "Garlic", quantity: "3", unit: "cloves", category: "Vegetables" },
      { name: "Black Pepper", quantity: "2", unit: "tsp", category: "Spices" },
      { name: "Mushrooms", quantity: "1", unit: "cup", category: "Vegetables" },
      { name: "Heavy Cream", quantity: "0.25", unit: "cup", category: "Dairy" },
    ],
    [
      "Sear steaks in a hot skillet to your preferred doneness.",
      "Cook mushrooms in the same pan and add garlic.",
      "Finish with butter, cracked pepper, and a splash of cream.",
    ],
    ["Temper the steak before cooking.", "Rest the meat before slicing.", "Use fresh cracked pepper for the best aroma."],
    ["chef-special", "premium"],
    ["milk"],
    [],
    true,
    "Bold sparkling tea or red grape spritzer"
  ),
  recipe(
    "premium-ricotta-toast",
    "Whipped Ricotta Peach Toast",
    heroImages.dessert,
    "Italian",
    ["breakfast", "dessert"],
    "easy",
    6,
    2,
    2,
    320,
    6.9,
    [
      { name: "Bread", quantity: "2", unit: "slices", category: "Grains" },
      { name: "Ricotta", quantity: "0.5", unit: "cup", category: "Dairy" },
      { name: "Peach", quantity: "1", unit: "whole", category: "Fruits" },
      { name: "Honey", quantity: "1", unit: "tbsp", category: "Pantry" },
      { name: "Mint", quantity: "4", unit: "leaves", category: "Herbs" },
    ],
    [
      "Toast bread until crisp.",
      "Whip ricotta until fluffy and spread generously.",
      "Top with peach slices, honey, and mint.",
    ],
    ["Use room-temperature ricotta for a silkier spread.", "Ripe peaches matter most here.", "Finish with flaky salt if you have it."],
    ["chef-special", "premium"],
    ["milk", "wheat"],
    ["vegetarian"],
    true
  ),
];

const cloneRecipe = (base: Recipe, index: number, titleSuffix: string, premium = false): Recipe => ({
  ...base,
  id: `${base.id}-${index}`,
  title: `${base.title} ${titleSuffix}`,
  popularity: Math.max(50, Math.min(99, base.popularity - 5 + (index % 10))),
  averageRating: Math.max(3.8, Math.min(4.9, base.averageRating - 0.1 + (index % 5) * 0.05)),
  totalReviews: base.totalReviews + index * 11,
  estimatedCost: Number((base.estimatedCost + (index % 4) * 0.6).toFixed(2)),
  calories: base.calories + (index % 3) * 20,
  nutrition: {
    ...base.nutrition,
    protein: base.nutrition.protein + (index % 4),
    carbs: base.nutrition.carbs + (index % 5),
    fat: base.nutrition.fat + (index % 3),
  },
  isPremiumOnly: premium || base.isPremiumOnly,
});

const seasonalSuffixes = [
  "— Cozy Edition",
  "— Weeknight Remix",
  "— Meal Prep Version",
  "— Fresh Market Style",
  "— Family Favorite",
  "— Quick Fix",
  "— Garden Bowl",
  "— Sunset Plate",
];

const generatedRecipes = recipes
  .slice(0, 12)
  .flatMap((base, baseIndex) =>
    seasonalSuffixes.slice(0, 4).map((suffix, suffixIndex) =>
      cloneRecipe(base, baseIndex * 10 + suffixIndex + 1, suffix, baseIndex % 5 === 0 && suffixIndex > 1)
    )
  );

export const recipeDatabase: Recipe[] = [...recipes, ...generatedRecipes];

export const tierRecipeLimits: Record<Tier, number> = {
  free: 5,
  common: 25,
  premium: 999,
};

export const tierScanLimits: Record<Tier, number> = {
  free: 3,
  common: 15,
  premium: 999,
};

export const tierRecipeViewLimits: Record<Tier, number> = {
  free: 3,
  common: 15,
  premium: 999,
};

export const tierSavedLimits: Record<Tier, number> = {
  free: 5,
  common: 50,
  premium: 999,
};

export const tierBadges: Record<Tier, string> = {
  free: "",
  common: "🥈",
  premium: "👑",
};

export const planCopy = {
  free: {
    name: "Free",
    price: "$0",
    perks: ["5 recipes per search", "3 scans/day", "3 recipe views/day", "5 saved recipes"],
  },
  common: {
    name: "Common",
    price: "$2.99/mo",
    perks: ["25 recipes per search", "15 scans/day", "meal planner", "no ads"],
  },
  premium: {
    name: "Premium",
    price: "$4.99/mo",
    perks: ["Unlimited scans", "receipt scan", "nutrition dashboard", "chef specials"],
  },
};

export const tierFeatures = [
  { feature: "Camera scans/day", free: "3", common: "15", premium: "Unlimited" },
  { feature: "Recipe results", free: "5", common: "25", premium: "Unlimited" },
  { feature: "Saved recipes", free: "5", common: "50", premium: "Unlimited" },
  { feature: "Barcode scanning", free: "Yes", common: "Yes", premium: "Yes" },
  { feature: "Receipt scanning", free: "No", common: "No", premium: "Yes" },
  { feature: "Meal planner", free: "No", common: "1 week", premium: "4 weeks + AI" },
  { feature: "Nutrition tracker", free: "No", common: "Basic", premium: "Advanced" },
  { feature: "Community", free: "No", common: "No", premium: "Yes" },
];

export const discoverSections = [
  {
    title: "Trending Recipes",
    subtitle: "Most cooked by the CookSnap community this week",
    recipeIds: ["chicken-rice-bowl", "banana-oat-pancakes", "broccoli-fried-rice", "chickpea-curry"],
  },
  {
    title: "Quick & Easy",
    subtitle: "Under 15 minutes",
    recipeIds: ["veggie-omelette", "avocado-toast-egg", "pesto-grilled-cheese", "yogurt-berry-parfait"],
  },
  {
    title: "Chef's Specials",
    subtitle: "Premium-only elevated dishes",
    recipeIds: ["premium-cod-herb", "premium-steak-peppers", "premium-ricotta-toast"],
  },
];
