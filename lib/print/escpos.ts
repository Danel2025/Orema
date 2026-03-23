/**
 * Module ESC/POS - Generateur de commandes pour imprimantes thermiques
 *
 * Ce module genere des commandes ESC/POS raw pour les imprimantes thermiques.
 * Compatible avec les imprimantes Epson, Star, et la plupart des imprimantes POS.
 *
 * @see https://reference.epson-biz.com/modules/ref_escpos/
 */

// Caracteres de controle ESC/POS
const ESC = "\x1B"; // Escape
const GS = "\x1D"; // Group Separator
const FS = "\x1C"; // File Separator
const LF = "\x0A"; // Line Feed

/**
 * Commandes ESC/POS de base
 */
export const ESCPOS = {
  // Initialisation
  INIT: `${ESC}@`, // Reset imprimante

  // Texte - Styles
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  UNDERLINE_ON: `${ESC}-\x01`,
  UNDERLINE_OFF: `${ESC}-\x00`,
  UNDERLINE_THICK: `${ESC}-\x02`,
  INVERT_ON: `${GS}B\x01`,
  INVERT_OFF: `${GS}B\x00`,

  // Texte - Alignement
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,

  // Texte - Taille
  NORMAL: `${GS}!\x00`, // Taille normale (1x1)
  DOUBLE_HEIGHT: `${GS}!\x01`, // Double hauteur
  DOUBLE_WIDTH: `${GS}!\x10`, // Double largeur
  DOUBLE_SIZE: `${GS}!\x11`, // Double hauteur et largeur

  // Police
  FONT_A: `${ESC}M\x00`, // Police A (12x24)
  FONT_B: `${ESC}M\x01`, // Police B (9x17)

  // Ligne
  LINE_FEED: LF,
  CARRIAGE_RETURN: "\x0D",

  // Coupe papier
  CUT_FULL: `${GS}V\x00`, // Coupe complete
  CUT_PARTIAL: `${GS}V\x01`, // Coupe partielle (laisse un pont)
  CUT_FEED: `${GS}V\x41\x03`, // Avance puis coupe

  // Tiroir caisse
  OPEN_DRAWER: `${ESC}p\x00\x19\xFA`, // Ouvre le tiroir caisse (pin 2)
  OPEN_DRAWER_PIN5: `${ESC}p\x01\x19\xFA`, // Ouvre le tiroir caisse (pin 5)

  // Bip
  BEEP: `${ESC}B\x02\x02`, // 2 bips de 100ms

  // Code-barres
  BARCODE_HEIGHT: (height: number) => `${GS}h${String.fromCharCode(height)}`,
  BARCODE_WIDTH: (width: number) => `${GS}w${String.fromCharCode(width)}`,
  BARCODE_HRI_OFF: `${GS}H\x00`, // Pas d'affichage HRI
  BARCODE_HRI_ABOVE: `${GS}H\x01`, // HRI au-dessus
  BARCODE_HRI_BELOW: `${GS}H\x02`, // HRI en-dessous
  BARCODE_HRI_BOTH: `${GS}H\x03`, // HRI dessus et dessous

  // Types de code-barres
  BARCODE_CODE39: `${GS}k\x04`, // Code 39
  BARCODE_CODE128: `${GS}k\x49`, // Code 128

  // QR Code
  QR_MODEL: `${GS}(k\x04\x001A2\x00`, // QR Code Model 2
  QR_SIZE: (size: number) => `${GS}(k\x03\x001C${String.fromCharCode(size)}`,
  QR_ERROR_L: `${GS}(k\x03\x001E0`, // Error correction L (7%)
  QR_ERROR_M: `${GS}(k\x03\x001E1`, // Error correction M (15%)
  QR_ERROR_Q: `${GS}(k\x03\x001E2`, // Error correction Q (25%)
  QR_ERROR_H: `${GS}(k\x03\x001E3`, // Error correction H (30%)
} as const;

/**
 * Configuration d'une imprimante
 */
export interface PrinterConfig {
  /** Largeur du papier en mm (58 ou 80) */
  paperWidth: 58 | 80;
  /** Nombre de caracteres par ligne */
  charsPerLine?: number;
  /** Encodage des caracteres */
  encoding?: "CP437" | "CP850" | "CP858" | "UTF8";
}

/**
 * Calcule le nombre de caracteres par ligne selon la largeur du papier
 */
function getCharsPerLine(paperWidth: number, font: "A" | "B" = "A"): number {
  // Font A: 12x24 points, Font B: 9x17 points
  // 80mm = ~48 chars (font A) ou ~64 chars (font B)
  // 58mm = ~32 chars (font A) ou ~42 chars (font B)
  if (font === "A") {
    return paperWidth === 80 ? 48 : 32;
  }
  return paperWidth === 80 ? 64 : 42;
}

/**
 * Classe principale pour generer des commandes ESC/POS
 */
export class ESCPOSBuilder {
  private buffer: string[] = [];
  private paperWidth: number;
  private charsPerLine: number;

