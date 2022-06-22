import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

import { getDrawablePixels } from '@/core/bot';

type APIRequest = NextApiRequest & {
  query: {
    address: string;
  };
};
export default async (req: APIRequest, res: NextApiResponse) => {
  const { data } = await axios
    .get(`https://pixels-osmosis.keplr.app/permission/${req.query.address}`)
    .catch((e) => {
      console.error(e.response?.data ?? e.message ?? null);
      return { data: { remainingBlocks: 0 } };
    });
  const remainingBlocks: number = data.remainingBlocks ?? 0;
  if (remainingBlocks !== 0) {
    res.status(403).json({ remainingBlocks });
    return;
  }

  const pixels = await getDrawablePixels();

  // pick random pixel
  const randomIndex = Math.floor(Math.random() * pixels.length);
  const pixel = pixels[randomIndex];

  res.status(200).json({ randomPixel: pixel });
};
