import Dogfighter from '../src/Dogfighter';

test('basic jest test', () => {
  expect(0).toBe(0);
});

test('basic import test', () => {
  const fighter = new Dogfighter();
  expect(fighter.testMethod('Garrett')).toBe('Hello Garrett!');
});