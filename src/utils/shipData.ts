// Ship specifications data gathered from online research
export interface ShipSpecs {
  capacity: number;
  length: number; // in feet
}

export const SHIP_SPECIFICATIONS: Record<string, ShipSpecs> = {
  'MSC Grandiosa': { capacity: 6334, length: 1087 },
  'MSC Magnifica': { capacity: 3223, length: 963 },
  'MSC Musica': { capacity: 2550, length: 964 },
  'MSC Orchestra': { capacity: 3223, length: 964 },
  'MSC Poesia': { capacity: 3223, length: 964 },
  'MSC Fantasia': { capacity: 4363, length: 1093 },
  'MSC Splendida': { capacity: 4363, length: 1093 },
  'MSC Divina': { capacity: 4345, length: 1093 },
  'MSC Preziosa': { capacity: 4345, length: 1093 },
  'MSC Meraviglia': { capacity: 4500, length: 1036 },
  'MSC Bellissima': { capacity: 4500, length: 1036 },
  'MSC Seaside': { capacity: 5179, length: 1060 },
  'MSC Seaview': { capacity: 5179, length: 1060 },
  'MSC Seashore': { capacity: 5632, length: 1112 },
  'MSC Seascape': { capacity: 5877, length: 1112 },
  'MSC Virtuosa': { capacity: 6334, length: 1087 },
  'MSC Euribia': { capacity: 6334, length: 1087 },
  'MSC World Europa': { capacity: 6774, length: 1112 },
  'MSC World America': { capacity: 6774, length: 1112 },
  'MSC Armonia': { capacity: 2679, length: 902 },
  'MSC Sinfonia': { capacity: 2199, length: 902 },
  'MSC Lirica': { capacity: 2199, length: 902 },
  'MSC Opera': { capacity: 2679, length: 902 },
};

export function getShipDisplayName(shipName: string): string {
  const specs = SHIP_SPECIFICATIONS[shipName];
  if (specs) {
    return `${shipName} (${specs.capacity} guests, ${specs.length}ft)`;
  }
  return shipName;
}

export function getShipSpecs(shipName: string): ShipSpecs | null {
  return SHIP_SPECIFICATIONS[shipName] || null;
} 