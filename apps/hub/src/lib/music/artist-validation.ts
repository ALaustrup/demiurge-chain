/**
 * Artist Name Validation
 * Prevents impersonation through reserved names and similarity detection
 */

// Reserved names - well-known artists that require verification
// This is a subset - the full list should be maintained in the backend
export const RESERVED_ARTIST_NAMES = [
  // Pop
  'Taylor Swift', 'Beyonce', 'Beyoncé', 'Rihanna', 'Lady Gaga', 'Ariana Grande',
  'Justin Bieber', 'Ed Sheeran', 'Bruno Mars', 'The Weeknd', 'Dua Lipa',
  'Billie Eilish', 'Olivia Rodrigo', 'Harry Styles', 'Adele', 'Katy Perry',
  'Shakira', 'Miley Cyrus', 'Selena Gomez', 'Demi Lovato', 'Pink', 'Madonna',
  
  // Hip-Hop / Rap
  'Drake', 'Kanye West', 'Kendrick Lamar', 'Travis Scott', 'Post Malone',
  'Lil Wayne', 'Eminem', 'Jay-Z', 'Jay Z', 'Nicki Minaj', 'Cardi B',
  'Megan Thee Stallion', '21 Savage', 'Future', 'Lil Baby', 'Lil Uzi Vert',
  'J Cole', 'J. Cole', 'Tyler The Creator', 'A$AP Rocky', 'ASAP Rocky',
  'Snoop Dogg', 'Ice Cube', 'Dr Dre', 'Dr. Dre', '50 Cent', 'Nas',
  'Migos', 'Offset', 'Quavo', 'Takeoff', 'Lil Nas X', 'Jack Harlow',
  
  // Rock / Alternative
  'Coldplay', 'Imagine Dragons', 'Maroon 5', 'OneRepublic', 'The Killers',
  'Arctic Monkeys', 'Radiohead', 'Muse', 'Green Day', 'Foo Fighters',
  'Linkin Park', 'Red Hot Chili Peppers', 'RHCP', 'Nirvana', 'Pearl Jam',
  'Metallica', 'AC/DC', 'ACDC', 'Led Zeppelin', 'Pink Floyd', 'Queen',
  'The Rolling Stones', 'The Beatles', 'U2', 'Guns N Roses',
  
  // Electronic / EDM
  'Daft Punk', 'Deadmau5', 'Skrillex', 'Marshmello', 'Calvin Harris',
  'David Guetta', 'Tiesto', 'Tiësto', 'Martin Garrix', 'Zedd', 'Kygo',
  'Avicii', 'Swedish House Mafia', 'Diplo', 'Major Lazer', 'The Chainsmokers',
  'Flume', 'ODESZA', 'Illenium', 'Porter Robinson', 'Madeon', 'Disclosure',
  'Above & Beyond', 'Armin van Buuren', 'Aphex Twin', 'Boards of Canada',
  
  // R&B / Soul
  'Frank Ocean', 'The Weeknd', 'SZA', 'Daniel Caesar', 'H.E.R.', 'HER',
  'Usher', 'Chris Brown', 'John Legend', 'Alicia Keys', 'Lauryn Hill',
  'Mary J Blige', 'Toni Braxton', 'Whitney Houston', 'Mariah Carey',
  
  // Country
  'Morgan Wallen', 'Luke Combs', 'Chris Stapleton', 'Zach Bryan',
  'Luke Bryan', 'Blake Shelton', 'Carrie Underwood', 'Dolly Parton',
  'Johnny Cash', 'Willie Nelson', 'Garth Brooks', 'Tim McGraw',
  
  // Latin
  'Bad Bunny', 'J Balvin', 'Daddy Yankee', 'Ozuna', 'Maluma',
  'Karol G', 'Rosalia', 'Rosalía', 'Becky G', 'Anuel AA',
  
  // K-Pop
  'BTS', 'Blackpink', 'BLACKPINK', 'Twice', 'TWICE', 'Stray Kids',
  'NCT', 'EXO', 'Red Velvet', 'Aespa', 'aespa', 'NewJeans',
  'IVE', 'LE SSERAFIM', 'Seventeen', 'TXT', 'Enhypen',
  
  // Classic / Jazz
  'Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Ludwig van Beethoven',
  'Mozart', 'Bach', 'Chopin', 'Miles Davis', 'John Coltrane', 'Louis Armstrong',
  
  // Bands
  'Gorillaz', 'Twenty One Pilots', 'Panic At The Disco', 'Fall Out Boy',
  'My Chemical Romance', 'Paramore', 'Blink 182', 'Blink-182',
  'The Black Keys', 'Tame Impala', 'Glass Animals', 'The 1975',
  
  // Producers / DJs
  'Metro Boomin', 'Mike Dean', 'Pharrell', 'Pharrell Williams', 'Timbaland',
  'Max Martin', 'Rick Rubin', 'Dr Luke', 'Finneas', 'FINNEAS',
];

