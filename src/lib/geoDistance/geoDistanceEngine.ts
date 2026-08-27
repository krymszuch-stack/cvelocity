import { PolishLocality, CommuteRouteCalculation, TransportCorridor, DistanceMatrixPair } from './types';
import { POLISH_LOCALITIES } from './polishLocalities';

const EARTH_RADIUS_KM = 6371.0088;

/**
 * Normalizuje tekst do wyszukiwania (usuwa polskie znaki diakrytyczne i spacje).
 */
export function normalizeLocalityName(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_.]+/g, '');
}

/**
 * Oblicza fizyczną odległość w linii prostej na elipsoidzie Ziemi (wzór Haversine'a) w kilometrach.
 */
export function calculateDirectDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Wykrywa główny korytarz transportowy łączący dwa miasta w Polsce
 * oraz wyznacza współczynnik krętości trasy drogowej (detour factor) i średnią prędkość przelotową.
 */
function detectCorridorAndDetour(
  locA: PolishLocality,
  locB: PolishLocality,
  directKm: number
): { corridor: TransportCorridor; description: string; detourFactor: number; avgSpeedKmH: number; terminalDelayMin: number } {
  // 1. Ta sama aglomeracja (np. Katowice - Chorzów, Gdańsk - Sopot, Warszawa - Pruszków)
  if (locA.urbanAreaId && locA.urbanAreaId === locB.urbanAreaId) {
    return {
      corridor: 'URBAN_AGGLOMERATION',
      description: 'Połączenie wewnątrz-aglomeracyjne / trasa średnicowa',
      detourFactor: 1.25,
      avgSpeedKmH: 45,
      terminalDelayMin: 4,
    };
  }

  const ids = new Set([locA.id, locB.id]);

  // 2. Korytarz A4 (Zgorzelec - Legnica - Wrocław - Opole - Gliwice/GOP - Kraków - Tarnów - Rzeszów - Przemyśl)
  const isA4 =
    (ids.has('krakow') && (ids.has('tarnow') || ids.has('rzeszow') || ids.has('katowice') || ids.has('chorzow') || ids.has('gliwice') || ids.has('wroclaw') || ids.has('debica') || ids.has('bochnia') || ids.has('brzesko') || ids.has('przemysl') || ids.has('opole'))) ||
    (ids.has('tarnow') && (ids.has('rzeszow') || ids.has('debica') || ids.has('bochnia') || ids.has('katowice') || ids.has('gliwice'))) ||
    (ids.has('wroclaw') && (ids.has('opole') || ids.has('gliwice') || ids.has('katowice') || ids.has('legnica') || ids.has('boleslawiec')));

  if (isA4) {
    return {
      corridor: 'A4_CORRIDOR',
      description: 'Korytarz autostradowy A4 (Magistrala Południowa)',
      detourFactor: 1.11,
      avgSpeedKmH: 105,
      terminalDelayMin: 8,
    };
  }

  // 3. Korytarz S7 (Gdańsk - Olsztynek - Warszawa - Radom - Kielce - Kraków)
  const isS7 =
    (ids.has('warszawa') && (ids.has('radom') || ids.has('kielce') || ids.has('krakow') || ids.has('gdansk') || ids.has('sopot') || ids.has('gdynia') || ids.has('olsztyn') || ids.has('elblag') || ids.has('skarzysko_kamienna'))) ||
    (ids.has('krakow') && (ids.has('kielce') || ids.has('radom') || ids.has('warszawa') || ids.has('skarzysko_kamienna') || ids.has('nowy_targ') || ids.has('zakopane')));

  if (isS7) {
    return {
      corridor: 'S7_CORRIDOR',
      description: 'Korytarz drogi ekspresowej S7 (Północ - Południe)',
      detourFactor: 1.17,
      avgSpeedKmH: 100,
      terminalDelayMin: 12,
    };
  }

  // 4. Korytarz A1 (Trójmiasto - Toruń - Włocławek - Łódź - Piotrków - Częstochowa - GOP)
  const isA1 =
    (ids.has('gdansk') || ids.has('gdynia') || ids.has('torun')) &&
    (ids.has('lodz') || ids.has('czestochowa') || ids.has('katowice') || ids.has('gliwice') || ids.has('piotrkow_trybunalski') || ids.has('wloclawek') || ids.has('krakow'));

  if (isA1) {
    return {
      corridor: 'A1_CORRIDOR',
      description: 'Korytarz autostradowy A1 (Autostrada Bursztynowa)',
      detourFactor: 1.19,
      avgSpeedKmH: 110,
      terminalDelayMin: 10,
    };
  }

  // 5. Korytarz A2 (Poznań - Konin - Łódź - Warszawa - Siedlce)
  const isA2 =
    ids.has('warszawa') && (ids.has('poznan') || ids.has('konin') || ids.has('lodz') || ids.has('siedlce') || ids.has('minsk_mazowiecki') || ids.has('zyrardow') || ids.has('skierniewice'));

  if (isA2) {
    return {
      corridor: 'A2_CORRIDOR',
      description: 'Korytarz autostradowy A2 (Magistrala Wschód - Zachód)',
      detourFactor: 1.10,
      avgSpeedKmH: 110,
      terminalDelayMin: 10,
    };
  }

  // 6. Korytarz S8 (Wrocław - Wieluń - Łódź - Piotrków - Warszawa - Białystok)
  const isS8 =
    (ids.has('warszawa') && (ids.has('wroclaw') || ids.has('bialystok') || ids.has('piotrkow_trybunalski') || ids.has('sieradz') || ids.has('ostrow_wielkopolski'))) ||
    (ids.has('lodz') && (ids.has('wroclaw') || ids.has('bialystok')));

  if (isS8) {
    return {
      corridor: 'S8_CORRIDOR',
      description: 'Korytarz drogi ekspresowej S8',
      detourFactor: 1.16,
      avgSpeedKmH: 100,
      terminalDelayMin: 12,
    };
  }

  // 7. Korytarz S17/S19 (Warszawa - Lublin - Rzeszów)
  const isS17S19 =
    (ids.has('warszawa') && (ids.has('lublin') || ids.has('pulawy') || ids.has('swidnik') || ids.has('zamosc') || ids.has('chelm'))) ||
    (ids.has('lublin') && (ids.has('rzeszow') || ids.has('stalowa_wola') || ids.has('krasnik') || ids.has('nisko')));

  if (isS17S19) {
    return {
      corridor: 'S17_S19_CORRIDOR',
      description: 'Korytarz dróg ekspresowych S17 / S19 (Via Carpatia)',
      detourFactor: 1.15,
      avgSpeedKmH: 95,
      terminalDelayMin: 10,
    };
  }

  // 8. Trasy regionalne i krajowe
  const detour = directKm < 30 ? 1.25 : directKm < 100 ? 1.22 : 1.20;
  const speed = directKm < 40 ? 55 : directKm < 120 ? 70 : 85;

  return {
    corridor: 'REGIONAL_ROAD',
    description: 'Sieć dróg krajowych i wojewódzkich (DK / DW)',
    detourFactor: detour,
    avgSpeedKmH: speed,
    terminalDelayMin: directKm < 30 ? 5 : 10,
  };
}