  constructor(config: PrinterConfig = { paperWidth: 80 }) {
    this.paperWidth = config.paperWidth;
    this.charsPerLine = config.charsPerLine || getCharsPerLine(config.paperWidth);
  }

  /**
   * Initialise l'imprimante (reset)
   */
  init(): this {
    this.buffer.push(ESCPOS.INIT);
    return this;
  }

  /**
   * Ajoute du texte
   */
  text(content: string): this {
    this.buffer.push(content);
    return this;
  }

  /**
   * Ajoute du texte avec retour a la ligne
   */
  println(content: string = ""): this {
    this.buffer.push(content + LF);
    return this;
  }

  /**
   * Ajoute plusieurs lignes vides
   */
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  /**
   * Active/desactive le gras
   */
  bold(enabled: boolean = true): this {
    this.buffer.push(enabled ? ESCPOS.BOLD_ON : ESCPOS.BOLD_OFF);
    return this;
  }

  /**
   * Active/desactive le soulignement
   */
  underline(enabled: boolean = true, thick: boolean = false): this {
    if (!enabled) {
      this.buffer.push(ESCPOS.UNDERLINE_OFF);
    } else {
      this.buffer.push(thick ? ESCPOS.UNDERLINE_THICK : ESCPOS.UNDERLINE_ON);
    }
    return this;
  }

  /**
   * Active/desactive l'inversion (texte blanc sur fond noir)
   */
  invert(enabled: boolean = true): this {
    this.buffer.push(enabled ? ESCPOS.INVERT_ON : ESCPOS.INVERT_OFF);
    return this;
  }

  /**
   * Definit l'alignement du texte
   */
  align(alignment: "left" | "center" | "right"): this {
    switch (alignment) {
      case "left":
        this.buffer.push(ESCPOS.ALIGN_LEFT);
        break;
      case "center":
        this.buffer.push(ESCPOS.ALIGN_CENTER);
        break;
      case "right":
        this.buffer.push(ESCPOS.ALIGN_RIGHT);
        break;
    }
    return this;
  }

  /**
   * Definit la taille du texte
   */
  size(type: "normal" | "double-height" | "double-width" | "double" = "normal"): this {
    switch (type) {
      case "normal":
        this.buffer.push(ESCPOS.NORMAL);
        break;
      case "double-height":
        this.buffer.push(ESCPOS.DOUBLE_HEIGHT);
        break;
      case "double-width":
        this.buffer.push(ESCPOS.DOUBLE_WIDTH);
        break;
      case "double":
        this.buffer.push(ESCPOS.DOUBLE_SIZE);
        break;
    }
    return this;
  }

  /**
   * Definit la police (A ou B)
   */
  font(type: "A" | "B"): this {
    this.buffer.push(type === "A" ? ESCPOS.FONT_A : ESCPOS.FONT_B);
    return this;
  }

  /**
   * Trace une ligne de separation
   */
  line(char: string = "-"): this {
    this.buffer.push(char.repeat(this.charsPerLine) + LF);
    return this;
  }

  /**
   * Trace une ligne double
   */
  doubleLine(): this {
    return this.line("=");
  }

  /**
   * Affiche du texte a gauche et a droite sur la meme ligne
   */
  leftRight(left: string, right: string, fillChar: string = " "): this {
    const maxLen = this.charsPerLine;
    const leftLen = left.length;
    const rightLen = right.length;

    if (leftLen + rightLen >= maxLen) {
      // Si les deux textes sont trop longs, on les met sur deux lignes
      this.println(left);
      this.align("right").println(right).align("left");
    } else {
      const padding = fillChar.repeat(maxLen - leftLen - rightLen);
      this.println(left + padding + right);
    }
    return this;
  }

  /**
   * Affiche trois colonnes de texte
   */
  columns3(left: string, center: string, right: string): this {
    const maxLen = this.charsPerLine;
    const colWidth = Math.floor(maxLen / 3);

    const leftPadded = left.substring(0, colWidth).padEnd(colWidth);
    const centerPadded = center
      .substring(0, colWidth)
      .padStart(Math.floor((colWidth + center.length) / 2))
      .padEnd(colWidth);
    const rightPadded = right.substring(0, colWidth).padStart(colWidth);

    this.println(leftPadded + centerPadded + rightPadded);
    return this;
  }

  /**
   * Imprime un tableau avec plusieurs colonnes
   */
  table(
    columns: Array<{ text: string; width: number; align?: "left" | "center" | "right" }>
  ): this {
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const scale = this.charsPerLine / totalWidth;

    const line = columns
      .map((col) => {
        const width = Math.floor(col.width * scale);
        let text = col.text.substring(0, width);

        switch (col.align) {
          case "center":
            const padLeft = Math.floor((width - text.length) / 2);
            text = text.padStart(padLeft + text.length).padEnd(width);
            break;
          case "right":
            text = text.padStart(width);
            break;
          default:
            text = text.padEnd(width);
        }
        return text;
      })
      .join("");

    this.println(line);
    return this;
  }

