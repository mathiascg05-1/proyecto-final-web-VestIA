// Clave para guardar en el navegador
const PROFILE_KEY = 'vestla_user_profile';

// Estado inicial
let userProfile = {
    name: '',
    email: '',
    defaultSize: ''
};

// 1. Cargar datos al iniciar
export const loadProfile = () => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
        userProfile = JSON.parse(saved);
        updateUI(); // Llenar los campos del modal
        updateHeaderGreeting(); // Saludar al usuario
    }
};

// 2. Guardar datos
const saveProfileData = () => {
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const sizeInput = document.getElementById('profile-size');

    userProfile = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        defaultSize: sizeInput.value
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    updateHeaderGreeting();

    // Feedback visual
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Perfil actualizado',
            text: 'Tus preferencias se han guardado.',
            timer: 1500,
            showConfirmButton: false
        });
    }
    
    // Cerrar modal
    const modalEl = document.getElementById('profileModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
};

// 3. Actualizar la interfaz (Inputs del formulario)
const updateUI = () => {
    document.getElementById('profile-name').value = userProfile.name || '';
    document.getElementById('profile-email').value = userProfile.email || '';
    document.getElementById('profile-size').value = userProfile.defaultSize || '';
};

// 4. Pequeño detalle: Saludar en la consola o header (opcional)
const updateHeaderGreeting = () => {
    if (userProfile.name) {
        console.log(`Usuario activo: ${userProfile.name}`);
        // Si quisieras poner "Hola, Juan" en el header, lo harías aquí.
    }
};

// --- EXPORTABLES ---

// Getter para que otros archivos sepan la talla del usuario
export const getUserDefaultSize = () => userProfile.defaultSize;

// Setup principal
export const setupProfileListeners = () => {
    loadProfile(); // Cargar datos guardados

    // Botón abrir modal
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('profileModal'));
            modal.show();
        });
    }

    // Botón guardar
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfileData);
    }
};