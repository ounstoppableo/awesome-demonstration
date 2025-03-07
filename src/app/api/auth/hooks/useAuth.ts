import { headers } from 'next/headers';

export default async function useAuth() {
  const headersList = await headers();
  const Authorization = headersList.get('Authorization');
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  try {
    const authRes = await (
      await fetch(process.env.AUTH_ADDR as string, {
        headers: {
          token: Authorization,
        } as any,
      })
    ).json();
    if (authRes.code === 200) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
}
