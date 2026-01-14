// js/profile.js

const PROFILE_KEY = 'vestla_user_profile';

let userProfile = {
    name: '',
    email: '',
    clothingSize: '', // Ropa (S, M, L...)
    shoeSize: ''      // Zapatos (36, 37...)
};

// 1. Cargar datos
export const loadProfile = () => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
        userProfile = { ...userProfile, ...JSON.parse(saved) };
        updateUI();
        updateHeaderGreeting();
    }
};

// 2. Guardar datos
const saveProfileData = () => {
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const clothesInput = document.getElementById('profile-size-clothes');
    const shoesInput = document.getElementById('profile-size-shoes');

    userProfile = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        clothingSize: clothesInput.value,
        shoeSize: shoesInput.value
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    updateHeaderGreeting();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: '¡Preferencias Guardadas!',
            text: 'Tus tallas se aplicarán automáticamente.',
            timer: 1500,
            showConfirmButton: false,
            confirmButtonColor: '#2c2c2c'
        });
    }
    
    const modalEl = document.getElementById('profileModal');
    if (modalEl && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
};

const updateUI = () => {
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const clothesEl = document.getElementById('profile-size-clothes');
    const shoesEl = document.getElementById('profile-size-shoes');

    if(nameEl) nameEl.value = userProfile.name || '';
    if(emailEl) emailEl.value = userProfile.email || '';
    if(clothesEl) clothesEl.value = userProfile.clothingSize || '';
    if(shoesEl) shoesEl.value = userProfile.shoeSize || '';
};

const updateHeaderGreeting = () => {
    if (userProfile.name) {
        console.log(`Hola, ${userProfile.name}`);
    }
};

// --- FUNCIÓN INTELIGENTE CORREGIDA ---
export const getPreferredSize = (category) => {
    // Listas estrictas de categorías
    const shoeCats = ['mens-shoes', 'womens-shoes'];
    const clothingCats = ['tops', 'womens-dresses', 'mens-shirts'];

    // 1. Es Zapato -> Devuelve talla de zapato (ej: 42)
    if (shoeCats.includes(category)) {
        return userProfile.shoeSize; 
    }
    
    // 2. Es Ropa -> Devuelve talla de ropa (ej: M)
    if (clothingCats.includes(category)) {
        return userProfile.clothingSize; 
    }

    // 3. Es Maquillaje, Tecnología, Joyas, etc. -> Devuelve "Única"
    return 'Única';
};

export const setupProfileListeners = () => {
    loadProfile();
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfileData);
};