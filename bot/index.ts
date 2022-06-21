import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import axios from 'axios';
import { createCanvas, Image } from '@napi-rs/canvas';

type ResponsePixels = {
  [x: number]:
    | {
        [y: number]: number | undefined;
      }
    | undefined;
};

const GAME_CONFIG = {
  PIXEL_SIZE: 30,
  PIXEL_WIDTH: 250,
  PIXEL_HEIGHT: 250,
  SIDE_BAR_WIDTH: 206,
  CANVAS_SIZE: 30 * 250,
};

const COLOR_SET = [
  '#FFF',
  '#D4D7D9',
  '#898D90',
  '#000',
  '#FF4500',
  '#FFA800',
  '#FFD635',
  '#00A368',
  '#7EED56',
  '#2450A4',
  '#3690EA',
  '#51E9F4',
  '#811E9F',
  '#B44AC0',
  '#FF99AA',
  '#9C6926',
];

const updatePixels = async () => {
  const { data: pixels } = await axios.get<ResponsePixels>(
    'https://pixels-osmosis.keplr.app/pixels',
  );

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

  fs.writeFileSync('./pixels.json', JSON.stringify(pixels, null, 2), 'utf8');

  const data = await canvas.encode('png');
  fs.writeFileSync('./pixels.png', data);
};

const main = async () => {
  // await updatePixels();

  const pixels: ResponsePixels = JSON.parse(
    fs.readFileSync('./pixels.json', 'utf8'),
  );

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

  const manythingsSVG = await fs.promises.readFile('./manythings.svg');
  const image = new Image();
  const resvg = new Resvg(manythingsSVG, {});
  const pngData = resvg.render();
  image.src = pngData.asPng();

  const logoCanvas = createCanvas(pngData.width, pngData.height);
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.drawImage(image, 0, 0);

  // load pixels from logoCanvas
  const logoPixels = logoCtx.getImageData(0, 0, pngData.width, pngData.height);
  console.log(logoPixels);

  // for each pixel in logoPixels
  const offsetX = 52;
  const offsetY = 98;

  for (let x = 0; x < pngData.width; x++) {
    for (let y = 0; y < pngData.height; y++) {
      const index = (x + y * pngData.width) * 4;

      const r = logoPixels.data[index];
      const g = logoPixels.data[index + 1];
      const b = logoPixels.data[index + 2];
      const a = logoPixels.data[index + 3];

      if (a > 0) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        ctx.fillRect(
          (offsetX + x) * GAME_CONFIG.PIXEL_SIZE,
          (offsetY + y) * GAME_CONFIG.PIXEL_SIZE,
          GAME_CONFIG.PIXEL_SIZE,
          GAME_CONFIG.PIXEL_SIZE,
        );
      }
    }
  }

  const newCanvasImage = await canvas.encode('png');
  fs.writeFileSync('./new-pixels.png', newCanvasImage);
};

main().catch(console.error);
