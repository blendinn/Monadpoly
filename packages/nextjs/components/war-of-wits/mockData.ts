import type { QuizQuestion } from "./types";

export const mockPot = 250;
export const mockWalletBalance = 250;
export const mockEntryFee = 0;
export const initialContestants = 100;
export const web3Participants = [
  "0x9f7a...12c1",
  "0x41de...88b2",
  "0x77aa...0f45",
  "0xc239...9ad0",
  "0x18be...4f77",
  "0xa912...b66e",
  "0x5ce4...e130",
  "0xdd10...44c2",
  "0x3ea8...71a9",
  "0x0f92...9d0e",
  "0xbe22...ac18",
  "0x6e41...33f2",
];
export const mockQuestions: QuizQuestion[] = [
  {
    id: "q-1",
    prompt: "Monad hangi performans hedefiyle dikkat cekiyor?",
    options: [
      { id: "a", label: "10,000 TPS and low latency finality" },
      { id: "b", label: "Only cheap NFT minting" },
      { id: "c", label: "No smart contracts" },
      { id: "d", label: "Single validator design" },
    ],
    correctOptionId: "a",
    hint: "Speed + throughput odakli.",
  },
  {
    id: "q-2",
    prompt: "EVM compatibility bir takim icin ne avantaj saglar?",
    options: [
      { id: "a", label: "Frontend yazmaya gerek kalmaz" },
      { id: "b", label: "Mevcut Solidity bilgi birikimi kullanilir" },
      { id: "c", label: "Gas her durumda sifir olur" },
      { id: "d", label: "Sadece mobilde calisir" },
    ],
    correctOptionId: "b",
    hint: "Ayni tooling ekosistemi.",
  },
  {
    id: "q-3",
    prompt: "Web3 quiz oyununda en kritik UX nedir?",
    options: [
      { id: "a", label: "Uzun bekleme ekranlari" },
      { id: "b", label: "Anlik geri bildirim ve net state" },
      { id: "c", label: "Sadece metin tabanli akis" },
      { id: "d", label: "Rastgele buton yerlesimi" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-4",
    prompt: "Hangisi self-custody tanimina uygundur?",
    options: [
      { id: "a", label: "Private keyin kullanicida olmasi" },
      { id: "b", label: "Merkezi borsanin tum varligi tutmasi" },
      { id: "c", label: "Sifreyi ekip liderinin saklamasi" },
      { id: "d", label: "Sadece email ile giris" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q-5",
    prompt: "Optimistic UI davranisi en iyi nasil aciklanir?",
    options: [
      { id: "a", label: "Onay gelene kadar hicbir sey gosterme" },
      { id: "b", label: "Kullanici aksiyonunu aninda yansitma" },
      { id: "c", label: "Tum state'i silme" },
      { id: "d", label: "Animasyonlari kapatma" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-6",
    prompt: "Bir blockchain explorer ne icin kullanilir?",
    options: [
      { id: "a", label: "Cuzdan sifresi olusturmak" },
      { id: "b", label: "On-chain islemleri dogrulamak" },
      { id: "c", label: "Token yakmak" },
      { id: "d", label: "RPC node kurmadan deploy etmek" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-7",
    prompt: "Game-Fi ekonomisinde sabit odul havuzu ne saglar?",
    options: [
      { id: "a", label: "Tahmin edilebilir odul dagilimi" },
      { id: "b", label: "Her saniye rastgele odul artisi" },
      { id: "c", label: "Sonsuz enflasyon" },
      { id: "d", label: "Oyuncu sayisindan bagimsiz kazanc" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q-8",
    prompt: "Elimination turu hangi amaca hizmet eder?",
    options: [
      { id: "a", label: "Sadece renk degistirmek" },
      { id: "b", label: "Yanlis cevaplayanlari ayiklamak" },
      { id: "c", label: "Sureyi uzatmak" },
      { id: "d", label: "Skoru sifirlamak" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q-9",
    prompt: "Kisi basi kazanc hangi formul ile hesaplanir?",
    options: [
      { id: "a", label: "Toplam Pot / Kalan Oyuncu" },
      { id: "b", label: "Toplam Pot * Kalan Oyuncu" },
      { id: "c", label: "Toplam Pot - Kalan Oyuncu" },
      { id: "d", label: "Sabit 1 MON" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q-10",
    prompt: "Hangisi profesyonel oyun dongusu yaklasimidir?",
    options: [
      { id: "a", label: "Lobby -> Playing -> Elimination -> GameOver" },
      { id: "b", label: "Tek ekranda tum state'leri karistirmak" },
      { id: "c", label: "Timer olmadan gecis yapmak" },
      { id: "d", label: "Kazanan olmadan round bitirmek" },
    ],
    correctOptionId: "a",
  },
];

export const mockPlayers = [
  "Aylin",
  "Bora",
  "Cem",
  "Dora",
  "Efe",
  "Lara",
  "Mert",
  "Nisa",
  "Ozan",
  "Pelin",
  "Rana",
  "Sarp",
  "Tuna",
  "Yaren",
];
