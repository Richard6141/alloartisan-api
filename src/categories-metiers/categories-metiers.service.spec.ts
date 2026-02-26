import { CategoriesMetiersService } from './categories-metiers.service';

describe('CategoriesMetiersService', () => {
    const prisma = {
        categorieMetier: {
            findMany: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
        },
    };

    const cacheService = {
        getCategories: jest.fn(),
        setCategories: jest.fn(),
        invalidateCategories: jest.fn(),
        invalidateMetiers: jest.fn(),
    };

    let service: CategoriesMetiersService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new CategoriesMetiersService(prisma as never, cacheService as never);
    });

    it('returns cached categories when available', async () => {
        const cached = [{ id: 'cat-1', nom: 'Plomberie', _count: { metiers: 4 } }];
        cacheService.getCategories.mockResolvedValueOnce(cached);

        const result = await service.findAll(false);

        expect(result).toEqual(cached);
        expect(prisma.categorieMetier.findMany).not.toHaveBeenCalled();
    });

    it('queries database and populates cache on cache miss', async () => {
        const rows = [{ id: 'cat-2', nom: 'Electricite', _count: { metiers: 2 } }];
        cacheService.getCategories.mockResolvedValueOnce(null);
        prisma.categorieMetier.findMany.mockResolvedValueOnce(rows);

        const result = await service.findAll(false);

        expect(prisma.categorieMetier.findMany).toHaveBeenCalledTimes(1);
        expect(cacheService.setCategories).toHaveBeenCalledWith(rows, false);
        expect(result).toEqual(rows);
    });
});
