import { Share } from 'react-native';

export async function shareGoal(title: string, stake: number): Promise<void> {
  await Share.share({
    message: `🎯 I just set a goal "${title}" with ${stake} plates on Plate Party! Join me and make an impact.`,
  });
}

export async function shareBet(title: string, position: string, stake: number): Promise<void> {
  await Share.share({
    message: `⚡ I bet ${stake} plates on "${title}" — I'm taking the ${position} side. Play with me on Plate Party!`,
  });
}

export async function shareImpact(charityName: string, plates: number, metric: string): Promise<void> {
  await Share.share({
    message: `🌍 I just contributed ${plates} plates to ${charityName}, providing ${metric}! Join Plate Party and do good.`,
  });
}
