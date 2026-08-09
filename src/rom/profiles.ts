export interface GBAAddressProfile {
  name: string;
  gameCode: string;
  watches: { name: string; address: number; size: 8 | 16 | 32 }[];
  cheats: { name: string; address: number; value: number; size: 8 | 16 | 32 }[];
}

export const GBA_GAME_PROFILES: GBAAddressProfile[] = [
  {
    name: "Pokémon Emerald",
    gameCode: "BPEE",
    watches: [
      { name: "Player Name", address: 0x03005D90, size: 8 },
      { name: "Player X Coord", address: 0x020249F0, size: 16 },
      { name: "Player Y Coord", address: 0x020249F2, size: 16 },
      { name: "Money Amount", address: 0x02024904, size: 32 }
    ],
    cheats: [
      { name: "Max Money Hack", address: 0x02024904, value: 999999, size: 32 }
    ]
  },
  {
    name: "The Legend of Zelda: The Minish Cap",
    gameCode: "BZME",
    watches: [
      { name: "Rupees", address: 0x02002B00, size: 16 },
      { name: "Hearts (Current)", address: 0x02002AFE, size: 8 },
      { name: "Hearts (Max)", address: 0x02002AFF, size: 8 }
    ],
    cheats: [
      { name: "Infinite Health Hack", address: 0x02002AFE, value: 80, size: 8 }
    ]
  }
];
