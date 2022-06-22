import { Image, createCanvas } from '@napi-rs/canvas';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';
import fs from 'fs';

import { COLOR_SET, GAME_CONFIG } from './config';
import { fromHex } from './find-color';
import { manythingsSVG } from './manythingsSVG';

const componentToHex = (c: number) => c.toString(16).padStart(2, '0');
const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

type ResponsePixels = {
  [x: number]:
    | {
        [y: number]: number | undefined;
      }
    | undefined;
};

const updatedPixels = async () => {
  console.log('[Loading] Fetching latest game state...');
  const { data: pixels } = await axios.get<ResponsePixels>(
    'https://pixels-osmosis.keplr.app/pixels',
  );
  console.log('[Success] Fetched latest game state!');
  return pixels;
};

export const getDrawablePixels = async () => {
  const pixels = await updatedPixels();

  const canvas = createCanvas(
    GAME_CONFIG.PIXEL_WIDTH * GAME_CONFIG.PIXEL_SIZE,
    GAME_CONFIG.PIXEL_HEIGHT * GAME_CONFIG.PIXEL_SIZE,
  );
  const ctx = canvas.getContext('2d');

  for (const xStr of Object.keys(pixels)) {
    const x = parseInt(xStr);
    if (!Number.isNaN(x)) {
      const yPixels = pixels[x] ?? {};
      for (const yStr of Object.keys(yPixels)) {
        const y = parseInt(yStr);
        if (!Number.isNaN(y)) {
          const color = yPixels[y];
          if (color != null && color >= 0 && color < COLOR_SET.length) {
            ctx.fillStyle = COLOR_SET[color];
            ctx.fillRect(
              x * GAME_CONFIG.PIXEL_SIZE,
              y * GAME_CONFIG.PIXEL_SIZE,
              GAME_CONFIG.PIXEL_SIZE,
              GAME_CONFIG.PIXEL_SIZE,
            );
          }
        }
      }
    }
  }

  const image = new Image();
  const resvg = new Resvg(manythingsSVG, {});
  const pngData = resvg.render();
  image.src = pngData.asPng();

  const logoCanvas = createCanvas(pngData.width, pngData.height);
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.imageSmoothingEnabled = false;
  logoCtx.drawImage(image, 0, 0);

  const logoPixels = logoCtx.getImageData(0, 0, pngData.width, pngData.height);

  const offsetX = 52;
  const offsetY = 98;

  let drawablePixels = new Set();

  for (let x = 0; x < pngData.width; x++) {
    for (let y = 0; y < pngData.height; y++) {
      const index = (x + y * pngData.width) * 4;

      const r = logoPixels.data[index];
      const g = logoPixels.data[index + 1];
      const b = logoPixels.data[index + 2];
      const a = logoPixels.data[index + 3];

      if (a <= 0) {
        return;
      }

      const pixelCoordX = offsetX + x;
      const pixelCoordY = offsetY + y;

      const xPixels = pixels[pixelCoordX];
      if (!xPixels) {
        continue;
      }
      const currentColor = xPixels[pixelCoordY];

      // get color index
      const givenColor = rgbToHex(r, g, b).toUpperCase();
      const nearestColorInSet = fromHex(COLOR_SET).find(givenColor);
      let nearestColor =
        nearestColorInSet === 0
          ? '#000'
          : `#${nearestColorInSet.toString(16).toUpperCase()}`;
      if (r > 230 && g > 230 && b > 230) {
        nearestColor = '#FFF';
      }
      const givenColorIndex = COLOR_SET.indexOf(nearestColor);

      ctx.fillStyle = nearestColor;
      ctx.fillRect(
        pixelCoordX * GAME_CONFIG.PIXEL_SIZE,
        pixelCoordY * GAME_CONFIG.PIXEL_SIZE,
        GAME_CONFIG.PIXEL_SIZE,
        GAME_CONFIG.PIXEL_SIZE,
      );

      if (givenColorIndex === -1) {
        continue;
      }

      // Need to paint
      if (currentColor !== givenColorIndex) {
        xPixels[pixelCoordX] = givenColorIndex;
        const memo = `osmopixel (${pixelCoordX},${pixelCoordY},${givenColorIndex})`;
        drawablePixels.add(memo);
      }
    }
  }

  return Array.from(drawablePixels);
};

type TendermintRPCStatusResponse = {
  result: {
    sync_info: {
      latest_block_height: string;
    };
  };
};
export const getLatestBlockNumber = async () => {
  const TENDERMINT_RPC_ENDPOINT =
    'https://osmosis-1--rpc--full.datahub.figment.io/apikey/1d501057297ffd7db2a343c2d3daf459';
  try {
    const { data } = await axios.get<TendermintRPCStatusResponse>(
      `${TENDERMINT_RPC_ENDPOINT}/status`,
    );
    return parseInt(data.result.sync_info.latest_block_height);
  } catch (error) {
    console.error(error);
    return null;
  }
};
