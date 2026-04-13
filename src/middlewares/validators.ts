import { type Request, type Response, type NextFunction } from "express";
import response from "../utils/response.js";


interface ValidationConfig {
    [key: string]: {
        regex: RegExp;
        message: string;
    };
}

export const jsonValidatorMiddler = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.body || typeof req.body !== "object") {
            return response(
                res,
                false,
                `Invalid or missing JSON body ${fields}`,
                { fields },
                400
            );
        }

        const body = req.body;
        const missingFields: string[] = [];

        for (const field of fields) {
            const value = body[field];

            if (
                !(field in body) ||
                value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === "")
            ) {
                missingFields.push(field);
            }
        }
        if (missingFields.length > 0) {
            return response(
                res,
                false,
                `Missing required properties: ${missingFields.join(", ")}`,
                { missingFields },
                400
            );
        }

        next();
    };
};



export const patternValidator = (config: ValidationConfig) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const body = req.body;
        const errors: { field: string; message: string }[] = [];

        const fieldsToUppercase = ["rank", "name", "serviceNumber", "role"];

        for (const [field, rule] of Object.entries(config)) {
            let value = body[field];

            if (value && typeof value === 'string') {
                
                value = value.trim();

                if (fieldsToUppercase.includes(field)) {
                    value = value.toUpperCase();
                    
                    req.body[field] = value;
                }

                if (!rule.regex.test(value)) {
                    errors.push({ field, message: rule.message });
                }
            }
        }

        if (errors.length > 0) {
            return response(
                res,
                false,
                "Pattern validation failed",
                { validationErrors: errors },
                400
            );
        }

        next();
    };
};

// export const queryValidatorMiddler = (fields: string[]) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         const query = req.query;
//         const missingFields: string[] = [];

//         for (const field of fields) {
//             const value = query[field];
//             if (!(field in query) || value === undefined || value === null || (typeof value === 'string' && value.trim() === "")) {
//                 missingFields.push(field);
//             }
//         }

//         if (missingFields.length > 0) {
//             return response(res, false, `Missing query params: ${missingFields.join(", ")}`, { missingFields }, 400);
//         }

//         next();
//     };
// };


// export const formValidatorMiddler = (fields: string[], requiredFileKey?: string) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         const body = req.body;
//         const missingFields: string[] = [];

       
//         for (const field of fields) {
//             const value = body[field];
//             if (!(field in body) || value === undefined || (typeof value === 'string' && value.trim() === "")) {
//                 missingFields.push(field);
//             }
//         }


//         if (requiredFileKey && !req.file) {
//             missingFields.push(requiredFileKey);
//         }

//         if (missingFields.length > 0) {
//             return response(
//                 res, 
//                 false, 
//                 `Missing form data or file: ${missingFields.join(", ")}`, 
//                 { missingFields }, 
//                 400
//             );
//         }

//         next();
//     };
// };