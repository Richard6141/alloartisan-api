
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model CategorieMetier
 * 
 */
export type CategorieMetier = $Result.DefaultSelection<Prisma.$CategorieMetierPayload>
/**
 * Model Metier
 * 
 */
export type Metier = $Result.DefaultSelection<Prisma.$MetierPayload>
/**
 * Model Artisan
 * 
 */
export type Artisan = $Result.DefaultSelection<Prisma.$ArtisanPayload>
/**
 * Model ArtisanMetier
 * 
 */
export type ArtisanMetier = $Result.DefaultSelection<Prisma.$ArtisanMetierPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  CLIENT: 'CLIENT',
  ARTISAN: 'ARTISAN',
  ADMIN: 'ADMIN'
};

export type Role = (typeof Role)[keyof typeof Role]


export const Statut: {
  EN_ATTENTE: 'EN_ATTENTE',
  ACTIF: 'ACTIF',
  SUSPENDU: 'SUSPENDU',
  BANNI: 'BANNI'
};

export type Statut = (typeof Statut)[keyof typeof Statut]


export const StatutArtisan: {
  EN_ATTENTE: 'EN_ATTENTE',
  ACTIF: 'ACTIF',
  SUSPENDU: 'SUSPENDU',
  REJETE: 'REJETE'
};

export type StatutArtisan = (typeof StatutArtisan)[keyof typeof StatutArtisan]


export const AbonnementType: {
  GRATUIT: 'GRATUIT',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM'
};

export type AbonnementType = (typeof AbonnementType)[keyof typeof AbonnementType]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type Statut = $Enums.Statut

export const Statut: typeof $Enums.Statut

export type StatutArtisan = $Enums.StatutArtisan

export const StatutArtisan: typeof $Enums.StatutArtisan

export type AbonnementType = $Enums.AbonnementType

