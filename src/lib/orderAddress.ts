function normalizeAddressSegment(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized || null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeOrderPostalCode(
  postalCode: string | null | undefined,
  district: string
) {
  const normalizedDistrict = normalizeAddressSegment(district);
  const normalizedPostalCode = normalizeAddressSegment(postalCode);

  if (!normalizedDistrict || !normalizedPostalCode) {
    return null;
  }

  const compactPostalCode = normalizedPostalCode.replace(/\s*-\s*/g, "-");

  if (/^\d+$/.test(compactPostalCode)) {
    return `${normalizedDistrict}-${compactPostalCode}`;
  }

  const districtPrefixPattern = new RegExp(
    `^${escapeRegex(normalizedDistrict)}(?:\\s*-\\s*|\\s+)?`,
    "i"
  );

  if (districtPrefixPattern.test(normalizedPostalCode)) {
    const suffix = normalizedPostalCode
      .replace(districtPrefixPattern, "")
      .replace(/^[-\s]+/, "")
      .trim();

    return suffix ? `${normalizedDistrict}-${suffix}` : null;
  }

  return compactPostalCode;
}

export function buildOrderAddress(data: {
  houseRoad?: string | null;
  areaVillage: string;
  townCityThana: string;
  district: string;
  postalCode?: string | null;
}) {
  const normalizedDistrict = normalizeAddressSegment(data.district);
  const normalizedPostalCode = normalizedDistrict
    ? normalizeOrderPostalCode(data.postalCode, normalizedDistrict)
    : null;

  return [
    normalizeAddressSegment(data.houseRoad),
    normalizeAddressSegment(data.areaVillage),
    normalizeAddressSegment(data.townCityThana),
    normalizedDistrict,
    normalizedPostalCode,
  ]
    .filter((segment): segment is string => Boolean(segment))
    .join(", ");
}