type GameName = string;
type DiscordUserId = string;
type DownData = {
  canonicalMap: Record<string, GameName>,
  gameNames: string[], // Canonical names.

  gamers: Record<GameName, Record<DiscordUserId, {
    downUntil: Date,
  }>>
};

declare type BartenderData = {
  down: DownData,
};
