export interface IdPhotoSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthPx: number; // @300dpi
  heightPx: number; // @300dpi
  description: string;
}

export enum ProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface ProcessingState {
  status: ProcessingStatus;
  message?: string;
}

export enum ToolType {
  SIZE = 'size',
  BACKGROUND = 'background',
  BEAUTY = 'beauty',
  OUTFIT = 'outfit',
  ADJUST = 'adjust'
}

export interface GeneratedImage {
  data: string; // base64
  timestamp: number;
  promptUsed?: string;
}