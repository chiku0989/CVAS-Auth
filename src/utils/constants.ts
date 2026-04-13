export const ARMY_RANKS = [
    "SEPOY", "LANCE NAIK", "NAIK", "HAVILDAR", "NAIB SUBEDAR", "SUBEDAR", "SUBEDAR MAJOR",
    "LIEUTENANT", "CAPTAIN", "MAJOR", "LIEUTENANT COLONEL", "COLONEL", "BRIGADIER", 
    "MAJOR GENERAL", "LIEUTENANT GENERAL", "GENERAL"
] as const;

export enum UserRole {
    SUPER_ADMIN = "SUPER ADMIN",
    CHECKPOINT_ADMIN = "CHECKPOINT ADMIN",
    WORKER = 'WORKER'
}
const ALLOWED_REGISTRATION_ROLES = Object.values(UserRole)
    .filter(role => role !== UserRole.SUPER_ADMIN)
    .join('|');


export const CVAS_PATTERNS = {
    SERVICE_NUMBER: {
        regex: /^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]+$/,
        message: "Service number must be alphanumeric (contain both letters and numbers)."
    },
    RANK: {
        regex: new RegExp(`^(${ARMY_RANKS.join('|')})$`),
        message: "Invalid Army Rank. Please select a valid rank from the list."
    },
    PASSWORD: {
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
        message: "Password must be 8+ chars with uppercase, lowercase, number, and special character [ @$!%*?&# ]"
    },
    ROLE: {
        regex: new RegExp(`^(${Object.values(UserRole).join('|')})$`),
        message: "Invalid User Role provided."
    },

    REGISTRATION_ROLES : {
        regex : new RegExp(ALLOWED_REGISTRATION_ROLES),
        message : "Cannot Register as Super Admin."
    }
};