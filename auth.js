// ===== Authentication Manager =====
const AuthManager = {
    // Validate username
    validateUsername(username) {
        if (!username || username.length < 3) {
            return { valid: false, message: 'Username must be at least 3 characters' };
        }
        if (/^[0-9@_]/.test(username)) {
            return { valid: false, message: 'Username cannot start with number, @, or _' };
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
        }
        return { valid: true };
    },

    // Validate password
    validatePassword(password) {
        if (!password || password.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters' };
        }
        if (password.length > 12) {
            return { valid: false, message: 'Password must be maximum 12 characters' };
        }
        return { valid: true };
    },

    // Sign up
    signup(username, password, email = '') {
        const usernameValidation = this.validateUsername(username);
        if (!usernameValidation.valid) {
            return { success: false, message: usernameValidation.message };
        }

        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.valid) {
            return { success: false, message: passwordValidation.message };
        }

        // Check if user already exists
        if (StorageManager.getUser(username)) {
            return { success: false, message: 'Username already exists' };
        }

        // Create new user
        const user = {
            username,
            password, // In real app, this should be hashed
            email,
            createdAt: new Date().toISOString()
        };

        StorageManager.addUser(user);
        StorageManager.setCurrentUser(username);
        
        return { success: true, message: 'Account created successfully!' };
    },

    // Login
    login(username, password) {
        const user = StorageManager.getUser(username);
        
        if (!user) {
            return { success: false, message: 'Username not found' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Incorrect password' };
        }

        StorageManager.setCurrentUser(username);
        return { success: true, message: 'Login successful!' };
    },

    // Logout
    logout() {
        StorageManager.logout();
        return { success: true, message: 'Logged out successfully' };
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!StorageManager.getCurrentUser();
    },

    // Get current user
    getCurrentUser() {
        return StorageManager.getCurrentUser();
    }
};

