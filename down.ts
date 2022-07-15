/**
 * Usage:
 * !down leg 5h
 * !down leg
 */

export const downCommand = (data: BartenderData, args: string[]) => {
  const game = args;
  const caonicalGameName = data[1];
  return data;
};
