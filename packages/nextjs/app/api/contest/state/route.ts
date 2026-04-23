import { NextResponse } from "next/server";

type ContestState = {
  started: boolean;
  startedAt: number | null;
  readyParticipants: string[];
  hostAddress: string | null;
  minParticipants: number;
  targetParticipants: number;
};

type ParticipantStore = {
  participants: string[];
};

declare global {
  // eslint-disable-next-line no-var
  var __contestStateStore: ContestState | undefined;
  // eslint-disable-next-line no-var
  var __contestStore: ParticipantStore | undefined;
}

const getContestState = (): ContestState => {
  if (!global.__contestStateStore) {
    global.__contestStateStore = {
      started: false,
      startedAt: null,
      readyParticipants: [],
      hostAddress: null,
      minParticipants: 2,
      targetParticipants: 2,
    };
  }
  return global.__contestStateStore;
};

const getParticipants = (): string[] => {
  return global.__contestStore?.participants ?? [];
};

export async function GET() {
  return NextResponse.json(getContestState());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    started?: boolean;
    startedAt?: number | null;
    readyAddress?: string;
    isReady?: boolean;
    hostAddress?: string;
    minParticipants?: number;
    targetParticipants?: number;
    startRequest?: boolean;
  };
  const store = getContestState();

  const participants = getParticipants();
  const readyAddress = body.readyAddress?.toLowerCase().trim();

  if (readyAddress && typeof body.isReady === "boolean" && participants.includes(readyAddress)) {
    if (body.isReady) {
      if (!store.readyParticipants.includes(readyAddress)) {
        store.readyParticipants.push(readyAddress);
      }
    } else {
      store.readyParticipants = store.readyParticipants.filter(item => item !== readyAddress);
    }
  }

  if (body.hostAddress) {
    store.hostAddress = body.hostAddress.toLowerCase().trim();
  }
  if (typeof body.minParticipants === "number") {
    store.minParticipants = Math.max(2, Math.floor(body.minParticipants));
  }
  if (typeof body.targetParticipants === "number") {
    store.targetParticipants = Math.max(store.minParticipants, Math.floor(body.targetParticipants));
  }

  if (typeof body.started === "boolean") {
    store.started = body.started;
    if (!body.started) {
      store.readyParticipants = [];
      store.startedAt = null;
      store.hostAddress = null;
      store.minParticipants = 2;
      store.targetParticipants = 2;
    }
  }
  if (typeof body.startedAt === "number" || body.startedAt === null) {
    store.startedAt = body.startedAt;
  }

  if (body.startRequest) {
    const allReady = participants.length > 0 && participants.every(item => store.readyParticipants.includes(item));
    const enoughParticipants =
      participants.length >= store.minParticipants && participants.length >= store.targetParticipants;
    if (allReady && enoughParticipants) {
      store.started = true;
      store.startedAt = Date.now();
    }
  }

  return NextResponse.json(store);
}
