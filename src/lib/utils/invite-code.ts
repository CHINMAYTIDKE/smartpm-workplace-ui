// Generate a unique 6-character alphanumeric invite code
export function generateInviteCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }

    return code;
}

// Validate invite code format (6 alphanumeric characters)
export function validateInviteCode(code: string): boolean {
    const regex = /^[A-Z0-9]{6}$/;
    return regex.test(code);
}
