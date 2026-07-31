import {
  STUDENT_SIZE_CHART
} from "../constants/studentSizeChart";

import type {
  BodyMeasurements,
  SizeRecommendation
} from "../types/studentMeasurement.types";

function getRangeDistance(
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

export function recommendStudentSize(
  measurements:
    BodyMeasurements
): SizeRecommendation {
  const suppliedMeasurements =
    Object.entries(
      measurements
    ).filter(
      (
        entry
      ): entry is [
        keyof BodyMeasurements,
        number
      ] =>
        typeof entry[1] ===
          "number" &&
        Number.isFinite(
          entry[1]
        ) &&
        entry[1] > 0
    );

  if (
    suppliedMeasurements.length ===
    0
  ) {
    return {
      recommendedSize: "",
      score: 0,
      matchedFields: [],
      consideredFields: []
    };
  }

  const results =
    STUDENT_SIZE_CHART.map(
      (sizeEntry) => {
        let totalDistance = 0;

        const matchedFields:
          string[] = [];

        const consideredFields:
          string[] = [];

        for (
          const [
            field,
            value
          ] of suppliedMeasurements
        ) {
          consideredFields.push(
            field
          );

          let distance = 0;

          if (
            field === "height" ||
            field === "chest" ||
            field === "waist" ||
            field === "hip"
          ) {
            const sizeRange =
              sizeEntry[field];

            distance =
              getRangeDistance(
                value,
                sizeRange.minimum,
                sizeRange.maximum
              );
          } else {
            distance =
              Math.abs(
                value -
                  sizeEntry[field]
              );
          }

          if (
            field === "height"
          ) {
            distance /= 5;
          }

          if (
            field === "chest" ||
            field === "waist" ||
            field === "hip"
          ) {
            distance *= 1.5;
          }

          if (distance === 0) {
            matchedFields.push(
              field
            );
          }

          totalDistance +=
            distance;
        }

        const averageDistance =
          totalDistance /
          suppliedMeasurements.length;

        return {
          recommendedSize:
            sizeEntry.size,

          distance:
            averageDistance,

          score:
            Math.max(
              0,
              Math.round(
                100 -
                  averageDistance *
                    20
              )
            ),

          matchedFields,

          consideredFields
        };
      }
    );

  results.sort(
    (first, second) =>
      first.distance -
        second.distance ||
      Number(
        first.recommendedSize
      ) -
        Number(
          second.recommendedSize
        )
  );

  const bestResult =
    results[0];

  return {
    recommendedSize:
      bestResult
        ?.recommendedSize ?? "",

    score:
      bestResult?.score ?? 0,

    matchedFields:
      bestResult
        ?.matchedFields ?? [],

    consideredFields:
      bestResult
        ?.consideredFields ?? []
  };
}