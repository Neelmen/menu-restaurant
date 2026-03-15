const SUPABASE_URL = "https://oaxpofkmtrudriyrbxvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0bTuLBKIo_-tSVK_XfKYg_LScZ_5EY";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("APP JS CHARGÉ");

// S’assure que le DOM est prêt
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM prêt");
  document.getElementById("admin-panel")?.style.setProperty("display", "none");
  document.getElementById("login-section")?.style.setProperty("display", "block");
  checkSession();
});

// ======= SESSION =======
async function checkSession() {
  const { data } = await client.auth.getSession();
  console.log("Session :", data.session);

  if (data.session) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("admin-panel")?.style.setProperty("display", "block");
    loadDishes();
  } else {
    console.log("Pas de session active, chargement test des plats quand même...");
    loadDishes(); // Pour test sur PC sans session
  }
}

async function loginAdmin() {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById("login-message").innerText = "Erreur : " + error.message;
  } else {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadDishes();
  }
}

async function logoutAdmin() {
  await client.auth.signOut();
  location.reload();
}

// ======= UPLOAD IMAGE =======
async function uploadImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = Date.now() + "." + fileExt;

  const { error } = await client.storage
    .from("dishes-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) {
    alert("Erreur upload : " + error.message);
    return null;
  }

  const { data } = client.storage.from("dishes-images").getPublicUrl(fileName);
  return data.publicUrl;
}

// ======= LOAD DISHES =======
async function loadDishes() {
  const container = document.getElementById("dish-list");
  if (!container) {
    console.error("#dish-list introuvable dans le DOM !");
    return;
  }

  try {
    const { data, error } = await client
      .from("dishes")
      .select("*")
      .order("available", { ascending: false })
      .order("category", { ascending: true })
      .order("subcategory", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    console.log("Plats récupérés :", data);

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>Aucun plat trouvé.</p>";
      return;
    }

    data.forEach(dish => {
      console.log("Injection plat :", dish.name, dish.image_url);

      const div = document.createElement("div");
      div.style.border = "1px solid #ddd";
      div.style.borderRadius = "12px";
      div.style.padding = "15px";
      div.style.marginBottom = "20px";
      div.style.background = dish.available ? "#fff" : "#ffe5e5";
      div.style.textAlign = "center";

      div.innerHTML = `
        <div style="margin-bottom:10px;">
          <strong>${dish.name}</strong> - ${dish.price}€
        </div>
        <div style="margin-bottom:10px;">
          ${dish.category} ${dish.subcategory ? "- " + dish.subcategory : ""}
        </div>
        <div style="margin-bottom:10px;">${dish.description || ""}</div>
        <div style="margin-bottom:10px;"><i>${dish.ingredients || ""}</i></div>
        ${
          dish.image_url
            ? `<img src="${dish.image_url}" alt="${dish.name}" style="width:220px; max-width:100%; border-radius:10px; display:block; margin:0 auto;">`
            : "<p style='color:#999'>Pas d'image</p>"
        }
        <div style="margin-top:12px;">
          <button onclick="toggleDish('${dish.id}', ${dish.available})">
            ${dish.available ? "Désactiver" : "Activer"}
          </button>
          <button onclick="editDish('${dish.id}')">Modifier</button>
          <button onclick="deleteDish('${dish.id}')">Supprimer</button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Erreur loadDishes :", err);
    container.innerHTML = "<p>Erreur lors du chargement des plats.</p>";
  }
}

// ======= ACTIONS =======
async function toggleDish(id, status) {
  await client.from("dishes").update({ available: !status }).eq("id", id);
  loadDishes();
}

async function deleteDish(id) {
  const confirmDelete = confirm("Supprimer ce plat et son image ?");
  if (!confirmDelete) return;

  try {
    const { data: dishData, error: fetchError } = await client
      .from("dishes")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const imageUrl = dishData.image_url;

    if (imageUrl) {
      const url = new URL(imageUrl);
      const path = url.pathname;
      const prefix = "/storage/v1/object/public/dishes-images/";
      const filePath = path.replace(prefix, "");

      const { error: removeError } = await client.storage
        .from("dishes-images")
        .remove([filePath]);

      if (removeError) console.warn("Erreur suppression image:", removeError.message);
    }

    const { error: deleteError } = await client.from("dishes").delete().eq("id", id);
    if (deleteError) throw deleteError;

    loadDishes();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
}

function editDish(id) {
  console.log("Modifier plat :", id);
}

// ======= FORMULAIRE AJOUT =======
document.getElementById("dish-form")?.addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value;
  const subcategory = document.getElementById("subcategory").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const description = document.getElementById("description").value.trim();
  const ingredients = document.getElementById("ingredients").value.trim();
  const available = document.getElementById("available").checked;
  const file = document.getElementById("image_file").files[0];

  let image_url = "";

  if (file) {
    image_url = await uploadImage(file);
  }

  const { error } = await client.from("dishes").insert([{
    name,
    category,
    subcategory,
    price,
    description,
    ingredients,
    available,
    image_url
  }]);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  document.getElementById("dish-form").reset();
  document.getElementById("image-preview")?.innerHTML = "";
  loadDishes();
});
