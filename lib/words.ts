// 5-letter words list
export const WORDS = [
  'REACT', 'WORLD', 'BRAIN', 'CLOUD', 'DREAM', 'FLAME', 'GHOST', 'HEART', 'LIGHT',
  'MUSIC', 'OCEAN', 'PEACE', 'QUEEN', 'SMILE', 'STORM', 'TIGER', 'VOICE', 'WATER',
  'YOUTH', 'SPACE'
];

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

export function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}