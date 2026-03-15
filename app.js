// ================================
// app.js - Menu digital optimisé
// ================================
console.log("APP JS CHARGÉ");

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cache = {};
let currentCategory = null;

// ================================
// Helpers image
// ================================
function createDishImage(src, altText = "Image du plat") {
    if (!src || typeof src !== "string" || !src.trim()) {
        return null;
    }

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src.trim();
    img.alt = altText;
    img.className = "dish-image";

    img.onerror = function () {
        console.warn("Image introuvable ou non chargeable :", src);
        this.style.display = "none";
    };

    img.addEventListener("click", (e) => {
        e.stopPropagation();
        showFullscreenImage(src.trim());
    });

    return img;
}

// ================================
// Affiche la catégorie sélectionnée
// ================================
async function showCategory(category) {
    currentCategory = category;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    const container = document.getElementById("menu");
    container.innerHTML = "";

    const navButtons = document.querySelectorAll("#navigation button");
    navButtons.forEach(btn => {
        btn.classList.remove("active");
        if (btn.textContent.toLowerCase() === category) {
            btn.classList.add("active");
        }
    });

    document.getElementById("back-button").classList.remove("hidden");

    if (cache[category]) {
        displayCategory(cache[category]);
        return;
    }

    const { data, error } = await client
        .from("dishes")
        .select("*")
        .eq("category", category)
        .eq("available", true)
        .order("subcategory", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        console.error("Erreur Supabase:", error);
        container.innerHTML = "<p>Erreur lors du chargement de la carte.</p>";
        return;
    }

    const grouped = {};
    data.forEach(dish => {
        const sub = dish.subcategory && dish.subcategory.trim()
            ? dish.subcategory.trim()
            : "Autres";

        if (!grouped[sub]) grouped[sub] = [];
        grouped[sub].push(dish);
    });

    cache[category] = grouped;
    displayCategory(grouped);
}

// ================================
// Affiche les plats
// ================================
function displayCategory(grouped) {
    const container = document.getElementById("menu");
    container.innerHTML = "";

    const sortedSubs = Object.keys(grouped).sort((a, b) => {
        if (a === "Autres") return 1;
        if (b === "Autres") return -1;
        return a.localeCompare(b, "fr", { sensitivity: "base" });
    });

    sortedSubs.forEach(sub => {
        if (sub !== "Autres") {
            const subTitle = document.createElement("h3");
            subTitle.textContent = sub;
            subTitle.style.textAlign = "center";
            subTitle.style.margin = "20px 0 10px";
            container.appendChild(subTitle);
        }

        grouped[sub].forEach(dish => {
            const card = document.createElement("div");
            card.className = "card";

            const img = createDishImage(dish.image_url, dish.name);

            const nameEl = document.createElement("h3");
            nameEl.textContent = dish.name;

            const priceEl = document.createElement("p");
            priceEl.textContent = dish.price + " €";

            if (img) {
                card.appendChild(img);
            }

            card.appendChild(nameEl);
            card.appendChild(priceEl);

            card.addEventListener("click", () => showDetail(dish));

            container.appendChild(card);
        });
    });
}

// ================================
// Image plein écran
// ================================
function showFullscreenImage(src) {
    if (!src) return;

    const viewer = document.createElement("div");
    viewer.id = "image-viewer";
    viewer.style.position = "fixed";
    viewer.style.top = "0";
    viewer.style.left = "0";
    viewer.style.width = "100%";
    viewer.style.height = "100%";
    viewer.style.background = "rgba(0,0,0,0.9)";
    viewer.style.display = "flex";
    viewer.style.alignItems = "center";
    viewer.style.justifyContent = "center";
    viewer.style.zIndex = "9999";

    const img = document.createElement("img");
    img.src = src;
    img.style.maxWidth = "95%";
    img.style.maxHeight = "95%";
    img.style.borderRadius = "10px";

    img.onerror = function () {
        console.warn("Impossible d'afficher l'image en plein écran :", src);
        viewer.remove();
    };

    viewer.appendChild(img);

    viewer.addEventListener("click", () => {
        viewer.remove();
    });

    document.body.appendChild(viewer);
}

// ================================
// Fiche détail du plat
// ================================
function showDetail(dish) {
    const detail = document.getElementById("dish-detail");
    detail.classList.remove("hidden");

    const detailImage = document.getElementById("detail-image");
    const detailName = document.getElementById("detail-name");
    const detailPrice = document.getElementById("detail-price");
    const detailDescription = document.getElementById("detail-description");
    const detailIngredients = document.getElementById("detail-ingredients");
    const detailAllergens = document.getElementById("detail-allergens");

    detailName.textContent = dish.name || "";
    detailPrice.textContent = (dish.price ?? "") + " €";
    detailDescription.textContent = dish.description || "";
    detailIngredients.textContent = dish.ingredients || "";
    detailAllergens.textContent = dish.allergens || "";

    if (dish.image_url && dish.image_url.trim()) {
        detailImage.src = dish.image_url.trim();
        detailImage.style.display = "block";

        detailImage.onerror = function () {
            console.warn("Image détail non chargeable :", dish.image_url);
            detailImage.style.display = "none";
        };
    } else {
        detailImage.removeAttribute("src");
        detailImage.style.display = "none";
    }
}

// ================================
// Fermeture fiche détail
// ================================
document.addEventListener("DOMContentLoaded", () => {
    const detail = document.getElementById("dish-detail");

    if (detail) {
        detail.addEventListener("click", () => detail.classList.add("hidden"));

        detail.querySelectorAll("img, h2, p").forEach(el => {
            el.addEventListener("click", e => e.stopPropagation());
        });
    }
});

// ================================
// Menu principal
// ================================
function initMainMenu() {
    const nav = document.getElementById("navigation");
    nav.innerHTML = "";

    const categories = ["entree", "plat", "dessert", "boisson"];

    categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.toUpperCase();
        btn.addEventListener("click", () => showCategory(cat));
        nav.appendChild(btn);
    });

    document.getElementById("back-button").classList.add("hidden");
}

// ================================
// Bouton retour
// ================================
document.getElementById("back-button").addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    initMainMenu();
    document.getElementById("menu").innerHTML = "";
});

// ================================
// Lancement
// ================================
document.addEventListener("DOMContentLoaded", () => {
    initMainMenu();
});