/**
 * Główny rejestr z mapowaniem po znormalizowanej nazwie i ID.
 */
class GeoDistanceRegistry {
  private localitiesById = new Map<string, PolishLocality>();
  private localitiesByNorm = new Map<string, PolishLocality>();

  constructor(localities: PolishLocality[] = POLISH_LOCALITIES) {
    for (const loc of localities) {
      this.localitiesById.set(loc.id, loc);
      this.localitiesByNorm.set(normalizeLocalityName(loc.name), loc);

      if (loc.aliases) {
        for (const alias of loc.aliases) {
          this.localitiesByNorm.set(normalizeLocalityName(alias), loc);
        }
      }
    }
  }

  /**
   * Wyszukuje miejscowość po nazwie, identyfikatorze lub aliasie.
   */
  public findLocality(query: string): PolishLocality | undefined {
    if (!query || typeof query !== 'string') return undefined;
    const cleanId = query.toLowerCase().trim().replace(/[\s-]+/g, '_');

    if (this.localitiesById.has(cleanId)) {
      return this.localitiesById.get(cleanId);
    }

    const norm = normalizeLocalityName(query);
    if (this.localitiesByNorm.has(norm)) {
      return this.localitiesByNorm.get(norm);
    }

    // Wyszukiwanie prefiksowe lub częściowe
    for (const [normKey, loc] of this.localitiesByNorm.entries()) {
      if (normKey.startsWith(norm) || norm.startsWith(normKey)) {
        return loc;
      }
    }

    return undefined;
  }

  /**
   * Zwraca podpowiedzi miejscowości na podstawie zapytania tekstowego.
   */
  public searchLocalities(query: string, limit = 8): PolishLocality[] {
    if (!query) return [];
    const norm = normalizeLocalityName(query);
    const results: PolishLocality[] = [];
    const seen = new Set<string>();

    for (const loc of this.localitiesById.values()) {
      const locNorm = normalizeLocalityName(loc.name);
      if (locNorm.includes(norm) || (loc.aliases && loc.aliases.some((a) => normalizeLocalityName(a).includes(norm)))) {
        if (!seen.has(loc.id)) {
          seen.add(loc.id);
          results.push(loc);
        }
      }
      if (results.length >= limit) break;
    }

    return results;
  }

  /**
   * Zwraca wszystkie zarejestrowane miejscowości.
   */
  public getAllLocalities(): PolishLocality[] {
    return Array.from(this.localitiesById.values());
  }

