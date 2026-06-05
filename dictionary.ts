// Իսպաներեն և հայերեն թվերի բառարան (1-100)
// Dictionary of Spanish and Armenian numbers (1-100)

export interface NumberItem {
  number: number;
  armenian: string;
  spanish: string;
}

const spanishUnits = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const spanishTens = [
  "",
  "diez",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa"
];

const armenianUnits = ["", "մեկ", "երկու", "երեք", "չորս", "հինգ", "վեց", "յոթ", "ութ", "ինն"];
const armenianTens = [
  "",
  "տասը",
  "քսան",
  "երեսուն",
  "քառասուն",
  "հիսուն",
  "վաթսուն",
  "յոթանասուն",
  "ութսուն",
  "իննսուն"
];

const spanishSpecial11to19: Record<number, string> = {
  11: "once",
  12: "doce",
  13: "trece",
  14: "catorce",
  15: "quince",
  16: "dieciséis",
  17: "diecisiete",
  18: "dieciocho",
  19: "diecinueve"
};

const spanishSpecial21to29: Record<number, string> = {
  21: "veintiuno",
  22: "veintidós",
  23: "veintitrés",
  24: "veinticuatro",
  25: "veinticinco",
  26: "veintiséis",
  27: "veintisiete",
  28: "veintiocho",
  29: "veintinueve"
};

export function getSpanishNumberName(num: number): string {
  if (num === 100) return "cien";
  if (num < 10) return spanishUnits[num];
  if (num === 10) return "diez";
  if (num >= 11 && num <= 19) return spanishSpecial11to19[num];
  if (num === 20) return "veinte";
  if (num >= 21 && num <= 29) return spanishSpecial21to29[num];
  
  const tenIdx = Math.floor(num / 10);
  const unitIdx = num % 10;
  
  if (unitIdx === 0) {
    return spanishTens[tenIdx];
  } else {
    return `${spanishTens[tenIdx]} y ${spanishUnits[unitIdx]}`;
  }
}

export function getArmenianNumberName(num: number): string {
  if (num === 100) return "հարյուր";
  if (num < 10) return armenianUnits[num];
  if (num === 10) return "տասը";
  if (num >= 11 && num <= 19) {
    const unit = armenianUnits[num % 10];
    return `տասն${unit}`;
  }
  
  const tenIdx = Math.floor(num / 10);
  const unitIdx = num % 10;
  
  if (unitIdx === 0) {
    return armenianTens[tenIdx];
  } else {
    const tenBase = armenianTens[tenIdx];
    const unitName = armenianUnits[unitIdx];
    // For 21-29, 31-39... we just concatenate, e.g. քսանմեկ, երեսունհինգ
    return `${tenBase}${unitName}`;
  }
}

// Generate the fully structured database (excluding number 71 as requested)
export const numberDatabase: NumberItem[] = Array.from({ length: 100 }, (_, i) => {
  const n = i + 1;
  return {
    number: n,
    armenian: getArmenianNumberName(n),
    spanish: getSpanishNumberName(n)
  };
}).filter((item) => item.number !== 71);

export const theoryLessons = [
  {
    title: "1 - 10: Հիմնական թվերը",
    description: "Սրանք հիմքն են, որոնց վրա կառուցվում են մնացած բոլոր թվերը: Խորհուրդ է տրվում սկսել սրանցից:",
    items: numberDatabase.slice(0, 10)
  },
  {
    title: "11 - 19: Հատուկ և կոմպոզիտ թվեր",
    description: "11-ից 15-ն ունեն յուրահատուկ անուններ, իսկ 16-ից 19-ը կազմվում են «dieci-» (տասը) նախածանցով և համապատասխան միավորով:",
    items: numberDatabase.slice(10, 19)
  },
  {
    title: "20 - 29: Քսանի խումբը",
    description: "20-ը «veinte»-ն է: 21-ից 29 թվերը գրվում են որպես մեկ բառ՝ սկսվելով «veinti-» նախածանցով: Ուշադրություն դարձրեք 22, 23 և 26 թվերի շեշտադրությանը (accent):",
    items: numberDatabase.slice(19, 29)
  },
  {
    title: "30 - 99: Տասնավորներ և «y» կապը",
    description: "30-ից սկսած տասնավորները և միավորները միանում են հայերենի «և» բառի համարժեք «y» տառով (օրինակ՝ treinta y uno - երեսունմեկ):",
    items: [
      { number: 30, armenian: "երեսուն", spanish: "treinta" },
      { number: 31, armenian: "երեսունմեկ", spanish: "treinta y uno" },
      { number: 40, armenian: "քառասուն", spanish: "cuarenta" },
      { number: 45, armenian: "քառասունհինգ", spanish: "cuarenta y cinco" },
      { number: 50, armenian: "հիսուն", spanish: "cincuenta" },
      { number: 60, armenian: "վաթսուն", spanish: "sesenta" },
      { number: 70, armenian: "յոթանասուն", spanish: "setenta" },
      { number: 80, armenian: "ութսուն", spanish: "ochenta" },
      { number: 90, armenian: "իննսուն", spanish: "noventa" },
      { number: 100, armenian: "հարյուր", spanish: "cien" }
    ]
  }
];
