// ================================
// app.js corrigé
// ================================
console.log("APP JS CHARGÉ");

const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cache = {};
let currentCategory = null;

document.addEventListener("DOMContentLoaded", () => {
    // ======= INITIALISATION =======
    initMainMenu();
    initDetailListener();
    initBackButton();
});

// ================================
// Affiche la catégorie sélectionnée
// ================================
async function showCategory(category) {
    currentCategory = category;

    window.scrollTo({ top: 0, behavior: "smooth" });

    const container = document.getElementById("menu");
    container.innerHTML = "";

    // Bouton actif
    document.querySelectorAll("#navigation button").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.toLowerCase() === category);
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
        .eq("available", true);

    if (error) {
        console.error("Erreur Supabase:", error);
        container.innerHTML = "<p>Erreur lors du chargement de la carte.</p>";
        return;
    }

    const grouped = {};
    data.forEach(dish => {
        const sub = dish.subcategory || "Autres";
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

    Object.keys(grouped).forEach(sub => {
        if (sub !== "Autres") {
            const h3 = document.createElement("h3");
            h3.textContent = sub;
            h3.style.textAlign = "center";
            h3.style.margin = "20px 0 10px";
            container.appendChild(h3);
        }

        grouped[sub].forEach(dish => {
            const card = document.createElement("div");
            card.className = "card";

            // Image
            if (dish.image_url) {
                const img = document.createElement("img");
                img.src = dish.image_url;
                img.alt = dish.name;
                img.loading = "lazy";
                img.className = "dish-image";
                img.style.cursor = "pointer";
                img.addEventListener("click", e => {
                    e.stopPropagation();
                    showFullscreenImage(dish.image_url);
                });
                card.appendChild(img);
            }

            // Nom et prix
            const h3Name = document.createElement("h3");
            h3Name.textContent = dish.name;
            const pPrice = document.createElement("p");
            pPrice.textContent = dish.price + " €";

            card.appendChild(h3Name);
            card.appendChild(pPrice);

            // Clic sur la carte = détail
            card.addEventListener("click", () => showDetail(dish));

            container.appendChild(card);
        });
    });
}

// ================================
// Image plein écran
// ================================
function showFullscreenImage(src) {
    const viewer = document.createElement("div");
    viewer.id = "image-viewer";
    viewer.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.9); display:flex;
        align-items:center; justify-content:center; z-index:9999;
    `;

    const img = document.createElement("img");
    img.src = src;
    img.style.cssText = "max-width:95%; max-height:95%; border-radius:10px;";
    viewer.appendChild(img);

    viewer.addEventListener("click", () => viewer.remove());

    document.body.appendChild(viewer);
}

// ================================
// Fiche détail du plat
// ================================
function showDetail(dish) {
    const detail = document.getElementById("dish-detail");
    if (!detail) return;

    detail.classList.remove("hidden");
    document.getElementById("detail-image").src = dish.image_url || "";
    document.getElementById("detail-name").textContent = dish.name || "";
    document.getElementById("detail-price").textContent = dish.price + " €";
    document.getElementById("detail-description").textContent = dish.description || "";
    document.getElementById("detail-ingredients").textContent = dish.ingredients || "";
    document.getElementById("detail-allergens").textContent = dish.allergens || "";
}

// ================================
// Écoute fermeture fiche détail
// ================================
function initDetailListener() {
    const detail = document.getElementById("dish-detail");
    if (!detail) return;

    detail.addEventListener("click", () => detail.classList.add("hidden"));
    detail.querySelectorAll("img,h2,p").forEach(el => {
        el.addEventListener("click", e => e.stopPropagation());
    });
}

// ================================
// Menu principal
// ================================
function initMainMenu() {
    const nav = document.getElementById("navigation");
    if (!nav) return;

    nav.innerHTML = "";

    const categories = ["entree", "plat", "dessert", "boisson"];
    categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.toUpperCase();
        btn.addEventListener("click", () => showCategory(cat));
        nav.appendChild(btn);
    });

    document.getElementById("back-button")?.classList.add("hidden");
}

// ================================
// Bouton retour
// ================================
function initBackButton() {
    const backBtn = document.getElementById("back-button");
    if (!backBtn) return;

    backBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        initMainMenu();
        document.getElementById("menu").innerHTML = "";
    });
}