  /**
   * Imprime un code-barres Code128
   */
  barcode(
    data: string,
    height: number = 60,
    width: number = 2,
    hri: "off" | "above" | "below" | "both" = "below"
  ): this {
    // Configuration du code-barres
    this.buffer.push(ESCPOS.BARCODE_HEIGHT(height));
    this.buffer.push(ESCPOS.BARCODE_WIDTH(width));

    // Position du HRI (Human Readable Interpretation)
    switch (hri) {
      case "off":
        this.buffer.push(ESCPOS.BARCODE_HRI_OFF);
        break;
      case "above":
        this.buffer.push(ESCPOS.BARCODE_HRI_ABOVE);
        break;
      case "below":
        this.buffer.push(ESCPOS.BARCODE_HRI_BELOW);
        break;
      case "both":
        this.buffer.push(ESCPOS.BARCODE_HRI_BOTH);
        break;
    }

    // Centrer le code-barres
    this.buffer.push(ESCPOS.ALIGN_CENTER);

    // Imprimer le code-barres Code128
    const dataLength = data.length + 2;
    this.buffer.push(`${GS}k\x49${String.fromCharCode(dataLength)}{B${data}`);

    // Retour a l'alignement gauche
    this.buffer.push(ESCPOS.ALIGN_LEFT);
    this.buffer.push(LF);

    return this;
  }

  /**
   * Imprime un QR Code
   */
  qrcode(data: string, size: number = 6, errorLevel: "L" | "M" | "Q" | "H" = "M"): this {
    // Centrer le QR code
    this.buffer.push(ESCPOS.ALIGN_CENTER);

    // Model QR Code 2
    this.buffer.push(ESCPOS.QR_MODEL);

    // Taille du module (1-16)
    this.buffer.push(ESCPOS.QR_SIZE(Math.min(16, Math.max(1, size))));

    // Niveau de correction d'erreur
    switch (errorLevel) {
      case "L":
        this.buffer.push(ESCPOS.QR_ERROR_L);
        break;
      case "M":
        this.buffer.push(ESCPOS.QR_ERROR_M);
        break;
      case "Q":
        this.buffer.push(ESCPOS.QR_ERROR_Q);
        break;
      case "H":
        this.buffer.push(ESCPOS.QR_ERROR_H);
        break;
    }

    // Stocker les donnees
    const dataLen = data.length + 3;
    const pL = dataLen % 256;
    const pH = Math.floor(dataLen / 256);
    this.buffer.push(`${GS}(k${String.fromCharCode(pL)}${String.fromCharCode(pH)}1P0${data}`);

    // Imprimer le QR code
    this.buffer.push(`${GS}(k\x03\x001Q0`);

    // Retour a l'alignement gauche
    this.buffer.push(ESCPOS.ALIGN_LEFT);
    this.buffer.push(LF);

    return this;
  }

  /**
   * Coupe le papier
   */
  cut(partial: boolean = true): this {
    this.feed(3); // Avance le papier avant la coupe
    this.buffer.push(partial ? ESCPOS.CUT_PARTIAL : ESCPOS.CUT_FULL);
    return this;
  }

  /**
   * Ouvre le tiroir caisse
   */
  openDrawer(pin: 2 | 5 = 2): this {
    this.buffer.push(pin === 2 ? ESCPOS.OPEN_DRAWER : ESCPOS.OPEN_DRAWER_PIN5);
    return this;
  }

  /**
   * Fait biper l'imprimante
   */
  beep(): this {
    this.buffer.push(ESCPOS.BEEP);
    return this;
  }

  /**
   * Recupere le buffer sous forme de chaine
   */
  build(): string {
    return this.buffer.join("");
  }

  /**
   * Recupere le buffer sous forme de Buffer (pour envoi reseau/USB)
   */
  buildBuffer(): Buffer {
    return Buffer.from(this.build(), "binary");
  }

  /**
   * Remet le buffer a zero
   */
  clear(): this {
    this.buffer = [];
    return this;
  }

  /**
   * Retourne le nombre de caracteres par ligne
   */
  getCharsPerLine(): number {
    return this.charsPerLine;
  }
}

/**
 * Cree une nouvelle instance du builder ESC/POS
 */
export function createESCPOSBuilder(paperWidth: 58 | 80 = 80): ESCPOSBuilder {
  return new ESCPOSBuilder({ paperWidth });
}

/**
 * Utilitaire pour formater un montant FCFA pour l'impression
 * (sans espaces insecables qui peuvent poser probleme)
 */
export function formatPrintAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u202F/g, " "); // Remplace espace insecable par espace normal
}

/**
 * Convertit une valeur en objet Date
 * Gère les strings ISO (JSON sérialisé) et les objets Date
 */
function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Formate une date pour l'impression
 */
export function formatPrintDate(date: Date | string): string {
  return toDate(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formate une heure pour l'impression
 */
export function formatPrintTime(date: Date | string): string {
  return toDate(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formate date et heure pour l'impression
 */
export function formatPrintDateTime(date: Date | string): string {
  return `${formatPrintDate(date)} ${formatPrintTime(date)}`;
}
