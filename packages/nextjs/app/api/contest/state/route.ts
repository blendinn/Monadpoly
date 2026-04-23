import { NextResponse } from "next/server";

type ContestState = {
  started: boolean;
  startedAt: number | null;
  readyParticipants: string[];
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
    global.__contestStateStore = { started: false, startedAt: null, readyParticipants: [] };
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

  if (typeof body.started === "boolean") {
    store.started = body.started;
    if (!body.started) {
      store.readyParticipants = [];
      store.startedAt = null;
    }
  }
  if (typeof body.startedAt === "number" || body.startedAt === null) {
    store.startedAt = body.startedAt;
  }

  const allReady =
    participants.length > 0 && participants.every(item => store.readyParticipants.includes(item)) && !store.started;

  if (allReady) {
    store.started = true;
    store.startedAt = Date.now();
  }

  return NextResponse.json(store);
}
