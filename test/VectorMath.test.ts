import { addVectors, subractVectors, multiplyVectors, modVectors } from '../src/VectorMath';

test('Vector math: addition, subtraction, multiplication', () => {
  let origin = { x: 0, y: 0 }
  let vec1 = { x: 2, y: 2 }
  let vec2 = { x: -2, y: -2 }

  expect(addVectors(origin, vec1)).toEqual(vec1);
  expect(addVectors(vec1, origin)).toEqual(vec1);
  expect(addVectors(vec1, vec2)).toEqual(origin);
  expect(addVectors(vec1, vec1)).toEqual({ x: 4, y: 4 });
  expect(addVectors(vec2, vec2)).toEqual({ x: -4, y: -4 });

  expect(subractVectors(origin, vec1)).toEqual(vec2);
  expect(subractVectors(vec1, origin)).toEqual(vec1);
  expect(subractVectors(vec2, vec2)).toEqual(origin);
  expect(subractVectors(vec2, vec1)).toEqual({ x: -4, y: -4 });
  expect(subractVectors(vec1, vec2)).toEqual({ x: 4, y: 4 });

  expect(multiplyVectors(origin, vec1)).toEqual(origin);
  expect(multiplyVectors(vec1, origin)).toEqual(origin);
  expect(multiplyVectors(vec2, vec2)).toEqual({ x: 4, y: 4 });
  expect(multiplyVectors(vec2, vec1)).toEqual({ x: -4, y: -4 });
  expect(multiplyVectors(vec1, vec2)).toEqual({ x: -4, y: -4 });

  expect(modVectors(vec1, vec1)).toEqual(origin);
  expect(modVectors({ x: 4, y: 4 }, { x: 3, y: 3 })).toEqual({ x: 1, y: 1 });
});