// Normalize name for comparison (lowercase, remove special chars)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Common character substitutions used in impersonation
const CHAR_SUBSTITUTIONS: Record<string, string[]> = {
  'a': ['4', '@', 'α', 'λ', 'д'],
  'b': ['8', '6', 'ß', 'в'],
  'c': ['(', '<', '¢', 'с'],
  'd': ['đ', 'ð'],
  'e': ['3', '€', 'ε', 'є', 'е'],
  'g': ['9', '6'],
  'h': ['#', 'н'],
  'i': ['1', '!', '|', 'ι', 'і'],
  'k': ['κ', 'к'],
  'l': ['1', '|', '/', 'ł'],
  'm': ['м'],
  'n': ['и', 'η'],
  'o': ['0', 'ο', 'о', 'ø'],
  'p': ['ρ', 'р'],
  's': ['5', '$', 'ѕ'],
  't': ['7', '+', 'т'],
  'u': ['µ', 'υ', 'ц'],
  'v': ['ν', 'v'],
  'w': ['ω', 'ш', 'щ'],
  'x': ['×', 'х'],
  'y': ['ψ', 'у', 'γ'],
  'z': ['2'],
};

// Expand a name to include common substitutions for comparison
function expandSubstitutions(char: string): string[] {
  const lower = char.toLowerCase();
  const subs = CHAR_SUBSTITUTIONS[lower] || [];
  return [lower, ...subs];
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      // Check if characters match (including substitutions)
      const shorterChar = shorter[i - 1];
      const longerChar = longer[j - 1];
      const shorterExpanded = expandSubstitutions(shorterChar);
      const longerExpanded = expandSubstitutions(longerChar);
      
      const match = shorterExpanded.some(c => longerExpanded.includes(c));
      
      if (match) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[shorter.length][longer.length];
  return (longer.length - distance) / longer.length;
}

export interface NameValidationResult {
  isValid: boolean;
  isReserved: boolean;
  isSimilarToReserved: boolean;
  similarTo?: string;
  similarityScore?: number;
  requiresVerification: boolean;
  message?: string;
}

/**
 * Validate an artist name against reserved names and similarity checks
 */
export function validateArtistName(name: string): NameValidationResult {
  const normalizedInput = normalizeName(name);
  
  // Check for empty/too short
  if (!name || name.trim().length < 2) {
    return {
      isValid: false,
      isReserved: false,
      isSimilarToReserved: false,
      requiresVerification: false,
      message: 'Artist name must be at least 2 characters',
    };
  }
  
  // Check exact match against reserved names
  for (const reserved of RESERVED_ARTIST_NAMES) {
    if (normalizeName(reserved) === normalizedInput) {
      return {
        isValid: false,
        isReserved: true,
        isSimilarToReserved: false,
        similarTo: reserved,
        similarityScore: 1,
        requiresVerification: true,
        message: `"${reserved}" is a reserved name. If you are the official artist, please contact us for verification.`,
      };
    }
  }
  
  // Check similarity to reserved names (threshold: 0.85)
  const SIMILARITY_THRESHOLD = 0.85;
  
  for (const reserved of RESERVED_ARTIST_NAMES) {
    const similarity = calculateSimilarity(name, reserved);
    
    if (similarity >= SIMILARITY_THRESHOLD) {
      return {
        isValid: false,
        isReserved: false,
        isSimilarToReserved: true,
        similarTo: reserved,
        similarityScore: similarity,
        requiresVerification: true,
        message: `This name is too similar to "${reserved}". Please choose a different name or verify your identity if you are the official artist.`,
      };
    }
  }
  
  // Name is valid
  return {
    isValid: true,
    isReserved: false,
    isSimilarToReserved: false,
    requiresVerification: false,
  };
}

/**
 * Check if a name requires additional verification
 */
export function requiresVerification(name: string): boolean {
  const result = validateArtistName(name);
  return result.requiresVerification;
}

/**
 * Get list of reserved names for display
 */
export function getReservedNames(): string[] {
  return [...RESERVED_ARTIST_NAMES].sort();
}
