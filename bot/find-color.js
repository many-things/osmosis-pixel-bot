/**
 * find-color
 * Copyright(c) 2016 Mihai Potra <mike@mpotra.com>
 * MIT Licensed
 */

/**
 * Function that decodes a HEX string, into RGB array.
 *
 */
const decodeHex = (color) => {
  if (typeof color === 'string') {
    // Trim and remove any hash character.
    // attempt convertion from HEX to decimal, using parseInt(n, 16)
    color = parseInt(color.replace('#', '').trim(), 16);

    if (Number.isNaN(color) || color > 0xffffff) {
      // Not a valid Number, or hex conversion is greater than RGB.
      return false;
    }
  }

  if (typeof color !== 'number') {
    return false;
  }

  // Return a RGB tuple.
  return [
    (color & 0xff0000) >> 16, // get red
    (color & 0x00ff00) >> 8, // get green
    color & 0x0000ff, // get blue
  ];
};

/**
 * Decode any color parameter, into RGB tuble
 * Note: currently only alias for `decodeHex`
 *
 */
const decode = (color) => decodeHex(color);

/**
 * Compute a RGB color tuple into a decimal value
 */
const encodeRGB = (rgb) =>
  rgb ? (rgb[0] << 16) + (rgb[1] << 8) + rgb[2] : rgb;
/**
 * Find a RGB tuple inside a list of colors.
 *
 * Computes the distance between the given RGB color
 * expressed as a 3D point, and each of the colors in the list.
 * Returns the color in the list that is closest.
 *
 */
const findNearestRGB = (find, colors) => {
  var nearest;

  if (!find) {
    return find;
  }

  // For each color in the list, compute the distance to the color
  // that needs matching.
  // Formula: sqrt((x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2)
  nearest = colors
    .map((color) =>
      Math.sqrt(
        Math.pow(find[0] - color[0], 2) +
          Math.pow(find[1] - color[1], 2) +
          Math.pow(find[2] - color[2], 2),
      ),
    )
    // Find the smallest distance.
    .reduce(
      (prev, curr, index) => {
        if ((prev && prev.distance > curr) || !prev) {
          return { distance: curr, index: index };
        } else {
          return prev;
        }
      },
      { distance: Infinity, index: -1 },
    );

  return nearest.index >= 0 ? colors[nearest.index] : undefined;
};

/**
 * Find a color in a list of RGB tuple colors.
 */
const find = (color, colors) => {
  return encodeRGB(findNearestRGB(decode(color), colors));
};

/**
 * Create an object that allows finding a color,
 * from an array of RGB tuples.
 */
const fromRGB = (arrRGB) => {
  return { find: (color) => find(color, arrRGB) };
};

/**
 * Create an object that allows finding a color,
 * from an array of colors given in HEX.
 */
const fromHex = (arrHex) => {
  return fromRGB(arrHex.map((color) => decodeHex(color)));
};

/**
 * Export
 */
export { fromHex, fromRGB };
