import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface CacheOptions {
    ttl?: number; // en millisecondes
}

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    // TTL par defaut pour differents types de donnees
    static readonly TTL = {
        CATEGORIES: 24 * 60 * 60 * 1000, // 24 heures
        METIERS: 24 * 60 * 60 * 1000, // 24 heures
        METIERS_BY_CATEGORY: 12 * 60 * 60 * 1000, // 12 heures
        ARTISAN_PROFILE: 5 * 60 * 1000, // 5 minutes
        SEARCH_RESULTS: 2 * 60 * 1000, // 2 minutes
        STATS: 15 * 60 * 1000, // 15 minutes
    };

    // Prefixes de cles
    private readonly PREFIX = {
        CATEGORIES: 'cache:categories',
        METIERS: 'cache:metiers',
        METIERS_BY_CATEGORY: 'cache:metiers:cat:',
        ARTISAN: 'cache:artisan:',
        SEARCH: 'cache:search:',
        STATS: 'cache:stats:',
    };

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    // ==================== CATEGORIES ====================

    async getCategories<T>(): Promise<T | null> {
        return this.get<T>(this.PREFIX.CATEGORIES);
    }

    async setCategories<T>(data: T): Promise<void> {
        await this.set(this.PREFIX.CATEGORIES, data, CacheService.TTL.CATEGORIES);
    }

    async invalidateCategories(): Promise<void> {
        await this.del(this.PREFIX.CATEGORIES);
        this.logger.debug('Categories cache invalidated');
    }

    // ==================== METIERS ====================

    async getAllMetiers<T>(): Promise<T | null> {
        return this.get<T>(this.PREFIX.METIERS);
    }

    async setAllMetiers<T>(data: T): Promise<void> {
        await this.set(this.PREFIX.METIERS, data, CacheService.TTL.METIERS);
    }

    async getMetiersByCategory<T>(categoryId: string): Promise<T | null> {
        return this.get<T>(`${this.PREFIX.METIERS_BY_CATEGORY}${categoryId}`);
    }

    async setMetiersByCategory<T>(categoryId: string, data: T): Promise<void> {
        await this.set(
            `${this.PREFIX.METIERS_BY_CATEGORY}${categoryId}`,
            data,
            CacheService.TTL.METIERS_BY_CATEGORY,
        );
    }

    async invalidateMetiers(): Promise<void> {
        await this.del(this.PREFIX.METIERS);
        await this.delByPattern(`${this.PREFIX.METIERS_BY_CATEGORY}*`);
        this.logger.debug('Metiers cache invalidated');
    }

    // ==================== ARTISAN ====================

    async getArtisanProfile<T>(artisanId: string): Promise<T | null> {
        return this.get<T>(`${this.PREFIX.ARTISAN}${artisanId}`);
    }

    async setArtisanProfile<T>(artisanId: string, data: T): Promise<void> {
        await this.set(
            `${this.PREFIX.ARTISAN}${artisanId}`,
            data,
            CacheService.TTL.ARTISAN_PROFILE,
        );
    }

    async invalidateArtisanProfile(artisanId: string): Promise<void> {
        await this.del(`${this.PREFIX.ARTISAN}${artisanId}`);
    }

    // ==================== SEARCH RESULTS ====================

    async getSearchResults<T>(searchHash: string): Promise<T | null> {
        return this.get<T>(`${this.PREFIX.SEARCH}${searchHash}`);
    }

    async setSearchResults<T>(searchHash: string, data: T): Promise<void> {
        await this.set(
            `${this.PREFIX.SEARCH}${searchHash}`,
            data,
            CacheService.TTL.SEARCH_RESULTS,
        );
    }

    // ==================== STATS ====================

    async getStats<T>(key: string): Promise<T | null> {
        return this.get<T>(`${this.PREFIX.STATS}${key}`);
    }

    async setStats<T>(key: string, data: T): Promise<void> {
        await this.set(`${this.PREFIX.STATS}${key}`, data, CacheService.TTL.STATS);
    }

    // ==================== UTILITAIRES GENERIQUES ====================

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.cacheManager.get<string>(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            this.logger.warn(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set<T>(key: string, data: T, ttl: number): Promise<void> {
        try {
            await this.cacheManager.set(key, JSON.stringify(data), ttl);
        } catch (error) {
            this.logger.warn(`Cache set error for key ${key}:`, error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.cacheManager.del(key);
        } catch (error) {
            this.logger.warn(`Cache del error for key ${key}:`, error);
        }
    }

    async delByPattern(pattern: string): Promise<void> {
        try {
            // cache-manager v7+ utilise 'stores' au lieu de 'store'
            const stores = (this.cacheManager as unknown as { stores?: Array<{ keys?: (pattern: string) => Promise<string[]> }> }).stores;
            if (stores && stores.length > 0 && stores[0].keys) {
                const keys = await stores[0].keys(pattern);
                for (const key of keys) {
                    await this.cacheManager.del(key);
                }
            }
        } catch (error) {
            this.logger.warn(`Cache delByPattern error for pattern ${pattern}:`, error);
        }
    }

    /**
     * Recupere plusieurs cles en une seule requete (optimisation)
     */
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        try {
            // cache-manager v7+ utilise 'stores' au lieu de 'store'
            const stores = (this.cacheManager as unknown as { stores?: Array<{ mget?: (...keys: string[]) => Promise<(string | null)[]> }> }).stores;
            if (stores && stores.length > 0 && stores[0].mget) {
                const results = await stores[0].mget(...keys);
                return results.map((r) => (r ? (JSON.parse(r) as T) : null));
            }
            // Fallback: requetes individuelles
            return Promise.all(keys.map((k) => this.get<T>(k)));
        } catch (error) {
            this.logger.warn('Cache mget error:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Definit plusieurs cles en une seule requete
     */
    async mset<T>(entries: { key: string; value: T; ttl: number }[]): Promise<void> {
        try {
            await Promise.all(entries.map((e) => this.set(e.key, e.value, e.ttl)));
        } catch (error) {
            this.logger.warn('Cache mset error:', error);
        }
    }

    /**
     * Pattern Cache-Aside: recupere du cache ou execute la fonction et cache le resultat
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const data = await fetchFn();
        await this.set(key, data, ttl);
        return data;
    }
}
