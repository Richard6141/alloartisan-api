import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { contientContact } from '../utils/anti-contact.util';

/**
 * Anti-désintermédiation : refuse un champ libre (bio, slogan, description…)
 * contenant une coordonnée (numéro, email, réseau). Force à garder l'échange
 * sur la plateforme jusqu'au paiement.
 */
@ValidatorConstraint({ name: 'sansContact', async: false })
export class SansContactConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        if (typeof value !== 'string') return true; // laissé aux autres règles
        return !contientContact(value);
    }

    defaultMessage(): string {
        return 'Ce champ ne doit pas contenir de numéro, e-mail ou réseau. Les échanges de contact passent par la messagerie AlloArtisan.';
    }
}

export function SansContact(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: SansContactConstraint,
        });
    };
}
