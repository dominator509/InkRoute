type PrismaRuntimeClient = {
  readonly [delegate: string]: Record<string, (...args: unknown[]) => Promise<any>>;
  $transaction<T>(operation: (tx: Record<string, any>) => Promise<T>): Promise<T>;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaRuntimeClient };
const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;

let prismaLoad: Promise<PrismaRuntimeClient> | undefined;

function prismaUnavailableError(cause: unknown): Error {
  const message = cause instanceof Error ? cause.message : String(cause);
  return new Error(`PRISMA_CLIENT_UNAVAILABLE: generated @prisma/client could not be loaded (${message})`);
}

async function loadPrismaClient(): Promise<PrismaRuntimeClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  prismaLoad ??= dynamicImport("@prisma/client")
    .then((moduleValue) => {
      const moduleRecord = moduleValue as { PrismaClient?: new (options?: Record<string, unknown>) => PrismaRuntimeClient };
      if (!moduleRecord.PrismaClient) {
        throw new Error("PrismaClient export missing");
      }

      const client = new moduleRecord.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });

      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
      }

      return client;
    })
    .catch((error: unknown) => {
      prismaLoad = undefined;
      throw prismaUnavailableError(error);
    });

  return prismaLoad;
}

function createDelegateProxy(delegateName: string): unknown {
  return new Proxy(
    {},
    {
      get(_target, methodName) {
        if (typeof methodName !== "string") return undefined;
        return async (...args: unknown[]) => {
          const client = await loadPrismaClient();
          const delegate = client[delegateName] as Record<string, (...delegateArgs: unknown[]) => Promise<unknown>> | undefined;
          const method = delegate?.[methodName];
          if (!method) {
            throw new Error(`PRISMA_DELEGATE_METHOD_UNAVAILABLE: ${delegateName}.${methodName}`);
          }
          return method.apply(delegate, args);
        };
      },
    },
  );
}

export const prisma = new Proxy(
  {},
  {
    get(_target, propertyName) {
      if (propertyName === "$transaction") {
        return async <T>(operation: (tx: PrismaRuntimeClient) => Promise<T>) => {
          const client = await loadPrismaClient();
          return client.$transaction(operation);
        };
      }

      if (typeof propertyName !== "string") return undefined;
      return createDelegateProxy(propertyName);
    },
  },
) as PrismaRuntimeClient;
