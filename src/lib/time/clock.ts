export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock implements Clock {
  #current: Date;

  constructor(now: Date | string) {
    this.#current = new Date(now);

    if (Number.isNaN(this.#current.getTime())) {
      throw new Error("FixedClock requires a valid date.");
    }
  }

  now(): Date {
    return new Date(this.#current);
  }

  set(now: Date | string): void {
    const next = new Date(now);

    if (Number.isNaN(next.getTime())) {
      throw new Error("FixedClock requires a valid date.");
    }

    this.#current = next;
  }

  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds)) {
      throw new Error("Clock advance must be a finite number of milliseconds.");
    }

    this.#current = new Date(this.#current.getTime() + milliseconds);
  }
}

export const systemClock = new SystemClock();
