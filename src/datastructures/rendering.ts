
export class BarObject {
  min: number;
  max: number;

  value = 0;
  high = 0.9;
  low = 0.8;
  optimum = 0;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }
}