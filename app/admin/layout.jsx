import { requireAdmin, getCurrentUser } from '@/app/actions/auth'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({ children }) {
  await requireAdmin()
  const user = await getCurrentUser()

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>
}