  /**
   * Oblicza precyzyjną odległość drogową, czas i koszty dojazdu pomiędzy dwoma miejscowościami.
   */
  public calculateCommute(
    from: string | PolishLocality,
    to: string | PolishLocality
  ): CommuteRouteCalculation | null {
    const locA = typeof from === 'string' ? this.findLocality(from) : from;
    const locB = typeof to === 'string' ? this.findLocality(to) : to;

    if (!locA || !locB) return null;

    if (locA.id === locB.id) {
      return {
        fromLocality: locA,
        toLocality: locB,
        directDistanceKm: 0,
        roadDistanceKm: 0,
        corridor: 'URBAN_AGGLOMERATION',
        corridorDescription: 'Ta sama lokalizacja / dojazd lokalny w obrębie miasta',
        estimatedDriveTimeMinutes: 10,
        estimatedTransitTimeMinutes: 15,
        isSameUrbanArea: true,
        estimatedFuelCostOneWayPln: 0,
        estimatedMonthlyFuelCostPln: 0,
      };
    }

    // 1. Odległość w linii prostej (WGS-84 Haversine)
    const directDistanceKm = calculateDirectDistanceKm(locA.lat, locA.lng, locB.lat, locB.lng);

    // 2. Korytarz i współczynnik trasy drogowej
    const corridorInfo = detectCorridorAndDetour(locA, locB, directDistanceKm);
    
    // Szacowana rzeczywista odległość drogowa
    let roadDistanceKm = Math.round(directDistanceKm * corridorInfo.detourFactor);

    // Drobna kalibracja specyficznych węzłów aglomeracyjnych
    if (corridorInfo.corridor === 'URBAN_AGGLOMERATION') {
      roadDistanceKm = Math.max(Math.round(directDistanceKm + 1.5), roadDistanceKm);
    }

    // 3. Estymacja czasu dojazdu samochodem (w minutach)
    const drivingHours = roadDistanceKm / corridorInfo.avgSpeedKmH;
    const estimatedDriveTimeMinutes = Math.max(
      8,
      Math.round(drivingHours * 60 + corridorInfo.terminalDelayMin)
    );

    // 4. Estymacja transportu publicznego (kolej / autobus)
    // Przy dłuższych trasach kolej porusza się ~80-120 km/h + przesiadki
    const transitSpeed = directDistanceKm > 100 ? 80 : 50;
    const estimatedTransitTimeMinutes = Math.max(
      15,
      Math.round((roadDistanceKm / transitSpeed) * 60 + 20)
    );

    // 5. Estymacja kosztu paliwa (założenie: ~7.2 l / 100km, cena 6.50 zł / litr)
    const fuelConsumptionLitersPer100Km = 7.2;
    const fuelPricePerLiter = 6.5;
    const costPerKm = (fuelConsumptionLitersPer100Km / 100) * fuelPricePerLiter; // ~0.468 zł/km

    const estimatedFuelCostOneWayPln = Math.round(roadDistanceKm * costPerKm * 10) / 10;
    // 20 dni roboczych w miesiącu w 2 strony (40 przejazdów)
    const estimatedMonthlyFuelCostPln = Math.round(estimatedFuelCostOneWayPln * 2 * 20);

    const isSameUrbanArea = Boolean(locA.urbanAreaId && locA.urbanAreaId === locB.urbanAreaId);

    return {
      fromLocality: locA,
      toLocality: locB,
      directDistanceKm,
      roadDistanceKm,
      corridor: corridorInfo.corridor,
      corridorDescription: corridorInfo.description,
      estimatedDriveTimeMinutes,
      estimatedTransitTimeMinutes,
      isSameUrbanArea,
      estimatedFuelCostOneWayPln,
      estimatedMonthlyFuelCostPln,
    };
  }

  /**
   * Generuje pełną relacyjną macierz odległości N x N dla zadanego zbioru miast.
   */
  public generateDistanceMatrix(localitiesList?: PolishLocality[]): DistanceMatrixPair[] {
    const list = localitiesList || this.getAllLocalities();
    const pairs: DistanceMatrixPair[] = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const locA = list[i];
        const locB = list[j];
        const res = this.calculateCommute(locA, locB);
        if (res) {
          pairs.push({
            fromId: locA.id,
            fromName: locA.name,
            toId: locB.id,
            toName: locB.name,
            roadDistanceKm: res.roadDistanceKm,
            driveTimeMinutes: res.estimatedDriveTimeMinutes,
          });
        }
      }
    }

    return pairs;
  }
}

// Globalny singleton
let globalRegistryInstance: GeoDistanceRegistry | null = null;

export function getGeoDistanceRegistry(): GeoDistanceRegistry {
  if (!globalRegistryInstance) {
    globalRegistryInstance = new GeoDistanceRegistry();
  }
  return globalRegistryInstance;
}
