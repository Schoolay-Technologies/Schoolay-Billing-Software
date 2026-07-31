interface MeasurementRange {
  minimum: number;
  maximum: number;
}

export interface StudentSizeChartEntry {
  size: string;

  height:
    MeasurementRange;

  chest:
    MeasurementRange;

  waist:
    MeasurementRange;

  hip:
    MeasurementRange;

  shoulder: number;
  sleeve: number;

  shirtLength: number;
  pantLength: number;

  inseam: number;
  neck: number;
}

function range(
  minimum: number,
  maximum: number
): MeasurementRange {
  return {
    minimum,
    maximum
  };
}

export const STUDENT_SIZE_CHART:
  StudentSizeChartEntry[] = [
  {
    size: "18",
    height: range(90, 100),
    chest: range(20, 21),
    waist: range(19, 20),
    hip: range(21, 22),
    shoulder: 9,
    sleeve: 12,
    shirtLength: 17,
    pantLength: 22,
    inseam: 14,
    neck: 10
  },
  {
    size: "20",
    height: range(100, 110),
    chest: range(21, 22),
    waist: range(20, 21),
    hip: range(22, 23),
    shoulder: 9.5,
    sleeve: 13,
    shirtLength: 18,
    pantLength: 24,
    inseam: 16,
    neck: 10.5
  },
  {
    size: "22",
    height: range(110, 120),
    chest: range(22, 23),
    waist: range(21, 22),
    hip: range(23, 24),
    shoulder: 10,
    sleeve: 14,
    shirtLength: 19,
    pantLength: 26,
    inseam: 18,
    neck: 11
  },
  {
    size: "24",
    height: range(120, 125),
    chest: range(23, 24),
    waist: range(22, 23),
    hip: range(24, 25),
    shoulder: 10.5,
    sleeve: 15,
    shirtLength: 20,
    pantLength: 28,
    inseam: 20,
    neck: 11.5
  },
  {
    size: "26",
    height: range(125, 130),
    chest: range(24, 25),
    waist: range(23, 24),
    hip: range(25, 26),
    shoulder: 11,
    sleeve: 16,
    shirtLength: 21,
    pantLength: 30,
    inseam: 22,
    neck: 12
  },
  {
    size: "28",
    height: range(130, 135),
    chest: range(25, 26),
    waist: range(24, 25),
    hip: range(26, 27),
    shoulder: 11.5,
    sleeve: 17,
    shirtLength: 22,
    pantLength: 32,
    inseam: 24,
    neck: 12.5
  },
  {
    size: "30",
    height: range(135, 140),
    chest: range(26, 27),
    waist: range(25, 26),
    hip: range(27, 28),
    shoulder: 12,
    sleeve: 18,
    shirtLength: 23,
    pantLength: 34,
    inseam: 25,
    neck: 13
  },
  {
    size: "32",
    height: range(140, 145),
    chest: range(28, 29),
    waist: range(26, 27),
    hip: range(29, 30),
    shoulder: 13,
    sleeve: 19,
    shirtLength: 24,
    pantLength: 36,
    inseam: 26,
    neck: 13.5
  },
  {
    size: "34",
    height: range(145, 150),
    chest: range(30, 31),
    waist: range(27, 28),
    hip: range(31, 32),
    shoulder: 14,
    sleeve: 20,
    shirtLength: 25,
    pantLength: 38,
    inseam: 27,
    neck: 14
  },
  {
    size: "36",
    height: range(150, 160),
    chest: range(32, 33),
    waist: range(29, 30),
    hip: range(33, 34),
    shoulder: 15,
    sleeve: 21,
    shirtLength: 26,
    pantLength: 39,
    inseam: 28,
    neck: 14.5
  },
  {
    size: "38",
    height: range(160, 165),
    chest: range(34, 35),
    waist: range(31, 32),
    hip: range(35, 36),
    shoulder: 16,
    sleeve: 22,
    shirtLength: 27,
    pantLength: 40,
    inseam: 29,
    neck: 15
  },
  {
    size: "40",
    height: range(165, 170),
    chest: range(36, 37),
    waist: range(33, 34),
    hip: range(37, 38),
    shoulder: 17,
    sleeve: 23,
    shirtLength: 28,
    pantLength: 41,
    inseam: 30,
    neck: 15.5
  },
  {
    size: "42",
    height: range(170, 175),
    chest: range(38, 39),
    waist: range(35, 36),
    hip: range(39, 40),
    shoulder: 18,
    sleeve: 24,
    shirtLength: 29,
    pantLength: 42,
    inseam: 31,
    neck: 16
  },
  {
    size: "44",
    height: range(175, 178),
    chest: range(40, 41),
    waist: range(37, 38),
    hip: range(41, 42),
    shoulder: 18.5,
    sleeve: 24.5,
    shirtLength: 30,
    pantLength: 43,
    inseam: 31.5,
    neck: 16.5
  },
  {
    size: "46",
    height: range(178, 182),
    chest: range(42, 43),
    waist: range(39, 40),
    hip: range(43, 44),
    shoulder: 19,
    sleeve: 25,
    shirtLength: 31,
    pantLength: 44,
    inseam: 32,
    neck: 17
  },
  {
    size: "48",
    height: range(182, 185),
    chest: range(44, 45),
    waist: range(41, 42),
    hip: range(45, 46),
    shoulder: 19.5,
    sleeve: 25.5,
    shirtLength: 32,
    pantLength: 45,
    inseam: 32.5,
    neck: 17.5
  },
  {
    size: "50",
    height: range(185, 190),
    chest: range(46, 47),
    waist: range(43, 44),
    hip: range(47, 48),
    shoulder: 20,
    sleeve: 26,
    shirtLength: 33,
    pantLength: 46,
    inseam: 33,
    neck: 18
  }
];