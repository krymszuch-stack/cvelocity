export interface PolishLocality {
  id: string; // unikalny klucz, np. "krakow", "tarnow", "warszawa", "chorzow"
  name: string; // oficjalna nazwa, np. "Kraków", "Tarnów"
  voivodeship: string; // województwo, np. "małopolskie", "śląskie"
  powiat?: string; // powiat, np. "Kraków", "tarnowski", "m. Chorzów"
  lat: number; // szerokość geograficzna WGS-84
  lng: number; // długość geograficzna WGS-84
  isVoivodeshipCapital?: boolean; // miasto wojewódzkie
  isCountyCity?: boolean; // miasto na prawach powiatu / powiatowe
  urbanAreaId?: string; // identyfikator aglomeracji/konurbacji (np. "gop", "trojmiasto", "warszawa_metro", "krakow_metro")
  aliases?: string[]; // alternatywne nazwy lub skróty (np. ["krk", "cracow"])
}

export type TransportCorridor =
  | 'A4_CORRIDOR' // Wrocław - Katowice/GOP - Kraków - Tarnów - Rzeszów
  | 'A1_CORRIDOR' // Trójmiasto - Toruń - Łódź - Częstochowa - Gliwice/GOP
  | 'A2_CORRIDOR' // Poznań - Konin - Łódź - Warszawa - Siedlce
  | 'S7_CORRIDOR' // Gdańsk - Olsztynek - Warszawa - Radom - Kielce - Kraków - Nowy Targ
  | 'S8_CORRIDOR' // Wrocław - Wieluń/Sieradz - Łódź - Warszawa - Białystok
  | 'S3_CORRIDOR' // Szczecin - Gorzów Wlkp - Zielona Góra - Legnica
  | 'S5_CORRIDOR' // Gdańsk - Bydgoszcz - Poznań - Wrocław
  | 'S17_S19_CORRIDOR' // Warszawa - Lublin - Rzeszów
  | 'URBAN_AGGLOMERATION' // wewnątrz jednej aglomeracji (np. Katowice - Chorzów - Bytom)
  | 'REGIONAL_ROAD'; // drogi krajowe i wojewódzkie

export interface CommuteRouteCalculation {
  fromLocality: PolishLocality;
  toLocality: PolishLocality;
  directDistanceKm: number; // odległość w linii prostej (WGS-84)
  roadDistanceKm: number; // szacowana rzeczywista odległość drogowa
  corridor: TransportCorridor;
  corridorDescription: string;
  estimatedDriveTimeMinutes: number; // szacowany czas dojazdu samochodem w 1 stronę
  estimatedTransitTimeMinutes: number; // szacowany czas transportu zbiorowego (pociąg/bus)
  isSameUrbanArea: boolean;
  estimatedFuelCostOneWayPln: number; // koszt paliwa w 1 stronę (przy ~7.5 l/100km i 6.50 zł/l)
  estimatedMonthlyFuelCostPln: number; // miesięczny koszt przy 20 dniach dojazdu
}

export interface DistanceMatrixPair {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  roadDistanceKm: number;
  driveTimeMinutes: number;
}
