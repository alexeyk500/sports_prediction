export interface ISupportDestination {
  telegramUrl: string | null;
}

// TODO(product): configure the verified official Goalstery support account.
export const supportDestination: ISupportDestination = {
  telegramUrl: null,
};
