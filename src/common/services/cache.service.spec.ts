import { CacheService } from './cache.service';

type MockCacheManager = {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    stores?: Array<{
        keys?: jest.Mock;
        mget?: jest.Mock;
    }>;
};

describe('CacheService', () => {
    let service: CacheService;
    let cacheManager: MockCacheManager;

    beforeEach(() => {
        cacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            stores: [],
        };
        service = new CacheService(cacheManager as never);
    });

    it('should parse cached JSON payload in get()', async () => {
        cacheManager.get.mockResolvedValueOnce('{"ok":true}');

        const result = await service.get<{ ok: boolean }>('cache:key');

        expect(cacheManager.get).toHaveBeenCalledWith('cache:key');
        expect(result).toEqual({ ok: true });
    });

    it('should call fetch function and persist result when cache is empty in getOrSet()', async () => {
        cacheManager.get.mockResolvedValueOnce(null);
        const fetchFn = jest.fn().mockResolvedValue({ id: 'a1' });

        const result = await service.getOrSet('cache:key', fetchFn, 1000);

        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(cacheManager.set).toHaveBeenCalledWith('cache:key', '{"id":"a1"}', 1000);
        expect(result).toEqual({ id: 'a1' });
    });

    it('should delete all keys matching pattern in delByPattern()', async () => {
        const keys = jest.fn().mockResolvedValue(['cache:a', 'cache:b']);
        cacheManager.stores = [{ keys }];

        await service.delByPattern('cache:*');

        expect(keys).toHaveBeenCalledWith('cache:*');
        expect(cacheManager.del).toHaveBeenNthCalledWith(1, 'cache:a');
        expect(cacheManager.del).toHaveBeenNthCalledWith(2, 'cache:b');
    });
});
