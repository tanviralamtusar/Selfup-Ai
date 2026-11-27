import { NextRequest } from 'next/server';
import { handleMcp } from '@/lib/mcp/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = (req: NextRequest) => handleMcp(req);
export const GET = (req: NextRequest) => handleMcp(req);
export const DELETE = (req: NextRequest) => handleMcp(req);
export const OPTIONS = (req: NextRequest) => handleMcp(req);
