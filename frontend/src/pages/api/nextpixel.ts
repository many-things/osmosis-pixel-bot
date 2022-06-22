import { NextApiRequest, NextApiResponse } from 'next';

import { getDrawablePixels } from '@/core/bot';

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const pixels = await getDrawablePixels();

  // pick random pixel
  const randomIndex = Math.floor(Math.random() * pixels.length);
  const pixel = pixels[randomIndex];

  res.status(200).json({ randomPixel: pixel });
};
