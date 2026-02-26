import { MetiersService } from './metiers.service';

describe('MetiersService', () => {
    const prisma = {
        metier: {
            findMany: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
        },
        categorieMetier: {
            findUnique: jest.fn(),
        },
    };

    const cacheService = {
        getAllMetiers: jest.fn(),
        setAllMetiers: jest.fn(),
        invalidateMetiers: jest.fn(),
        invalidateCategories: jest.fn(),
    };

    let service: MetiersService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new MetiersService(prisma as never, cacheService as never);
    });

    it('returns cached metiers when no filter is provided', async () => {
        const cached = [{ id: 'met-1', nom: 'Plombier' }];
        cacheService.getAllMetiers.mockResolvedValueOnce(cached);

        const result = await service.findAll();

        expect(result).toEqual(cached);
        expect(prisma.metier.findMany).not.toHaveBeenCalled();
    });

    it('queries database and caches metiers when cache is empty', async () => {
        const rows = [{ id: 'met-2', nom: 'Electricien' }];
        cacheService.getAllMetiers.mockResolvedValueOnce(null);
        prisma.metier.findMany.mockResolvedValueOnce(rows);

        const result = await service.findAll();

        expect(prisma.metier.findMany).toHaveBeenCalledTimes(1);
        expect(cacheService.setAllMetiers).toHaveBeenCalledWith(rows, false);
        expect(result).toEqual(rows);
    });
});
