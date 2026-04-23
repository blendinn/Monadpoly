import { NextResponse } from "next/server";

type ParticipantStore = {
  participants: string[];
};

type ContestStateStore = {
  started: boolean;
  startedAt: number | null;
  readyParticipants: string[];
};

declare global {
  // eslint-disable-next-line no-var
  var __contestStore: ParticipantStore | undefined;
  // eslint-disable-next-line no-var
  var __contestStateStore: ContestStateStore | undefined;
}

const getStore = (): ParticipantStore => {
  if (!global.__contestStore) {
    global.__contestStore = { participants: [] };
  }
  return global.__contestStore;
};

export async function GET() {
  return NextResponse.json({ participants: getStore().participants });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { address?: string };
  const address = body.address?.toLowerCase().trim();

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const store = getStore();
  if (!store.participants.includes(address)) {
    store.participants.push(address);
  }

  return NextResponse.json({ participants: store.participants });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { address?: string };
  const address = body.address?.toLowerCase().trim();

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const store = getStore();
  store.participants = store.participants.filter(item => item !== address);
  if (global.__contestStateStore) {
    global.__contestStateStore.readyParticipants = global.__contestStateStore.readyParticipants.filter(
      item => item !== address,
    );
  }

  return NextResponse.json({ participants: store.participants });
}
