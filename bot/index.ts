import { Image, createCanvas } from '@napi-rs/canvas';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';
import fs from 'fs';

import { COLOR_SET, GAME_CONFIG, getSecrets } from './config';
import { fromHex } from './find-color';
import { paint } from './paint';

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

  const newCanvasImage = await canvas.encode('png');
  fs.writeFileSync('./assets/pixels.png', newCanvasImage);

  return pixels;
};

// TODO: Extract typings
const run = async (
  passedAddrs: {
    privateKey: string;
    address: string;
  }[],
) => {
  const pixels = await updatedPixels();
  // const pixels: ResponsePixels = JSON.parse(
  //   fs.readFileSync('./assets/pixels.json', 'utf8'),
  // );

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

  const manythingsSVG = await fs.promises.readFile('./assets/manythings.svg');
  const image = new Image();
  const resvg = new Resvg(manythingsSVG, {});
  const pngData = resvg.render();
  image.src = pngData.asPng();

  const logoCanvas = createCanvas(pngData.width, pngData.height);
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.imageSmoothingEnabled = false;
  logoCtx.drawImage(image, 0, 0);

  // load pixels from logoCanvas
  const logoPixels = logoCtx.getImageData(0, 0, pngData.width, pngData.height);

  // logoCanvas to logo.png
  const logoData = await logoCanvas.encode('png');
  fs.writeFileSync('./assets/logo.png', logoData);

  // for each pixel in logoPixels
  const offsetX = 52;
  const offsetY = 98;

  let paintCount = 0;
  let drawablePixels = new Set<string>();

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

      if (currentColor !== givenColorIndex) {
        // NOTE: Update color
        xPixels[pixelCoordX] = givenColorIndex;
        paintCount += 1;

        const memo = `osmopixel (${pixelCoordX},${pixelCoordY},${givenColorIndex})`;
        // console.log({ walletAddress, memo });
        drawablePixels.add(memo);
      }
    }
  }

  const shuffled = [...drawablePixels]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  console.log({ paintCount });

  let drawableAddrs = [...passedAddrs];

  for (const memo of shuffled) {
    const wallet = drawableAddrs.pop();
    if (!wallet) {
      break;
    }
    const { privateKey, address } = wallet;
    await paint(privateKey, address, memo).catch((e) => {
      console.log('[Transaction] Error', e.response?.data ?? e.message ?? null);
      // console.error(e);
      return 0;
    });
  }

  const newCanvasImage = await canvas.encode('png');
  fs.writeFileSync('./assets/new-pixels.png', newCanvasImage);
};

type TendermintRPCStatusResponse = {
  result: {
    sync_info: {
      latest_block_height: string;
    };
  };
};
const getLatestBlockNumber = async () => {
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

const delayForMilliseconds = async (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const secrets = await getSecrets();

  let count = 0;
  while (1) {
    count += 1;
    const latestBlock = await getLatestBlockNumber();
    console.log('\n=======\n');
    console.log(
      `${count.toLocaleString()}st Run, Latest block: ${latestBlock}`,
    );

    const drawableAfterBlocksByIndex = await Promise.all<number>(
      secrets.wallets.map(async (wallet) => {
        const { data } = await axios
          .get(`https://pixels-osmosis.keplr.app/permission/${wallet.address}`)
          .catch((e) => {
            console.error(e.response?.data ?? e.message ?? null);
            return { data: { remainingBlocks: 0 } };
          });

        return data.remainingBlocks;
      }),
    );

    const drawableAddrs = secrets.wallets.filter((_wallet, index) => {
      return drawableAfterBlocksByIndex[index] === 0;
    });

    console.log({ drawableAddrs: drawableAddrs.map((v) => v.address) });

    if (drawableAddrs.length > 0) {
      await run(drawableAddrs);
    }

    // console.log('Delay for 5s...');
    await delayForMilliseconds(5_000);
  }
};

main().catch(console.error);
