import {
  STUDENT_SIZE_CHART
} from "../constants/studentSizeChart.js";

export interface BodyMeasurements {
  height?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  sleeve?: number;
  shirtLength?: number;
  pantLength?: number;
  inseam?: number;
  neck?: number;
}

interface SizeRecommendation {
  recommendedSize: string;
  score: number;
  matchedFields: string[];
  consideredFields: string[];
}

function rangeDistance(
  value: number,
  minimum: number,
  maximum: number
): number {
  if (
    value >= minimum &&
    value <= maximum
  ) {
    return 0;
  }

  if (value < minimum) {
    return minimum - value;
  }

  return value - maximum;
}

function exactDistance(
  value: number,
  expected: number
): number {
  return Math.abs(
    value - expected
  );
}

export function recommendStudentSize(
  measurements: BodyMeasurements
): SizeRecommendation {
  const suppliedValues =
    Object.entries(measurements).filter(
      (
        entry
      ): entry is [
        keyof BodyMeasurements,
        number
      ] =>
        typeof entry[1] === "number" &&
        Number.isFinite(entry[1]) &&
        entry[1] > 0
    );

  if (suppliedValues.length === 0) {
    return {
      recommendedSize: "",
      score: 0,
      matchedFields: [],
      consideredFields: []
    };
  }

  const results =
    STUDENT_SIZE_CHART.map(
      (chartEntry) => {
        let totalDistance = 0;

        const matchedFields:
          string[] = [];

        const consideredFields:
          string[] = [];

        for (
          const [
            field,
            value
          ] of suppliedValues
        ) {
          consideredFields.push(field);

          let distance = 0;

          if (
            field === "height" ||
            field === "chest" ||
            field === "waist" ||
            field === "hip"
          ) {
            const measurementRange =
              chartEntry[field];

            distance = rangeDistance(
              value,
              measurementRange.minimum,
              measurementRange.maximum
            );
          } else {
            distance = exactDistance(
              value,
              chartEntry[field]
            );
          }

          /*
           * Height is in centimetres.
           * Reduce its numerical influence so it is
           * comparable with inch-based measurements.
           */
          if (field === "height") {
            distance /= 5;
          }

          /*
           * Chest, waist and hip are the strongest
           * garment-fit measurements.
           */
          if (
            field === "chest" ||
            field === "waist" ||
            field === "hip"
          ) {
            distance *= 1.5;
          }

          if (distance === 0) {
            matchedFields.push(field);
          }

          totalDistance += distance;
        }

        const averageDistance =
          totalDistance /
          suppliedValues.length;

        const score = Math.max(
          0,
          Math.round(
            100 -
              averageDistance * 20
          )
        );

        return {
          recommendedSize:
            chartEntry.size,
          score,
          distance:
            averageDistance,
          matchedFields,
          consideredFields
        };
      }
    );

  results.sort(
    (first, second) => {
      if (
        first.distance !==
        second.distance
      ) {
        return (
          first.distance -
          second.distance
        );
      }

      return (
        Number(
          first.recommendedSize
        ) -
        Number(
          second.recommendedSize
        )
      );
    }
  );

  const bestResult =
    results[0];

  return {
    recommendedSize:
      bestResult?.recommendedSize ??
      "",

    score:
      bestResult?.score ?? 0,

    matchedFields:
      bestResult?.matchedFields ??
      [],

    consideredFields:
      bestResult?.consideredFields ??
      []
  };
}