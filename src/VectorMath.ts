/**
 * To keep track of any 2D vectors such as coordinates.
 */
 export type Vec2 = {
  x: number,
  y: number
}

export const origin = {x: 0, y: 0};

/**
 * Given two vectors, returns v1 + v2
 */
export const addVectors = (v1: Vec2, v2: Vec2): Vec2 => {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  }
}

/**
 * Given two vectors, returns v1 - v2
 */
export const subractVectors = (v1: Vec2, v2: Vec2): Vec2 => {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y
  }
}

/**
 * Given two vectors, returns v1 * v2
 */
export const multiplyVectors = (v1: Vec2, v2: Vec2): Vec2 => {
  return {
    x: v1.x * v2.x,
    y: v1.y * v2.y
  }
}