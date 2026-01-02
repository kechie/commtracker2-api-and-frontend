export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const validateRequiredFields = (fields) => {
    return fields.every(field => field !== undefined && field !== null && field !== '');
};

export const validateUserInput = (userData) => {
    const { email, password } = userData;
    const errors = [];

    if (!validateRequiredFields([email, password])) {
        errors.push('Email and password are required.');
    }

    if (email && !validateEmail(email)) {
        errors.push('Invalid email format.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};