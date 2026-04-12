export interface BirthdayConfig {
  id: string;
  name: string;
  messageWords: string[];
  letterMessage: string;
  photos: string[]; // base64 or URLs — used for book pages AND heart mosaic
  musicUrl: string;
  themeColor: string; // hex
  createdAt: number;
}

export type SceneName =
  | "intro"
  | "book"
  | "heart"
  | "letter";

export interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const DEFAULT_CONFIG: BirthdayConfig = {
  id: "",
  name: "حبيبي",
  messageWords: ["عيد", "ميلاد", "سعيد", "يا"],
  letterMessage:
    "كل عام وأنت بخير، أتمنى لك عيد ميلاد مليء بالسعادة والحب. أنت تعني لي الكثير وأتمنى أن تتحقق كل أحلامك. عيد ميلاد سعيد!",
  photos: [],
  musicUrl: "",
  themeColor: "#ff2d75",
  createdAt: Date.now(),
};