export const AbonnementType: typeof $Enums.AbonnementType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.categorieMetier`: Exposes CRUD operations for the **CategorieMetier** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CategorieMetiers
    * const categorieMetiers = await prisma.categorieMetier.findMany()
    * ```
    */
  get categorieMetier(): Prisma.CategorieMetierDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.metier`: Exposes CRUD operations for the **Metier** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Metiers
    * const metiers = await prisma.metier.findMany()
    * ```
    */
  get metier(): Prisma.MetierDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.artisan`: Exposes CRUD operations for the **Artisan** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Artisans
    * const artisans = await prisma.artisan.findMany()
    * ```
    */
  get artisan(): Prisma.ArtisanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.artisanMetier`: Exposes CRUD operations for the **ArtisanMetier** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ArtisanMetiers
    * const artisanMetiers = await prisma.artisanMetier.findMany()
    * ```
    */
  get artisanMetier(): Prisma.ArtisanMetierDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.0.1
   * Query Engine version: f09f2815f091dbba658cdcd2264306d88bb5bda6
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    CategorieMetier: 'CategorieMetier',
    Metier: 'Metier',
    Artisan: 'Artisan',
    ArtisanMetier: 'ArtisanMetier'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "categorieMetier" | "metier" | "artisan" | "artisanMetier"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      CategorieMetier: {
        payload: Prisma.$CategorieMetierPayload<ExtArgs>
        fields: Prisma.CategorieMetierFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategorieMetierFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategorieMetierFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>
          }
          findFirst: {
            args: Prisma.CategorieMetierFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategorieMetierFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>
          }
          findMany: {
            args: Prisma.CategorieMetierFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>[]
          }
          create: {
            args: Prisma.CategorieMetierCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>
          }
          createMany: {
            args: Prisma.CategorieMetierCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategorieMetierCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>[]
          }
          delete: {
            args: Prisma.CategorieMetierDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>
          }
          update: {
            args: Prisma.CategorieMetierUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>
          }
          deleteMany: {
            args: Prisma.CategorieMetierDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategorieMetierUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategorieMetierUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>[]
          }
          upsert: {
            args: Prisma.CategorieMetierUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategorieMetierPayload>
          }
          aggregate: {
            args: Prisma.CategorieMetierAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategorieMetier>
          }
          groupBy: {
            args: Prisma.CategorieMetierGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategorieMetierGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategorieMetierCountArgs<ExtArgs>
            result: $Utils.Optional<CategorieMetierCountAggregateOutputType> | number
          }
        }
      }
      Metier: {
        payload: Prisma.$MetierPayload<ExtArgs>
        fields: Prisma.MetierFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MetierFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MetierFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>
          }
          findFirst: {
            args: Prisma.MetierFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MetierFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>
          }
          findMany: {
            args: Prisma.MetierFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>[]
          }
          create: {
            args: Prisma.MetierCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>
          }
          createMany: {
            args: Prisma.MetierCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MetierCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>[]
          }
          delete: {
            args: Prisma.MetierDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>
          }
          update: {
            args: Prisma.MetierUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>
          }
          deleteMany: {
            args: Prisma.MetierDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MetierUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MetierUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>[]
          }
          upsert: {
            args: Prisma.MetierUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MetierPayload>
          }
          aggregate: {
            args: Prisma.MetierAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMetier>
          }
          groupBy: {
            args: Prisma.MetierGroupByArgs<ExtArgs>
            result: $Utils.Optional<MetierGroupByOutputType>[]
          }
          count: {
            args: Prisma.MetierCountArgs<ExtArgs>
            result: $Utils.Optional<MetierCountAggregateOutputType> | number
          }
        }
      }
      Artisan: {
        payload: Prisma.$ArtisanPayload<ExtArgs>
        fields: Prisma.ArtisanFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ArtisanFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ArtisanFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>
          }
          findFirst: {
            args: Prisma.ArtisanFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ArtisanFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>
          }
          findMany: {
            args: Prisma.ArtisanFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>[]
          }
          create: {
            args: Prisma.ArtisanCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>
          }
          createMany: {
            args: Prisma.ArtisanCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ArtisanCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>[]
          }
          delete: {
            args: Prisma.ArtisanDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>
          }
          update: {
            args: Prisma.ArtisanUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>
          }
          deleteMany: {
            args: Prisma.ArtisanDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ArtisanUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ArtisanUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>[]
          }
          upsert: {
            args: Prisma.ArtisanUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanPayload>
          }
          aggregate: {
            args: Prisma.ArtisanAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateArtisan>
          }
          groupBy: {
            args: Prisma.ArtisanGroupByArgs<ExtArgs>
            result: $Utils.Optional<ArtisanGroupByOutputType>[]
          }
          count: {
            args: Prisma.ArtisanCountArgs<ExtArgs>
            result: $Utils.Optional<ArtisanCountAggregateOutputType> | number
          }
        }
      }
      ArtisanMetier: {
        payload: Prisma.$ArtisanMetierPayload<ExtArgs>
        fields: Prisma.ArtisanMetierFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ArtisanMetierFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ArtisanMetierFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>
          }
          findFirst: {
            args: Prisma.ArtisanMetierFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ArtisanMetierFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>
          }
          findMany: {
            args: Prisma.ArtisanMetierFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>[]
          }
          create: {
            args: Prisma.ArtisanMetierCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>
          }
          createMany: {
            args: Prisma.ArtisanMetierCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ArtisanMetierCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>[]
          }
          delete: {
            args: Prisma.ArtisanMetierDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>
          }
          update: {
            args: Prisma.ArtisanMetierUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>
          }
          deleteMany: {
            args: Prisma.ArtisanMetierDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ArtisanMetierUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ArtisanMetierUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>[]
          }
          upsert: {
            args: Prisma.ArtisanMetierUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtisanMetierPayload>
          }
          aggregate: {
            args: Prisma.ArtisanMetierAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateArtisanMetier>
          }
          groupBy: {
            args: Prisma.ArtisanMetierGroupByArgs<ExtArgs>
            result: $Utils.Optional<ArtisanMetierGroupByOutputType>[]
          }
          count: {
            args: Prisma.ArtisanMetierCountArgs<ExtArgs>
            result: $Utils.Optional<ArtisanMetierCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    categorieMetier?: CategorieMetierOmit
    metier?: MetierOmit
    artisan?: ArtisanOmit
    artisanMetier?: ArtisanMetierOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    artisansVerified: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artisansVerified?: boolean | UserCountOutputTypeCountArtisansVerifiedArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountArtisansVerifiedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtisanWhereInput
  }


  /**
   * Count Type CategorieMetierCountOutputType
   */

  export type CategorieMetierCountOutputType = {
    metiers: number
  }

  export type CategorieMetierCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    metiers?: boolean | CategorieMetierCountOutputTypeCountMetiersArgs
  }

  // Custom InputTypes
  /**
   * CategorieMetierCountOutputType without action
   */
  export type CategorieMetierCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetierCountOutputType
     */
    select?: CategorieMetierCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategorieMetierCountOutputType without action
   */
  export type CategorieMetierCountOutputTypeCountMetiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MetierWhereInput
  }


  /**
   * Count Type MetierCountOutputType
   */

  export type MetierCountOutputType = {
    artisanMetiers: number
  }

  export type MetierCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artisanMetiers?: boolean | MetierCountOutputTypeCountArtisanMetiersArgs
  }

  // Custom InputTypes
  /**
   * MetierCountOutputType without action
   */
  export type MetierCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MetierCountOutputType
     */
    select?: MetierCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MetierCountOutputType without action
   */
  export type MetierCountOutputTypeCountArtisanMetiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtisanMetierWhereInput
  }


  /**
   * Count Type ArtisanCountOutputType
   */

  export type ArtisanCountOutputType = {
    metiers: number
  }

  export type ArtisanCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    metiers?: boolean | ArtisanCountOutputTypeCountMetiersArgs
  }

  // Custom InputTypes
  /**
   * ArtisanCountOutputType without action
   */
  export type ArtisanCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanCountOutputType
     */
    select?: ArtisanCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ArtisanCountOutputType without action
   */
  export type ArtisanCountOutputTypeCountMetiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtisanMetierWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    latitude: Decimal | null
    longitude: Decimal | null
  }

  export type UserSumAggregateOutputType = {
    latitude: Decimal | null
    longitude: Decimal | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    telephone: string | null
    nom: string | null
    prenom: string | null
    dateNaissance: Date | null
    sexe: string | null
    photoUrl: string | null
    adressePrincipale: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    ville: string | null
    quartier: string | null
    passwordHash: string | null
    emailVerified: boolean | null
    telephoneVerified: boolean | null
    profilComplet: boolean | null
    mfaEnabled: boolean | null
    mfaSecret: string | null
    emailVerificationToken: string | null
    emailVerificationExpiresAt: Date | null
    telephoneVerificationToken: string | null
    telephoneVerificationExpiresAt: Date | null
    role: $Enums.Role | null
    statut: $Enums.Statut | null
    langue: string | null
    timezone: string | null
    notificationEmail: boolean | null
    notificationSms: boolean | null
    notificationPush: boolean | null
    derniereConnexion: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    telephone: string | null
    nom: string | null
    prenom: string | null
    dateNaissance: Date | null
    sexe: string | null
    photoUrl: string | null
    adressePrincipale: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    ville: string | null
    quartier: string | null
    passwordHash: string | null
    emailVerified: boolean | null
    telephoneVerified: boolean | null
    profilComplet: boolean | null
    mfaEnabled: boolean | null
    mfaSecret: string | null
    emailVerificationToken: string | null
    emailVerificationExpiresAt: Date | null
    telephoneVerificationToken: string | null
    telephoneVerificationExpiresAt: Date | null
    role: $Enums.Role | null
    statut: $Enums.Statut | null
    langue: string | null
    timezone: string | null
    notificationEmail: boolean | null
    notificationSms: boolean | null
    notificationPush: boolean | null
    derniereConnexion: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    telephone: number
    nom: number
    prenom: number
    dateNaissance: number
    sexe: number
    photoUrl: number
    adressePrincipale: number
    latitude: number
    longitude: number
    ville: number
    quartier: number
    passwordHash: number
    emailVerified: number
    telephoneVerified: number
    profilComplet: number
    mfaEnabled: number
    mfaSecret: number
    emailVerificationToken: number
    emailVerificationExpiresAt: number
    telephoneVerificationToken: number
    telephoneVerificationExpiresAt: number
    role: number
    statut: number
    langue: number
    timezone: number
    notificationEmail: number
    notificationSms: number
    notificationPush: number
    derniereConnexion: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type UserSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    telephone?: true
    nom?: true
    prenom?: true
    dateNaissance?: true
    sexe?: true
    photoUrl?: true
    adressePrincipale?: true
    latitude?: true
    longitude?: true
    ville?: true
    quartier?: true
    passwordHash?: true
    emailVerified?: true
    telephoneVerified?: true
    profilComplet?: true
    mfaEnabled?: true
    mfaSecret?: true
    emailVerificationToken?: true
    emailVerificationExpiresAt?: true
    telephoneVerificationToken?: true
    telephoneVerificationExpiresAt?: true
    role?: true
    statut?: true
    langue?: true
    timezone?: true
    notificationEmail?: true
    notificationSms?: true
    notificationPush?: true
    derniereConnexion?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    telephone?: true
    nom?: true
    prenom?: true
    dateNaissance?: true
    sexe?: true
    photoUrl?: true
    adressePrincipale?: true
    latitude?: true
    longitude?: true
    ville?: true
    quartier?: true
    passwordHash?: true
    emailVerified?: true
    telephoneVerified?: true
    profilComplet?: true
    mfaEnabled?: true
    mfaSecret?: true
    emailVerificationToken?: true
    emailVerificationExpiresAt?: true
    telephoneVerificationToken?: true
    telephoneVerificationExpiresAt?: true
    role?: true
    statut?: true
    langue?: true
    timezone?: true
    notificationEmail?: true
    notificationSms?: true
    notificationPush?: true
    derniereConnexion?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    telephone?: true
    nom?: true
    prenom?: true
    dateNaissance?: true
    sexe?: true
    photoUrl?: true
    adressePrincipale?: true
    latitude?: true
    longitude?: true
    ville?: true
    quartier?: true
    passwordHash?: true
    emailVerified?: true
    telephoneVerified?: true
    profilComplet?: true
    mfaEnabled?: true
    mfaSecret?: true
    emailVerificationToken?: true
    emailVerificationExpiresAt?: true
    telephoneVerificationToken?: true
    telephoneVerificationExpiresAt?: true
    role?: true
    statut?: true
    langue?: true
    timezone?: true
    notificationEmail?: true
    notificationSms?: true
    notificationPush?: true
    derniereConnexion?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    telephone: string | null
    nom: string | null
    prenom: string | null
    dateNaissance: Date | null
    sexe: string | null
    photoUrl: string | null
    adressePrincipale: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    ville: string | null
    quartier: string | null
    passwordHash: string
    emailVerified: boolean
    telephoneVerified: boolean
    profilComplet: boolean
    mfaEnabled: boolean
    mfaSecret: string | null
    emailVerificationToken: string | null
    emailVerificationExpiresAt: Date | null
    telephoneVerificationToken: string | null
    telephoneVerificationExpiresAt: Date | null
    role: $Enums.Role
    statut: $Enums.Statut
    langue: string
    timezone: string
    notificationEmail: boolean
    notificationSms: boolean
    notificationPush: boolean
    derniereConnexion: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    telephone?: boolean
    nom?: boolean
    prenom?: boolean
    dateNaissance?: boolean
    sexe?: boolean
    photoUrl?: boolean
    adressePrincipale?: boolean
    latitude?: boolean
    longitude?: boolean
    ville?: boolean
    quartier?: boolean
    passwordHash?: boolean
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: boolean
    emailVerificationToken?: boolean
    emailVerificationExpiresAt?: boolean
    telephoneVerificationToken?: boolean
    telephoneVerificationExpiresAt?: boolean
    role?: boolean
    statut?: boolean
    langue?: boolean
    timezone?: boolean
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    artisan?: boolean | User$artisanArgs<ExtArgs>
    artisansVerified?: boolean | User$artisansVerifiedArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    telephone?: boolean
    nom?: boolean
    prenom?: boolean
    dateNaissance?: boolean
    sexe?: boolean
    photoUrl?: boolean
    adressePrincipale?: boolean
    latitude?: boolean
    longitude?: boolean
    ville?: boolean
    quartier?: boolean
    passwordHash?: boolean
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: boolean
    emailVerificationToken?: boolean
    emailVerificationExpiresAt?: boolean
    telephoneVerificationToken?: boolean
    telephoneVerificationExpiresAt?: boolean
    role?: boolean
    statut?: boolean
    langue?: boolean
    timezone?: boolean
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    telephone?: boolean
    nom?: boolean
    prenom?: boolean
    dateNaissance?: boolean
    sexe?: boolean
    photoUrl?: boolean
    adressePrincipale?: boolean
    latitude?: boolean
    longitude?: boolean
    ville?: boolean
    quartier?: boolean
    passwordHash?: boolean
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: boolean
    emailVerificationToken?: boolean
    emailVerificationExpiresAt?: boolean
    telephoneVerificationToken?: boolean
    telephoneVerificationExpiresAt?: boolean
    role?: boolean
    statut?: boolean
    langue?: boolean
    timezone?: boolean
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    telephone?: boolean
    nom?: boolean
    prenom?: boolean
    dateNaissance?: boolean
    sexe?: boolean
    photoUrl?: boolean
    adressePrincipale?: boolean
    latitude?: boolean
    longitude?: boolean
    ville?: boolean
    quartier?: boolean
    passwordHash?: boolean
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: boolean
    emailVerificationToken?: boolean
    emailVerificationExpiresAt?: boolean
    telephoneVerificationToken?: boolean
    telephoneVerificationExpiresAt?: boolean
    role?: boolean
    statut?: boolean
    langue?: boolean
    timezone?: boolean
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "telephone" | "nom" | "prenom" | "dateNaissance" | "sexe" | "photoUrl" | "adressePrincipale" | "latitude" | "longitude" | "ville" | "quartier" | "passwordHash" | "emailVerified" | "telephoneVerified" | "profilComplet" | "mfaEnabled" | "mfaSecret" | "emailVerificationToken" | "emailVerificationExpiresAt" | "telephoneVerificationToken" | "telephoneVerificationExpiresAt" | "role" | "statut" | "langue" | "timezone" | "notificationEmail" | "notificationSms" | "notificationPush" | "derniereConnexion" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artisan?: boolean | User$artisanArgs<ExtArgs>
    artisansVerified?: boolean | User$artisansVerifiedArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      artisan: Prisma.$ArtisanPayload<ExtArgs> | null
      artisansVerified: Prisma.$ArtisanPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      telephone: string | null
      nom: string | null
      prenom: string | null
      dateNaissance: Date | null
      sexe: string | null
      photoUrl: string | null
      adressePrincipale: string | null
      latitude: Prisma.Decimal | null
      longitude: Prisma.Decimal | null
      ville: string | null
      quartier: string | null
      passwordHash: string
      emailVerified: boolean
      telephoneVerified: boolean
      profilComplet: boolean
      mfaEnabled: boolean
      mfaSecret: string | null
      emailVerificationToken: string | null
      emailVerificationExpiresAt: Date | null
      telephoneVerificationToken: string | null
      telephoneVerificationExpiresAt: Date | null
      role: $Enums.Role
      statut: $Enums.Statut
      langue: string
      timezone: string
      notificationEmail: boolean
      notificationSms: boolean
      notificationPush: boolean
      derniereConnexion: Date | null
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    artisan<T extends User$artisanArgs<ExtArgs> = {}>(args?: Subset<T, User$artisanArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    artisansVerified<T extends User$artisansVerifiedArgs<ExtArgs> = {}>(args?: Subset<T, User$artisansVerifiedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly telephone: FieldRef<"User", 'String'>
    readonly nom: FieldRef<"User", 'String'>
    readonly prenom: FieldRef<"User", 'String'>
    readonly dateNaissance: FieldRef<"User", 'DateTime'>
    readonly sexe: FieldRef<"User", 'String'>
    readonly photoUrl: FieldRef<"User", 'String'>
    readonly adressePrincipale: FieldRef<"User", 'String'>
    readonly latitude: FieldRef<"User", 'Decimal'>
    readonly longitude: FieldRef<"User", 'Decimal'>
    readonly ville: FieldRef<"User", 'String'>
    readonly quartier: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly telephoneVerified: FieldRef<"User", 'Boolean'>
    readonly profilComplet: FieldRef<"User", 'Boolean'>
    readonly mfaEnabled: FieldRef<"User", 'Boolean'>
    readonly mfaSecret: FieldRef<"User", 'String'>
    readonly emailVerificationToken: FieldRef<"User", 'String'>
    readonly emailVerificationExpiresAt: FieldRef<"User", 'DateTime'>
    readonly telephoneVerificationToken: FieldRef<"User", 'String'>
    readonly telephoneVerificationExpiresAt: FieldRef<"User", 'DateTime'>
    readonly role: FieldRef<"User", 'Role'>
    readonly statut: FieldRef<"User", 'Statut'>
    readonly langue: FieldRef<"User", 'String'>
    readonly timezone: FieldRef<"User", 'String'>
    readonly notificationEmail: FieldRef<"User", 'Boolean'>
    readonly notificationSms: FieldRef<"User", 'Boolean'>
    readonly notificationPush: FieldRef<"User", 'Boolean'>
    readonly derniereConnexion: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly deletedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.artisan
   */
  export type User$artisanArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    where?: ArtisanWhereInput
  }

  /**
   * User.artisansVerified
   */
  export type User$artisansVerifiedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    where?: ArtisanWhereInput
    orderBy?: ArtisanOrderByWithRelationInput | ArtisanOrderByWithRelationInput[]
    cursor?: ArtisanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtisanScalarFieldEnum | ArtisanScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model CategorieMetier
   */

  export type AggregateCategorieMetier = {
    _count: CategorieMetierCountAggregateOutputType | null
    _avg: CategorieMetierAvgAggregateOutputType | null
    _sum: CategorieMetierSumAggregateOutputType | null
    _min: CategorieMetierMinAggregateOutputType | null
    _max: CategorieMetierMaxAggregateOutputType | null
  }

  export type CategorieMetierAvgAggregateOutputType = {
    ordreAffichage: number | null
  }

  export type CategorieMetierSumAggregateOutputType = {
    ordreAffichage: number | null
  }

  export type CategorieMetierMinAggregateOutputType = {
    id: string | null
    nom: string | null
    slug: string | null
    description: string | null
    iconUrl: string | null
    ordreAffichage: number | null
    actif: boolean | null
    createdAt: Date | null
  }

  export type CategorieMetierMaxAggregateOutputType = {
    id: string | null
    nom: string | null
    slug: string | null
    description: string | null
    iconUrl: string | null
    ordreAffichage: number | null
    actif: boolean | null
    createdAt: Date | null
  }

  export type CategorieMetierCountAggregateOutputType = {
    id: number
    nom: number
    slug: number
    description: number
    iconUrl: number
    ordreAffichage: number
    actif: number
    createdAt: number
    _all: number
  }


  export type CategorieMetierAvgAggregateInputType = {
    ordreAffichage?: true
  }

  export type CategorieMetierSumAggregateInputType = {
    ordreAffichage?: true
  }

  export type CategorieMetierMinAggregateInputType = {
    id?: true
    nom?: true
    slug?: true
    description?: true
    iconUrl?: true
    ordreAffichage?: true
    actif?: true
    createdAt?: true
  }

  export type CategorieMetierMaxAggregateInputType = {
    id?: true
    nom?: true
    slug?: true
    description?: true
    iconUrl?: true
    ordreAffichage?: true
    actif?: true
    createdAt?: true
  }

  export type CategorieMetierCountAggregateInputType = {
    id?: true
    nom?: true
    slug?: true
    description?: true
    iconUrl?: true
    ordreAffichage?: true
    actif?: true
    createdAt?: true
    _all?: true
  }

  export type CategorieMetierAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CategorieMetier to aggregate.
     */
    where?: CategorieMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategorieMetiers to fetch.
     */
    orderBy?: CategorieMetierOrderByWithRelationInput | CategorieMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategorieMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategorieMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategorieMetiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CategorieMetiers
    **/
    _count?: true | CategorieMetierCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CategorieMetierAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CategorieMetierSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategorieMetierMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategorieMetierMaxAggregateInputType
  }

  export type GetCategorieMetierAggregateType<T extends CategorieMetierAggregateArgs> = {
        [P in keyof T & keyof AggregateCategorieMetier]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategorieMetier[P]>
      : GetScalarType<T[P], AggregateCategorieMetier[P]>
  }




  export type CategorieMetierGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategorieMetierWhereInput
    orderBy?: CategorieMetierOrderByWithAggregationInput | CategorieMetierOrderByWithAggregationInput[]
    by: CategorieMetierScalarFieldEnum[] | CategorieMetierScalarFieldEnum
    having?: CategorieMetierScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategorieMetierCountAggregateInputType | true
    _avg?: CategorieMetierAvgAggregateInputType
    _sum?: CategorieMetierSumAggregateInputType
    _min?: CategorieMetierMinAggregateInputType
    _max?: CategorieMetierMaxAggregateInputType
  }

  export type CategorieMetierGroupByOutputType = {
    id: string
    nom: string
    slug: string
    description: string | null
    iconUrl: string | null
    ordreAffichage: number
    actif: boolean
    createdAt: Date
    _count: CategorieMetierCountAggregateOutputType | null
    _avg: CategorieMetierAvgAggregateOutputType | null
    _sum: CategorieMetierSumAggregateOutputType | null
    _min: CategorieMetierMinAggregateOutputType | null
    _max: CategorieMetierMaxAggregateOutputType | null
  }

  type GetCategorieMetierGroupByPayload<T extends CategorieMetierGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategorieMetierGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategorieMetierGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategorieMetierGroupByOutputType[P]>
            : GetScalarType<T[P], CategorieMetierGroupByOutputType[P]>
        }
      >
    >


  export type CategorieMetierSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    ordreAffichage?: boolean
    actif?: boolean
    createdAt?: boolean
    metiers?: boolean | CategorieMetier$metiersArgs<ExtArgs>
    _count?: boolean | CategorieMetierCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["categorieMetier"]>

  export type CategorieMetierSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    ordreAffichage?: boolean
    actif?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["categorieMetier"]>

  export type CategorieMetierSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    ordreAffichage?: boolean
    actif?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["categorieMetier"]>

  export type CategorieMetierSelectScalar = {
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    ordreAffichage?: boolean
    actif?: boolean
    createdAt?: boolean
  }

  export type CategorieMetierOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nom" | "slug" | "description" | "iconUrl" | "ordreAffichage" | "actif" | "createdAt", ExtArgs["result"]["categorieMetier"]>
  export type CategorieMetierInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    metiers?: boolean | CategorieMetier$metiersArgs<ExtArgs>
    _count?: boolean | CategorieMetierCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategorieMetierIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CategorieMetierIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategorieMetierPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CategorieMetier"
    objects: {
      metiers: Prisma.$MetierPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      nom: string
      slug: string
      description: string | null
      iconUrl: string | null
      ordreAffichage: number
      actif: boolean
      createdAt: Date
    }, ExtArgs["result"]["categorieMetier"]>
    composites: {}
  }

  type CategorieMetierGetPayload<S extends boolean | null | undefined | CategorieMetierDefaultArgs> = $Result.GetResult<Prisma.$CategorieMetierPayload, S>

  type CategorieMetierCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategorieMetierFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategorieMetierCountAggregateInputType | true
    }

  export interface CategorieMetierDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CategorieMetier'], meta: { name: 'CategorieMetier' } }
    /**
     * Find zero or one CategorieMetier that matches the filter.
     * @param {CategorieMetierFindUniqueArgs} args - Arguments to find a CategorieMetier
     * @example
     * // Get one CategorieMetier
     * const categorieMetier = await prisma.categorieMetier.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategorieMetierFindUniqueArgs>(args: SelectSubset<T, CategorieMetierFindUniqueArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CategorieMetier that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategorieMetierFindUniqueOrThrowArgs} args - Arguments to find a CategorieMetier
     * @example
     * // Get one CategorieMetier
     * const categorieMetier = await prisma.categorieMetier.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategorieMetierFindUniqueOrThrowArgs>(args: SelectSubset<T, CategorieMetierFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CategorieMetier that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierFindFirstArgs} args - Arguments to find a CategorieMetier
     * @example
     * // Get one CategorieMetier
     * const categorieMetier = await prisma.categorieMetier.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategorieMetierFindFirstArgs>(args?: SelectSubset<T, CategorieMetierFindFirstArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CategorieMetier that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierFindFirstOrThrowArgs} args - Arguments to find a CategorieMetier
     * @example
     * // Get one CategorieMetier
     * const categorieMetier = await prisma.categorieMetier.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategorieMetierFindFirstOrThrowArgs>(args?: SelectSubset<T, CategorieMetierFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CategorieMetiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CategorieMetiers
     * const categorieMetiers = await prisma.categorieMetier.findMany()
     * 
     * // Get first 10 CategorieMetiers
     * const categorieMetiers = await prisma.categorieMetier.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categorieMetierWithIdOnly = await prisma.categorieMetier.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategorieMetierFindManyArgs>(args?: SelectSubset<T, CategorieMetierFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CategorieMetier.
     * @param {CategorieMetierCreateArgs} args - Arguments to create a CategorieMetier.
     * @example
     * // Create one CategorieMetier
     * const CategorieMetier = await prisma.categorieMetier.create({
     *   data: {
     *     // ... data to create a CategorieMetier
     *   }
     * })
     * 
     */
    create<T extends CategorieMetierCreateArgs>(args: SelectSubset<T, CategorieMetierCreateArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CategorieMetiers.
     * @param {CategorieMetierCreateManyArgs} args - Arguments to create many CategorieMetiers.
     * @example
     * // Create many CategorieMetiers
     * const categorieMetier = await prisma.categorieMetier.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategorieMetierCreateManyArgs>(args?: SelectSubset<T, CategorieMetierCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CategorieMetiers and returns the data saved in the database.
     * @param {CategorieMetierCreateManyAndReturnArgs} args - Arguments to create many CategorieMetiers.
     * @example
     * // Create many CategorieMetiers
     * const categorieMetier = await prisma.categorieMetier.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CategorieMetiers and only return the `id`
     * const categorieMetierWithIdOnly = await prisma.categorieMetier.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategorieMetierCreateManyAndReturnArgs>(args?: SelectSubset<T, CategorieMetierCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CategorieMetier.
     * @param {CategorieMetierDeleteArgs} args - Arguments to delete one CategorieMetier.
     * @example
     * // Delete one CategorieMetier
     * const CategorieMetier = await prisma.categorieMetier.delete({
     *   where: {
     *     // ... filter to delete one CategorieMetier
     *   }
     * })
     * 
     */
    delete<T extends CategorieMetierDeleteArgs>(args: SelectSubset<T, CategorieMetierDeleteArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CategorieMetier.
     * @param {CategorieMetierUpdateArgs} args - Arguments to update one CategorieMetier.
     * @example
     * // Update one CategorieMetier
     * const categorieMetier = await prisma.categorieMetier.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategorieMetierUpdateArgs>(args: SelectSubset<T, CategorieMetierUpdateArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CategorieMetiers.
     * @param {CategorieMetierDeleteManyArgs} args - Arguments to filter CategorieMetiers to delete.
     * @example
     * // Delete a few CategorieMetiers
     * const { count } = await prisma.categorieMetier.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategorieMetierDeleteManyArgs>(args?: SelectSubset<T, CategorieMetierDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CategorieMetiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CategorieMetiers
     * const categorieMetier = await prisma.categorieMetier.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategorieMetierUpdateManyArgs>(args: SelectSubset<T, CategorieMetierUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CategorieMetiers and returns the data updated in the database.
     * @param {CategorieMetierUpdateManyAndReturnArgs} args - Arguments to update many CategorieMetiers.
     * @example
     * // Update many CategorieMetiers
     * const categorieMetier = await prisma.categorieMetier.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CategorieMetiers and only return the `id`
     * const categorieMetierWithIdOnly = await prisma.categorieMetier.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategorieMetierUpdateManyAndReturnArgs>(args: SelectSubset<T, CategorieMetierUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CategorieMetier.
     * @param {CategorieMetierUpsertArgs} args - Arguments to update or create a CategorieMetier.
     * @example
     * // Update or create a CategorieMetier
     * const categorieMetier = await prisma.categorieMetier.upsert({
     *   create: {
     *     // ... data to create a CategorieMetier
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CategorieMetier we want to update
     *   }
     * })
     */
    upsert<T extends CategorieMetierUpsertArgs>(args: SelectSubset<T, CategorieMetierUpsertArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CategorieMetiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierCountArgs} args - Arguments to filter CategorieMetiers to count.
     * @example
     * // Count the number of CategorieMetiers
     * const count = await prisma.categorieMetier.count({
     *   where: {
     *     // ... the filter for the CategorieMetiers we want to count
     *   }
     * })
    **/
    count<T extends CategorieMetierCountArgs>(
      args?: Subset<T, CategorieMetierCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategorieMetierCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CategorieMetier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategorieMetierAggregateArgs>(args: Subset<T, CategorieMetierAggregateArgs>): Prisma.PrismaPromise<GetCategorieMetierAggregateType<T>>

    /**
     * Group by CategorieMetier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategorieMetierGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategorieMetierGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategorieMetierGroupByArgs['orderBy'] }
        : { orderBy?: CategorieMetierGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategorieMetierGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategorieMetierGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CategorieMetier model
   */
  readonly fields: CategorieMetierFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CategorieMetier.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategorieMetierClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    metiers<T extends CategorieMetier$metiersArgs<ExtArgs> = {}>(args?: Subset<T, CategorieMetier$metiersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CategorieMetier model
   */
  interface CategorieMetierFieldRefs {
    readonly id: FieldRef<"CategorieMetier", 'String'>
    readonly nom: FieldRef<"CategorieMetier", 'String'>
    readonly slug: FieldRef<"CategorieMetier", 'String'>
    readonly description: FieldRef<"CategorieMetier", 'String'>
    readonly iconUrl: FieldRef<"CategorieMetier", 'String'>
    readonly ordreAffichage: FieldRef<"CategorieMetier", 'Int'>
    readonly actif: FieldRef<"CategorieMetier", 'Boolean'>
    readonly createdAt: FieldRef<"CategorieMetier", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CategorieMetier findUnique
   */
  export type CategorieMetierFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * Filter, which CategorieMetier to fetch.
     */
    where: CategorieMetierWhereUniqueInput
  }

  /**
   * CategorieMetier findUniqueOrThrow
   */
  export type CategorieMetierFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * Filter, which CategorieMetier to fetch.
     */
    where: CategorieMetierWhereUniqueInput
  }

  /**
   * CategorieMetier findFirst
   */
  export type CategorieMetierFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * Filter, which CategorieMetier to fetch.
     */
    where?: CategorieMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategorieMetiers to fetch.
     */
    orderBy?: CategorieMetierOrderByWithRelationInput | CategorieMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CategorieMetiers.
     */
    cursor?: CategorieMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategorieMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategorieMetiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CategorieMetiers.
     */
    distinct?: CategorieMetierScalarFieldEnum | CategorieMetierScalarFieldEnum[]
  }

  /**
   * CategorieMetier findFirstOrThrow
   */
  export type CategorieMetierFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * Filter, which CategorieMetier to fetch.
     */
    where?: CategorieMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategorieMetiers to fetch.
     */
    orderBy?: CategorieMetierOrderByWithRelationInput | CategorieMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CategorieMetiers.
     */
    cursor?: CategorieMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategorieMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategorieMetiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CategorieMetiers.
     */
    distinct?: CategorieMetierScalarFieldEnum | CategorieMetierScalarFieldEnum[]
  }

  /**
   * CategorieMetier findMany
   */
  export type CategorieMetierFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * Filter, which CategorieMetiers to fetch.
     */
    where?: CategorieMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategorieMetiers to fetch.
     */
    orderBy?: CategorieMetierOrderByWithRelationInput | CategorieMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CategorieMetiers.
     */
    cursor?: CategorieMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategorieMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategorieMetiers.
     */
    skip?: number
    distinct?: CategorieMetierScalarFieldEnum | CategorieMetierScalarFieldEnum[]
  }

  /**
   * CategorieMetier create
   */
  export type CategorieMetierCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * The data needed to create a CategorieMetier.
     */
    data: XOR<CategorieMetierCreateInput, CategorieMetierUncheckedCreateInput>
  }

  /**
   * CategorieMetier createMany
   */
  export type CategorieMetierCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CategorieMetiers.
     */
    data: CategorieMetierCreateManyInput | CategorieMetierCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CategorieMetier createManyAndReturn
   */
  export type CategorieMetierCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * The data used to create many CategorieMetiers.
     */
    data: CategorieMetierCreateManyInput | CategorieMetierCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CategorieMetier update
   */
  export type CategorieMetierUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * The data needed to update a CategorieMetier.
     */
    data: XOR<CategorieMetierUpdateInput, CategorieMetierUncheckedUpdateInput>
    /**
     * Choose, which CategorieMetier to update.
     */
    where: CategorieMetierWhereUniqueInput
  }

  /**
   * CategorieMetier updateMany
   */
  export type CategorieMetierUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CategorieMetiers.
     */
    data: XOR<CategorieMetierUpdateManyMutationInput, CategorieMetierUncheckedUpdateManyInput>
    /**
     * Filter which CategorieMetiers to update
     */
    where?: CategorieMetierWhereInput
    /**
     * Limit how many CategorieMetiers to update.
     */
    limit?: number
  }

  /**
   * CategorieMetier updateManyAndReturn
   */
  export type CategorieMetierUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * The data used to update CategorieMetiers.
     */
    data: XOR<CategorieMetierUpdateManyMutationInput, CategorieMetierUncheckedUpdateManyInput>
    /**
     * Filter which CategorieMetiers to update
     */
    where?: CategorieMetierWhereInput
    /**
     * Limit how many CategorieMetiers to update.
     */
    limit?: number
  }

  /**
   * CategorieMetier upsert
   */
  export type CategorieMetierUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * The filter to search for the CategorieMetier to update in case it exists.
     */
    where: CategorieMetierWhereUniqueInput
    /**
     * In case the CategorieMetier found by the `where` argument doesn't exist, create a new CategorieMetier with this data.
     */
    create: XOR<CategorieMetierCreateInput, CategorieMetierUncheckedCreateInput>
    /**
     * In case the CategorieMetier was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategorieMetierUpdateInput, CategorieMetierUncheckedUpdateInput>
  }

  /**
   * CategorieMetier delete
   */
  export type CategorieMetierDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
    /**
     * Filter which CategorieMetier to delete.
     */
    where: CategorieMetierWhereUniqueInput
  }

  /**
   * CategorieMetier deleteMany
   */
  export type CategorieMetierDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CategorieMetiers to delete
     */
    where?: CategorieMetierWhereInput
    /**
     * Limit how many CategorieMetiers to delete.
     */
    limit?: number
  }

  /**
   * CategorieMetier.metiers
   */
  export type CategorieMetier$metiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    where?: MetierWhereInput
    orderBy?: MetierOrderByWithRelationInput | MetierOrderByWithRelationInput[]
    cursor?: MetierWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MetierScalarFieldEnum | MetierScalarFieldEnum[]
  }

  /**
   * CategorieMetier without action
   */
  export type CategorieMetierDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategorieMetier
     */
    select?: CategorieMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategorieMetier
     */
    omit?: CategorieMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategorieMetierInclude<ExtArgs> | null
  }


  /**
   * Model Metier
   */

  export type AggregateMetier = {
    _count: MetierCountAggregateOutputType | null
    _avg: MetierAvgAggregateOutputType | null
    _sum: MetierSumAggregateOutputType | null
    _min: MetierMinAggregateOutputType | null
    _max: MetierMaxAggregateOutputType | null
  }

  export type MetierAvgAggregateOutputType = {
    ordreAffichage: number | null
  }

  export type MetierSumAggregateOutputType = {
    ordreAffichage: number | null
  }

  export type MetierMinAggregateOutputType = {
    id: string | null
    nom: string | null
    slug: string | null
    description: string | null
    iconUrl: string | null
    categorieId: string | null
    ordreAffichage: number | null
    populaire: boolean | null
    actif: boolean | null
    createdAt: Date | null
  }

  export type MetierMaxAggregateOutputType = {
    id: string | null
    nom: string | null
    slug: string | null
    description: string | null
    iconUrl: string | null
    categorieId: string | null
    ordreAffichage: number | null
    populaire: boolean | null
    actif: boolean | null
    createdAt: Date | null
  }

  export type MetierCountAggregateOutputType = {
    id: number
    nom: number
    slug: number
    description: number
    iconUrl: number
    categorieId: number
    ordreAffichage: number
    populaire: number
    actif: number
    createdAt: number
    _all: number
  }


  export type MetierAvgAggregateInputType = {
    ordreAffichage?: true
  }

  export type MetierSumAggregateInputType = {
    ordreAffichage?: true
  }

  export type MetierMinAggregateInputType = {
    id?: true
    nom?: true
    slug?: true
    description?: true
    iconUrl?: true
    categorieId?: true
    ordreAffichage?: true
    populaire?: true
    actif?: true
    createdAt?: true
  }

  export type MetierMaxAggregateInputType = {
    id?: true
    nom?: true
    slug?: true
    description?: true
    iconUrl?: true
    categorieId?: true
    ordreAffichage?: true
    populaire?: true
    actif?: true
    createdAt?: true
  }

  export type MetierCountAggregateInputType = {
    id?: true
    nom?: true
    slug?: true
    description?: true
    iconUrl?: true
    categorieId?: true
    ordreAffichage?: true
    populaire?: true
    actif?: true
    createdAt?: true
    _all?: true
  }

  export type MetierAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Metier to aggregate.
     */
    where?: MetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Metiers to fetch.
     */
    orderBy?: MetierOrderByWithRelationInput | MetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Metiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Metiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Metiers
    **/
    _count?: true | MetierCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MetierAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MetierSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MetierMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MetierMaxAggregateInputType
  }

  export type GetMetierAggregateType<T extends MetierAggregateArgs> = {
        [P in keyof T & keyof AggregateMetier]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMetier[P]>
      : GetScalarType<T[P], AggregateMetier[P]>
  }




  export type MetierGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MetierWhereInput
    orderBy?: MetierOrderByWithAggregationInput | MetierOrderByWithAggregationInput[]
    by: MetierScalarFieldEnum[] | MetierScalarFieldEnum
    having?: MetierScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MetierCountAggregateInputType | true
    _avg?: MetierAvgAggregateInputType
    _sum?: MetierSumAggregateInputType
    _min?: MetierMinAggregateInputType
    _max?: MetierMaxAggregateInputType
  }

  export type MetierGroupByOutputType = {
    id: string
    nom: string
    slug: string
    description: string | null
    iconUrl: string | null
    categorieId: string
    ordreAffichage: number
    populaire: boolean
    actif: boolean
    createdAt: Date
    _count: MetierCountAggregateOutputType | null
    _avg: MetierAvgAggregateOutputType | null
    _sum: MetierSumAggregateOutputType | null
    _min: MetierMinAggregateOutputType | null
    _max: MetierMaxAggregateOutputType | null
  }

  type GetMetierGroupByPayload<T extends MetierGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MetierGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MetierGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MetierGroupByOutputType[P]>
            : GetScalarType<T[P], MetierGroupByOutputType[P]>
        }
      >
    >


  export type MetierSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    categorieId?: boolean
    ordreAffichage?: boolean
    populaire?: boolean
    actif?: boolean
    createdAt?: boolean
    categorie?: boolean | CategorieMetierDefaultArgs<ExtArgs>
    artisanMetiers?: boolean | Metier$artisanMetiersArgs<ExtArgs>
    _count?: boolean | MetierCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["metier"]>

  export type MetierSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    categorieId?: boolean
    ordreAffichage?: boolean
    populaire?: boolean
    actif?: boolean
    createdAt?: boolean
    categorie?: boolean | CategorieMetierDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["metier"]>

  export type MetierSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    categorieId?: boolean
    ordreAffichage?: boolean
    populaire?: boolean
    actif?: boolean
    createdAt?: boolean
    categorie?: boolean | CategorieMetierDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["metier"]>

  export type MetierSelectScalar = {
    id?: boolean
    nom?: boolean
    slug?: boolean
    description?: boolean
    iconUrl?: boolean
    categorieId?: boolean
    ordreAffichage?: boolean
    populaire?: boolean
    actif?: boolean
    createdAt?: boolean
  }

  export type MetierOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nom" | "slug" | "description" | "iconUrl" | "categorieId" | "ordreAffichage" | "populaire" | "actif" | "createdAt", ExtArgs["result"]["metier"]>
  export type MetierInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categorie?: boolean | CategorieMetierDefaultArgs<ExtArgs>
    artisanMetiers?: boolean | Metier$artisanMetiersArgs<ExtArgs>
    _count?: boolean | MetierCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MetierIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categorie?: boolean | CategorieMetierDefaultArgs<ExtArgs>
  }
  export type MetierIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categorie?: boolean | CategorieMetierDefaultArgs<ExtArgs>
  }

  export type $MetierPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Metier"
    objects: {
      categorie: Prisma.$CategorieMetierPayload<ExtArgs>
      artisanMetiers: Prisma.$ArtisanMetierPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      nom: string
      slug: string
      description: string | null
      iconUrl: string | null
      categorieId: string
      ordreAffichage: number
      populaire: boolean
      actif: boolean
      createdAt: Date
    }, ExtArgs["result"]["metier"]>
    composites: {}
  }

  type MetierGetPayload<S extends boolean | null | undefined | MetierDefaultArgs> = $Result.GetResult<Prisma.$MetierPayload, S>

  type MetierCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MetierFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MetierCountAggregateInputType | true
    }

  export interface MetierDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Metier'], meta: { name: 'Metier' } }
    /**
     * Find zero or one Metier that matches the filter.
     * @param {MetierFindUniqueArgs} args - Arguments to find a Metier
     * @example
     * // Get one Metier
     * const metier = await prisma.metier.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MetierFindUniqueArgs>(args: SelectSubset<T, MetierFindUniqueArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Metier that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MetierFindUniqueOrThrowArgs} args - Arguments to find a Metier
     * @example
     * // Get one Metier
     * const metier = await prisma.metier.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MetierFindUniqueOrThrowArgs>(args: SelectSubset<T, MetierFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Metier that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierFindFirstArgs} args - Arguments to find a Metier
     * @example
     * // Get one Metier
     * const metier = await prisma.metier.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MetierFindFirstArgs>(args?: SelectSubset<T, MetierFindFirstArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Metier that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierFindFirstOrThrowArgs} args - Arguments to find a Metier
     * @example
     * // Get one Metier
     * const metier = await prisma.metier.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MetierFindFirstOrThrowArgs>(args?: SelectSubset<T, MetierFindFirstOrThrowArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Metiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Metiers
     * const metiers = await prisma.metier.findMany()
     * 
     * // Get first 10 Metiers
     * const metiers = await prisma.metier.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const metierWithIdOnly = await prisma.metier.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MetierFindManyArgs>(args?: SelectSubset<T, MetierFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Metier.
     * @param {MetierCreateArgs} args - Arguments to create a Metier.
     * @example
     * // Create one Metier
     * const Metier = await prisma.metier.create({
     *   data: {
     *     // ... data to create a Metier
     *   }
     * })
     * 
     */
    create<T extends MetierCreateArgs>(args: SelectSubset<T, MetierCreateArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Metiers.
     * @param {MetierCreateManyArgs} args - Arguments to create many Metiers.
     * @example
     * // Create many Metiers
     * const metier = await prisma.metier.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MetierCreateManyArgs>(args?: SelectSubset<T, MetierCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Metiers and returns the data saved in the database.
     * @param {MetierCreateManyAndReturnArgs} args - Arguments to create many Metiers.
     * @example
     * // Create many Metiers
     * const metier = await prisma.metier.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Metiers and only return the `id`
     * const metierWithIdOnly = await prisma.metier.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MetierCreateManyAndReturnArgs>(args?: SelectSubset<T, MetierCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Metier.
     * @param {MetierDeleteArgs} args - Arguments to delete one Metier.
     * @example
     * // Delete one Metier
     * const Metier = await prisma.metier.delete({
     *   where: {
     *     // ... filter to delete one Metier
     *   }
     * })
     * 
     */
    delete<T extends MetierDeleteArgs>(args: SelectSubset<T, MetierDeleteArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Metier.
     * @param {MetierUpdateArgs} args - Arguments to update one Metier.
     * @example
     * // Update one Metier
     * const metier = await prisma.metier.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MetierUpdateArgs>(args: SelectSubset<T, MetierUpdateArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Metiers.
     * @param {MetierDeleteManyArgs} args - Arguments to filter Metiers to delete.
     * @example
     * // Delete a few Metiers
     * const { count } = await prisma.metier.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MetierDeleteManyArgs>(args?: SelectSubset<T, MetierDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Metiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Metiers
     * const metier = await prisma.metier.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MetierUpdateManyArgs>(args: SelectSubset<T, MetierUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Metiers and returns the data updated in the database.
     * @param {MetierUpdateManyAndReturnArgs} args - Arguments to update many Metiers.
     * @example
     * // Update many Metiers
     * const metier = await prisma.metier.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Metiers and only return the `id`
     * const metierWithIdOnly = await prisma.metier.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MetierUpdateManyAndReturnArgs>(args: SelectSubset<T, MetierUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Metier.
     * @param {MetierUpsertArgs} args - Arguments to update or create a Metier.
     * @example
     * // Update or create a Metier
     * const metier = await prisma.metier.upsert({
     *   create: {
     *     // ... data to create a Metier
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Metier we want to update
     *   }
     * })
     */
    upsert<T extends MetierUpsertArgs>(args: SelectSubset<T, MetierUpsertArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Metiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierCountArgs} args - Arguments to filter Metiers to count.
     * @example
     * // Count the number of Metiers
     * const count = await prisma.metier.count({
     *   where: {
     *     // ... the filter for the Metiers we want to count
     *   }
     * })
    **/
    count<T extends MetierCountArgs>(
      args?: Subset<T, MetierCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MetierCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Metier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MetierAggregateArgs>(args: Subset<T, MetierAggregateArgs>): Prisma.PrismaPromise<GetMetierAggregateType<T>>

    /**
     * Group by Metier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MetierGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MetierGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MetierGroupByArgs['orderBy'] }
        : { orderBy?: MetierGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MetierGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMetierGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Metier model
   */
  readonly fields: MetierFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Metier.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MetierClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    categorie<T extends CategorieMetierDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CategorieMetierDefaultArgs<ExtArgs>>): Prisma__CategorieMetierClient<$Result.GetResult<Prisma.$CategorieMetierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    artisanMetiers<T extends Metier$artisanMetiersArgs<ExtArgs> = {}>(args?: Subset<T, Metier$artisanMetiersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Metier model
   */
  interface MetierFieldRefs {
    readonly id: FieldRef<"Metier", 'String'>
    readonly nom: FieldRef<"Metier", 'String'>
    readonly slug: FieldRef<"Metier", 'String'>
    readonly description: FieldRef<"Metier", 'String'>
    readonly iconUrl: FieldRef<"Metier", 'String'>
    readonly categorieId: FieldRef<"Metier", 'String'>
    readonly ordreAffichage: FieldRef<"Metier", 'Int'>
    readonly populaire: FieldRef<"Metier", 'Boolean'>
    readonly actif: FieldRef<"Metier", 'Boolean'>
    readonly createdAt: FieldRef<"Metier", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Metier findUnique
   */
  export type MetierFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * Filter, which Metier to fetch.
     */
    where: MetierWhereUniqueInput
  }

  /**
   * Metier findUniqueOrThrow
   */
  export type MetierFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * Filter, which Metier to fetch.
     */
    where: MetierWhereUniqueInput
  }

  /**
   * Metier findFirst
   */
  export type MetierFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * Filter, which Metier to fetch.
     */
    where?: MetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Metiers to fetch.
     */
    orderBy?: MetierOrderByWithRelationInput | MetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Metiers.
     */
    cursor?: MetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Metiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Metiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Metiers.
     */
    distinct?: MetierScalarFieldEnum | MetierScalarFieldEnum[]
  }

  /**
   * Metier findFirstOrThrow
   */
  export type MetierFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * Filter, which Metier to fetch.
     */
    where?: MetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Metiers to fetch.
     */
    orderBy?: MetierOrderByWithRelationInput | MetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Metiers.
     */
    cursor?: MetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Metiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Metiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Metiers.
     */
    distinct?: MetierScalarFieldEnum | MetierScalarFieldEnum[]
  }

  /**
   * Metier findMany
   */
  export type MetierFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * Filter, which Metiers to fetch.
     */
    where?: MetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Metiers to fetch.
     */
    orderBy?: MetierOrderByWithRelationInput | MetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Metiers.
     */
    cursor?: MetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Metiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Metiers.
     */
    skip?: number
    distinct?: MetierScalarFieldEnum | MetierScalarFieldEnum[]
  }

  /**
   * Metier create
   */
  export type MetierCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * The data needed to create a Metier.
     */
    data: XOR<MetierCreateInput, MetierUncheckedCreateInput>
  }

  /**
   * Metier createMany
   */
  export type MetierCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Metiers.
     */
    data: MetierCreateManyInput | MetierCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Metier createManyAndReturn
   */
  export type MetierCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * The data used to create many Metiers.
     */
    data: MetierCreateManyInput | MetierCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Metier update
   */
  export type MetierUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * The data needed to update a Metier.
     */
    data: XOR<MetierUpdateInput, MetierUncheckedUpdateInput>
    /**
     * Choose, which Metier to update.
     */
    where: MetierWhereUniqueInput
  }

  /**
   * Metier updateMany
   */
  export type MetierUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Metiers.
     */
    data: XOR<MetierUpdateManyMutationInput, MetierUncheckedUpdateManyInput>
    /**
     * Filter which Metiers to update
     */
    where?: MetierWhereInput
    /**
     * Limit how many Metiers to update.
     */
    limit?: number
  }

  /**
   * Metier updateManyAndReturn
   */
  export type MetierUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * The data used to update Metiers.
     */
    data: XOR<MetierUpdateManyMutationInput, MetierUncheckedUpdateManyInput>
    /**
     * Filter which Metiers to update
     */
    where?: MetierWhereInput
    /**
     * Limit how many Metiers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Metier upsert
   */
  export type MetierUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * The filter to search for the Metier to update in case it exists.
     */
    where: MetierWhereUniqueInput
    /**
     * In case the Metier found by the `where` argument doesn't exist, create a new Metier with this data.
     */
    create: XOR<MetierCreateInput, MetierUncheckedCreateInput>
    /**
     * In case the Metier was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MetierUpdateInput, MetierUncheckedUpdateInput>
  }

  /**
   * Metier delete
   */
  export type MetierDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
    /**
     * Filter which Metier to delete.
     */
    where: MetierWhereUniqueInput
  }

  /**
   * Metier deleteMany
   */
  export type MetierDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Metiers to delete
     */
    where?: MetierWhereInput
    /**
     * Limit how many Metiers to delete.
     */
    limit?: number
  }

  /**
   * Metier.artisanMetiers
   */
  export type Metier$artisanMetiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    where?: ArtisanMetierWhereInput
    orderBy?: ArtisanMetierOrderByWithRelationInput | ArtisanMetierOrderByWithRelationInput[]
    cursor?: ArtisanMetierWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtisanMetierScalarFieldEnum | ArtisanMetierScalarFieldEnum[]
  }

  /**
   * Metier without action
   */
  export type MetierDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Metier
     */
    select?: MetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Metier
     */
    omit?: MetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MetierInclude<ExtArgs> | null
  }


  /**
   * Model Artisan
   */

  export type AggregateArtisan = {
    _count: ArtisanCountAggregateOutputType | null
    _avg: ArtisanAvgAggregateOutputType | null
    _sum: ArtisanSumAggregateOutputType | null
    _min: ArtisanMinAggregateOutputType | null
    _max: ArtisanMaxAggregateOutputType | null
  }

  export type ArtisanAvgAggregateOutputType = {
    anneesExperience: number | null
    latitude: Decimal | null
    longitude: Decimal | null
    zoneInterventionKm: Decimal | null
    noteMoyenne: Decimal | null
    nombreAvis: number | null
    compteurDemandesMoisCourant: number | null
    nombreMissionsCompletees: number | null
    tauxCompletion: Decimal | null
    tauxReponseMoyen: number | null
    totalVuesProfil: number | null
    totalContacts: number | null
  }

  export type ArtisanSumAggregateOutputType = {
    anneesExperience: number | null
    latitude: Decimal | null
    longitude: Decimal | null
    zoneInterventionKm: Decimal | null
    noteMoyenne: Decimal | null
    nombreAvis: number | null
    compteurDemandesMoisCourant: number | null
    nombreMissionsCompletees: number | null
    tauxCompletion: Decimal | null
    tauxReponseMoyen: number | null
    totalVuesProfil: number | null
    totalContacts: number | null
  }

  export type ArtisanMinAggregateOutputType = {
    id: string | null
    userId: string | null
    nomEntreprise: string | null
    numeroIfu: string | null
    anneesExperience: number | null
    bio: string | null
    slogan: string | null
    photoProfilUrl: string | null
    photoCouvertureUrl: string | null
    adresseAtelier: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    villePrincipale: string | null
    zoneInterventionKm: Decimal | null
    noteMoyenne: Decimal | null
    nombreAvis: number | null
    compteurDemandesMoisCourant: number | null
    nombreMissionsCompletees: number | null
    tauxCompletion: Decimal | null
    tauxReponseMoyen: number | null
    disponible: boolean | null
    accepteUrgences: boolean | null
    accepteWeekend: boolean | null
    verified: boolean | null
    verifiedAt: Date | null
    verifiedBy: string | null
    abonnementType: $Enums.AbonnementType | null
    abonnementExpireAt: Date | null
    totalVuesProfil: number | null
    totalContacts: number | null
    statut: $Enums.StatutArtisan | null
    raisonSuspension: string | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type ArtisanMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    nomEntreprise: string | null
    numeroIfu: string | null
    anneesExperience: number | null
    bio: string | null
    slogan: string | null
    photoProfilUrl: string | null
    photoCouvertureUrl: string | null
    adresseAtelier: string | null
    latitude: Decimal | null
    longitude: Decimal | null
    villePrincipale: string | null
    zoneInterventionKm: Decimal | null
    noteMoyenne: Decimal | null
    nombreAvis: number | null
    compteurDemandesMoisCourant: number | null
    nombreMissionsCompletees: number | null
    tauxCompletion: Decimal | null
    tauxReponseMoyen: number | null
    disponible: boolean | null
    accepteUrgences: boolean | null
    accepteWeekend: boolean | null
    verified: boolean | null
    verifiedAt: Date | null
    verifiedBy: string | null
    abonnementType: $Enums.AbonnementType | null
    abonnementExpireAt: Date | null
    totalVuesProfil: number | null
    totalContacts: number | null
    statut: $Enums.StatutArtisan | null
    raisonSuspension: string | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type ArtisanCountAggregateOutputType = {
    id: number
    userId: number
    nomEntreprise: number
    numeroIfu: number
    anneesExperience: number
    bio: number
    slogan: number
    photoProfilUrl: number
    photoCouvertureUrl: number
    portfolioUrls: number
    adresseAtelier: number
    latitude: number
    longitude: number
    villePrincipale: number
    zoneInterventionKm: number
    villesIntervention: number
    noteMoyenne: number
    nombreAvis: number
    compteurDemandesMoisCourant: number
    nombreMissionsCompletees: number
    tauxCompletion: number
    tauxReponseMoyen: number
    disponible: number
    accepteUrgences: number
    accepteWeekend: number
    horairesTravail: number
    verified: number
    verifiedAt: number
    verifiedBy: number
    badges: number
    abonnementType: number
    abonnementExpireAt: number
    totalVuesProfil: number
    totalContacts: number
    statut: number
    raisonSuspension: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    _all: number
  }


  export type ArtisanAvgAggregateInputType = {
    anneesExperience?: true
    latitude?: true
    longitude?: true
    zoneInterventionKm?: true
    noteMoyenne?: true
    nombreAvis?: true
    compteurDemandesMoisCourant?: true
    nombreMissionsCompletees?: true
    tauxCompletion?: true
    tauxReponseMoyen?: true
    totalVuesProfil?: true
    totalContacts?: true
  }

  export type ArtisanSumAggregateInputType = {
    anneesExperience?: true
    latitude?: true
    longitude?: true
    zoneInterventionKm?: true
    noteMoyenne?: true
    nombreAvis?: true
    compteurDemandesMoisCourant?: true
    nombreMissionsCompletees?: true
    tauxCompletion?: true
    tauxReponseMoyen?: true
    totalVuesProfil?: true
    totalContacts?: true
  }

  export type ArtisanMinAggregateInputType = {
    id?: true
    userId?: true
    nomEntreprise?: true
    numeroIfu?: true
    anneesExperience?: true
    bio?: true
    slogan?: true
    photoProfilUrl?: true
    photoCouvertureUrl?: true
    adresseAtelier?: true
    latitude?: true
    longitude?: true
    villePrincipale?: true
    zoneInterventionKm?: true
    noteMoyenne?: true
    nombreAvis?: true
    compteurDemandesMoisCourant?: true
    nombreMissionsCompletees?: true
    tauxCompletion?: true
    tauxReponseMoyen?: true
    disponible?: true
    accepteUrgences?: true
    accepteWeekend?: true
    verified?: true
    verifiedAt?: true
    verifiedBy?: true
    abonnementType?: true
    abonnementExpireAt?: true
    totalVuesProfil?: true
    totalContacts?: true
    statut?: true
    raisonSuspension?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type ArtisanMaxAggregateInputType = {
    id?: true
    userId?: true
    nomEntreprise?: true
    numeroIfu?: true
    anneesExperience?: true
    bio?: true
    slogan?: true
    photoProfilUrl?: true
    photoCouvertureUrl?: true
    adresseAtelier?: true
    latitude?: true
    longitude?: true
    villePrincipale?: true
    zoneInterventionKm?: true
    noteMoyenne?: true
    nombreAvis?: true
    compteurDemandesMoisCourant?: true
    nombreMissionsCompletees?: true
    tauxCompletion?: true
    tauxReponseMoyen?: true
    disponible?: true
    accepteUrgences?: true
    accepteWeekend?: true
    verified?: true
    verifiedAt?: true
    verifiedBy?: true
    abonnementType?: true
    abonnementExpireAt?: true
    totalVuesProfil?: true
    totalContacts?: true
    statut?: true
    raisonSuspension?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type ArtisanCountAggregateInputType = {
    id?: true
    userId?: true
    nomEntreprise?: true
    numeroIfu?: true
    anneesExperience?: true
    bio?: true
    slogan?: true
    photoProfilUrl?: true
    photoCouvertureUrl?: true
    portfolioUrls?: true
    adresseAtelier?: true
    latitude?: true
    longitude?: true
    villePrincipale?: true
    zoneInterventionKm?: true
    villesIntervention?: true
    noteMoyenne?: true
    nombreAvis?: true
    compteurDemandesMoisCourant?: true
    nombreMissionsCompletees?: true
    tauxCompletion?: true
    tauxReponseMoyen?: true
    disponible?: true
    accepteUrgences?: true
    accepteWeekend?: true
    horairesTravail?: true
    verified?: true
    verifiedAt?: true
    verifiedBy?: true
    badges?: true
    abonnementType?: true
    abonnementExpireAt?: true
    totalVuesProfil?: true
    totalContacts?: true
    statut?: true
    raisonSuspension?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    _all?: true
  }

  export type ArtisanAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artisan to aggregate.
     */
    where?: ArtisanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artisans to fetch.
     */
    orderBy?: ArtisanOrderByWithRelationInput | ArtisanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ArtisanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artisans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artisans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Artisans
    **/
    _count?: true | ArtisanCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ArtisanAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ArtisanSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ArtisanMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ArtisanMaxAggregateInputType
  }

  export type GetArtisanAggregateType<T extends ArtisanAggregateArgs> = {
        [P in keyof T & keyof AggregateArtisan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateArtisan[P]>
      : GetScalarType<T[P], AggregateArtisan[P]>
  }




  export type ArtisanGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtisanWhereInput
    orderBy?: ArtisanOrderByWithAggregationInput | ArtisanOrderByWithAggregationInput[]
    by: ArtisanScalarFieldEnum[] | ArtisanScalarFieldEnum
    having?: ArtisanScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ArtisanCountAggregateInputType | true
    _avg?: ArtisanAvgAggregateInputType
    _sum?: ArtisanSumAggregateInputType
    _min?: ArtisanMinAggregateInputType
    _max?: ArtisanMaxAggregateInputType
  }

  export type ArtisanGroupByOutputType = {
    id: string
    userId: string
    nomEntreprise: string | null
    numeroIfu: string | null
    anneesExperience: number
    bio: string | null
    slogan: string | null
    photoProfilUrl: string | null
    photoCouvertureUrl: string | null
    portfolioUrls: JsonValue | null
    adresseAtelier: string | null
    latitude: Decimal
    longitude: Decimal
    villePrincipale: string
    zoneInterventionKm: Decimal
    villesIntervention: JsonValue | null
    noteMoyenne: Decimal
    nombreAvis: number
    compteurDemandesMoisCourant: number
    nombreMissionsCompletees: number
    tauxCompletion: Decimal
    tauxReponseMoyen: number | null
    disponible: boolean
    accepteUrgences: boolean
    accepteWeekend: boolean
    horairesTravail: JsonValue | null
    verified: boolean
    verifiedAt: Date | null
    verifiedBy: string | null
    badges: JsonValue | null
    abonnementType: $Enums.AbonnementType
    abonnementExpireAt: Date | null
    totalVuesProfil: number
    totalContacts: number
    statut: $Enums.StatutArtisan
    raisonSuspension: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    _count: ArtisanCountAggregateOutputType | null
    _avg: ArtisanAvgAggregateOutputType | null
    _sum: ArtisanSumAggregateOutputType | null
    _min: ArtisanMinAggregateOutputType | null
    _max: ArtisanMaxAggregateOutputType | null
  }

  type GetArtisanGroupByPayload<T extends ArtisanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ArtisanGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ArtisanGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ArtisanGroupByOutputType[P]>
            : GetScalarType<T[P], ArtisanGroupByOutputType[P]>
        }
      >
    >


  export type ArtisanSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    nomEntreprise?: boolean
    numeroIfu?: boolean
    anneesExperience?: boolean
    bio?: boolean
    slogan?: boolean
    photoProfilUrl?: boolean
    photoCouvertureUrl?: boolean
    portfolioUrls?: boolean
    adresseAtelier?: boolean
    latitude?: boolean
    longitude?: boolean
    villePrincipale?: boolean
    zoneInterventionKm?: boolean
    villesIntervention?: boolean
    noteMoyenne?: boolean
    nombreAvis?: boolean
    compteurDemandesMoisCourant?: boolean
    nombreMissionsCompletees?: boolean
    tauxCompletion?: boolean
    tauxReponseMoyen?: boolean
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: boolean
    verified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    badges?: boolean
    abonnementType?: boolean
    abonnementExpireAt?: boolean
    totalVuesProfil?: boolean
    totalContacts?: boolean
    statut?: boolean
    raisonSuspension?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    verifiedByUser?: boolean | Artisan$verifiedByUserArgs<ExtArgs>
    metiers?: boolean | Artisan$metiersArgs<ExtArgs>
    _count?: boolean | ArtisanCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["artisan"]>

  export type ArtisanSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    nomEntreprise?: boolean
    numeroIfu?: boolean
    anneesExperience?: boolean
    bio?: boolean
    slogan?: boolean
    photoProfilUrl?: boolean
    photoCouvertureUrl?: boolean
    portfolioUrls?: boolean
    adresseAtelier?: boolean
    latitude?: boolean
    longitude?: boolean
    villePrincipale?: boolean
    zoneInterventionKm?: boolean
    villesIntervention?: boolean
    noteMoyenne?: boolean
    nombreAvis?: boolean
    compteurDemandesMoisCourant?: boolean
    nombreMissionsCompletees?: boolean
    tauxCompletion?: boolean
    tauxReponseMoyen?: boolean
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: boolean
    verified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    badges?: boolean
    abonnementType?: boolean
    abonnementExpireAt?: boolean
    totalVuesProfil?: boolean
    totalContacts?: boolean
    statut?: boolean
    raisonSuspension?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    verifiedByUser?: boolean | Artisan$verifiedByUserArgs<ExtArgs>
  }, ExtArgs["result"]["artisan"]>

  export type ArtisanSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    nomEntreprise?: boolean
    numeroIfu?: boolean
    anneesExperience?: boolean
    bio?: boolean
    slogan?: boolean
    photoProfilUrl?: boolean
    photoCouvertureUrl?: boolean
    portfolioUrls?: boolean
    adresseAtelier?: boolean
    latitude?: boolean
    longitude?: boolean
    villePrincipale?: boolean
    zoneInterventionKm?: boolean
    villesIntervention?: boolean
    noteMoyenne?: boolean
    nombreAvis?: boolean
    compteurDemandesMoisCourant?: boolean
    nombreMissionsCompletees?: boolean
    tauxCompletion?: boolean
    tauxReponseMoyen?: boolean
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: boolean
    verified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    badges?: boolean
    abonnementType?: boolean
    abonnementExpireAt?: boolean
    totalVuesProfil?: boolean
    totalContacts?: boolean
    statut?: boolean
    raisonSuspension?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    verifiedByUser?: boolean | Artisan$verifiedByUserArgs<ExtArgs>
  }, ExtArgs["result"]["artisan"]>

  export type ArtisanSelectScalar = {
    id?: boolean
    userId?: boolean
    nomEntreprise?: boolean
    numeroIfu?: boolean
    anneesExperience?: boolean
    bio?: boolean
    slogan?: boolean
    photoProfilUrl?: boolean
    photoCouvertureUrl?: boolean
    portfolioUrls?: boolean
    adresseAtelier?: boolean
    latitude?: boolean
    longitude?: boolean
    villePrincipale?: boolean
    zoneInterventionKm?: boolean
    villesIntervention?: boolean
    noteMoyenne?: boolean
    nombreAvis?: boolean
    compteurDemandesMoisCourant?: boolean
    nombreMissionsCompletees?: boolean
    tauxCompletion?: boolean
    tauxReponseMoyen?: boolean
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: boolean
    verified?: boolean
    verifiedAt?: boolean
    verifiedBy?: boolean
    badges?: boolean
    abonnementType?: boolean
    abonnementExpireAt?: boolean
    totalVuesProfil?: boolean
    totalContacts?: boolean
    statut?: boolean
    raisonSuspension?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }

  export type ArtisanOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "nomEntreprise" | "numeroIfu" | "anneesExperience" | "bio" | "slogan" | "photoProfilUrl" | "photoCouvertureUrl" | "portfolioUrls" | "adresseAtelier" | "latitude" | "longitude" | "villePrincipale" | "zoneInterventionKm" | "villesIntervention" | "noteMoyenne" | "nombreAvis" | "compteurDemandesMoisCourant" | "nombreMissionsCompletees" | "tauxCompletion" | "tauxReponseMoyen" | "disponible" | "accepteUrgences" | "accepteWeekend" | "horairesTravail" | "verified" | "verifiedAt" | "verifiedBy" | "badges" | "abonnementType" | "abonnementExpireAt" | "totalVuesProfil" | "totalContacts" | "statut" | "raisonSuspension" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["artisan"]>
  export type ArtisanInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    verifiedByUser?: boolean | Artisan$verifiedByUserArgs<ExtArgs>
    metiers?: boolean | Artisan$metiersArgs<ExtArgs>
    _count?: boolean | ArtisanCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ArtisanIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    verifiedByUser?: boolean | Artisan$verifiedByUserArgs<ExtArgs>
  }
  export type ArtisanIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    verifiedByUser?: boolean | Artisan$verifiedByUserArgs<ExtArgs>
  }

  export type $ArtisanPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Artisan"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      verifiedByUser: Prisma.$UserPayload<ExtArgs> | null
      metiers: Prisma.$ArtisanMetierPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      nomEntreprise: string | null
      numeroIfu: string | null
      anneesExperience: number
      bio: string | null
      slogan: string | null
      photoProfilUrl: string | null
      photoCouvertureUrl: string | null
      portfolioUrls: Prisma.JsonValue | null
      adresseAtelier: string | null
      latitude: Prisma.Decimal
      longitude: Prisma.Decimal
      villePrincipale: string
      zoneInterventionKm: Prisma.Decimal
      villesIntervention: Prisma.JsonValue | null
      noteMoyenne: Prisma.Decimal
      nombreAvis: number
      compteurDemandesMoisCourant: number
      nombreMissionsCompletees: number
      tauxCompletion: Prisma.Decimal
      tauxReponseMoyen: number | null
      disponible: boolean
      accepteUrgences: boolean
      accepteWeekend: boolean
      horairesTravail: Prisma.JsonValue | null
      verified: boolean
      verifiedAt: Date | null
      verifiedBy: string | null
      badges: Prisma.JsonValue | null
      abonnementType: $Enums.AbonnementType
      abonnementExpireAt: Date | null
      totalVuesProfil: number
      totalContacts: number
      statut: $Enums.StatutArtisan
      raisonSuspension: string | null
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
    }, ExtArgs["result"]["artisan"]>
    composites: {}
  }

  type ArtisanGetPayload<S extends boolean | null | undefined | ArtisanDefaultArgs> = $Result.GetResult<Prisma.$ArtisanPayload, S>

  type ArtisanCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ArtisanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ArtisanCountAggregateInputType | true
    }

  export interface ArtisanDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Artisan'], meta: { name: 'Artisan' } }
    /**
     * Find zero or one Artisan that matches the filter.
     * @param {ArtisanFindUniqueArgs} args - Arguments to find a Artisan
     * @example
     * // Get one Artisan
     * const artisan = await prisma.artisan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ArtisanFindUniqueArgs>(args: SelectSubset<T, ArtisanFindUniqueArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Artisan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ArtisanFindUniqueOrThrowArgs} args - Arguments to find a Artisan
     * @example
     * // Get one Artisan
     * const artisan = await prisma.artisan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ArtisanFindUniqueOrThrowArgs>(args: SelectSubset<T, ArtisanFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Artisan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanFindFirstArgs} args - Arguments to find a Artisan
     * @example
     * // Get one Artisan
     * const artisan = await prisma.artisan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ArtisanFindFirstArgs>(args?: SelectSubset<T, ArtisanFindFirstArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Artisan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanFindFirstOrThrowArgs} args - Arguments to find a Artisan
     * @example
     * // Get one Artisan
     * const artisan = await prisma.artisan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ArtisanFindFirstOrThrowArgs>(args?: SelectSubset<T, ArtisanFindFirstOrThrowArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Artisans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Artisans
     * const artisans = await prisma.artisan.findMany()
     * 
     * // Get first 10 Artisans
     * const artisans = await prisma.artisan.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const artisanWithIdOnly = await prisma.artisan.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ArtisanFindManyArgs>(args?: SelectSubset<T, ArtisanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Artisan.
     * @param {ArtisanCreateArgs} args - Arguments to create a Artisan.
     * @example
     * // Create one Artisan
     * const Artisan = await prisma.artisan.create({
     *   data: {
     *     // ... data to create a Artisan
     *   }
     * })
     * 
     */
    create<T extends ArtisanCreateArgs>(args: SelectSubset<T, ArtisanCreateArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Artisans.
     * @param {ArtisanCreateManyArgs} args - Arguments to create many Artisans.
     * @example
     * // Create many Artisans
     * const artisan = await prisma.artisan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ArtisanCreateManyArgs>(args?: SelectSubset<T, ArtisanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Artisans and returns the data saved in the database.
     * @param {ArtisanCreateManyAndReturnArgs} args - Arguments to create many Artisans.
     * @example
     * // Create many Artisans
     * const artisan = await prisma.artisan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Artisans and only return the `id`
     * const artisanWithIdOnly = await prisma.artisan.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ArtisanCreateManyAndReturnArgs>(args?: SelectSubset<T, ArtisanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Artisan.
     * @param {ArtisanDeleteArgs} args - Arguments to delete one Artisan.
     * @example
     * // Delete one Artisan
     * const Artisan = await prisma.artisan.delete({
     *   where: {
     *     // ... filter to delete one Artisan
     *   }
     * })
     * 
     */
    delete<T extends ArtisanDeleteArgs>(args: SelectSubset<T, ArtisanDeleteArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Artisan.
     * @param {ArtisanUpdateArgs} args - Arguments to update one Artisan.
     * @example
     * // Update one Artisan
     * const artisan = await prisma.artisan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ArtisanUpdateArgs>(args: SelectSubset<T, ArtisanUpdateArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Artisans.
     * @param {ArtisanDeleteManyArgs} args - Arguments to filter Artisans to delete.
     * @example
     * // Delete a few Artisans
     * const { count } = await prisma.artisan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ArtisanDeleteManyArgs>(args?: SelectSubset<T, ArtisanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artisans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Artisans
     * const artisan = await prisma.artisan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ArtisanUpdateManyArgs>(args: SelectSubset<T, ArtisanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artisans and returns the data updated in the database.
     * @param {ArtisanUpdateManyAndReturnArgs} args - Arguments to update many Artisans.
     * @example
     * // Update many Artisans
     * const artisan = await prisma.artisan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Artisans and only return the `id`
     * const artisanWithIdOnly = await prisma.artisan.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ArtisanUpdateManyAndReturnArgs>(args: SelectSubset<T, ArtisanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Artisan.
     * @param {ArtisanUpsertArgs} args - Arguments to update or create a Artisan.
     * @example
     * // Update or create a Artisan
     * const artisan = await prisma.artisan.upsert({
     *   create: {
     *     // ... data to create a Artisan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Artisan we want to update
     *   }
     * })
     */
    upsert<T extends ArtisanUpsertArgs>(args: SelectSubset<T, ArtisanUpsertArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Artisans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanCountArgs} args - Arguments to filter Artisans to count.
     * @example
     * // Count the number of Artisans
     * const count = await prisma.artisan.count({
     *   where: {
     *     // ... the filter for the Artisans we want to count
     *   }
     * })
    **/
    count<T extends ArtisanCountArgs>(
      args?: Subset<T, ArtisanCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ArtisanCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Artisan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ArtisanAggregateArgs>(args: Subset<T, ArtisanAggregateArgs>): Prisma.PrismaPromise<GetArtisanAggregateType<T>>

    /**
     * Group by Artisan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ArtisanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ArtisanGroupByArgs['orderBy'] }
        : { orderBy?: ArtisanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ArtisanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetArtisanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Artisan model
   */
  readonly fields: ArtisanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Artisan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ArtisanClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    verifiedByUser<T extends Artisan$verifiedByUserArgs<ExtArgs> = {}>(args?: Subset<T, Artisan$verifiedByUserArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    metiers<T extends Artisan$metiersArgs<ExtArgs> = {}>(args?: Subset<T, Artisan$metiersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Artisan model
   */
  interface ArtisanFieldRefs {
    readonly id: FieldRef<"Artisan", 'String'>
    readonly userId: FieldRef<"Artisan", 'String'>
    readonly nomEntreprise: FieldRef<"Artisan", 'String'>
    readonly numeroIfu: FieldRef<"Artisan", 'String'>
    readonly anneesExperience: FieldRef<"Artisan", 'Int'>
    readonly bio: FieldRef<"Artisan", 'String'>
    readonly slogan: FieldRef<"Artisan", 'String'>
    readonly photoProfilUrl: FieldRef<"Artisan", 'String'>
    readonly photoCouvertureUrl: FieldRef<"Artisan", 'String'>
    readonly portfolioUrls: FieldRef<"Artisan", 'Json'>
    readonly adresseAtelier: FieldRef<"Artisan", 'String'>
    readonly latitude: FieldRef<"Artisan", 'Decimal'>
    readonly longitude: FieldRef<"Artisan", 'Decimal'>
    readonly villePrincipale: FieldRef<"Artisan", 'String'>
    readonly zoneInterventionKm: FieldRef<"Artisan", 'Decimal'>
    readonly villesIntervention: FieldRef<"Artisan", 'Json'>
    readonly noteMoyenne: FieldRef<"Artisan", 'Decimal'>
    readonly nombreAvis: FieldRef<"Artisan", 'Int'>
    readonly compteurDemandesMoisCourant: FieldRef<"Artisan", 'Int'>
    readonly nombreMissionsCompletees: FieldRef<"Artisan", 'Int'>
    readonly tauxCompletion: FieldRef<"Artisan", 'Decimal'>
    readonly tauxReponseMoyen: FieldRef<"Artisan", 'Int'>
    readonly disponible: FieldRef<"Artisan", 'Boolean'>
    readonly accepteUrgences: FieldRef<"Artisan", 'Boolean'>
    readonly accepteWeekend: FieldRef<"Artisan", 'Boolean'>
    readonly horairesTravail: FieldRef<"Artisan", 'Json'>
    readonly verified: FieldRef<"Artisan", 'Boolean'>
    readonly verifiedAt: FieldRef<"Artisan", 'DateTime'>
    readonly verifiedBy: FieldRef<"Artisan", 'String'>
    readonly badges: FieldRef<"Artisan", 'Json'>
    readonly abonnementType: FieldRef<"Artisan", 'AbonnementType'>
    readonly abonnementExpireAt: FieldRef<"Artisan", 'DateTime'>
    readonly totalVuesProfil: FieldRef<"Artisan", 'Int'>
    readonly totalContacts: FieldRef<"Artisan", 'Int'>
    readonly statut: FieldRef<"Artisan", 'StatutArtisan'>
    readonly raisonSuspension: FieldRef<"Artisan", 'String'>
    readonly createdAt: FieldRef<"Artisan", 'DateTime'>
    readonly updatedAt: FieldRef<"Artisan", 'DateTime'>
    readonly deletedAt: FieldRef<"Artisan", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Artisan findUnique
   */
  export type ArtisanFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * Filter, which Artisan to fetch.
     */
    where: ArtisanWhereUniqueInput
  }

  /**
   * Artisan findUniqueOrThrow
   */
  export type ArtisanFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * Filter, which Artisan to fetch.
     */
    where: ArtisanWhereUniqueInput
  }

  /**
   * Artisan findFirst
   */
  export type ArtisanFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * Filter, which Artisan to fetch.
     */
    where?: ArtisanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artisans to fetch.
     */
    orderBy?: ArtisanOrderByWithRelationInput | ArtisanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artisans.
     */
    cursor?: ArtisanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artisans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artisans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artisans.
     */
    distinct?: ArtisanScalarFieldEnum | ArtisanScalarFieldEnum[]
  }

  /**
   * Artisan findFirstOrThrow
   */
  export type ArtisanFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * Filter, which Artisan to fetch.
     */
    where?: ArtisanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artisans to fetch.
     */
    orderBy?: ArtisanOrderByWithRelationInput | ArtisanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artisans.
     */
    cursor?: ArtisanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artisans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artisans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artisans.
     */
    distinct?: ArtisanScalarFieldEnum | ArtisanScalarFieldEnum[]
  }

  /**
   * Artisan findMany
   */
  export type ArtisanFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * Filter, which Artisans to fetch.
     */
    where?: ArtisanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artisans to fetch.
     */
    orderBy?: ArtisanOrderByWithRelationInput | ArtisanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Artisans.
     */
    cursor?: ArtisanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artisans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artisans.
     */
    skip?: number
    distinct?: ArtisanScalarFieldEnum | ArtisanScalarFieldEnum[]
  }

  /**
   * Artisan create
   */
  export type ArtisanCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * The data needed to create a Artisan.
     */
    data: XOR<ArtisanCreateInput, ArtisanUncheckedCreateInput>
  }

  /**
   * Artisan createMany
   */
  export type ArtisanCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Artisans.
     */
    data: ArtisanCreateManyInput | ArtisanCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Artisan createManyAndReturn
   */
  export type ArtisanCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * The data used to create many Artisans.
     */
    data: ArtisanCreateManyInput | ArtisanCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Artisan update
   */
  export type ArtisanUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * The data needed to update a Artisan.
     */
    data: XOR<ArtisanUpdateInput, ArtisanUncheckedUpdateInput>
    /**
     * Choose, which Artisan to update.
     */
    where: ArtisanWhereUniqueInput
  }

  /**
   * Artisan updateMany
   */
  export type ArtisanUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Artisans.
     */
    data: XOR<ArtisanUpdateManyMutationInput, ArtisanUncheckedUpdateManyInput>
    /**
     * Filter which Artisans to update
     */
    where?: ArtisanWhereInput
    /**
     * Limit how many Artisans to update.
     */
    limit?: number
  }

  /**
   * Artisan updateManyAndReturn
   */
  export type ArtisanUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * The data used to update Artisans.
     */
    data: XOR<ArtisanUpdateManyMutationInput, ArtisanUncheckedUpdateManyInput>
    /**
     * Filter which Artisans to update
     */
    where?: ArtisanWhereInput
    /**
     * Limit how many Artisans to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Artisan upsert
   */
  export type ArtisanUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * The filter to search for the Artisan to update in case it exists.
     */
    where: ArtisanWhereUniqueInput
    /**
     * In case the Artisan found by the `where` argument doesn't exist, create a new Artisan with this data.
     */
    create: XOR<ArtisanCreateInput, ArtisanUncheckedCreateInput>
    /**
     * In case the Artisan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ArtisanUpdateInput, ArtisanUncheckedUpdateInput>
  }

  /**
   * Artisan delete
   */
  export type ArtisanDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
    /**
     * Filter which Artisan to delete.
     */
    where: ArtisanWhereUniqueInput
  }

  /**
   * Artisan deleteMany
   */
  export type ArtisanDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artisans to delete
     */
    where?: ArtisanWhereInput
    /**
     * Limit how many Artisans to delete.
     */
    limit?: number
  }

  /**
   * Artisan.verifiedByUser
   */
  export type Artisan$verifiedByUserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * Artisan.metiers
   */
  export type Artisan$metiersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    where?: ArtisanMetierWhereInput
    orderBy?: ArtisanMetierOrderByWithRelationInput | ArtisanMetierOrderByWithRelationInput[]
    cursor?: ArtisanMetierWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtisanMetierScalarFieldEnum | ArtisanMetierScalarFieldEnum[]
  }

  /**
   * Artisan without action
   */
  export type ArtisanDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artisan
     */
    select?: ArtisanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artisan
     */
    omit?: ArtisanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanInclude<ExtArgs> | null
  }


  /**
   * Model ArtisanMetier
   */

  export type AggregateArtisanMetier = {
    _count: ArtisanMetierCountAggregateOutputType | null
    _avg: ArtisanMetierAvgAggregateOutputType | null
    _sum: ArtisanMetierSumAggregateOutputType | null
    _min: ArtisanMetierMinAggregateOutputType | null
    _max: ArtisanMetierMaxAggregateOutputType | null
  }

  export type ArtisanMetierAvgAggregateOutputType = {
    anneesExperience: number | null
    tarifHoraire: Decimal | null
  }

  export type ArtisanMetierSumAggregateOutputType = {
    anneesExperience: number | null
    tarifHoraire: Decimal | null
  }

  export type ArtisanMetierMinAggregateOutputType = {
    id: string | null
    artisanId: string | null
    metierId: string | null
    estPrincipal: boolean | null
    anneesExperience: number | null
    certifie: boolean | null
    tarifHoraire: Decimal | null
    description: string | null
    createdAt: Date | null
  }

  export type ArtisanMetierMaxAggregateOutputType = {
    id: string | null
    artisanId: string | null
    metierId: string | null
    estPrincipal: boolean | null
    anneesExperience: number | null
    certifie: boolean | null
    tarifHoraire: Decimal | null
    description: string | null
    createdAt: Date | null
  }

  export type ArtisanMetierCountAggregateOutputType = {
    id: number
    artisanId: number
    metierId: number
    estPrincipal: number
    anneesExperience: number
    certifie: number
    tarifHoraire: number
    description: number
    createdAt: number
    _all: number
  }


  export type ArtisanMetierAvgAggregateInputType = {
    anneesExperience?: true
    tarifHoraire?: true
  }

  export type ArtisanMetierSumAggregateInputType = {
    anneesExperience?: true
    tarifHoraire?: true
  }

  export type ArtisanMetierMinAggregateInputType = {
    id?: true
    artisanId?: true
    metierId?: true
    estPrincipal?: true
    anneesExperience?: true
    certifie?: true
    tarifHoraire?: true
    description?: true
    createdAt?: true
  }

  export type ArtisanMetierMaxAggregateInputType = {
    id?: true
    artisanId?: true
    metierId?: true
    estPrincipal?: true
    anneesExperience?: true
    certifie?: true
    tarifHoraire?: true
    description?: true
    createdAt?: true
  }

  export type ArtisanMetierCountAggregateInputType = {
    id?: true
    artisanId?: true
    metierId?: true
    estPrincipal?: true
    anneesExperience?: true
    certifie?: true
    tarifHoraire?: true
    description?: true
    createdAt?: true
    _all?: true
  }

  export type ArtisanMetierAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ArtisanMetier to aggregate.
     */
    where?: ArtisanMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ArtisanMetiers to fetch.
     */
    orderBy?: ArtisanMetierOrderByWithRelationInput | ArtisanMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ArtisanMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ArtisanMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ArtisanMetiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ArtisanMetiers
    **/
    _count?: true | ArtisanMetierCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ArtisanMetierAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ArtisanMetierSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ArtisanMetierMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ArtisanMetierMaxAggregateInputType
  }

  export type GetArtisanMetierAggregateType<T extends ArtisanMetierAggregateArgs> = {
        [P in keyof T & keyof AggregateArtisanMetier]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateArtisanMetier[P]>
      : GetScalarType<T[P], AggregateArtisanMetier[P]>
  }




  export type ArtisanMetierGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtisanMetierWhereInput
    orderBy?: ArtisanMetierOrderByWithAggregationInput | ArtisanMetierOrderByWithAggregationInput[]
    by: ArtisanMetierScalarFieldEnum[] | ArtisanMetierScalarFieldEnum
    having?: ArtisanMetierScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ArtisanMetierCountAggregateInputType | true
    _avg?: ArtisanMetierAvgAggregateInputType
    _sum?: ArtisanMetierSumAggregateInputType
    _min?: ArtisanMetierMinAggregateInputType
    _max?: ArtisanMetierMaxAggregateInputType
  }

  export type ArtisanMetierGroupByOutputType = {
    id: string
    artisanId: string
    metierId: string
    estPrincipal: boolean
    anneesExperience: number | null
    certifie: boolean
    tarifHoraire: Decimal | null
    description: string | null
    createdAt: Date
    _count: ArtisanMetierCountAggregateOutputType | null
    _avg: ArtisanMetierAvgAggregateOutputType | null
    _sum: ArtisanMetierSumAggregateOutputType | null
    _min: ArtisanMetierMinAggregateOutputType | null
    _max: ArtisanMetierMaxAggregateOutputType | null
  }

  type GetArtisanMetierGroupByPayload<T extends ArtisanMetierGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ArtisanMetierGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ArtisanMetierGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ArtisanMetierGroupByOutputType[P]>
            : GetScalarType<T[P], ArtisanMetierGroupByOutputType[P]>
        }
      >
    >


  export type ArtisanMetierSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artisanId?: boolean
    metierId?: boolean
    estPrincipal?: boolean
    anneesExperience?: boolean
    certifie?: boolean
    tarifHoraire?: boolean
    description?: boolean
    createdAt?: boolean
    artisan?: boolean | ArtisanDefaultArgs<ExtArgs>
    metier?: boolean | MetierDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["artisanMetier"]>

  export type ArtisanMetierSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artisanId?: boolean
    metierId?: boolean
    estPrincipal?: boolean
    anneesExperience?: boolean
    certifie?: boolean
    tarifHoraire?: boolean
    description?: boolean
    createdAt?: boolean
    artisan?: boolean | ArtisanDefaultArgs<ExtArgs>
    metier?: boolean | MetierDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["artisanMetier"]>

  export type ArtisanMetierSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    artisanId?: boolean
    metierId?: boolean
    estPrincipal?: boolean
    anneesExperience?: boolean
    certifie?: boolean
    tarifHoraire?: boolean
    description?: boolean
    createdAt?: boolean
    artisan?: boolean | ArtisanDefaultArgs<ExtArgs>
    metier?: boolean | MetierDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["artisanMetier"]>

  export type ArtisanMetierSelectScalar = {
    id?: boolean
    artisanId?: boolean
    metierId?: boolean
    estPrincipal?: boolean
    anneesExperience?: boolean
    certifie?: boolean
    tarifHoraire?: boolean
    description?: boolean
    createdAt?: boolean
  }

  export type ArtisanMetierOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "artisanId" | "metierId" | "estPrincipal" | "anneesExperience" | "certifie" | "tarifHoraire" | "description" | "createdAt", ExtArgs["result"]["artisanMetier"]>
  export type ArtisanMetierInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artisan?: boolean | ArtisanDefaultArgs<ExtArgs>
    metier?: boolean | MetierDefaultArgs<ExtArgs>
  }
  export type ArtisanMetierIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artisan?: boolean | ArtisanDefaultArgs<ExtArgs>
    metier?: boolean | MetierDefaultArgs<ExtArgs>
  }
  export type ArtisanMetierIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artisan?: boolean | ArtisanDefaultArgs<ExtArgs>
    metier?: boolean | MetierDefaultArgs<ExtArgs>
  }

  export type $ArtisanMetierPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ArtisanMetier"
    objects: {
      artisan: Prisma.$ArtisanPayload<ExtArgs>
      metier: Prisma.$MetierPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      artisanId: string
      metierId: string
      estPrincipal: boolean
      anneesExperience: number | null
      certifie: boolean
      tarifHoraire: Prisma.Decimal | null
      description: string | null
      createdAt: Date
    }, ExtArgs["result"]["artisanMetier"]>
    composites: {}
  }

  type ArtisanMetierGetPayload<S extends boolean | null | undefined | ArtisanMetierDefaultArgs> = $Result.GetResult<Prisma.$ArtisanMetierPayload, S>

  type ArtisanMetierCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ArtisanMetierFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ArtisanMetierCountAggregateInputType | true
    }

  export interface ArtisanMetierDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ArtisanMetier'], meta: { name: 'ArtisanMetier' } }
    /**
     * Find zero or one ArtisanMetier that matches the filter.
     * @param {ArtisanMetierFindUniqueArgs} args - Arguments to find a ArtisanMetier
     * @example
     * // Get one ArtisanMetier
     * const artisanMetier = await prisma.artisanMetier.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ArtisanMetierFindUniqueArgs>(args: SelectSubset<T, ArtisanMetierFindUniqueArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ArtisanMetier that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ArtisanMetierFindUniqueOrThrowArgs} args - Arguments to find a ArtisanMetier
     * @example
     * // Get one ArtisanMetier
     * const artisanMetier = await prisma.artisanMetier.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ArtisanMetierFindUniqueOrThrowArgs>(args: SelectSubset<T, ArtisanMetierFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ArtisanMetier that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierFindFirstArgs} args - Arguments to find a ArtisanMetier
     * @example
     * // Get one ArtisanMetier
     * const artisanMetier = await prisma.artisanMetier.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ArtisanMetierFindFirstArgs>(args?: SelectSubset<T, ArtisanMetierFindFirstArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ArtisanMetier that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierFindFirstOrThrowArgs} args - Arguments to find a ArtisanMetier
     * @example
     * // Get one ArtisanMetier
     * const artisanMetier = await prisma.artisanMetier.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ArtisanMetierFindFirstOrThrowArgs>(args?: SelectSubset<T, ArtisanMetierFindFirstOrThrowArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ArtisanMetiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ArtisanMetiers
     * const artisanMetiers = await prisma.artisanMetier.findMany()
     * 
     * // Get first 10 ArtisanMetiers
     * const artisanMetiers = await prisma.artisanMetier.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const artisanMetierWithIdOnly = await prisma.artisanMetier.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ArtisanMetierFindManyArgs>(args?: SelectSubset<T, ArtisanMetierFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ArtisanMetier.
     * @param {ArtisanMetierCreateArgs} args - Arguments to create a ArtisanMetier.
     * @example
     * // Create one ArtisanMetier
     * const ArtisanMetier = await prisma.artisanMetier.create({
     *   data: {
     *     // ... data to create a ArtisanMetier
     *   }
     * })
     * 
     */
    create<T extends ArtisanMetierCreateArgs>(args: SelectSubset<T, ArtisanMetierCreateArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ArtisanMetiers.
     * @param {ArtisanMetierCreateManyArgs} args - Arguments to create many ArtisanMetiers.
     * @example
     * // Create many ArtisanMetiers
     * const artisanMetier = await prisma.artisanMetier.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ArtisanMetierCreateManyArgs>(args?: SelectSubset<T, ArtisanMetierCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ArtisanMetiers and returns the data saved in the database.
     * @param {ArtisanMetierCreateManyAndReturnArgs} args - Arguments to create many ArtisanMetiers.
     * @example
     * // Create many ArtisanMetiers
     * const artisanMetier = await prisma.artisanMetier.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ArtisanMetiers and only return the `id`
     * const artisanMetierWithIdOnly = await prisma.artisanMetier.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ArtisanMetierCreateManyAndReturnArgs>(args?: SelectSubset<T, ArtisanMetierCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ArtisanMetier.
     * @param {ArtisanMetierDeleteArgs} args - Arguments to delete one ArtisanMetier.
     * @example
     * // Delete one ArtisanMetier
     * const ArtisanMetier = await prisma.artisanMetier.delete({
     *   where: {
     *     // ... filter to delete one ArtisanMetier
     *   }
     * })
     * 
     */
    delete<T extends ArtisanMetierDeleteArgs>(args: SelectSubset<T, ArtisanMetierDeleteArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ArtisanMetier.
     * @param {ArtisanMetierUpdateArgs} args - Arguments to update one ArtisanMetier.
     * @example
     * // Update one ArtisanMetier
     * const artisanMetier = await prisma.artisanMetier.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ArtisanMetierUpdateArgs>(args: SelectSubset<T, ArtisanMetierUpdateArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ArtisanMetiers.
     * @param {ArtisanMetierDeleteManyArgs} args - Arguments to filter ArtisanMetiers to delete.
     * @example
     * // Delete a few ArtisanMetiers
     * const { count } = await prisma.artisanMetier.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ArtisanMetierDeleteManyArgs>(args?: SelectSubset<T, ArtisanMetierDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ArtisanMetiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ArtisanMetiers
     * const artisanMetier = await prisma.artisanMetier.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ArtisanMetierUpdateManyArgs>(args: SelectSubset<T, ArtisanMetierUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ArtisanMetiers and returns the data updated in the database.
     * @param {ArtisanMetierUpdateManyAndReturnArgs} args - Arguments to update many ArtisanMetiers.
     * @example
     * // Update many ArtisanMetiers
     * const artisanMetier = await prisma.artisanMetier.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ArtisanMetiers and only return the `id`
     * const artisanMetierWithIdOnly = await prisma.artisanMetier.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ArtisanMetierUpdateManyAndReturnArgs>(args: SelectSubset<T, ArtisanMetierUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ArtisanMetier.
     * @param {ArtisanMetierUpsertArgs} args - Arguments to update or create a ArtisanMetier.
     * @example
     * // Update or create a ArtisanMetier
     * const artisanMetier = await prisma.artisanMetier.upsert({
     *   create: {
     *     // ... data to create a ArtisanMetier
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ArtisanMetier we want to update
     *   }
     * })
     */
    upsert<T extends ArtisanMetierUpsertArgs>(args: SelectSubset<T, ArtisanMetierUpsertArgs<ExtArgs>>): Prisma__ArtisanMetierClient<$Result.GetResult<Prisma.$ArtisanMetierPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ArtisanMetiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierCountArgs} args - Arguments to filter ArtisanMetiers to count.
     * @example
     * // Count the number of ArtisanMetiers
     * const count = await prisma.artisanMetier.count({
     *   where: {
     *     // ... the filter for the ArtisanMetiers we want to count
     *   }
     * })
    **/
    count<T extends ArtisanMetierCountArgs>(
      args?: Subset<T, ArtisanMetierCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ArtisanMetierCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ArtisanMetier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ArtisanMetierAggregateArgs>(args: Subset<T, ArtisanMetierAggregateArgs>): Prisma.PrismaPromise<GetArtisanMetierAggregateType<T>>

    /**
     * Group by ArtisanMetier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtisanMetierGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ArtisanMetierGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ArtisanMetierGroupByArgs['orderBy'] }
        : { orderBy?: ArtisanMetierGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ArtisanMetierGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetArtisanMetierGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ArtisanMetier model
   */
  readonly fields: ArtisanMetierFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ArtisanMetier.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ArtisanMetierClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    artisan<T extends ArtisanDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ArtisanDefaultArgs<ExtArgs>>): Prisma__ArtisanClient<$Result.GetResult<Prisma.$ArtisanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    metier<T extends MetierDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MetierDefaultArgs<ExtArgs>>): Prisma__MetierClient<$Result.GetResult<Prisma.$MetierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ArtisanMetier model
   */
  interface ArtisanMetierFieldRefs {
    readonly id: FieldRef<"ArtisanMetier", 'String'>
    readonly artisanId: FieldRef<"ArtisanMetier", 'String'>
    readonly metierId: FieldRef<"ArtisanMetier", 'String'>
    readonly estPrincipal: FieldRef<"ArtisanMetier", 'Boolean'>
    readonly anneesExperience: FieldRef<"ArtisanMetier", 'Int'>
    readonly certifie: FieldRef<"ArtisanMetier", 'Boolean'>
    readonly tarifHoraire: FieldRef<"ArtisanMetier", 'Decimal'>
    readonly description: FieldRef<"ArtisanMetier", 'String'>
    readonly createdAt: FieldRef<"ArtisanMetier", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ArtisanMetier findUnique
   */
  export type ArtisanMetierFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * Filter, which ArtisanMetier to fetch.
     */
    where: ArtisanMetierWhereUniqueInput
  }

  /**
   * ArtisanMetier findUniqueOrThrow
   */
  export type ArtisanMetierFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * Filter, which ArtisanMetier to fetch.
     */
    where: ArtisanMetierWhereUniqueInput
  }

  /**
   * ArtisanMetier findFirst
   */
  export type ArtisanMetierFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * Filter, which ArtisanMetier to fetch.
     */
    where?: ArtisanMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ArtisanMetiers to fetch.
     */
    orderBy?: ArtisanMetierOrderByWithRelationInput | ArtisanMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ArtisanMetiers.
     */
    cursor?: ArtisanMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ArtisanMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ArtisanMetiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ArtisanMetiers.
     */
    distinct?: ArtisanMetierScalarFieldEnum | ArtisanMetierScalarFieldEnum[]
  }

  /**
   * ArtisanMetier findFirstOrThrow
   */
  export type ArtisanMetierFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * Filter, which ArtisanMetier to fetch.
     */
    where?: ArtisanMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ArtisanMetiers to fetch.
     */
    orderBy?: ArtisanMetierOrderByWithRelationInput | ArtisanMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ArtisanMetiers.
     */
    cursor?: ArtisanMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ArtisanMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ArtisanMetiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ArtisanMetiers.
     */
    distinct?: ArtisanMetierScalarFieldEnum | ArtisanMetierScalarFieldEnum[]
  }

  /**
   * ArtisanMetier findMany
   */
  export type ArtisanMetierFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * Filter, which ArtisanMetiers to fetch.
     */
    where?: ArtisanMetierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ArtisanMetiers to fetch.
     */
    orderBy?: ArtisanMetierOrderByWithRelationInput | ArtisanMetierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ArtisanMetiers.
     */
    cursor?: ArtisanMetierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ArtisanMetiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ArtisanMetiers.
     */
    skip?: number
    distinct?: ArtisanMetierScalarFieldEnum | ArtisanMetierScalarFieldEnum[]
  }

  /**
   * ArtisanMetier create
   */
  export type ArtisanMetierCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * The data needed to create a ArtisanMetier.
     */
    data: XOR<ArtisanMetierCreateInput, ArtisanMetierUncheckedCreateInput>
  }

  /**
   * ArtisanMetier createMany
   */
  export type ArtisanMetierCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ArtisanMetiers.
     */
    data: ArtisanMetierCreateManyInput | ArtisanMetierCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ArtisanMetier createManyAndReturn
   */
  export type ArtisanMetierCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * The data used to create many ArtisanMetiers.
     */
    data: ArtisanMetierCreateManyInput | ArtisanMetierCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ArtisanMetier update
   */
  export type ArtisanMetierUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * The data needed to update a ArtisanMetier.
     */
    data: XOR<ArtisanMetierUpdateInput, ArtisanMetierUncheckedUpdateInput>
    /**
     * Choose, which ArtisanMetier to update.
     */
    where: ArtisanMetierWhereUniqueInput
  }

  /**
   * ArtisanMetier updateMany
   */
  export type ArtisanMetierUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ArtisanMetiers.
     */
    data: XOR<ArtisanMetierUpdateManyMutationInput, ArtisanMetierUncheckedUpdateManyInput>
    /**
     * Filter which ArtisanMetiers to update
     */
    where?: ArtisanMetierWhereInput
    /**
     * Limit how many ArtisanMetiers to update.
     */
    limit?: number
  }

  /**
   * ArtisanMetier updateManyAndReturn
   */
  export type ArtisanMetierUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * The data used to update ArtisanMetiers.
     */
    data: XOR<ArtisanMetierUpdateManyMutationInput, ArtisanMetierUncheckedUpdateManyInput>
    /**
     * Filter which ArtisanMetiers to update
     */
    where?: ArtisanMetierWhereInput
    /**
     * Limit how many ArtisanMetiers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ArtisanMetier upsert
   */
  export type ArtisanMetierUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * The filter to search for the ArtisanMetier to update in case it exists.
     */
    where: ArtisanMetierWhereUniqueInput
    /**
     * In case the ArtisanMetier found by the `where` argument doesn't exist, create a new ArtisanMetier with this data.
     */
    create: XOR<ArtisanMetierCreateInput, ArtisanMetierUncheckedCreateInput>
    /**
     * In case the ArtisanMetier was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ArtisanMetierUpdateInput, ArtisanMetierUncheckedUpdateInput>
  }

  /**
   * ArtisanMetier delete
   */
  export type ArtisanMetierDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
    /**
     * Filter which ArtisanMetier to delete.
     */
    where: ArtisanMetierWhereUniqueInput
  }

  /**
   * ArtisanMetier deleteMany
   */
  export type ArtisanMetierDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ArtisanMetiers to delete
     */
    where?: ArtisanMetierWhereInput
    /**
     * Limit how many ArtisanMetiers to delete.
     */
    limit?: number
  }

  /**
   * ArtisanMetier without action
   */
  export type ArtisanMetierDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtisanMetier
     */
    select?: ArtisanMetierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ArtisanMetier
     */
    omit?: ArtisanMetierOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtisanMetierInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    telephone: 'telephone',
    nom: 'nom',
    prenom: 'prenom',
    dateNaissance: 'dateNaissance',
    sexe: 'sexe',
    photoUrl: 'photoUrl',
    adressePrincipale: 'adressePrincipale',
    latitude: 'latitude',
    longitude: 'longitude',
    ville: 'ville',
    quartier: 'quartier',
    passwordHash: 'passwordHash',
    emailVerified: 'emailVerified',
    telephoneVerified: 'telephoneVerified',
    profilComplet: 'profilComplet',
    mfaEnabled: 'mfaEnabled',
    mfaSecret: 'mfaSecret',
    emailVerificationToken: 'emailVerificationToken',
    emailVerificationExpiresAt: 'emailVerificationExpiresAt',
    telephoneVerificationToken: 'telephoneVerificationToken',
    telephoneVerificationExpiresAt: 'telephoneVerificationExpiresAt',
    role: 'role',
    statut: 'statut',
    langue: 'langue',
    timezone: 'timezone',
    notificationEmail: 'notificationEmail',
    notificationSms: 'notificationSms',
    notificationPush: 'notificationPush',
    derniereConnexion: 'derniereConnexion',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const CategorieMetierScalarFieldEnum: {
    id: 'id',
    nom: 'nom',
    slug: 'slug',
    description: 'description',
    iconUrl: 'iconUrl',
    ordreAffichage: 'ordreAffichage',
    actif: 'actif',
    createdAt: 'createdAt'
  };

  export type CategorieMetierScalarFieldEnum = (typeof CategorieMetierScalarFieldEnum)[keyof typeof CategorieMetierScalarFieldEnum]


  export const MetierScalarFieldEnum: {
    id: 'id',
    nom: 'nom',
    slug: 'slug',
    description: 'description',
    iconUrl: 'iconUrl',
    categorieId: 'categorieId',
    ordreAffichage: 'ordreAffichage',
    populaire: 'populaire',
    actif: 'actif',
    createdAt: 'createdAt'
  };

  export type MetierScalarFieldEnum = (typeof MetierScalarFieldEnum)[keyof typeof MetierScalarFieldEnum]


  export const ArtisanScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    nomEntreprise: 'nomEntreprise',
    numeroIfu: 'numeroIfu',
    anneesExperience: 'anneesExperience',
    bio: 'bio',
    slogan: 'slogan',
    photoProfilUrl: 'photoProfilUrl',
    photoCouvertureUrl: 'photoCouvertureUrl',
    portfolioUrls: 'portfolioUrls',
    adresseAtelier: 'adresseAtelier',
    latitude: 'latitude',
    longitude: 'longitude',
    villePrincipale: 'villePrincipale',
    zoneInterventionKm: 'zoneInterventionKm',
    villesIntervention: 'villesIntervention',
    noteMoyenne: 'noteMoyenne',
    nombreAvis: 'nombreAvis',
    compteurDemandesMoisCourant: 'compteurDemandesMoisCourant',
    nombreMissionsCompletees: 'nombreMissionsCompletees',
    tauxCompletion: 'tauxCompletion',
    tauxReponseMoyen: 'tauxReponseMoyen',
    disponible: 'disponible',
    accepteUrgences: 'accepteUrgences',
    accepteWeekend: 'accepteWeekend',
    horairesTravail: 'horairesTravail',
    verified: 'verified',
    verifiedAt: 'verifiedAt',
    verifiedBy: 'verifiedBy',
    badges: 'badges',
    abonnementType: 'abonnementType',
    abonnementExpireAt: 'abonnementExpireAt',
    totalVuesProfil: 'totalVuesProfil',
    totalContacts: 'totalContacts',
    statut: 'statut',
    raisonSuspension: 'raisonSuspension',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
  };

  export type ArtisanScalarFieldEnum = (typeof ArtisanScalarFieldEnum)[keyof typeof ArtisanScalarFieldEnum]


  export const ArtisanMetierScalarFieldEnum: {
    id: 'id',
    artisanId: 'artisanId',
    metierId: 'metierId',
    estPrincipal: 'estPrincipal',
    anneesExperience: 'anneesExperience',
    certifie: 'certifie',
    tarifHoraire: 'tarifHoraire',
    description: 'description',
    createdAt: 'createdAt'
  };

  export type ArtisanMetierScalarFieldEnum = (typeof ArtisanMetierScalarFieldEnum)[keyof typeof ArtisanMetierScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Statut'
   */
  export type EnumStatutFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Statut'>
    


  /**
   * Reference to a field of type 'Statut[]'
   */
  export type ListEnumStatutFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Statut[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'AbonnementType'
   */
  export type EnumAbonnementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AbonnementType'>
    


  /**
   * Reference to a field of type 'AbonnementType[]'
   */
  export type ListEnumAbonnementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AbonnementType[]'>
    


  /**
   * Reference to a field of type 'StatutArtisan'
   */
  export type EnumStatutArtisanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StatutArtisan'>
    


  /**
   * Reference to a field of type 'StatutArtisan[]'
   */
  export type ListEnumStatutArtisanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StatutArtisan[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    telephone?: StringNullableFilter<"User"> | string | null
    nom?: StringNullableFilter<"User"> | string | null
    prenom?: StringNullableFilter<"User"> | string | null
    dateNaissance?: DateTimeNullableFilter<"User"> | Date | string | null
    sexe?: StringNullableFilter<"User"> | string | null
    photoUrl?: StringNullableFilter<"User"> | string | null
    adressePrincipale?: StringNullableFilter<"User"> | string | null
    latitude?: DecimalNullableFilter<"User"> | Decimal | DecimalJsLike | number | string | null
    longitude?: DecimalNullableFilter<"User"> | Decimal | DecimalJsLike | number | string | null
    ville?: StringNullableFilter<"User"> | string | null
    quartier?: StringNullableFilter<"User"> | string | null
    passwordHash?: StringFilter<"User"> | string
    emailVerified?: BoolFilter<"User"> | boolean
    telephoneVerified?: BoolFilter<"User"> | boolean
    profilComplet?: BoolFilter<"User"> | boolean
    mfaEnabled?: BoolFilter<"User"> | boolean
    mfaSecret?: StringNullableFilter<"User"> | string | null
    emailVerificationToken?: StringNullableFilter<"User"> | string | null
    emailVerificationExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    telephoneVerificationToken?: StringNullableFilter<"User"> | string | null
    telephoneVerificationExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
    statut?: EnumStatutFilter<"User"> | $Enums.Statut
    langue?: StringFilter<"User"> | string
    timezone?: StringFilter<"User"> | string
    notificationEmail?: BoolFilter<"User"> | boolean
    notificationSms?: BoolFilter<"User"> | boolean
    notificationPush?: BoolFilter<"User"> | boolean
    derniereConnexion?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    deletedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    artisan?: XOR<ArtisanNullableScalarRelationFilter, ArtisanWhereInput> | null
    artisansVerified?: ArtisanListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    telephone?: SortOrderInput | SortOrder
    nom?: SortOrderInput | SortOrder
    prenom?: SortOrderInput | SortOrder
    dateNaissance?: SortOrderInput | SortOrder
    sexe?: SortOrderInput | SortOrder
    photoUrl?: SortOrderInput | SortOrder
    adressePrincipale?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    ville?: SortOrderInput | SortOrder
    quartier?: SortOrderInput | SortOrder
    passwordHash?: SortOrder
    emailVerified?: SortOrder
    telephoneVerified?: SortOrder
    profilComplet?: SortOrder
    mfaEnabled?: SortOrder
    mfaSecret?: SortOrderInput | SortOrder
    emailVerificationToken?: SortOrderInput | SortOrder
    emailVerificationExpiresAt?: SortOrderInput | SortOrder
    telephoneVerificationToken?: SortOrderInput | SortOrder
    telephoneVerificationExpiresAt?: SortOrderInput | SortOrder
    role?: SortOrder
    statut?: SortOrder
    langue?: SortOrder
    timezone?: SortOrder
    notificationEmail?: SortOrder
    notificationSms?: SortOrder
    notificationPush?: SortOrder
    derniereConnexion?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    artisan?: ArtisanOrderByWithRelationInput
    artisansVerified?: ArtisanOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    telephone?: string
    emailVerificationToken?: string
    telephoneVerificationToken?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    nom?: StringNullableFilter<"User"> | string | null
    prenom?: StringNullableFilter<"User"> | string | null
    dateNaissance?: DateTimeNullableFilter<"User"> | Date | string | null
    sexe?: StringNullableFilter<"User"> | string | null
    photoUrl?: StringNullableFilter<"User"> | string | null
    adressePrincipale?: StringNullableFilter<"User"> | string | null
    latitude?: DecimalNullableFilter<"User"> | Decimal | DecimalJsLike | number | string | null
    longitude?: DecimalNullableFilter<"User"> | Decimal | DecimalJsLike | number | string | null
    ville?: StringNullableFilter<"User"> | string | null
    quartier?: StringNullableFilter<"User"> | string | null
    passwordHash?: StringFilter<"User"> | string
    emailVerified?: BoolFilter<"User"> | boolean
    telephoneVerified?: BoolFilter<"User"> | boolean
    profilComplet?: BoolFilter<"User"> | boolean
    mfaEnabled?: BoolFilter<"User"> | boolean
    mfaSecret?: StringNullableFilter<"User"> | string | null
    emailVerificationExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    telephoneVerificationExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
    statut?: EnumStatutFilter<"User"> | $Enums.Statut
    langue?: StringFilter<"User"> | string
    timezone?: StringFilter<"User"> | string
    notificationEmail?: BoolFilter<"User"> | boolean
    notificationSms?: BoolFilter<"User"> | boolean
    notificationPush?: BoolFilter<"User"> | boolean
    derniereConnexion?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    deletedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    artisan?: XOR<ArtisanNullableScalarRelationFilter, ArtisanWhereInput> | null
    artisansVerified?: ArtisanListRelationFilter
  }, "id" | "email" | "telephone" | "emailVerificationToken" | "telephoneVerificationToken">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    telephone?: SortOrderInput | SortOrder
    nom?: SortOrderInput | SortOrder
    prenom?: SortOrderInput | SortOrder
    dateNaissance?: SortOrderInput | SortOrder
    sexe?: SortOrderInput | SortOrder
    photoUrl?: SortOrderInput | SortOrder
    adressePrincipale?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    ville?: SortOrderInput | SortOrder
    quartier?: SortOrderInput | SortOrder
    passwordHash?: SortOrder
    emailVerified?: SortOrder
    telephoneVerified?: SortOrder
    profilComplet?: SortOrder
    mfaEnabled?: SortOrder
    mfaSecret?: SortOrderInput | SortOrder
    emailVerificationToken?: SortOrderInput | SortOrder
    emailVerificationExpiresAt?: SortOrderInput | SortOrder
    telephoneVerificationToken?: SortOrderInput | SortOrder
    telephoneVerificationExpiresAt?: SortOrderInput | SortOrder
    role?: SortOrder
    statut?: SortOrder
    langue?: SortOrder
    timezone?: SortOrder
    notificationEmail?: SortOrder
    notificationSms?: SortOrder
    notificationPush?: SortOrder
    derniereConnexion?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    telephone?: StringNullableWithAggregatesFilter<"User"> | string | null
    nom?: StringNullableWithAggregatesFilter<"User"> | string | null
    prenom?: StringNullableWithAggregatesFilter<"User"> | string | null
    dateNaissance?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    sexe?: StringNullableWithAggregatesFilter<"User"> | string | null
    photoUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    adressePrincipale?: StringNullableWithAggregatesFilter<"User"> | string | null
    latitude?: DecimalNullableWithAggregatesFilter<"User"> | Decimal | DecimalJsLike | number | string | null
    longitude?: DecimalNullableWithAggregatesFilter<"User"> | Decimal | DecimalJsLike | number | string | null
    ville?: StringNullableWithAggregatesFilter<"User"> | string | null
    quartier?: StringNullableWithAggregatesFilter<"User"> | string | null
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    telephoneVerified?: BoolWithAggregatesFilter<"User"> | boolean
    profilComplet?: BoolWithAggregatesFilter<"User"> | boolean
    mfaEnabled?: BoolWithAggregatesFilter<"User"> | boolean
    mfaSecret?: StringNullableWithAggregatesFilter<"User"> | string | null
    emailVerificationToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    emailVerificationExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    telephoneVerificationToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    telephoneVerificationExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    statut?: EnumStatutWithAggregatesFilter<"User"> | $Enums.Statut
    langue?: StringWithAggregatesFilter<"User"> | string
    timezone?: StringWithAggregatesFilter<"User"> | string
    notificationEmail?: BoolWithAggregatesFilter<"User"> | boolean
    notificationSms?: BoolWithAggregatesFilter<"User"> | boolean
    notificationPush?: BoolWithAggregatesFilter<"User"> | boolean
    derniereConnexion?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
  }

  export type CategorieMetierWhereInput = {
    AND?: CategorieMetierWhereInput | CategorieMetierWhereInput[]
    OR?: CategorieMetierWhereInput[]
    NOT?: CategorieMetierWhereInput | CategorieMetierWhereInput[]
    id?: StringFilter<"CategorieMetier"> | string
    nom?: StringFilter<"CategorieMetier"> | string
    slug?: StringFilter<"CategorieMetier"> | string
    description?: StringNullableFilter<"CategorieMetier"> | string | null
    iconUrl?: StringNullableFilter<"CategorieMetier"> | string | null
    ordreAffichage?: IntFilter<"CategorieMetier"> | number
    actif?: BoolFilter<"CategorieMetier"> | boolean
    createdAt?: DateTimeFilter<"CategorieMetier"> | Date | string
    metiers?: MetierListRelationFilter
  }

  export type CategorieMetierOrderByWithRelationInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    iconUrl?: SortOrderInput | SortOrder
    ordreAffichage?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
    metiers?: MetierOrderByRelationAggregateInput
  }

  export type CategorieMetierWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    nom?: string
    slug?: string
    AND?: CategorieMetierWhereInput | CategorieMetierWhereInput[]
    OR?: CategorieMetierWhereInput[]
    NOT?: CategorieMetierWhereInput | CategorieMetierWhereInput[]
    description?: StringNullableFilter<"CategorieMetier"> | string | null
    iconUrl?: StringNullableFilter<"CategorieMetier"> | string | null
    ordreAffichage?: IntFilter<"CategorieMetier"> | number
    actif?: BoolFilter<"CategorieMetier"> | boolean
    createdAt?: DateTimeFilter<"CategorieMetier"> | Date | string
    metiers?: MetierListRelationFilter
  }, "id" | "nom" | "slug">

  export type CategorieMetierOrderByWithAggregationInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    iconUrl?: SortOrderInput | SortOrder
    ordreAffichage?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
    _count?: CategorieMetierCountOrderByAggregateInput
    _avg?: CategorieMetierAvgOrderByAggregateInput
    _max?: CategorieMetierMaxOrderByAggregateInput
    _min?: CategorieMetierMinOrderByAggregateInput
    _sum?: CategorieMetierSumOrderByAggregateInput
  }

  export type CategorieMetierScalarWhereWithAggregatesInput = {
    AND?: CategorieMetierScalarWhereWithAggregatesInput | CategorieMetierScalarWhereWithAggregatesInput[]
    OR?: CategorieMetierScalarWhereWithAggregatesInput[]
    NOT?: CategorieMetierScalarWhereWithAggregatesInput | CategorieMetierScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CategorieMetier"> | string
    nom?: StringWithAggregatesFilter<"CategorieMetier"> | string
    slug?: StringWithAggregatesFilter<"CategorieMetier"> | string
    description?: StringNullableWithAggregatesFilter<"CategorieMetier"> | string | null
    iconUrl?: StringNullableWithAggregatesFilter<"CategorieMetier"> | string | null
    ordreAffichage?: IntWithAggregatesFilter<"CategorieMetier"> | number
    actif?: BoolWithAggregatesFilter<"CategorieMetier"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CategorieMetier"> | Date | string
  }

  export type MetierWhereInput = {
    AND?: MetierWhereInput | MetierWhereInput[]
    OR?: MetierWhereInput[]
    NOT?: MetierWhereInput | MetierWhereInput[]
    id?: StringFilter<"Metier"> | string
    nom?: StringFilter<"Metier"> | string
    slug?: StringFilter<"Metier"> | string
    description?: StringNullableFilter<"Metier"> | string | null
    iconUrl?: StringNullableFilter<"Metier"> | string | null
    categorieId?: StringFilter<"Metier"> | string
    ordreAffichage?: IntFilter<"Metier"> | number
    populaire?: BoolFilter<"Metier"> | boolean
    actif?: BoolFilter<"Metier"> | boolean
    createdAt?: DateTimeFilter<"Metier"> | Date | string
    categorie?: XOR<CategorieMetierScalarRelationFilter, CategorieMetierWhereInput>
    artisanMetiers?: ArtisanMetierListRelationFilter
  }

  export type MetierOrderByWithRelationInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    iconUrl?: SortOrderInput | SortOrder
    categorieId?: SortOrder
    ordreAffichage?: SortOrder
    populaire?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
    categorie?: CategorieMetierOrderByWithRelationInput
    artisanMetiers?: ArtisanMetierOrderByRelationAggregateInput
  }

  export type MetierWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    nom?: string
    slug?: string
    AND?: MetierWhereInput | MetierWhereInput[]
    OR?: MetierWhereInput[]
    NOT?: MetierWhereInput | MetierWhereInput[]
    description?: StringNullableFilter<"Metier"> | string | null
    iconUrl?: StringNullableFilter<"Metier"> | string | null
    categorieId?: StringFilter<"Metier"> | string
    ordreAffichage?: IntFilter<"Metier"> | number
    populaire?: BoolFilter<"Metier"> | boolean
    actif?: BoolFilter<"Metier"> | boolean
    createdAt?: DateTimeFilter<"Metier"> | Date | string
    categorie?: XOR<CategorieMetierScalarRelationFilter, CategorieMetierWhereInput>
    artisanMetiers?: ArtisanMetierListRelationFilter
  }, "id" | "nom" | "slug">

  export type MetierOrderByWithAggregationInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    iconUrl?: SortOrderInput | SortOrder
    categorieId?: SortOrder
    ordreAffichage?: SortOrder
    populaire?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
    _count?: MetierCountOrderByAggregateInput
    _avg?: MetierAvgOrderByAggregateInput
    _max?: MetierMaxOrderByAggregateInput
    _min?: MetierMinOrderByAggregateInput
    _sum?: MetierSumOrderByAggregateInput
  }

  export type MetierScalarWhereWithAggregatesInput = {
    AND?: MetierScalarWhereWithAggregatesInput | MetierScalarWhereWithAggregatesInput[]
    OR?: MetierScalarWhereWithAggregatesInput[]
    NOT?: MetierScalarWhereWithAggregatesInput | MetierScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Metier"> | string
    nom?: StringWithAggregatesFilter<"Metier"> | string
    slug?: StringWithAggregatesFilter<"Metier"> | string
    description?: StringNullableWithAggregatesFilter<"Metier"> | string | null
    iconUrl?: StringNullableWithAggregatesFilter<"Metier"> | string | null
    categorieId?: StringWithAggregatesFilter<"Metier"> | string
    ordreAffichage?: IntWithAggregatesFilter<"Metier"> | number
    populaire?: BoolWithAggregatesFilter<"Metier"> | boolean
    actif?: BoolWithAggregatesFilter<"Metier"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Metier"> | Date | string
  }

  export type ArtisanWhereInput = {
    AND?: ArtisanWhereInput | ArtisanWhereInput[]
    OR?: ArtisanWhereInput[]
    NOT?: ArtisanWhereInput | ArtisanWhereInput[]
    id?: StringFilter<"Artisan"> | string
    userId?: StringFilter<"Artisan"> | string
    nomEntreprise?: StringNullableFilter<"Artisan"> | string | null
    numeroIfu?: StringNullableFilter<"Artisan"> | string | null
    anneesExperience?: IntFilter<"Artisan"> | number
    bio?: StringNullableFilter<"Artisan"> | string | null
    slogan?: StringNullableFilter<"Artisan"> | string | null
    photoProfilUrl?: StringNullableFilter<"Artisan"> | string | null
    photoCouvertureUrl?: StringNullableFilter<"Artisan"> | string | null
    portfolioUrls?: JsonNullableFilter<"Artisan">
    adresseAtelier?: StringNullableFilter<"Artisan"> | string | null
    latitude?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFilter<"Artisan"> | string
    zoneInterventionKm?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villesIntervention?: JsonNullableFilter<"Artisan">
    noteMoyenne?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFilter<"Artisan"> | number
    compteurDemandesMoisCourant?: IntFilter<"Artisan"> | number
    nombreMissionsCompletees?: IntFilter<"Artisan"> | number
    tauxCompletion?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: IntNullableFilter<"Artisan"> | number | null
    disponible?: BoolFilter<"Artisan"> | boolean
    accepteUrgences?: BoolFilter<"Artisan"> | boolean
    accepteWeekend?: BoolFilter<"Artisan"> | boolean
    horairesTravail?: JsonNullableFilter<"Artisan">
    verified?: BoolFilter<"Artisan"> | boolean
    verifiedAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    verifiedBy?: StringNullableFilter<"Artisan"> | string | null
    badges?: JsonNullableFilter<"Artisan">
    abonnementType?: EnumAbonnementTypeFilter<"Artisan"> | $Enums.AbonnementType
    abonnementExpireAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    totalVuesProfil?: IntFilter<"Artisan"> | number
    totalContacts?: IntFilter<"Artisan"> | number
    statut?: EnumStatutArtisanFilter<"Artisan"> | $Enums.StatutArtisan
    raisonSuspension?: StringNullableFilter<"Artisan"> | string | null
    createdAt?: DateTimeFilter<"Artisan"> | Date | string
    updatedAt?: DateTimeFilter<"Artisan"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    verifiedByUser?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    metiers?: ArtisanMetierListRelationFilter
  }

  export type ArtisanOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    nomEntreprise?: SortOrderInput | SortOrder
    numeroIfu?: SortOrderInput | SortOrder
    anneesExperience?: SortOrder
    bio?: SortOrderInput | SortOrder
    slogan?: SortOrderInput | SortOrder
    photoProfilUrl?: SortOrderInput | SortOrder
    photoCouvertureUrl?: SortOrderInput | SortOrder
    portfolioUrls?: SortOrderInput | SortOrder
    adresseAtelier?: SortOrderInput | SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    villePrincipale?: SortOrder
    zoneInterventionKm?: SortOrder
    villesIntervention?: SortOrderInput | SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrderInput | SortOrder
    disponible?: SortOrder
    accepteUrgences?: SortOrder
    accepteWeekend?: SortOrder
    horairesTravail?: SortOrderInput | SortOrder
    verified?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    verifiedBy?: SortOrderInput | SortOrder
    badges?: SortOrderInput | SortOrder
    abonnementType?: SortOrder
    abonnementExpireAt?: SortOrderInput | SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
    statut?: SortOrder
    raisonSuspension?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
    verifiedByUser?: UserOrderByWithRelationInput
    metiers?: ArtisanMetierOrderByRelationAggregateInput
  }

  export type ArtisanWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: ArtisanWhereInput | ArtisanWhereInput[]
    OR?: ArtisanWhereInput[]
    NOT?: ArtisanWhereInput | ArtisanWhereInput[]
    nomEntreprise?: StringNullableFilter<"Artisan"> | string | null
    numeroIfu?: StringNullableFilter<"Artisan"> | string | null
    anneesExperience?: IntFilter<"Artisan"> | number
    bio?: StringNullableFilter<"Artisan"> | string | null
    slogan?: StringNullableFilter<"Artisan"> | string | null
    photoProfilUrl?: StringNullableFilter<"Artisan"> | string | null
    photoCouvertureUrl?: StringNullableFilter<"Artisan"> | string | null
    portfolioUrls?: JsonNullableFilter<"Artisan">
    adresseAtelier?: StringNullableFilter<"Artisan"> | string | null
    latitude?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFilter<"Artisan"> | string
    zoneInterventionKm?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villesIntervention?: JsonNullableFilter<"Artisan">
    noteMoyenne?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFilter<"Artisan"> | number
    compteurDemandesMoisCourant?: IntFilter<"Artisan"> | number
    nombreMissionsCompletees?: IntFilter<"Artisan"> | number
    tauxCompletion?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: IntNullableFilter<"Artisan"> | number | null
    disponible?: BoolFilter<"Artisan"> | boolean
    accepteUrgences?: BoolFilter<"Artisan"> | boolean
    accepteWeekend?: BoolFilter<"Artisan"> | boolean
    horairesTravail?: JsonNullableFilter<"Artisan">
    verified?: BoolFilter<"Artisan"> | boolean
    verifiedAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    verifiedBy?: StringNullableFilter<"Artisan"> | string | null
    badges?: JsonNullableFilter<"Artisan">
    abonnementType?: EnumAbonnementTypeFilter<"Artisan"> | $Enums.AbonnementType
    abonnementExpireAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    totalVuesProfil?: IntFilter<"Artisan"> | number
    totalContacts?: IntFilter<"Artisan"> | number
    statut?: EnumStatutArtisanFilter<"Artisan"> | $Enums.StatutArtisan
    raisonSuspension?: StringNullableFilter<"Artisan"> | string | null
    createdAt?: DateTimeFilter<"Artisan"> | Date | string
    updatedAt?: DateTimeFilter<"Artisan"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    verifiedByUser?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    metiers?: ArtisanMetierListRelationFilter
  }, "id" | "userId">

  export type ArtisanOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    nomEntreprise?: SortOrderInput | SortOrder
    numeroIfu?: SortOrderInput | SortOrder
    anneesExperience?: SortOrder
    bio?: SortOrderInput | SortOrder
    slogan?: SortOrderInput | SortOrder
    photoProfilUrl?: SortOrderInput | SortOrder
    photoCouvertureUrl?: SortOrderInput | SortOrder
    portfolioUrls?: SortOrderInput | SortOrder
    adresseAtelier?: SortOrderInput | SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    villePrincipale?: SortOrder
    zoneInterventionKm?: SortOrder
    villesIntervention?: SortOrderInput | SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrderInput | SortOrder
    disponible?: SortOrder
    accepteUrgences?: SortOrder
    accepteWeekend?: SortOrder
    horairesTravail?: SortOrderInput | SortOrder
    verified?: SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    verifiedBy?: SortOrderInput | SortOrder
    badges?: SortOrderInput | SortOrder
    abonnementType?: SortOrder
    abonnementExpireAt?: SortOrderInput | SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
    statut?: SortOrder
    raisonSuspension?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: ArtisanCountOrderByAggregateInput
    _avg?: ArtisanAvgOrderByAggregateInput
    _max?: ArtisanMaxOrderByAggregateInput
    _min?: ArtisanMinOrderByAggregateInput
    _sum?: ArtisanSumOrderByAggregateInput
  }

  export type ArtisanScalarWhereWithAggregatesInput = {
    AND?: ArtisanScalarWhereWithAggregatesInput | ArtisanScalarWhereWithAggregatesInput[]
    OR?: ArtisanScalarWhereWithAggregatesInput[]
    NOT?: ArtisanScalarWhereWithAggregatesInput | ArtisanScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Artisan"> | string
    userId?: StringWithAggregatesFilter<"Artisan"> | string
    nomEntreprise?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    numeroIfu?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    anneesExperience?: IntWithAggregatesFilter<"Artisan"> | number
    bio?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    slogan?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    photoProfilUrl?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    photoCouvertureUrl?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    portfolioUrls?: JsonNullableWithAggregatesFilter<"Artisan">
    adresseAtelier?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    latitude?: DecimalWithAggregatesFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    longitude?: DecimalWithAggregatesFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringWithAggregatesFilter<"Artisan"> | string
    zoneInterventionKm?: DecimalWithAggregatesFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villesIntervention?: JsonNullableWithAggregatesFilter<"Artisan">
    noteMoyenne?: DecimalWithAggregatesFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntWithAggregatesFilter<"Artisan"> | number
    compteurDemandesMoisCourant?: IntWithAggregatesFilter<"Artisan"> | number
    nombreMissionsCompletees?: IntWithAggregatesFilter<"Artisan"> | number
    tauxCompletion?: DecimalWithAggregatesFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: IntNullableWithAggregatesFilter<"Artisan"> | number | null
    disponible?: BoolWithAggregatesFilter<"Artisan"> | boolean
    accepteUrgences?: BoolWithAggregatesFilter<"Artisan"> | boolean
    accepteWeekend?: BoolWithAggregatesFilter<"Artisan"> | boolean
    horairesTravail?: JsonNullableWithAggregatesFilter<"Artisan">
    verified?: BoolWithAggregatesFilter<"Artisan"> | boolean
    verifiedAt?: DateTimeNullableWithAggregatesFilter<"Artisan"> | Date | string | null
    verifiedBy?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    badges?: JsonNullableWithAggregatesFilter<"Artisan">
    abonnementType?: EnumAbonnementTypeWithAggregatesFilter<"Artisan"> | $Enums.AbonnementType
    abonnementExpireAt?: DateTimeNullableWithAggregatesFilter<"Artisan"> | Date | string | null
    totalVuesProfil?: IntWithAggregatesFilter<"Artisan"> | number
    totalContacts?: IntWithAggregatesFilter<"Artisan"> | number
    statut?: EnumStatutArtisanWithAggregatesFilter<"Artisan"> | $Enums.StatutArtisan
    raisonSuspension?: StringNullableWithAggregatesFilter<"Artisan"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Artisan"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Artisan"> | Date | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Artisan"> | Date | string | null
  }

  export type ArtisanMetierWhereInput = {
    AND?: ArtisanMetierWhereInput | ArtisanMetierWhereInput[]
    OR?: ArtisanMetierWhereInput[]
    NOT?: ArtisanMetierWhereInput | ArtisanMetierWhereInput[]
    id?: StringFilter<"ArtisanMetier"> | string
    artisanId?: StringFilter<"ArtisanMetier"> | string
    metierId?: StringFilter<"ArtisanMetier"> | string
    estPrincipal?: BoolFilter<"ArtisanMetier"> | boolean
    anneesExperience?: IntNullableFilter<"ArtisanMetier"> | number | null
    certifie?: BoolFilter<"ArtisanMetier"> | boolean
    tarifHoraire?: DecimalNullableFilter<"ArtisanMetier"> | Decimal | DecimalJsLike | number | string | null
    description?: StringNullableFilter<"ArtisanMetier"> | string | null
    createdAt?: DateTimeFilter<"ArtisanMetier"> | Date | string
    artisan?: XOR<ArtisanScalarRelationFilter, ArtisanWhereInput>
    metier?: XOR<MetierScalarRelationFilter, MetierWhereInput>
  }

  export type ArtisanMetierOrderByWithRelationInput = {
    id?: SortOrder
    artisanId?: SortOrder
    metierId?: SortOrder
    estPrincipal?: SortOrder
    anneesExperience?: SortOrderInput | SortOrder
    certifie?: SortOrder
    tarifHoraire?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    artisan?: ArtisanOrderByWithRelationInput
    metier?: MetierOrderByWithRelationInput
  }

  export type ArtisanMetierWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idx_artisan_metier_unique?: ArtisanMetierIdx_artisan_metier_uniqueCompoundUniqueInput
    AND?: ArtisanMetierWhereInput | ArtisanMetierWhereInput[]
    OR?: ArtisanMetierWhereInput[]
    NOT?: ArtisanMetierWhereInput | ArtisanMetierWhereInput[]
    artisanId?: StringFilter<"ArtisanMetier"> | string
    metierId?: StringFilter<"ArtisanMetier"> | string
    estPrincipal?: BoolFilter<"ArtisanMetier"> | boolean
    anneesExperience?: IntNullableFilter<"ArtisanMetier"> | number | null
    certifie?: BoolFilter<"ArtisanMetier"> | boolean
    tarifHoraire?: DecimalNullableFilter<"ArtisanMetier"> | Decimal | DecimalJsLike | number | string | null
    description?: StringNullableFilter<"ArtisanMetier"> | string | null
    createdAt?: DateTimeFilter<"ArtisanMetier"> | Date | string
    artisan?: XOR<ArtisanScalarRelationFilter, ArtisanWhereInput>
    metier?: XOR<MetierScalarRelationFilter, MetierWhereInput>
  }, "id" | "idx_artisan_metier_unique">

  export type ArtisanMetierOrderByWithAggregationInput = {
    id?: SortOrder
    artisanId?: SortOrder
    metierId?: SortOrder
    estPrincipal?: SortOrder
    anneesExperience?: SortOrderInput | SortOrder
    certifie?: SortOrder
    tarifHoraire?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ArtisanMetierCountOrderByAggregateInput
    _avg?: ArtisanMetierAvgOrderByAggregateInput
    _max?: ArtisanMetierMaxOrderByAggregateInput
    _min?: ArtisanMetierMinOrderByAggregateInput
    _sum?: ArtisanMetierSumOrderByAggregateInput
  }

  export type ArtisanMetierScalarWhereWithAggregatesInput = {
    AND?: ArtisanMetierScalarWhereWithAggregatesInput | ArtisanMetierScalarWhereWithAggregatesInput[]
    OR?: ArtisanMetierScalarWhereWithAggregatesInput[]
    NOT?: ArtisanMetierScalarWhereWithAggregatesInput | ArtisanMetierScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ArtisanMetier"> | string
    artisanId?: StringWithAggregatesFilter<"ArtisanMetier"> | string
    metierId?: StringWithAggregatesFilter<"ArtisanMetier"> | string
    estPrincipal?: BoolWithAggregatesFilter<"ArtisanMetier"> | boolean
    anneesExperience?: IntNullableWithAggregatesFilter<"ArtisanMetier"> | number | null
    certifie?: BoolWithAggregatesFilter<"ArtisanMetier"> | boolean
    tarifHoraire?: DecimalNullableWithAggregatesFilter<"ArtisanMetier"> | Decimal | DecimalJsLike | number | string | null
    description?: StringNullableWithAggregatesFilter<"ArtisanMetier"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ArtisanMetier"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    artisan?: ArtisanCreateNestedOneWithoutUserInput
    artisansVerified?: ArtisanCreateNestedManyWithoutVerifiedByUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    artisan?: ArtisanUncheckedCreateNestedOneWithoutUserInput
    artisansVerified?: ArtisanUncheckedCreateNestedManyWithoutVerifiedByUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    artisan?: ArtisanUpdateOneWithoutUserNestedInput
    artisansVerified?: ArtisanUpdateManyWithoutVerifiedByUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    artisan?: ArtisanUncheckedUpdateOneWithoutUserNestedInput
    artisansVerified?: ArtisanUncheckedUpdateManyWithoutVerifiedByUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CategorieMetierCreateInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    actif?: boolean
    createdAt?: Date | string
    metiers?: MetierCreateNestedManyWithoutCategorieInput
  }

  export type CategorieMetierUncheckedCreateInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    actif?: boolean
    createdAt?: Date | string
    metiers?: MetierUncheckedCreateNestedManyWithoutCategorieInput
  }

  export type CategorieMetierUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    metiers?: MetierUpdateManyWithoutCategorieNestedInput
  }

  export type CategorieMetierUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    metiers?: MetierUncheckedUpdateManyWithoutCategorieNestedInput
  }

  export type CategorieMetierCreateManyInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    actif?: boolean
    createdAt?: Date | string
  }

  export type CategorieMetierUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategorieMetierUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MetierCreateInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
    categorie: CategorieMetierCreateNestedOneWithoutMetiersInput
    artisanMetiers?: ArtisanMetierCreateNestedManyWithoutMetierInput
  }

  export type MetierUncheckedCreateInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    categorieId: string
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
    artisanMetiers?: ArtisanMetierUncheckedCreateNestedManyWithoutMetierInput
  }

  export type MetierUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categorie?: CategorieMetierUpdateOneRequiredWithoutMetiersNestedInput
    artisanMetiers?: ArtisanMetierUpdateManyWithoutMetierNestedInput
  }

  export type MetierUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    categorieId?: StringFieldUpdateOperationsInput | string
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artisanMetiers?: ArtisanMetierUncheckedUpdateManyWithoutMetierNestedInput
  }

  export type MetierCreateManyInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    categorieId: string
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
  }

  export type MetierUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MetierUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    categorieId?: StringFieldUpdateOperationsInput | string
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanCreateInput = {
    id?: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    user: UserCreateNestedOneWithoutArtisanInput
    verifiedByUser?: UserCreateNestedOneWithoutArtisansVerifiedInput
    metiers?: ArtisanMetierCreateNestedManyWithoutArtisanInput
  }

  export type ArtisanUncheckedCreateInput = {
    id?: string
    userId: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    metiers?: ArtisanMetierUncheckedCreateNestedManyWithoutArtisanInput
  }

  export type ArtisanUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutArtisanNestedInput
    verifiedByUser?: UserUpdateOneWithoutArtisansVerifiedNestedInput
    metiers?: ArtisanMetierUpdateManyWithoutArtisanNestedInput
  }

  export type ArtisanUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metiers?: ArtisanMetierUncheckedUpdateManyWithoutArtisanNestedInput
  }

  export type ArtisanCreateManyInput = {
    id?: string
    userId: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type ArtisanUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ArtisanUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ArtisanMetierCreateInput = {
    id?: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
    artisan: ArtisanCreateNestedOneWithoutMetiersInput
    metier: MetierCreateNestedOneWithoutArtisanMetiersInput
  }

  export type ArtisanMetierUncheckedCreateInput = {
    id?: string
    artisanId: string
    metierId: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
  }

  export type ArtisanMetierUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artisan?: ArtisanUpdateOneRequiredWithoutMetiersNestedInput
    metier?: MetierUpdateOneRequiredWithoutArtisanMetiersNestedInput
  }

  export type ArtisanMetierUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    artisanId?: StringFieldUpdateOperationsInput | string
    metierId?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierCreateManyInput = {
    id?: string
    artisanId: string
    metierId: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
  }

  export type ArtisanMetierUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    artisanId?: StringFieldUpdateOperationsInput | string
    metierId?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type EnumStatutFilter<$PrismaModel = never> = {
    equals?: $Enums.Statut | EnumStatutFieldRefInput<$PrismaModel>
    in?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    notIn?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutFilter<$PrismaModel> | $Enums.Statut
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ArtisanNullableScalarRelationFilter = {
    is?: ArtisanWhereInput | null
    isNot?: ArtisanWhereInput | null
  }

  export type ArtisanListRelationFilter = {
    every?: ArtisanWhereInput
    some?: ArtisanWhereInput
    none?: ArtisanWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ArtisanOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    telephone?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    dateNaissance?: SortOrder
    sexe?: SortOrder
    photoUrl?: SortOrder
    adressePrincipale?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    ville?: SortOrder
    quartier?: SortOrder
    passwordHash?: SortOrder
    emailVerified?: SortOrder
    telephoneVerified?: SortOrder
    profilComplet?: SortOrder
    mfaEnabled?: SortOrder
    mfaSecret?: SortOrder
    emailVerificationToken?: SortOrder
    emailVerificationExpiresAt?: SortOrder
    telephoneVerificationToken?: SortOrder
    telephoneVerificationExpiresAt?: SortOrder
    role?: SortOrder
    statut?: SortOrder
    langue?: SortOrder
    timezone?: SortOrder
    notificationEmail?: SortOrder
    notificationSms?: SortOrder
    notificationPush?: SortOrder
    derniereConnexion?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    telephone?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    dateNaissance?: SortOrder
    sexe?: SortOrder
    photoUrl?: SortOrder
    adressePrincipale?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    ville?: SortOrder
    quartier?: SortOrder
    passwordHash?: SortOrder
    emailVerified?: SortOrder
    telephoneVerified?: SortOrder
    profilComplet?: SortOrder
    mfaEnabled?: SortOrder
    mfaSecret?: SortOrder
    emailVerificationToken?: SortOrder
    emailVerificationExpiresAt?: SortOrder
    telephoneVerificationToken?: SortOrder
    telephoneVerificationExpiresAt?: SortOrder
    role?: SortOrder
    statut?: SortOrder
    langue?: SortOrder
    timezone?: SortOrder
    notificationEmail?: SortOrder
    notificationSms?: SortOrder
    notificationPush?: SortOrder
    derniereConnexion?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    telephone?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    dateNaissance?: SortOrder
    sexe?: SortOrder
    photoUrl?: SortOrder
    adressePrincipale?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    ville?: SortOrder
    quartier?: SortOrder
    passwordHash?: SortOrder
    emailVerified?: SortOrder
    telephoneVerified?: SortOrder
    profilComplet?: SortOrder
    mfaEnabled?: SortOrder
    mfaSecret?: SortOrder
    emailVerificationToken?: SortOrder
    emailVerificationExpiresAt?: SortOrder
    telephoneVerificationToken?: SortOrder
    telephoneVerificationExpiresAt?: SortOrder
    role?: SortOrder
    statut?: SortOrder
    langue?: SortOrder
    timezone?: SortOrder
    notificationEmail?: SortOrder
    notificationSms?: SortOrder
    notificationPush?: SortOrder
    derniereConnexion?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type EnumStatutWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Statut | EnumStatutFieldRefInput<$PrismaModel>
    in?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    notIn?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutWithAggregatesFilter<$PrismaModel> | $Enums.Statut
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatutFilter<$PrismaModel>
    _max?: NestedEnumStatutFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type MetierListRelationFilter = {
    every?: MetierWhereInput
    some?: MetierWhereInput
    none?: MetierWhereInput
  }

  export type MetierOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategorieMetierCountOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    iconUrl?: SortOrder
    ordreAffichage?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
  }

  export type CategorieMetierAvgOrderByAggregateInput = {
    ordreAffichage?: SortOrder
  }

  export type CategorieMetierMaxOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    iconUrl?: SortOrder
    ordreAffichage?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
  }

  export type CategorieMetierMinOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    iconUrl?: SortOrder
    ordreAffichage?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
  }

  export type CategorieMetierSumOrderByAggregateInput = {
    ordreAffichage?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type CategorieMetierScalarRelationFilter = {
    is?: CategorieMetierWhereInput
    isNot?: CategorieMetierWhereInput
  }

  export type ArtisanMetierListRelationFilter = {
    every?: ArtisanMetierWhereInput
    some?: ArtisanMetierWhereInput
    none?: ArtisanMetierWhereInput
  }

  export type ArtisanMetierOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MetierCountOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    iconUrl?: SortOrder
    categorieId?: SortOrder
    ordreAffichage?: SortOrder
    populaire?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
  }

  export type MetierAvgOrderByAggregateInput = {
    ordreAffichage?: SortOrder
  }

  export type MetierMaxOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    iconUrl?: SortOrder
    categorieId?: SortOrder
    ordreAffichage?: SortOrder
    populaire?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
  }

  export type MetierMinOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    iconUrl?: SortOrder
    categorieId?: SortOrder
    ordreAffichage?: SortOrder
    populaire?: SortOrder
    actif?: SortOrder
    createdAt?: SortOrder
  }

  export type MetierSumOrderByAggregateInput = {
    ordreAffichage?: SortOrder
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EnumAbonnementTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AbonnementType | EnumAbonnementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAbonnementTypeFilter<$PrismaModel> | $Enums.AbonnementType
  }

  export type EnumStatutArtisanFilter<$PrismaModel = never> = {
    equals?: $Enums.StatutArtisan | EnumStatutArtisanFieldRefInput<$PrismaModel>
    in?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    notIn?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutArtisanFilter<$PrismaModel> | $Enums.StatutArtisan
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type ArtisanCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    nomEntreprise?: SortOrder
    numeroIfu?: SortOrder
    anneesExperience?: SortOrder
    bio?: SortOrder
    slogan?: SortOrder
    photoProfilUrl?: SortOrder
    photoCouvertureUrl?: SortOrder
    portfolioUrls?: SortOrder
    adresseAtelier?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    villePrincipale?: SortOrder
    zoneInterventionKm?: SortOrder
    villesIntervention?: SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrder
    disponible?: SortOrder
    accepteUrgences?: SortOrder
    accepteWeekend?: SortOrder
    horairesTravail?: SortOrder
    verified?: SortOrder
    verifiedAt?: SortOrder
    verifiedBy?: SortOrder
    badges?: SortOrder
    abonnementType?: SortOrder
    abonnementExpireAt?: SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
    statut?: SortOrder
    raisonSuspension?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type ArtisanAvgOrderByAggregateInput = {
    anneesExperience?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    zoneInterventionKm?: SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
  }

  export type ArtisanMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    nomEntreprise?: SortOrder
    numeroIfu?: SortOrder
    anneesExperience?: SortOrder
    bio?: SortOrder
    slogan?: SortOrder
    photoProfilUrl?: SortOrder
    photoCouvertureUrl?: SortOrder
    adresseAtelier?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    villePrincipale?: SortOrder
    zoneInterventionKm?: SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrder
    disponible?: SortOrder
    accepteUrgences?: SortOrder
    accepteWeekend?: SortOrder
    verified?: SortOrder
    verifiedAt?: SortOrder
    verifiedBy?: SortOrder
    abonnementType?: SortOrder
    abonnementExpireAt?: SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
    statut?: SortOrder
    raisonSuspension?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type ArtisanMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    nomEntreprise?: SortOrder
    numeroIfu?: SortOrder
    anneesExperience?: SortOrder
    bio?: SortOrder
    slogan?: SortOrder
    photoProfilUrl?: SortOrder
    photoCouvertureUrl?: SortOrder
    adresseAtelier?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    villePrincipale?: SortOrder
    zoneInterventionKm?: SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrder
    disponible?: SortOrder
    accepteUrgences?: SortOrder
    accepteWeekend?: SortOrder
    verified?: SortOrder
    verifiedAt?: SortOrder
    verifiedBy?: SortOrder
    abonnementType?: SortOrder
    abonnementExpireAt?: SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
    statut?: SortOrder
    raisonSuspension?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type ArtisanSumOrderByAggregateInput = {
    anneesExperience?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    zoneInterventionKm?: SortOrder
    noteMoyenne?: SortOrder
    nombreAvis?: SortOrder
    compteurDemandesMoisCourant?: SortOrder
    nombreMissionsCompletees?: SortOrder
    tauxCompletion?: SortOrder
    tauxReponseMoyen?: SortOrder
    totalVuesProfil?: SortOrder
    totalContacts?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumAbonnementTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AbonnementType | EnumAbonnementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAbonnementTypeWithAggregatesFilter<$PrismaModel> | $Enums.AbonnementType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAbonnementTypeFilter<$PrismaModel>
    _max?: NestedEnumAbonnementTypeFilter<$PrismaModel>
  }

  export type EnumStatutArtisanWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatutArtisan | EnumStatutArtisanFieldRefInput<$PrismaModel>
    in?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    notIn?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutArtisanWithAggregatesFilter<$PrismaModel> | $Enums.StatutArtisan
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatutArtisanFilter<$PrismaModel>
    _max?: NestedEnumStatutArtisanFilter<$PrismaModel>
  }

  export type ArtisanScalarRelationFilter = {
    is?: ArtisanWhereInput
    isNot?: ArtisanWhereInput
  }

  export type MetierScalarRelationFilter = {
    is?: MetierWhereInput
    isNot?: MetierWhereInput
  }

  export type ArtisanMetierIdx_artisan_metier_uniqueCompoundUniqueInput = {
    artisanId: string
    metierId: string
  }

  export type ArtisanMetierCountOrderByAggregateInput = {
    id?: SortOrder
    artisanId?: SortOrder
    metierId?: SortOrder
    estPrincipal?: SortOrder
    anneesExperience?: SortOrder
    certifie?: SortOrder
    tarifHoraire?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
  }

  export type ArtisanMetierAvgOrderByAggregateInput = {
    anneesExperience?: SortOrder
    tarifHoraire?: SortOrder
  }

  export type ArtisanMetierMaxOrderByAggregateInput = {
    id?: SortOrder
    artisanId?: SortOrder
    metierId?: SortOrder
    estPrincipal?: SortOrder
    anneesExperience?: SortOrder
    certifie?: SortOrder
    tarifHoraire?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
  }

  export type ArtisanMetierMinOrderByAggregateInput = {
    id?: SortOrder
    artisanId?: SortOrder
    metierId?: SortOrder
    estPrincipal?: SortOrder
    anneesExperience?: SortOrder
    certifie?: SortOrder
    tarifHoraire?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
  }

  export type ArtisanMetierSumOrderByAggregateInput = {
    anneesExperience?: SortOrder
    tarifHoraire?: SortOrder
  }

  export type ArtisanCreateNestedOneWithoutUserInput = {
    create?: XOR<ArtisanCreateWithoutUserInput, ArtisanUncheckedCreateWithoutUserInput>
    connectOrCreate?: ArtisanCreateOrConnectWithoutUserInput
    connect?: ArtisanWhereUniqueInput
  }

  export type ArtisanCreateNestedManyWithoutVerifiedByUserInput = {
    create?: XOR<ArtisanCreateWithoutVerifiedByUserInput, ArtisanUncheckedCreateWithoutVerifiedByUserInput> | ArtisanCreateWithoutVerifiedByUserInput[] | ArtisanUncheckedCreateWithoutVerifiedByUserInput[]
    connectOrCreate?: ArtisanCreateOrConnectWithoutVerifiedByUserInput | ArtisanCreateOrConnectWithoutVerifiedByUserInput[]
    createMany?: ArtisanCreateManyVerifiedByUserInputEnvelope
    connect?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
  }

  export type ArtisanUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<ArtisanCreateWithoutUserInput, ArtisanUncheckedCreateWithoutUserInput>
    connectOrCreate?: ArtisanCreateOrConnectWithoutUserInput
    connect?: ArtisanWhereUniqueInput
  }

  export type ArtisanUncheckedCreateNestedManyWithoutVerifiedByUserInput = {
    create?: XOR<ArtisanCreateWithoutVerifiedByUserInput, ArtisanUncheckedCreateWithoutVerifiedByUserInput> | ArtisanCreateWithoutVerifiedByUserInput[] | ArtisanUncheckedCreateWithoutVerifiedByUserInput[]
    connectOrCreate?: ArtisanCreateOrConnectWithoutVerifiedByUserInput | ArtisanCreateOrConnectWithoutVerifiedByUserInput[]
    createMany?: ArtisanCreateManyVerifiedByUserInputEnvelope
    connect?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type EnumStatutFieldUpdateOperationsInput = {
    set?: $Enums.Statut
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ArtisanUpdateOneWithoutUserNestedInput = {
    create?: XOR<ArtisanCreateWithoutUserInput, ArtisanUncheckedCreateWithoutUserInput>
    connectOrCreate?: ArtisanCreateOrConnectWithoutUserInput
    upsert?: ArtisanUpsertWithoutUserInput
    disconnect?: ArtisanWhereInput | boolean
    delete?: ArtisanWhereInput | boolean
    connect?: ArtisanWhereUniqueInput
    update?: XOR<XOR<ArtisanUpdateToOneWithWhereWithoutUserInput, ArtisanUpdateWithoutUserInput>, ArtisanUncheckedUpdateWithoutUserInput>
  }

  export type ArtisanUpdateManyWithoutVerifiedByUserNestedInput = {
    create?: XOR<ArtisanCreateWithoutVerifiedByUserInput, ArtisanUncheckedCreateWithoutVerifiedByUserInput> | ArtisanCreateWithoutVerifiedByUserInput[] | ArtisanUncheckedCreateWithoutVerifiedByUserInput[]
    connectOrCreate?: ArtisanCreateOrConnectWithoutVerifiedByUserInput | ArtisanCreateOrConnectWithoutVerifiedByUserInput[]
    upsert?: ArtisanUpsertWithWhereUniqueWithoutVerifiedByUserInput | ArtisanUpsertWithWhereUniqueWithoutVerifiedByUserInput[]
    createMany?: ArtisanCreateManyVerifiedByUserInputEnvelope
    set?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    disconnect?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    delete?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    connect?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    update?: ArtisanUpdateWithWhereUniqueWithoutVerifiedByUserInput | ArtisanUpdateWithWhereUniqueWithoutVerifiedByUserInput[]
    updateMany?: ArtisanUpdateManyWithWhereWithoutVerifiedByUserInput | ArtisanUpdateManyWithWhereWithoutVerifiedByUserInput[]
    deleteMany?: ArtisanScalarWhereInput | ArtisanScalarWhereInput[]
  }

  export type ArtisanUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<ArtisanCreateWithoutUserInput, ArtisanUncheckedCreateWithoutUserInput>
    connectOrCreate?: ArtisanCreateOrConnectWithoutUserInput
    upsert?: ArtisanUpsertWithoutUserInput
    disconnect?: ArtisanWhereInput | boolean
    delete?: ArtisanWhereInput | boolean
    connect?: ArtisanWhereUniqueInput
    update?: XOR<XOR<ArtisanUpdateToOneWithWhereWithoutUserInput, ArtisanUpdateWithoutUserInput>, ArtisanUncheckedUpdateWithoutUserInput>
  }

  export type ArtisanUncheckedUpdateManyWithoutVerifiedByUserNestedInput = {
    create?: XOR<ArtisanCreateWithoutVerifiedByUserInput, ArtisanUncheckedCreateWithoutVerifiedByUserInput> | ArtisanCreateWithoutVerifiedByUserInput[] | ArtisanUncheckedCreateWithoutVerifiedByUserInput[]
    connectOrCreate?: ArtisanCreateOrConnectWithoutVerifiedByUserInput | ArtisanCreateOrConnectWithoutVerifiedByUserInput[]
    upsert?: ArtisanUpsertWithWhereUniqueWithoutVerifiedByUserInput | ArtisanUpsertWithWhereUniqueWithoutVerifiedByUserInput[]
    createMany?: ArtisanCreateManyVerifiedByUserInputEnvelope
    set?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    disconnect?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    delete?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    connect?: ArtisanWhereUniqueInput | ArtisanWhereUniqueInput[]
    update?: ArtisanUpdateWithWhereUniqueWithoutVerifiedByUserInput | ArtisanUpdateWithWhereUniqueWithoutVerifiedByUserInput[]
    updateMany?: ArtisanUpdateManyWithWhereWithoutVerifiedByUserInput | ArtisanUpdateManyWithWhereWithoutVerifiedByUserInput[]
    deleteMany?: ArtisanScalarWhereInput | ArtisanScalarWhereInput[]
  }

  export type MetierCreateNestedManyWithoutCategorieInput = {
    create?: XOR<MetierCreateWithoutCategorieInput, MetierUncheckedCreateWithoutCategorieInput> | MetierCreateWithoutCategorieInput[] | MetierUncheckedCreateWithoutCategorieInput[]
    connectOrCreate?: MetierCreateOrConnectWithoutCategorieInput | MetierCreateOrConnectWithoutCategorieInput[]
    createMany?: MetierCreateManyCategorieInputEnvelope
    connect?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
  }

  export type MetierUncheckedCreateNestedManyWithoutCategorieInput = {
    create?: XOR<MetierCreateWithoutCategorieInput, MetierUncheckedCreateWithoutCategorieInput> | MetierCreateWithoutCategorieInput[] | MetierUncheckedCreateWithoutCategorieInput[]
    connectOrCreate?: MetierCreateOrConnectWithoutCategorieInput | MetierCreateOrConnectWithoutCategorieInput[]
    createMany?: MetierCreateManyCategorieInputEnvelope
    connect?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MetierUpdateManyWithoutCategorieNestedInput = {
    create?: XOR<MetierCreateWithoutCategorieInput, MetierUncheckedCreateWithoutCategorieInput> | MetierCreateWithoutCategorieInput[] | MetierUncheckedCreateWithoutCategorieInput[]
    connectOrCreate?: MetierCreateOrConnectWithoutCategorieInput | MetierCreateOrConnectWithoutCategorieInput[]
    upsert?: MetierUpsertWithWhereUniqueWithoutCategorieInput | MetierUpsertWithWhereUniqueWithoutCategorieInput[]
    createMany?: MetierCreateManyCategorieInputEnvelope
    set?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    disconnect?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    delete?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    connect?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    update?: MetierUpdateWithWhereUniqueWithoutCategorieInput | MetierUpdateWithWhereUniqueWithoutCategorieInput[]
    updateMany?: MetierUpdateManyWithWhereWithoutCategorieInput | MetierUpdateManyWithWhereWithoutCategorieInput[]
    deleteMany?: MetierScalarWhereInput | MetierScalarWhereInput[]
  }

  export type MetierUncheckedUpdateManyWithoutCategorieNestedInput = {
    create?: XOR<MetierCreateWithoutCategorieInput, MetierUncheckedCreateWithoutCategorieInput> | MetierCreateWithoutCategorieInput[] | MetierUncheckedCreateWithoutCategorieInput[]
    connectOrCreate?: MetierCreateOrConnectWithoutCategorieInput | MetierCreateOrConnectWithoutCategorieInput[]
    upsert?: MetierUpsertWithWhereUniqueWithoutCategorieInput | MetierUpsertWithWhereUniqueWithoutCategorieInput[]
    createMany?: MetierCreateManyCategorieInputEnvelope
    set?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    disconnect?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    delete?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    connect?: MetierWhereUniqueInput | MetierWhereUniqueInput[]
    update?: MetierUpdateWithWhereUniqueWithoutCategorieInput | MetierUpdateWithWhereUniqueWithoutCategorieInput[]
    updateMany?: MetierUpdateManyWithWhereWithoutCategorieInput | MetierUpdateManyWithWhereWithoutCategorieInput[]
    deleteMany?: MetierScalarWhereInput | MetierScalarWhereInput[]
  }

  export type CategorieMetierCreateNestedOneWithoutMetiersInput = {
    create?: XOR<CategorieMetierCreateWithoutMetiersInput, CategorieMetierUncheckedCreateWithoutMetiersInput>
    connectOrCreate?: CategorieMetierCreateOrConnectWithoutMetiersInput
    connect?: CategorieMetierWhereUniqueInput
  }

  export type ArtisanMetierCreateNestedManyWithoutMetierInput = {
    create?: XOR<ArtisanMetierCreateWithoutMetierInput, ArtisanMetierUncheckedCreateWithoutMetierInput> | ArtisanMetierCreateWithoutMetierInput[] | ArtisanMetierUncheckedCreateWithoutMetierInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutMetierInput | ArtisanMetierCreateOrConnectWithoutMetierInput[]
    createMany?: ArtisanMetierCreateManyMetierInputEnvelope
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
  }

  export type ArtisanMetierUncheckedCreateNestedManyWithoutMetierInput = {
    create?: XOR<ArtisanMetierCreateWithoutMetierInput, ArtisanMetierUncheckedCreateWithoutMetierInput> | ArtisanMetierCreateWithoutMetierInput[] | ArtisanMetierUncheckedCreateWithoutMetierInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutMetierInput | ArtisanMetierCreateOrConnectWithoutMetierInput[]
    createMany?: ArtisanMetierCreateManyMetierInputEnvelope
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
  }

  export type CategorieMetierUpdateOneRequiredWithoutMetiersNestedInput = {
    create?: XOR<CategorieMetierCreateWithoutMetiersInput, CategorieMetierUncheckedCreateWithoutMetiersInput>
    connectOrCreate?: CategorieMetierCreateOrConnectWithoutMetiersInput
    upsert?: CategorieMetierUpsertWithoutMetiersInput
    connect?: CategorieMetierWhereUniqueInput
    update?: XOR<XOR<CategorieMetierUpdateToOneWithWhereWithoutMetiersInput, CategorieMetierUpdateWithoutMetiersInput>, CategorieMetierUncheckedUpdateWithoutMetiersInput>
  }

  export type ArtisanMetierUpdateManyWithoutMetierNestedInput = {
    create?: XOR<ArtisanMetierCreateWithoutMetierInput, ArtisanMetierUncheckedCreateWithoutMetierInput> | ArtisanMetierCreateWithoutMetierInput[] | ArtisanMetierUncheckedCreateWithoutMetierInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutMetierInput | ArtisanMetierCreateOrConnectWithoutMetierInput[]
    upsert?: ArtisanMetierUpsertWithWhereUniqueWithoutMetierInput | ArtisanMetierUpsertWithWhereUniqueWithoutMetierInput[]
    createMany?: ArtisanMetierCreateManyMetierInputEnvelope
    set?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    disconnect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    delete?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    update?: ArtisanMetierUpdateWithWhereUniqueWithoutMetierInput | ArtisanMetierUpdateWithWhereUniqueWithoutMetierInput[]
    updateMany?: ArtisanMetierUpdateManyWithWhereWithoutMetierInput | ArtisanMetierUpdateManyWithWhereWithoutMetierInput[]
    deleteMany?: ArtisanMetierScalarWhereInput | ArtisanMetierScalarWhereInput[]
  }

  export type ArtisanMetierUncheckedUpdateManyWithoutMetierNestedInput = {
    create?: XOR<ArtisanMetierCreateWithoutMetierInput, ArtisanMetierUncheckedCreateWithoutMetierInput> | ArtisanMetierCreateWithoutMetierInput[] | ArtisanMetierUncheckedCreateWithoutMetierInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutMetierInput | ArtisanMetierCreateOrConnectWithoutMetierInput[]
    upsert?: ArtisanMetierUpsertWithWhereUniqueWithoutMetierInput | ArtisanMetierUpsertWithWhereUniqueWithoutMetierInput[]
    createMany?: ArtisanMetierCreateManyMetierInputEnvelope
    set?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    disconnect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    delete?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    update?: ArtisanMetierUpdateWithWhereUniqueWithoutMetierInput | ArtisanMetierUpdateWithWhereUniqueWithoutMetierInput[]
    updateMany?: ArtisanMetierUpdateManyWithWhereWithoutMetierInput | ArtisanMetierUpdateManyWithWhereWithoutMetierInput[]
    deleteMany?: ArtisanMetierScalarWhereInput | ArtisanMetierScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutArtisanInput = {
    create?: XOR<UserCreateWithoutArtisanInput, UserUncheckedCreateWithoutArtisanInput>
    connectOrCreate?: UserCreateOrConnectWithoutArtisanInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutArtisansVerifiedInput = {
    create?: XOR<UserCreateWithoutArtisansVerifiedInput, UserUncheckedCreateWithoutArtisansVerifiedInput>
    connectOrCreate?: UserCreateOrConnectWithoutArtisansVerifiedInput
    connect?: UserWhereUniqueInput
  }

  export type ArtisanMetierCreateNestedManyWithoutArtisanInput = {
    create?: XOR<ArtisanMetierCreateWithoutArtisanInput, ArtisanMetierUncheckedCreateWithoutArtisanInput> | ArtisanMetierCreateWithoutArtisanInput[] | ArtisanMetierUncheckedCreateWithoutArtisanInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutArtisanInput | ArtisanMetierCreateOrConnectWithoutArtisanInput[]
    createMany?: ArtisanMetierCreateManyArtisanInputEnvelope
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
  }

  export type ArtisanMetierUncheckedCreateNestedManyWithoutArtisanInput = {
    create?: XOR<ArtisanMetierCreateWithoutArtisanInput, ArtisanMetierUncheckedCreateWithoutArtisanInput> | ArtisanMetierCreateWithoutArtisanInput[] | ArtisanMetierUncheckedCreateWithoutArtisanInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutArtisanInput | ArtisanMetierCreateOrConnectWithoutArtisanInput[]
    createMany?: ArtisanMetierCreateManyArtisanInputEnvelope
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumAbonnementTypeFieldUpdateOperationsInput = {
    set?: $Enums.AbonnementType
  }

  export type EnumStatutArtisanFieldUpdateOperationsInput = {
    set?: $Enums.StatutArtisan
  }

  export type UserUpdateOneRequiredWithoutArtisanNestedInput = {
    create?: XOR<UserCreateWithoutArtisanInput, UserUncheckedCreateWithoutArtisanInput>
    connectOrCreate?: UserCreateOrConnectWithoutArtisanInput
    upsert?: UserUpsertWithoutArtisanInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutArtisanInput, UserUpdateWithoutArtisanInput>, UserUncheckedUpdateWithoutArtisanInput>
  }

  export type UserUpdateOneWithoutArtisansVerifiedNestedInput = {
    create?: XOR<UserCreateWithoutArtisansVerifiedInput, UserUncheckedCreateWithoutArtisansVerifiedInput>
    connectOrCreate?: UserCreateOrConnectWithoutArtisansVerifiedInput
    upsert?: UserUpsertWithoutArtisansVerifiedInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutArtisansVerifiedInput, UserUpdateWithoutArtisansVerifiedInput>, UserUncheckedUpdateWithoutArtisansVerifiedInput>
  }

  export type ArtisanMetierUpdateManyWithoutArtisanNestedInput = {
    create?: XOR<ArtisanMetierCreateWithoutArtisanInput, ArtisanMetierUncheckedCreateWithoutArtisanInput> | ArtisanMetierCreateWithoutArtisanInput[] | ArtisanMetierUncheckedCreateWithoutArtisanInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutArtisanInput | ArtisanMetierCreateOrConnectWithoutArtisanInput[]
    upsert?: ArtisanMetierUpsertWithWhereUniqueWithoutArtisanInput | ArtisanMetierUpsertWithWhereUniqueWithoutArtisanInput[]
    createMany?: ArtisanMetierCreateManyArtisanInputEnvelope
    set?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    disconnect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    delete?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    update?: ArtisanMetierUpdateWithWhereUniqueWithoutArtisanInput | ArtisanMetierUpdateWithWhereUniqueWithoutArtisanInput[]
    updateMany?: ArtisanMetierUpdateManyWithWhereWithoutArtisanInput | ArtisanMetierUpdateManyWithWhereWithoutArtisanInput[]
    deleteMany?: ArtisanMetierScalarWhereInput | ArtisanMetierScalarWhereInput[]
  }

  export type ArtisanMetierUncheckedUpdateManyWithoutArtisanNestedInput = {
    create?: XOR<ArtisanMetierCreateWithoutArtisanInput, ArtisanMetierUncheckedCreateWithoutArtisanInput> | ArtisanMetierCreateWithoutArtisanInput[] | ArtisanMetierUncheckedCreateWithoutArtisanInput[]
    connectOrCreate?: ArtisanMetierCreateOrConnectWithoutArtisanInput | ArtisanMetierCreateOrConnectWithoutArtisanInput[]
    upsert?: ArtisanMetierUpsertWithWhereUniqueWithoutArtisanInput | ArtisanMetierUpsertWithWhereUniqueWithoutArtisanInput[]
    createMany?: ArtisanMetierCreateManyArtisanInputEnvelope
    set?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    disconnect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    delete?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    connect?: ArtisanMetierWhereUniqueInput | ArtisanMetierWhereUniqueInput[]
    update?: ArtisanMetierUpdateWithWhereUniqueWithoutArtisanInput | ArtisanMetierUpdateWithWhereUniqueWithoutArtisanInput[]
    updateMany?: ArtisanMetierUpdateManyWithWhereWithoutArtisanInput | ArtisanMetierUpdateManyWithWhereWithoutArtisanInput[]
    deleteMany?: ArtisanMetierScalarWhereInput | ArtisanMetierScalarWhereInput[]
  }

  export type ArtisanCreateNestedOneWithoutMetiersInput = {
    create?: XOR<ArtisanCreateWithoutMetiersInput, ArtisanUncheckedCreateWithoutMetiersInput>
    connectOrCreate?: ArtisanCreateOrConnectWithoutMetiersInput
    connect?: ArtisanWhereUniqueInput
  }

  export type MetierCreateNestedOneWithoutArtisanMetiersInput = {
    create?: XOR<MetierCreateWithoutArtisanMetiersInput, MetierUncheckedCreateWithoutArtisanMetiersInput>
    connectOrCreate?: MetierCreateOrConnectWithoutArtisanMetiersInput
    connect?: MetierWhereUniqueInput
  }

  export type ArtisanUpdateOneRequiredWithoutMetiersNestedInput = {
    create?: XOR<ArtisanCreateWithoutMetiersInput, ArtisanUncheckedCreateWithoutMetiersInput>
    connectOrCreate?: ArtisanCreateOrConnectWithoutMetiersInput
    upsert?: ArtisanUpsertWithoutMetiersInput
    connect?: ArtisanWhereUniqueInput
    update?: XOR<XOR<ArtisanUpdateToOneWithWhereWithoutMetiersInput, ArtisanUpdateWithoutMetiersInput>, ArtisanUncheckedUpdateWithoutMetiersInput>
  }

  export type MetierUpdateOneRequiredWithoutArtisanMetiersNestedInput = {
    create?: XOR<MetierCreateWithoutArtisanMetiersInput, MetierUncheckedCreateWithoutArtisanMetiersInput>
    connectOrCreate?: MetierCreateOrConnectWithoutArtisanMetiersInput
    upsert?: MetierUpsertWithoutArtisanMetiersInput
    connect?: MetierWhereUniqueInput
    update?: XOR<XOR<MetierUpdateToOneWithWhereWithoutArtisanMetiersInput, MetierUpdateWithoutArtisanMetiersInput>, MetierUncheckedUpdateWithoutArtisanMetiersInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedEnumStatutFilter<$PrismaModel = never> = {
    equals?: $Enums.Statut | EnumStatutFieldRefInput<$PrismaModel>
    in?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    notIn?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutFilter<$PrismaModel> | $Enums.Statut
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedEnumStatutWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Statut | EnumStatutFieldRefInput<$PrismaModel>
    in?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    notIn?: $Enums.Statut[] | ListEnumStatutFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutWithAggregatesFilter<$PrismaModel> | $Enums.Statut
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatutFilter<$PrismaModel>
    _max?: NestedEnumStatutFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedEnumAbonnementTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AbonnementType | EnumAbonnementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAbonnementTypeFilter<$PrismaModel> | $Enums.AbonnementType
  }

  export type NestedEnumStatutArtisanFilter<$PrismaModel = never> = {
    equals?: $Enums.StatutArtisan | EnumStatutArtisanFieldRefInput<$PrismaModel>
    in?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    notIn?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutArtisanFilter<$PrismaModel> | $Enums.StatutArtisan
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumAbonnementTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AbonnementType | EnumAbonnementTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AbonnementType[] | ListEnumAbonnementTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAbonnementTypeWithAggregatesFilter<$PrismaModel> | $Enums.AbonnementType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAbonnementTypeFilter<$PrismaModel>
    _max?: NestedEnumAbonnementTypeFilter<$PrismaModel>
  }

  export type NestedEnumStatutArtisanWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatutArtisan | EnumStatutArtisanFieldRefInput<$PrismaModel>
    in?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    notIn?: $Enums.StatutArtisan[] | ListEnumStatutArtisanFieldRefInput<$PrismaModel>
    not?: NestedEnumStatutArtisanWithAggregatesFilter<$PrismaModel> | $Enums.StatutArtisan
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatutArtisanFilter<$PrismaModel>
    _max?: NestedEnumStatutArtisanFilter<$PrismaModel>
  }

  export type ArtisanCreateWithoutUserInput = {
    id?: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    verifiedByUser?: UserCreateNestedOneWithoutArtisansVerifiedInput
    metiers?: ArtisanMetierCreateNestedManyWithoutArtisanInput
  }

  export type ArtisanUncheckedCreateWithoutUserInput = {
    id?: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    metiers?: ArtisanMetierUncheckedCreateNestedManyWithoutArtisanInput
  }

  export type ArtisanCreateOrConnectWithoutUserInput = {
    where: ArtisanWhereUniqueInput
    create: XOR<ArtisanCreateWithoutUserInput, ArtisanUncheckedCreateWithoutUserInput>
  }

  export type ArtisanCreateWithoutVerifiedByUserInput = {
    id?: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    user: UserCreateNestedOneWithoutArtisanInput
    metiers?: ArtisanMetierCreateNestedManyWithoutArtisanInput
  }

  export type ArtisanUncheckedCreateWithoutVerifiedByUserInput = {
    id?: string
    userId: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    metiers?: ArtisanMetierUncheckedCreateNestedManyWithoutArtisanInput
  }

  export type ArtisanCreateOrConnectWithoutVerifiedByUserInput = {
    where: ArtisanWhereUniqueInput
    create: XOR<ArtisanCreateWithoutVerifiedByUserInput, ArtisanUncheckedCreateWithoutVerifiedByUserInput>
  }

  export type ArtisanCreateManyVerifiedByUserInputEnvelope = {
    data: ArtisanCreateManyVerifiedByUserInput | ArtisanCreateManyVerifiedByUserInput[]
    skipDuplicates?: boolean
  }

  export type ArtisanUpsertWithoutUserInput = {
    update: XOR<ArtisanUpdateWithoutUserInput, ArtisanUncheckedUpdateWithoutUserInput>
    create: XOR<ArtisanCreateWithoutUserInput, ArtisanUncheckedCreateWithoutUserInput>
    where?: ArtisanWhereInput
  }

  export type ArtisanUpdateToOneWithWhereWithoutUserInput = {
    where?: ArtisanWhereInput
    data: XOR<ArtisanUpdateWithoutUserInput, ArtisanUncheckedUpdateWithoutUserInput>
  }

  export type ArtisanUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedByUser?: UserUpdateOneWithoutArtisansVerifiedNestedInput
    metiers?: ArtisanMetierUpdateManyWithoutArtisanNestedInput
  }

  export type ArtisanUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metiers?: ArtisanMetierUncheckedUpdateManyWithoutArtisanNestedInput
  }

  export type ArtisanUpsertWithWhereUniqueWithoutVerifiedByUserInput = {
    where: ArtisanWhereUniqueInput
    update: XOR<ArtisanUpdateWithoutVerifiedByUserInput, ArtisanUncheckedUpdateWithoutVerifiedByUserInput>
    create: XOR<ArtisanCreateWithoutVerifiedByUserInput, ArtisanUncheckedCreateWithoutVerifiedByUserInput>
  }

  export type ArtisanUpdateWithWhereUniqueWithoutVerifiedByUserInput = {
    where: ArtisanWhereUniqueInput
    data: XOR<ArtisanUpdateWithoutVerifiedByUserInput, ArtisanUncheckedUpdateWithoutVerifiedByUserInput>
  }

  export type ArtisanUpdateManyWithWhereWithoutVerifiedByUserInput = {
    where: ArtisanScalarWhereInput
    data: XOR<ArtisanUpdateManyMutationInput, ArtisanUncheckedUpdateManyWithoutVerifiedByUserInput>
  }

  export type ArtisanScalarWhereInput = {
    AND?: ArtisanScalarWhereInput | ArtisanScalarWhereInput[]
    OR?: ArtisanScalarWhereInput[]
    NOT?: ArtisanScalarWhereInput | ArtisanScalarWhereInput[]
    id?: StringFilter<"Artisan"> | string
    userId?: StringFilter<"Artisan"> | string
    nomEntreprise?: StringNullableFilter<"Artisan"> | string | null
    numeroIfu?: StringNullableFilter<"Artisan"> | string | null
    anneesExperience?: IntFilter<"Artisan"> | number
    bio?: StringNullableFilter<"Artisan"> | string | null
    slogan?: StringNullableFilter<"Artisan"> | string | null
    photoProfilUrl?: StringNullableFilter<"Artisan"> | string | null
    photoCouvertureUrl?: StringNullableFilter<"Artisan"> | string | null
    portfolioUrls?: JsonNullableFilter<"Artisan">
    adresseAtelier?: StringNullableFilter<"Artisan"> | string | null
    latitude?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFilter<"Artisan"> | string
    zoneInterventionKm?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    villesIntervention?: JsonNullableFilter<"Artisan">
    noteMoyenne?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFilter<"Artisan"> | number
    compteurDemandesMoisCourant?: IntFilter<"Artisan"> | number
    nombreMissionsCompletees?: IntFilter<"Artisan"> | number
    tauxCompletion?: DecimalFilter<"Artisan"> | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: IntNullableFilter<"Artisan"> | number | null
    disponible?: BoolFilter<"Artisan"> | boolean
    accepteUrgences?: BoolFilter<"Artisan"> | boolean
    accepteWeekend?: BoolFilter<"Artisan"> | boolean
    horairesTravail?: JsonNullableFilter<"Artisan">
    verified?: BoolFilter<"Artisan"> | boolean
    verifiedAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    verifiedBy?: StringNullableFilter<"Artisan"> | string | null
    badges?: JsonNullableFilter<"Artisan">
    abonnementType?: EnumAbonnementTypeFilter<"Artisan"> | $Enums.AbonnementType
    abonnementExpireAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
    totalVuesProfil?: IntFilter<"Artisan"> | number
    totalContacts?: IntFilter<"Artisan"> | number
    statut?: EnumStatutArtisanFilter<"Artisan"> | $Enums.StatutArtisan
    raisonSuspension?: StringNullableFilter<"Artisan"> | string | null
    createdAt?: DateTimeFilter<"Artisan"> | Date | string
    updatedAt?: DateTimeFilter<"Artisan"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Artisan"> | Date | string | null
  }

  export type MetierCreateWithoutCategorieInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
    artisanMetiers?: ArtisanMetierCreateNestedManyWithoutMetierInput
  }

  export type MetierUncheckedCreateWithoutCategorieInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
    artisanMetiers?: ArtisanMetierUncheckedCreateNestedManyWithoutMetierInput
  }

  export type MetierCreateOrConnectWithoutCategorieInput = {
    where: MetierWhereUniqueInput
    create: XOR<MetierCreateWithoutCategorieInput, MetierUncheckedCreateWithoutCategorieInput>
  }

  export type MetierCreateManyCategorieInputEnvelope = {
    data: MetierCreateManyCategorieInput | MetierCreateManyCategorieInput[]
    skipDuplicates?: boolean
  }

  export type MetierUpsertWithWhereUniqueWithoutCategorieInput = {
    where: MetierWhereUniqueInput
    update: XOR<MetierUpdateWithoutCategorieInput, MetierUncheckedUpdateWithoutCategorieInput>
    create: XOR<MetierCreateWithoutCategorieInput, MetierUncheckedCreateWithoutCategorieInput>
  }

  export type MetierUpdateWithWhereUniqueWithoutCategorieInput = {
    where: MetierWhereUniqueInput
    data: XOR<MetierUpdateWithoutCategorieInput, MetierUncheckedUpdateWithoutCategorieInput>
  }

  export type MetierUpdateManyWithWhereWithoutCategorieInput = {
    where: MetierScalarWhereInput
    data: XOR<MetierUpdateManyMutationInput, MetierUncheckedUpdateManyWithoutCategorieInput>
  }

  export type MetierScalarWhereInput = {
    AND?: MetierScalarWhereInput | MetierScalarWhereInput[]
    OR?: MetierScalarWhereInput[]
    NOT?: MetierScalarWhereInput | MetierScalarWhereInput[]
    id?: StringFilter<"Metier"> | string
    nom?: StringFilter<"Metier"> | string
    slug?: StringFilter<"Metier"> | string
    description?: StringNullableFilter<"Metier"> | string | null
    iconUrl?: StringNullableFilter<"Metier"> | string | null
    categorieId?: StringFilter<"Metier"> | string
    ordreAffichage?: IntFilter<"Metier"> | number
    populaire?: BoolFilter<"Metier"> | boolean
    actif?: BoolFilter<"Metier"> | boolean
    createdAt?: DateTimeFilter<"Metier"> | Date | string
  }

  export type CategorieMetierCreateWithoutMetiersInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    actif?: boolean
    createdAt?: Date | string
  }

  export type CategorieMetierUncheckedCreateWithoutMetiersInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    actif?: boolean
    createdAt?: Date | string
  }

  export type CategorieMetierCreateOrConnectWithoutMetiersInput = {
    where: CategorieMetierWhereUniqueInput
    create: XOR<CategorieMetierCreateWithoutMetiersInput, CategorieMetierUncheckedCreateWithoutMetiersInput>
  }

  export type ArtisanMetierCreateWithoutMetierInput = {
    id?: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
    artisan: ArtisanCreateNestedOneWithoutMetiersInput
  }

  export type ArtisanMetierUncheckedCreateWithoutMetierInput = {
    id?: string
    artisanId: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
  }

  export type ArtisanMetierCreateOrConnectWithoutMetierInput = {
    where: ArtisanMetierWhereUniqueInput
    create: XOR<ArtisanMetierCreateWithoutMetierInput, ArtisanMetierUncheckedCreateWithoutMetierInput>
  }

  export type ArtisanMetierCreateManyMetierInputEnvelope = {
    data: ArtisanMetierCreateManyMetierInput | ArtisanMetierCreateManyMetierInput[]
    skipDuplicates?: boolean
  }

  export type CategorieMetierUpsertWithoutMetiersInput = {
    update: XOR<CategorieMetierUpdateWithoutMetiersInput, CategorieMetierUncheckedUpdateWithoutMetiersInput>
    create: XOR<CategorieMetierCreateWithoutMetiersInput, CategorieMetierUncheckedCreateWithoutMetiersInput>
    where?: CategorieMetierWhereInput
  }

  export type CategorieMetierUpdateToOneWithWhereWithoutMetiersInput = {
    where?: CategorieMetierWhereInput
    data: XOR<CategorieMetierUpdateWithoutMetiersInput, CategorieMetierUncheckedUpdateWithoutMetiersInput>
  }

  export type CategorieMetierUpdateWithoutMetiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategorieMetierUncheckedUpdateWithoutMetiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierUpsertWithWhereUniqueWithoutMetierInput = {
    where: ArtisanMetierWhereUniqueInput
    update: XOR<ArtisanMetierUpdateWithoutMetierInput, ArtisanMetierUncheckedUpdateWithoutMetierInput>
    create: XOR<ArtisanMetierCreateWithoutMetierInput, ArtisanMetierUncheckedCreateWithoutMetierInput>
  }

  export type ArtisanMetierUpdateWithWhereUniqueWithoutMetierInput = {
    where: ArtisanMetierWhereUniqueInput
    data: XOR<ArtisanMetierUpdateWithoutMetierInput, ArtisanMetierUncheckedUpdateWithoutMetierInput>
  }

  export type ArtisanMetierUpdateManyWithWhereWithoutMetierInput = {
    where: ArtisanMetierScalarWhereInput
    data: XOR<ArtisanMetierUpdateManyMutationInput, ArtisanMetierUncheckedUpdateManyWithoutMetierInput>
  }

  export type ArtisanMetierScalarWhereInput = {
    AND?: ArtisanMetierScalarWhereInput | ArtisanMetierScalarWhereInput[]
    OR?: ArtisanMetierScalarWhereInput[]
    NOT?: ArtisanMetierScalarWhereInput | ArtisanMetierScalarWhereInput[]
    id?: StringFilter<"ArtisanMetier"> | string
    artisanId?: StringFilter<"ArtisanMetier"> | string
    metierId?: StringFilter<"ArtisanMetier"> | string
    estPrincipal?: BoolFilter<"ArtisanMetier"> | boolean
    anneesExperience?: IntNullableFilter<"ArtisanMetier"> | number | null
    certifie?: BoolFilter<"ArtisanMetier"> | boolean
    tarifHoraire?: DecimalNullableFilter<"ArtisanMetier"> | Decimal | DecimalJsLike | number | string | null
    description?: StringNullableFilter<"ArtisanMetier"> | string | null
    createdAt?: DateTimeFilter<"ArtisanMetier"> | Date | string
  }

  export type UserCreateWithoutArtisanInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    artisansVerified?: ArtisanCreateNestedManyWithoutVerifiedByUserInput
  }

  export type UserUncheckedCreateWithoutArtisanInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    artisansVerified?: ArtisanUncheckedCreateNestedManyWithoutVerifiedByUserInput
  }

  export type UserCreateOrConnectWithoutArtisanInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutArtisanInput, UserUncheckedCreateWithoutArtisanInput>
  }

  export type UserCreateWithoutArtisansVerifiedInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    artisan?: ArtisanCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutArtisansVerifiedInput = {
    id?: string
    email: string
    telephone?: string | null
    nom?: string | null
    prenom?: string | null
    dateNaissance?: Date | string | null
    sexe?: string | null
    photoUrl?: string | null
    adressePrincipale?: string | null
    latitude?: Decimal | DecimalJsLike | number | string | null
    longitude?: Decimal | DecimalJsLike | number | string | null
    ville?: string | null
    quartier?: string | null
    passwordHash: string
    emailVerified?: boolean
    telephoneVerified?: boolean
    profilComplet?: boolean
    mfaEnabled?: boolean
    mfaSecret?: string | null
    emailVerificationToken?: string | null
    emailVerificationExpiresAt?: Date | string | null
    telephoneVerificationToken?: string | null
    telephoneVerificationExpiresAt?: Date | string | null
    role?: $Enums.Role
    statut?: $Enums.Statut
    langue?: string
    timezone?: string
    notificationEmail?: boolean
    notificationSms?: boolean
    notificationPush?: boolean
    derniereConnexion?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    artisan?: ArtisanUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutArtisansVerifiedInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutArtisansVerifiedInput, UserUncheckedCreateWithoutArtisansVerifiedInput>
  }

  export type ArtisanMetierCreateWithoutArtisanInput = {
    id?: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
    metier: MetierCreateNestedOneWithoutArtisanMetiersInput
  }

  export type ArtisanMetierUncheckedCreateWithoutArtisanInput = {
    id?: string
    metierId: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
  }

  export type ArtisanMetierCreateOrConnectWithoutArtisanInput = {
    where: ArtisanMetierWhereUniqueInput
    create: XOR<ArtisanMetierCreateWithoutArtisanInput, ArtisanMetierUncheckedCreateWithoutArtisanInput>
  }

  export type ArtisanMetierCreateManyArtisanInputEnvelope = {
    data: ArtisanMetierCreateManyArtisanInput | ArtisanMetierCreateManyArtisanInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutArtisanInput = {
    update: XOR<UserUpdateWithoutArtisanInput, UserUncheckedUpdateWithoutArtisanInput>
    create: XOR<UserCreateWithoutArtisanInput, UserUncheckedCreateWithoutArtisanInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutArtisanInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutArtisanInput, UserUncheckedUpdateWithoutArtisanInput>
  }

  export type UserUpdateWithoutArtisanInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    artisansVerified?: ArtisanUpdateManyWithoutVerifiedByUserNestedInput
  }

  export type UserUncheckedUpdateWithoutArtisanInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    artisansVerified?: ArtisanUncheckedUpdateManyWithoutVerifiedByUserNestedInput
  }

  export type UserUpsertWithoutArtisansVerifiedInput = {
    update: XOR<UserUpdateWithoutArtisansVerifiedInput, UserUncheckedUpdateWithoutArtisansVerifiedInput>
    create: XOR<UserCreateWithoutArtisansVerifiedInput, UserUncheckedCreateWithoutArtisansVerifiedInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutArtisansVerifiedInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutArtisansVerifiedInput, UserUncheckedUpdateWithoutArtisansVerifiedInput>
  }

  export type UserUpdateWithoutArtisansVerifiedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    artisan?: ArtisanUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutArtisansVerifiedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    telephone?: NullableStringFieldUpdateOperationsInput | string | null
    nom?: NullableStringFieldUpdateOperationsInput | string | null
    prenom?: NullableStringFieldUpdateOperationsInput | string | null
    dateNaissance?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sexe?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    adressePrincipale?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    longitude?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ville?: NullableStringFieldUpdateOperationsInput | string | null
    quartier?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    telephoneVerified?: BoolFieldUpdateOperationsInput | boolean
    profilComplet?: BoolFieldUpdateOperationsInput | boolean
    mfaEnabled?: BoolFieldUpdateOperationsInput | boolean
    mfaSecret?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    emailVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    telephoneVerificationToken?: NullableStringFieldUpdateOperationsInput | string | null
    telephoneVerificationExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    statut?: EnumStatutFieldUpdateOperationsInput | $Enums.Statut
    langue?: StringFieldUpdateOperationsInput | string
    timezone?: StringFieldUpdateOperationsInput | string
    notificationEmail?: BoolFieldUpdateOperationsInput | boolean
    notificationSms?: BoolFieldUpdateOperationsInput | boolean
    notificationPush?: BoolFieldUpdateOperationsInput | boolean
    derniereConnexion?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    artisan?: ArtisanUncheckedUpdateOneWithoutUserNestedInput
  }

  export type ArtisanMetierUpsertWithWhereUniqueWithoutArtisanInput = {
    where: ArtisanMetierWhereUniqueInput
    update: XOR<ArtisanMetierUpdateWithoutArtisanInput, ArtisanMetierUncheckedUpdateWithoutArtisanInput>
    create: XOR<ArtisanMetierCreateWithoutArtisanInput, ArtisanMetierUncheckedCreateWithoutArtisanInput>
  }

  export type ArtisanMetierUpdateWithWhereUniqueWithoutArtisanInput = {
    where: ArtisanMetierWhereUniqueInput
    data: XOR<ArtisanMetierUpdateWithoutArtisanInput, ArtisanMetierUncheckedUpdateWithoutArtisanInput>
  }

  export type ArtisanMetierUpdateManyWithWhereWithoutArtisanInput = {
    where: ArtisanMetierScalarWhereInput
    data: XOR<ArtisanMetierUpdateManyMutationInput, ArtisanMetierUncheckedUpdateManyWithoutArtisanInput>
  }

  export type ArtisanCreateWithoutMetiersInput = {
    id?: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    user: UserCreateNestedOneWithoutArtisanInput
    verifiedByUser?: UserCreateNestedOneWithoutArtisansVerifiedInput
  }

  export type ArtisanUncheckedCreateWithoutMetiersInput = {
    id?: string
    userId: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    verifiedBy?: string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type ArtisanCreateOrConnectWithoutMetiersInput = {
    where: ArtisanWhereUniqueInput
    create: XOR<ArtisanCreateWithoutMetiersInput, ArtisanUncheckedCreateWithoutMetiersInput>
  }

  export type MetierCreateWithoutArtisanMetiersInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
    categorie: CategorieMetierCreateNestedOneWithoutMetiersInput
  }

  export type MetierUncheckedCreateWithoutArtisanMetiersInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    categorieId: string
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
  }

  export type MetierCreateOrConnectWithoutArtisanMetiersInput = {
    where: MetierWhereUniqueInput
    create: XOR<MetierCreateWithoutArtisanMetiersInput, MetierUncheckedCreateWithoutArtisanMetiersInput>
  }

  export type ArtisanUpsertWithoutMetiersInput = {
    update: XOR<ArtisanUpdateWithoutMetiersInput, ArtisanUncheckedUpdateWithoutMetiersInput>
    create: XOR<ArtisanCreateWithoutMetiersInput, ArtisanUncheckedCreateWithoutMetiersInput>
    where?: ArtisanWhereInput
  }

  export type ArtisanUpdateToOneWithWhereWithoutMetiersInput = {
    where?: ArtisanWhereInput
    data: XOR<ArtisanUpdateWithoutMetiersInput, ArtisanUncheckedUpdateWithoutMetiersInput>
  }

  export type ArtisanUpdateWithoutMetiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutArtisanNestedInput
    verifiedByUser?: UserUpdateOneWithoutArtisansVerifiedNestedInput
  }

  export type ArtisanUncheckedUpdateWithoutMetiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verifiedBy?: NullableStringFieldUpdateOperationsInput | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MetierUpsertWithoutArtisanMetiersInput = {
    update: XOR<MetierUpdateWithoutArtisanMetiersInput, MetierUncheckedUpdateWithoutArtisanMetiersInput>
    create: XOR<MetierCreateWithoutArtisanMetiersInput, MetierUncheckedCreateWithoutArtisanMetiersInput>
    where?: MetierWhereInput
  }

  export type MetierUpdateToOneWithWhereWithoutArtisanMetiersInput = {
    where?: MetierWhereInput
    data: XOR<MetierUpdateWithoutArtisanMetiersInput, MetierUncheckedUpdateWithoutArtisanMetiersInput>
  }

  export type MetierUpdateWithoutArtisanMetiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categorie?: CategorieMetierUpdateOneRequiredWithoutMetiersNestedInput
  }

  export type MetierUncheckedUpdateWithoutArtisanMetiersInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    categorieId?: StringFieldUpdateOperationsInput | string
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanCreateManyVerifiedByUserInput = {
    id?: string
    userId: string
    nomEntreprise?: string | null
    numeroIfu?: string | null
    anneesExperience?: number
    bio?: string | null
    slogan?: string | null
    photoProfilUrl?: string | null
    photoCouvertureUrl?: string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: string | null
    latitude: Decimal | DecimalJsLike | number | string
    longitude: Decimal | DecimalJsLike | number | string
    villePrincipale: string
    zoneInterventionKm?: Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: Decimal | DecimalJsLike | number | string
    nombreAvis?: number
    compteurDemandesMoisCourant?: number
    nombreMissionsCompletees?: number
    tauxCompletion?: Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: number | null
    disponible?: boolean
    accepteUrgences?: boolean
    accepteWeekend?: boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    verifiedAt?: Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: $Enums.AbonnementType
    abonnementExpireAt?: Date | string | null
    totalVuesProfil?: number
    totalContacts?: number
    statut?: $Enums.StatutArtisan
    raisonSuspension?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type ArtisanUpdateWithoutVerifiedByUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutArtisanNestedInput
    metiers?: ArtisanMetierUpdateManyWithoutArtisanNestedInput
  }

  export type ArtisanUncheckedUpdateWithoutVerifiedByUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metiers?: ArtisanMetierUncheckedUpdateManyWithoutArtisanNestedInput
  }

  export type ArtisanUncheckedUpdateManyWithoutVerifiedByUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    nomEntreprise?: NullableStringFieldUpdateOperationsInput | string | null
    numeroIfu?: NullableStringFieldUpdateOperationsInput | string | null
    anneesExperience?: IntFieldUpdateOperationsInput | number
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    slogan?: NullableStringFieldUpdateOperationsInput | string | null
    photoProfilUrl?: NullableStringFieldUpdateOperationsInput | string | null
    photoCouvertureUrl?: NullableStringFieldUpdateOperationsInput | string | null
    portfolioUrls?: NullableJsonNullValueInput | InputJsonValue
    adresseAtelier?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    longitude?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villePrincipale?: StringFieldUpdateOperationsInput | string
    zoneInterventionKm?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    villesIntervention?: NullableJsonNullValueInput | InputJsonValue
    noteMoyenne?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    nombreAvis?: IntFieldUpdateOperationsInput | number
    compteurDemandesMoisCourant?: IntFieldUpdateOperationsInput | number
    nombreMissionsCompletees?: IntFieldUpdateOperationsInput | number
    tauxCompletion?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tauxReponseMoyen?: NullableIntFieldUpdateOperationsInput | number | null
    disponible?: BoolFieldUpdateOperationsInput | boolean
    accepteUrgences?: BoolFieldUpdateOperationsInput | boolean
    accepteWeekend?: BoolFieldUpdateOperationsInput | boolean
    horairesTravail?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    badges?: NullableJsonNullValueInput | InputJsonValue
    abonnementType?: EnumAbonnementTypeFieldUpdateOperationsInput | $Enums.AbonnementType
    abonnementExpireAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    totalVuesProfil?: IntFieldUpdateOperationsInput | number
    totalContacts?: IntFieldUpdateOperationsInput | number
    statut?: EnumStatutArtisanFieldUpdateOperationsInput | $Enums.StatutArtisan
    raisonSuspension?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MetierCreateManyCategorieInput = {
    id?: string
    nom: string
    slug: string
    description?: string | null
    iconUrl?: string | null
    ordreAffichage?: number
    populaire?: boolean
    actif?: boolean
    createdAt?: Date | string
  }

  export type MetierUpdateWithoutCategorieInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artisanMetiers?: ArtisanMetierUpdateManyWithoutMetierNestedInput
  }

  export type MetierUncheckedUpdateWithoutCategorieInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artisanMetiers?: ArtisanMetierUncheckedUpdateManyWithoutMetierNestedInput
  }

  export type MetierUncheckedUpdateManyWithoutCategorieInput = {
    id?: StringFieldUpdateOperationsInput | string
    nom?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    ordreAffichage?: IntFieldUpdateOperationsInput | number
    populaire?: BoolFieldUpdateOperationsInput | boolean
    actif?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierCreateManyMetierInput = {
    id?: string
    artisanId: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
  }

  export type ArtisanMetierUpdateWithoutMetierInput = {
    id?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artisan?: ArtisanUpdateOneRequiredWithoutMetiersNestedInput
  }

  export type ArtisanMetierUncheckedUpdateWithoutMetierInput = {
    id?: StringFieldUpdateOperationsInput | string
    artisanId?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierUncheckedUpdateManyWithoutMetierInput = {
    id?: StringFieldUpdateOperationsInput | string
    artisanId?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierCreateManyArtisanInput = {
    id?: string
    metierId: string
    estPrincipal?: boolean
    anneesExperience?: number | null
    certifie?: boolean
    tarifHoraire?: Decimal | DecimalJsLike | number | string | null
    description?: string | null
    createdAt?: Date | string
  }

  export type ArtisanMetierUpdateWithoutArtisanInput = {
    id?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    metier?: MetierUpdateOneRequiredWithoutArtisanMetiersNestedInput
  }

  export type ArtisanMetierUncheckedUpdateWithoutArtisanInput = {
    id?: StringFieldUpdateOperationsInput | string
    metierId?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtisanMetierUncheckedUpdateManyWithoutArtisanInput = {
    id?: StringFieldUpdateOperationsInput | string
    metierId?: StringFieldUpdateOperationsInput | string
    estPrincipal?: BoolFieldUpdateOperationsInput | boolean
    anneesExperience?: NullableIntFieldUpdateOperationsInput | number | null
    certifie?: BoolFieldUpdateOperationsInput | boolean
    tarifHoraire?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}