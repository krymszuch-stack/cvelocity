export interface SlowosiecHypernym {
  lemma: string;
  sense_id?: string;
}

export interface SlowosiecData {
  lemma?: string;
  hiperonimy?: SlowosiecHypernym[];
  synset_id?: number | string;
  domain?: string;
}

export interface OccupationalProfessionEntry {
  id: string;
  profesja: string;
  branza?: string;
  slowosiec_sense_id?: string;
  slowosiec_data?: SlowosiecData;
  osoby?: string[];
  obiekty?: string[];
  czynnosci?: string[];
  narzedzia?: string[];
  miejsce?: string[];
}

export interface OccupationalGraphPayload {
  meta: {
    total_professions: number;
    total_indexed_words: number;
    last_updated?: string;
  };
  professions: Record<string, OccupationalProfessionEntry>;
  word_index: Record<string, string[]>;
  slowosiec_index: Record<string, string>;
}

export interface OccupationalSearchResult {
  profession: OccupationalProfessionEntry;
  score: number;
  matchedKeywords: string[];
}
