import { sql } from './db';
import crypto from 'crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  // Comparación en tiempo constante para prevenir timing attacks
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

export async function createSession(adminId: string, cookies: any): Promise<string> {
  const token = crypto.randomUUID();
  const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas para panel administrativo
  
  await sql`
    INSERT INTO administrador_sesion (administrador_id, token, expira_en)
    VALUES (${adminId}, ${token}, ${expiraEn})
  `;
  
  cookies.set('admin_session', token, {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    expires: expiraEn
  });
  
  return token;
}

export async function validateSession(cookies: any): Promise<any | null> {
  const cookieObj = cookies.get('admin_session');
  const token = cookieObj ? cookieObj.value : undefined;
  if (!token) return null;
  
  // Limpiar sesiones expiradas de forma oportunista (M4)
  await sql`DELETE FROM administrador_sesion WHERE expira_en < CURRENT_TIMESTAMP`.catch(() => {});
  
  const [session] = await sql`
    SELECT s.id as session_id, s.token, s.expira_en, a.id as admin_id, a.email
    FROM administrador_sesion s
    JOIN administrador a ON s.administrador_id = a.id
    WHERE s.token = ${token}
  `;
  
  if (!session) {
    cookies.delete('admin_session', { path: '/' });
    return null;
  }
  
  if (new Date() > new Date(session.expira_en)) {
    await sql`DELETE FROM administrador_sesion WHERE id = ${session.session_id}`;
    cookies.delete('admin_session', { path: '/' });
    return null;
  }
  
  return session;
}

export async function destroySession(cookies: any): Promise<void> {
  const cookieObj = cookies.get('admin_session');
  const token = cookieObj ? cookieObj.value : undefined;
  if (token) {
    await sql`DELETE FROM administrador_sesion WHERE token = ${token}`;
  }
  cookies.delete('admin_session', { path: '/' });
}
