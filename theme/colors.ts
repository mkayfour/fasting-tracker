export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
};

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F7F6F3',
  text: '#191919',
  textMuted: '#787774',
  accent: '#2F80ED',
  border: '#E9E9E7',
};

export const darkColors: ThemeColors = {
  background: '#191919',
  surface: '#232323',
  text: '#F1F1EF',
  textMuted: '#9B9B98',
  accent: '#5B9BF0',
  border: '#2F2F2F',
};
