import { IdPhotoSize } from './types';

// 300 DPI calculation: (mm / 25.4) * 300
export const ID_SIZES: IdPhotoSize[] = [
  {
    id: '1inch',
    name: '1 Inch (一寸)',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    description: 'Common for Resumes, Driver License'
  },
  {
    id: '2inch',
    name: '2 Inch (二寸)',
    widthMm: 35,
    heightMm: 49,
    widthPx: 413,
    heightPx: 579,
    description: 'Visas, Some Certificates'
  },
  {
    id: 'small2inch',
    name: 'Small 2 Inch (小二寸)',
    widthMm: 33,
    heightMm: 48,
    widthPx: 390,
    heightPx: 567,
    description: 'Passport, Generic ID'
  },
  {
    id: 'idcard_cn',
    name: 'China ID (身份证)',
    widthMm: 26,
    heightMm: 32,
    widthPx: 307,
    heightPx: 378,
    description: 'National ID Card'
  },
  {
    id: 'teacher',
    name: 'Teacher Cert (教资)',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    description: 'Teacher Qualification'
  },
  {
    id: 'student',
    name: 'Student ID (学生证)',
    widthMm: 25,
    heightMm: 35,
    widthPx: 295,
    heightPx: 413,
    description: 'Standard Student ID'
  }
];

export const BG_COLORS = [
  { name: 'White', value: '#FFFFFF', class: 'bg-white border-gray-200' },
  { name: 'Blue', value: '#438EDB', class: 'bg-[#438EDB]' },
  { name: 'Red', value: '#D91F26', class: 'bg-[#D91F26]' },
  { name: 'Gray', value: '#F1F5F9', class: 'bg-slate-100' },
  { name: 'Gradient', value: 'gradient', class: 'bg-gradient-to-b from-blue-200 to-blue-400' },
];

export const OUTFIT_OPTIONS = [
  { id: 'suit_black_m', label: 'Men\'s Black Suit', prompt: 'black formal business suit, white shirt, dark tie' },
  { id: 'suit_navy_m', label: 'Men\'s Navy Suit', prompt: 'navy blue formal business suit, white shirt' },
  { id: 'suit_black_f', label: 'Women\'s Blazer', prompt: 'black formal business blazer, white blouse' },
  { id: 'shirt_white', label: 'White Shirt', prompt: 'crisp white formal collared shirt' },
];

export const BEAUTY_LEVELS = [
  { id: 'none', label: 'Original', prompt: '' },
  { id: 'light', label: 'Light Retouch', prompt: 'subtle skin smoothing, natural lighting correction' },
  { id: 'pro', label: 'Professional', prompt: 'studio lighting, clear skin, professional retouching, sharp focus' },
];