import type { Fixture, PrismaClient } from "@prisma/client";
import type { Clock } from "@/lib/time/clock";
import { DomainError } from "@/lib/errors/domain-error";
import { assertFixtureEligibleForPrediction } from "./fixture.domain";

export interface FixtureServiceDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export async function resolveEligibleFixtureForPrediction(
  dependencies: FixtureServiceDependencies,
  fixtureId: string,
): Promise<Fixture> {
  const fixture = await dependencies.prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { competition: true },
  });

  if (!fixture) {
    throw new DomainError("FIXTURE_NOT_FOUND", "Fixture not found.", { fixtureId });
  }

  assertFixtureEligibleForPrediction(fixture, dependencies.clock.now());

  return fixture;
}
