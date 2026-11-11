export interface ImageSource {
  src: string;
  width: number;
  height: number;
  sources?: readonly { type: string; srcset: string }[];
  sizes?: string;
}
